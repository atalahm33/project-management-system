# National Project Management System - Frontend Full Specification

You are a senior frontend engineer responsible for building a complete production-ready **government-grade dashboard application**.

This is a **frontend-only system** with mocked data or API-ready structure.

---

# 🧠 Project Overview
Build a **National Project Management Dashboard** for monitoring, analyzing, and visualizing national infrastructure projects across multiple sectors.

The system includes:
- Project tracking
- Financial analytics
- GIS map visualization
- Sector management
- Funding sources overview
- Reporting interface

---

# 🧱 Tech Stack (Mandatory)
- React.js (Latest)
- Tailwind CSS
- shadcn/ui
- React Router DOM
- Recharts (Charts)
- Leaflet.js or Mapbox (GIS Map)
- Axios (for API layer structure only)

---

# 🎨 UI/UX Requirements
- Government-level professional design
- Arabic + English support (RTL ready)
- Clean, structured, data-heavy UI
- Fully responsive (desktop-first)
- Light/Dark mode support (optional)
- Use shadcn/ui components consistently

---

# 🧭 Application Pages

---

## 1. Authentication Page
- Login UI
- Role selection (Admin / Official / Viewer)
- Clean and minimal design

---

## 2. Main Dashboard

### KPIs:
- Total Projects
- Ongoing Projects
- Completed Projects
- Delayed Projects
- Total Budget
- Total Spent
- Remaining Budget
- Budget Utilization %

### Charts:
- Projects by Sector (Pie Chart)
- Budget vs Spending (Bar Chart)
- Status Distribution

---

## 3. Projects Page

Each project shows:
- Name
- Sector
- Status (Green / Yellow / Red)
- Budget vs Spent
- Progress bar
- Location icon (GIS link)

### Filters:
- Sector
- Status
- Budget range

---

## 4. Project Details Page

### 📊 Overview
- Project info
- Timeline
- Sector
- Status

---

### 💰 Financial Section
- Total budget
- Spent
- Remaining

#### Budget Breakdown:
- Construction
- Materials
- Labor
- Equipment
- Services
- Administration

#### Expense Table:
- Amount
- Category (what it was spent on)
- Date
- Vendor
- Description

---

### 📈 Progress Section
- Physical progress %
- Financial progress %
- Time progress %
- Overall weighted progress

---

### 📍 GIS Section
- Interactive map (Leaflet/Mapbox)
- Project location pin
- Coordinates display
- Fullscreen map view

---

## 5. Sectors Page
- List of sectors
- Number of projects per sector
- Total budget per sector
- Average progress
- Click to filter projects

---

## 6. Funding Sources Page
- List of funding entities
- Contribution per source
- Spent vs remaining
- Charts for distribution

---

## 7. GIS Map Page
- Full interactive map
- All projects displayed as pins
- Filters:
  - Sector
  - Status
  - Budget
- Color-coded markers:
  - Green = Completed
  - Yellow = In Progress
  - Red = Delayed

---

## 8. Reports Page (UI only)
- PDF report preview UI
- Export buttons (UI only)
- Monthly reports layout

---

# 📊 Data Handling (Frontend Only)
Use:
- Mock JSON data OR context/state management

Entities:
- Projects
- Sectors
- Expenses
- Funding Sources
- Users

---

# ⚙️ API ARCHITECTURE REQUIREMENT (IMPORTANT)

## 📁 Required Structure

Create a dedicated API layer:

/src/api/

---

## 🧠 Rules

- DO NOT write API calls inside components
- ALL API calls must go through centralized services

---

## 📦 Structure Example

- apiClient.js (or api.ts)
  - Base URL configuration
  - Headers setup
  - Interceptors (if needed)

- projectsApi.js
- sectorsApi.js
- financeApi.js
- authApi.js

Each file handles its own domain.

---

## ⚙️ Requirements

- Use axios or fetch wrapper
- Centralize baseURL in ONE place
- Use environment variables (.env)
- Allow easy backend switching without changing components

---

## 🔄 Benefits Required

- Clean architecture
- Easy backend replacement
- Reusable API functions
- Scalable system design

---

# 🚀 Key UI Features

- Advanced analytics dashboard
- Drill-down navigation (Dashboard → Project → Details)
- Financial visualization
- Interactive charts everywhere
- GIS-based project tracking
- Professional government UI system

---

# ⚠️ Important Instructions

- Frontend only (NO backend implementation)
- Use mock data or API-ready structure
- Focus heavily on UI/UX quality
- Keep code modular and scalable
- Use shadcn/ui components consistently
- Maintain clean folder structure

---

# 🎯 Final Output

A complete frontend application including:
- Dashboard
- Projects system
- Financial analytics UI
- GIS map system
- Sector & funding visualization
- Professional government-grade UI