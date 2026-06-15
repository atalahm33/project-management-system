# Financial System Redesign: Multi-Currency & Expense-Based Architecture

This implementation plan details the redesign of the project management platform's financial module. We will transition the application to an independent, per-currency financial system as defined in [Antigravity.md](file:///d:/nspo/منصة%20مشاريع%20%20الجهاز/Antigravity.md).

## Key Architectural Decisions & Intent
1. **Eliminate Allocation & Breakdown Constraints:** Deprecate legacy `budgetBreakdown` categories and the `allocatedBudget` counter from automatic updates during expense approval. Budgets are now tracked per currency code directly.
2. **Strict Currency Independence:** No cross-currency aggregation or exchange rate conversion. Each currency is an independent financial account. Tab filters will allow isolated views.
3. **Graceful Backward Compatibility:** Existing projects and transactions lacking a `currency` field will default to Egyptian Pound (`EGP`). Legacy projects with `totalBudget` will automatically populate `{ EGP: totalBudget }`.

---

## Proposed Changes

### 1. Database Schema Layer (Backend Models)

#### [MODIFY] [Project.js](file:///d:/nspo/باكاند%20مشاريع%20الجهاز/src/models/Project.js)
- Add `budgets` field as a Map of numbers:
  ```javascript
  budgets: {
    type: Map,
    of: Number,
    default: () => new Map()
  }
  ```
- Make `totalBudget` optional (relax required constraint) but default it to `0`.
- Add a pre-save hook to ensure backward compatibility:
  - If `budgets` map is empty but `totalBudget` is specified, populate `budgets` with `EGP: totalBudget`.
  - For legacy query support, keep `totalBudget` synchronized with the EGP budget value.

#### [MODIFY] [Expense.js](file:///d:/nspo/باكاند%20مشاريع%20الجهاز/src/models/Expense.js) & [ExpenseSubmission.js](file:///d:/nspo/باكاند%20مشاريع%20الجهاز/src/models/ExpenseSubmission.js)
- Add a `currency` field:
  ```javascript
  currency: {
    type: String,
    required: [true, 'Expense must have a currency'],
    default: 'EGP',
    enum: ['USD', 'EUR', 'EGP', 'SAR', 'AED', 'GBP', 'KWD', 'QAR', 'BHD', 'OMR']
  }
  ```

---

### 2. Backend Logic Layer (Controllers & Endpoints)

#### [MODIFY] [submissionController.js](file:///d:/nspo/باكاند%20مشاريع%20الجهاز/src/controllers/submissionController.js)
- Modify the approval branch for `expense` submissions:
  - Remove all logic mutating `allocatedBudget` and `budgetBreakdown` on the project.
  - Verify that the expense's `currency` exists in the target project's `budgets` Map. If it does not exist, reject the approval with a 400 error.
  - Set the `currency` field on the newly created `Expense` document.

#### [MODIFY] [analyticsController.js](file:///d:/nspo/باكاند%20مشاريع%20الجهاز/src/controllers/analyticsController.js)
- Redesign `getDashboardSummary` to support per-currency statistics:
  - Add query param `?currency=...` to request stats for a specific currency (or default to `'all'` for comparison).
  - If a specific currency is requested:
    - Filter projects, budgets, and expenses for that currency only.
    - Calculate `totalBudget` (sum of budget value for this currency across matching projects), `totalSpent` (sum of approved expenses in this currency), and `remainingBudget` (total budget - total spent).
    - Provide monthly trends and sector distributions using only values in this currency.
  - If `"all"` is requested:
    - Produce a cross-currency comparison dataset showing each currency code, its overall budget sum, total expense sum, and remaining amount.

#### [MODIFY] [reportController.js](file:///d:/nspo/باكاند%20مشاريع%20الجهاز/src/controllers/reportController.js)
- Adapt PDF and Excel exports to format financials per-currency rather than mixing them or assuming EGP.

