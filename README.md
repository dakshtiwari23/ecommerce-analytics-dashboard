# 📊 E-Commerce Analytics Dashboard

A modern interactive Business Intelligence dashboard built using React.js, Recharts, Python ETL pipelines.

This project analyzes real FY2025 e-commerce sales data and transforms raw transactional datasets into visually rich business insights through interactive dashboards and analytics visualizations.

---

# 🚀 Features

## 📈 Interactive Dashboard
- Monthly Revenue Trends
- Dynamic KPI Cards
- Revenue & Profit Analytics
- Animated Charts
- Interactive Filters
- Dark / Light Mode Toggle

## 🛍️ Product Analytics
- Revenue by Category
- Product Performance Tracking
- Top Selling Products
- Loss-Making Product Detection
- Revenue Share Analysis

## 🌍 Geography Analytics
- State-wise Revenue Insights
- Regional Profitability Analysis
- Business Performance Comparison

## 💳 Payment Analytics
- Revenue by Payment Mode
- Payment Distribution Analysis
- UPI / COD / Card Performance

## ⚙️ Data Engineering
- Python ETL Pipeline
- CSV Data Processing
- JSON Transformation

---

# 🛠️ Tech Stack

## Frontend
- React.js
- Recharts
- Lucide React Icons

## Backend / Data Processing
- Python
- Pandas

## Data Pipeline
- CSV → ETL → JSON Pipeline

---

# 📂 Project Structure

```bash
ecommerce-dashboard/
│
├── src/
│   ├── data/
│   ├── Dashboard.jsx
│   ├── App.js
│
├── etl/
│   ├── etl_pipeline.py
│
├── raw_data/
│   ├── customers.csv
│   ├── orders.csv
│   ├── products.csv
├── reports/
│   ├── monthly_revenue_report.csv
│   ├── category_report.csv
│   ├── payment_report.csv
│   ├── state_report.csv
│   └── top_products_report.csv
│
├── ecommerce_dashboard.db
├── package.json
└── README.md
```

---

# 📊 Dashboard Modules

## Overview
- KPI Cards
- Monthly Revenue Chart
- Revenue & Profit by Category
- Revenue by Payment Mode

## Products
- Category Filters
- Product Performance
- Revenue Share by Category
- Loss-Making Products

## Geography
- State-wise Revenue
- Regional Profitability

## Payments
- Payment Distribution
- Revenue by Payment Mode

---

# ⚙️ ETL Pipeline

The project uses a Python ETL pipeline to:

1. Extract raw ecommerce sales data
2. Clean and transform business metrics
3. Generate analytics reports
4. Export JSON data for React charts
5. Visualisation on React Dashboard

---

# 📈 Dataset Features

- 500+ real ecommerce orders
- Full FY2025 data
- Seasonal sales patterns
- Multiple product categories
- State-wise sales distribution

---

# 🎨 UI Features

- Glassmorphism Design
- Gradient Backgrounds
- Hover Glow Effects
- Animated KPI Cards
- Responsive Layout
- Modern SaaS-style Dashboard UI

---

# ▶️ Installation & Setup

## Clone Repository

```bash
git clone https://github.com/dakshtiwari23/ecommerce-analytics-dashboard.git
```

---

## Install Dependencies

```bash
npm install
```

---

## Start React Application

```bash
npm start
```

Application runs on:

```bash
http://localhost:3000
```

---

## Run ETL Pipeline

```bash
cd etl
python etl_pipeline.py
```

---

# 📦 Main Dependencies

This project uses:

- React.js
- Recharts
- TailwindCSS
- Lucide React
- PostCSS

Configured in `package.json`. :contentReference[oaicite:1]{index=1}

---

# 🔮 Future Improvements

- Real-time API Integration
- AI-powered Insights
- Predictive Analytics
- User Authentication
- Cloud Database Integration
- PDF Report Export

---

# 👨‍💻 Author

Daksh Tiwari

---

# ⭐ Support

If you like this project, give it a star ⭐ on GitHub.
