# Project Management System (Frontend)

##  Overview

This is the frontend part of the Project Management System. It provides a modern dashboard for managing projects, tasks, teams, budgets, and analytics. The interface is fully responsive and integrates with the backend APIs to provide real-time data visualization and reporting.

---

##  Backend API

This frontend is connected to the backend service:

* Backend Repository:
  https://github.com/atalahm33/project-management-system-backend

---

##  Features

* Modern dashboard UI
* Project and task management interface
* Team and user management screens
* Role-based access control UI
* Interactive charts and analytics
* PDF report generation support
* Real-time data fetching from backend APIs
* Responsive design for all devices

---

## 🛠️ Tech Stack

* React.js
* React Router
* Axios
* React Charts (Recharts / Chart.js)
* CSS / Tailwind (if used)

---

##  Installation & Setup

### 1. Clone repository

```bash id="fe2"
git clone https://github.com/your-username/project-management-system-frontend.git
cd project-management-system-frontend
```

---

### 2. Install dependencies

```bash id="fe3"
npm install
```

---

### 3. Environment Variables

Create a `.env` file:

```env id="fe4"
REACT_APP_API_URL=https://your-backend-url.com/api
```

---

### 4. Run project

```bash id="fe5"
npm start
```

---

##  Backend Connection

The frontend communicates with the backend using REST APIs.

Example:

* Authentication → `/api/auth`
* Projects → `/api/projects`
* Tasks → `/api/tasks`
* Users → `/api/users`

All API calls are handled via Axios using the base URL from environment variables.

---

##  Dashboard

* Real-time project statistics
* Budget and expense tracking
* Charts and visual analytics
* Filterable data views
* PDF export integration

---

## Future Improvements

* Dark mode support
* Real-time notifications
* Mobile optimization (PWA / React Native)
* Advanced analytics dashboard
* Multi-language support

---

##  License

This project is for portfolio and commercial use depending on agreement.
