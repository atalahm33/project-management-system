/**
 * currencyUtils.js
 * 
 * Multi-currency helpers for the project management platform.
 * Provides Arabic name mappings and formatting functions.
 * 
 * Rules:
 * - Database stores ISO codes only (e.g., "USD", "EGP")
 * - Frontend displays: Arabic name + (ISO code)
 * - No cross-currency conversion or aggregation
 */

// ─── Currency metadata ───────────────────────────────────────────────────────
export const CURRENCIES = {
  EGP: { arabicName: 'الجنيه المصري', arabicUnit: 'جنيه مصري', symbol: 'ج.م' },
  USD: { arabicName: 'الدولار الأمريكي', arabicUnit: 'دولار أمريكي', symbol: '$' },
  EUR: { arabicName: 'اليورو', arabicUnit: 'يورو', symbol: '€' },
  SAR: { arabicName: 'الريال السعودي', arabicUnit: 'ريال سعودي', symbol: 'ر.س' },
  AED: { arabicName: 'الدرهم الإماراتي', arabicUnit: 'درهم إماراتي', symbol: 'د.إ' },
  GBP: { arabicName: 'الجنيه الإسترليني', arabicUnit: 'جنيه إسترليني', symbol: '£' },
  KWD: { arabicName: 'الدينار الكويتي', arabicUnit: 'دينار كويتي', symbol: 'د.ك' },
  QAR: { arabicName: 'الريال القطري', arabicUnit: 'ريال قطري', symbol: 'ر.ق' },
  BHD: { arabicName: 'الدينار البحريني', arabicUnit: 'دينار بحريني', symbol: 'د.ب' },
  OMR: { arabicName: 'الريال العُماني', arabicUnit: 'ريال عُماني', symbol: 'ر.ع' },
}

// Ordered list for dropdowns
export const CURRENCY_CODES = ['EGP', 'USD', 'EUR', 'SAR', 'AED', 'GBP', 'KWD', 'QAR', 'BHD', 'OMR'];

export const normalizeCurrencyCode = (code) => {
  const normalized = String(code || '').trim().toUpperCase();
  if (normalized === 'EGY') return 'EGP';
  return CURRENCY_CODES.includes(normalized) ? normalized : 'EGP';
};

export const normalizeBudgets = (budgets, totalBudget = 0) => {
  const normalized = {};

  const setBudget = (currency, amount) => {
    const code = normalizeCurrencyCode(currency);
    const value = Number(amount);
    if (value > 0) normalized[code] = (normalized[code] || 0) + value;
  };

  if (budgets instanceof Map) {
    budgets.forEach((amount, currency) => setBudget(currency, amount));
  } else if (Array.isArray(budgets)) {
    budgets.forEach(entry => {
      if (Array.isArray(entry)) {
        setBudget(entry[0], entry[1]);
      } else if (entry && typeof entry === 'object') {
        setBudget(entry.currency || entry.code || entry._id, entry.amount || entry.value || entry.totalBudget);
      }
    });
  } else if (budgets && typeof budgets === 'object') {
    Object.entries(budgets).forEach(([currency, amount]) => setBudget(currency, amount));
  }

  if (Object.keys(normalized).length === 0 && Number(totalBudget) > 0) {
    normalized.EGP = Number(totalBudget);
  }

  return normalized;
};

/**
 * Returns the Arabic display label for a currency code.
 * Example: getCurrencyLabel('USD') → 'الدولار الأمريكي (USD)'
 */
export const getCurrencyLabel = (code) => {
  const normalized = normalizeCurrencyCode(code);
  const meta = CURRENCIES[normalized];
  if (!meta) return normalized;
  return `${meta.arabicName} (${normalized})`;
};

/**
 * Returns short Arabic name for a currency code.
 * Example: getCurrencyName('USD') → 'الدولار الأمريكي'
 */
export const getCurrencyName = (code) => {
  const normalized = normalizeCurrencyCode(code);
  return CURRENCIES[normalized]?.arabicName || normalized;
};

/**
 * Formats an amount with its Arabic currency unit.
 * Example: formatCurrencyVal(10000, 'USD') → '10,000 دولار أمريكي'
 */
export const formatCurrencyVal = (amount, code = 'EGP') => {
  const normalized = normalizeCurrencyCode(code);
  if (amount === null || amount === undefined || isNaN(amount)) return `0 ${CURRENCIES[normalized]?.arabicUnit || normalized}`;

  const meta = CURRENCIES[normalized] || { arabicUnit: normalized };
  const formatted = Number(amount).toLocaleString('ar-EG');
  return `${formatted} ${meta.arabicUnit}`;
};

/**
 * Compact formatter (M/B abbreviations) + Arabic unit.
 * Example: formatCurrencyCompact(1500000, 'EGP') → '1.5 مليون جنيه مصري'
 */
export const formatCurrencyCompact = (amount, code = 'EGP') => {
  const normalized = normalizeCurrencyCode(code);
  if (!amount || isNaN(amount)) return `0 ${CURRENCIES[normalized]?.arabicUnit || normalized}`;
  const meta = CURRENCIES[normalized] || { arabicUnit: normalized };

  if (amount >= 1e9) return `${(amount / 1e9).toFixed(5)} مليار ${meta.arabicUnit}`;
  if (amount >= 1e6) return `${(amount / 1e6).toFixed(5)} مليون ${meta.arabicUnit}`;
  return `${Number(amount).toLocaleString('ar-EG')} ${meta.arabicUnit}`;
};

/**
 * Returns options array for a currency select dropdown.
 * Each option has { value: 'USD', label: 'الدولار الأمريكي (USD)' }
 */
export const getCurrencyOptions = () => {
  return CURRENCY_CODES.map(code => ({
    value: code,
    label: getCurrencyLabel(code)
  }));
};

/**
 * Given a project's budgets object, returns an array of currency codes that are configured.
 * Handles both Map (from Mongoose) and plain objects (from JSON API response).
 * 
 * Example:
 *   getProjectCurrencies({ USD: 10000, EGP: 200000 }) → ['USD', 'EGP']
 */
export const getProjectCurrencies = (budgets) => {
  const normalized = normalizeBudgets(budgets);
  const currencies = Object.keys(normalized).filter(k => normalized[k] > 0);
  return currencies.length > 0 ? currencies : ['EGP'];
};

/**
 * All currencies to show as tabs: budget currencies + funding/expense currencies not in budget.
 */
export const getAllProjectCurrencies = (budgets, funding = [], expenses = [], totalBudget = 0) => {
  const budgetCurrencies = getProjectCurrencies(normalizeBudgets(budgets, totalBudget));
  const seen = new Set(budgetCurrencies);
  const extra = [];

  const addCurrency = (code) => {
    const normalized = normalizeCurrencyCode(code);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    extra.push(normalized);
  };

  funding?.forEach(f => addCurrency(f.currency));
  expenses?.forEach(e => addCurrency(e.currency));

  return [...budgetCurrencies, ...extra];
};

export const isFundingOnlyCurrency = (currency, budgets, totalBudget = 0) => {
  const budgetCurrencies = getProjectCurrencies(normalizeBudgets(budgets, totalBudget));
  return !budgetCurrencies.includes(normalizeCurrencyCode(currency));
};

/**
 * Get budget value for a specific currency from a project's budgets object.
 * Falls back to 0 if currency not found.
 */
export const getBudgetForCurrency = (budgets, currency) => {
  return normalizeBudgets(budgets)[normalizeCurrencyCode(currency)] || 0;
};