---

### 3. Frontend Web Application

#### [NEW] [currencyUtils.js](file:///d:/nspo/منصة%20مشاريع%20%20الجهاز/src/api/currencyUtils.js)
- Create helper mapping ISO codes to Arabic names and formatting strings:
  - `"USD"` -> `"الدولار الأمريكي"`
  - `"EGP"` -> `"الجنيه المصري"`
  - Helper function `formatCurrencyVal(amount, code)` -> `10,000 دولار أمريكي` or similar.

#### [MODIFY] [AddProjectPage.jsx](file:///d:/nspo/منصة%20مشاريع%20%20الجهاز/src/pages/admin/AddProjectPage.jsx)
- Redesign the budget input section to allow adding multiple budgets.
- Initialize with an EGP budget field, and add an option to click "+ إضافة ميزانية بعملة أخرى".
- Send the `budgets` object payload to the backend.

#### [MODIFY] [AddExpensePage.jsx](file:///d:/nspo/منصة%20مشاريع%20%20الجهاز/src/pages/admin/AddExpensePage.jsx)
- Add a currency select dropdown displaying `Arabic Name (ISO Code)`.
- When a project is selected, filter the currency options to display only those currencies that are configured in the project's budgets.
- Remove restriction of categories to budgetBreakdown since breakdown lines are deprecated.

#### [MODIFY] [ProjectDetailsPage.jsx](file:///d:/nspo/منصة%20مشاريع%20%20الجهاز/src/pages/ProjectDetailsPage.jsx)
- Implement tabs for the currencies present in the project's `budgets` Map, plus an "All Currencies" tab.
- When a currency tab is active, filter all KPIs, chart visuals, and expense tables to display only that currency.
- Under the "All Currencies" tab, display the cross-currency comparison table comparing budget vs spent vs remaining.

#### [MODIFY] [DashboardPage.jsx](file:///d:/nspo/منصة%20مشاريع%20%20الجهاز/src/pages/DashboardPage.jsx)
- Add currency selection tabs at the top (All Currencies, EGP, USD, EUR, etc.).
- Update dashboard stats query to pass the selected currency to the API endpoint and render isolated statistics, charts, and trends.

---

## Verification Plan

### Automated Build Checks
- Check that build succeeds on backend and frontend:
  ```powershell
  # For frontend validation:
  npm run build
  ```

### Manual Verification Flow
1. Create a new project with two budgets: `EGP: 500,000` and `USD: 20,000`.
2. Navigate to the Expense Creation page, select the project, and check that the currency selector restricts options to EGP and USD.
3. Submit a USD expense of `5,000` and an EGP expense of `10,000`. Approve both via the Submissions page.
4. Verify that the project details page correctly separates EGP and USD balances (no cross-currency deduction or aggregation).
5. Verify that the dashboard filters statistics correctly when switching tabs.

### ملخص: ماذا يحدث عند تبديل العملات (ماذا يعرض وماذا يهمل)؟
- **عند اختيار عملة محددة (مثل الدولار USD):** يقوم النظام **بإهمال وتجاهل** أي مصروفات، ميزانيات، أو تمويلات بأي عملات أخرى (مثل الجنيه أو اليورو). سيتم تصفية جميع البطاقات والمؤشرات (KPIs) والرسوم البيانية لتعرض **فقط** الأرقام الخاصة بالدولار.
- **في صفحة تفاصيل المشروع:** عند اختيار عملة معينة، يتم إهمال باقي العملات في جدول سجل المصروفات التفصيلي ومخططات التمويل لضمان عدم الخلط.
- **عند اختيار "المقارنة الشاملة (كل العملات)":** يتم تجميع وعرض جدول مقارنة يضم كافة العملات المتاحة في المشروع لفصل كل عملة عن الأخرى دون دمج الأرقام ببعضها (لعدم منطقية الجمع بين عملات مختلفة).