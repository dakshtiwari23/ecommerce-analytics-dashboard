import pandas as pd
import sqlite3
from datetime import datetime

# ======================================================
# E-Commerce ETL Pipeline
# ======================================================

print("Starting ETL Pipeline...")
print("Step 1: Extracting data")

# ------------------------------
# EXTRACT PHASE
# ------------------------------

orders_df = pd.read_csv("raw_data/orders.csv")
products_df = pd.read_csv("raw_data/products.csv")
customers_df = pd.read_csv("raw_data/customers.csv")

print(f"Orders Loaded: {len(orders_df)}")
print(f"Products Loaded: {len(products_df)}")
print(f"Customers Loaded: {len(customers_df)}")

# ------------------------------
# TRANSFORM PHASE
# ------------------------------

print("\nStep 2: Transforming data")

# Remove duplicates
orders_df = orders_df.drop_duplicates()

# Fill missing values
orders_df = orders_df.fillna(0)
products_df = products_df.fillna("Unknown")
customers_df = customers_df.fillna("Unknown")

# Convert order date
orders_df['Order_Date'] = pd.to_datetime(orders_df['Order_Date'])

# Create month column
orders_df['Month'] = orders_df['Order_Date'].dt.strftime('%b')

# Calculate revenue
orders_df['Revenue'] = orders_df['Quantity'] * orders_df['Price']

# Calculate profit
orders_df['Profit'] = orders_df['Revenue'] - orders_df['Cost']

# Merge product data
merged_df = pd.merge(
    orders_df,
    products_df,
    on='Product_ID',
    how='left'
)

# Merge customer data
merged_df = pd.merge(
    merged_df,
    customers_df,
    on='Customer_ID',
    how='left'
)

print("Data transformation completed")

# ------------------------------
# ANALYTICS CALCULATIONS
# ------------------------------

print("\nStep 3: Generating analytics")

# Monthly revenue
# -----------------------------
# Monthly Revenue Analysis
# -----------------------------

orders_df['Order_Date'] = pd.to_datetime(orders_df['Order_Date'])

orders_df['Month_Num'] = orders_df['Order_Date'].dt.month

orders_df['Month'] = orders_df['Order_Date'].dt.strftime('%b')

monthly_revenue = (
    orders_df.groupby(['Month_Num', 'Month'])['Revenue']
    .sum()
    .reset_index()
)

# Sort correctly Jan -> Dec
monthly_revenue = monthly_revenue.sort_values('Month_Num')

# Keep only required columns
monthly_revenue = monthly_revenue[['Month', 'Revenue']]

# Rename columns for dashboard
monthly_revenue.columns = ['month', 'revenue']
# Category analysis
category_analysis = merged_df.groupby('Category').agg({
    'Revenue': 'sum',
    'Profit': 'sum',
    'Quantity': 'sum'
}).reset_index()
category_analysis.columns = ['name', 'revenue', 'profit', 'qty']

# Payment analysis
payment_analysis = merged_df.groupby('Payment_Mode')['Revenue'].sum().reset_index()
payment_analysis.columns = ['name', 'value']
# State analysis
state_analysis = merged_df.groupby('State').agg({
    'Revenue': 'sum',
    'Profit': 'sum'
}).reset_index()
state_analysis.columns = ['state', 'revenue', 'profit']
# Sub-category analysis
top_products = merged_df.groupby(
    ['Category', 'Sub_Category']
).agg({
    'Revenue': 'sum',
    'Profit': 'sum',
    'Quantity': 'sum'
}).reset_index()

top_products.columns = [
    'cat',
    'name',
    'revenue',
    'profit',
    'qty'
]
print("Analytics generation completed")

# ------------------------------
# LOAD PHASE
# ------------------------------

print("\nStep 4: Loading into SQLite database")

conn = sqlite3.connect('ecommerce_dashboard.db')

merged_df.to_sql('processed_orders', conn, if_exists='replace', index=False)
monthly_revenue.to_sql('monthly_revenue', conn, if_exists='replace', index=False)
category_analysis.to_sql('category_analysis', conn, if_exists='replace', index=False)
payment_analysis.to_sql('payment_analysis', conn, if_exists='replace', index=False)
state_analysis.to_sql('state_analysis', conn, if_exists='replace', index=False)
top_products.to_sql('top_products', conn, if_exists='replace', index=False)

conn.commit()
conn.close()

print("Database loading completed")

# ------------------------------
# EXPORT JSON FOR REACT
# ------------------------------

print("\nStep 5: Exporting JSON files")

monthly_revenue.to_json(
    'src/data/monthlyData.json',
    orient='records'
)

category_analysis.to_json(
    'src/data/categoryData.json',
    orient='records'
)

payment_analysis.to_json(
    'src/data/paymentData.json',
    orient='records'
)

state_analysis.to_json(
    'src/data/stateData.json',
    orient='records'
)

top_products.to_json(
    'src/data/subcatData.json',
    orient='records'
)

print("JSON export completed")

# ------------------------------
# EXPORT CSV REPORTS
# ------------------------------

monthly_revenue.to_csv('monthly_revenue_report.csv', index=False)
category_analysis.to_csv('category_report.csv', index=False)
payment_analysis.to_csv('payment_report.csv', index=False)
state_analysis.to_csv('state_report.csv', index=False)
top_products.to_csv('top_products_report.csv', index=False)

print("CSV reports exported")

# ------------------------------
# KPI SUMMARY
# ------------------------------

print("\n========== KPI SUMMARY ==========")

TOTAL_REVENUE = merged_df['Revenue'].sum()
TOTAL_PROFIT = merged_df['Profit'].sum()
TOTAL_ORDERS = merged_df['Order_ID'].nunique()
TOTAL_QUANTITY = merged_df['Quantity'].sum()

PROFIT_MARGIN = (TOTAL_PROFIT / TOTAL_REVENUE) * 100

print(f"Total Revenue : ₹{TOTAL_REVENUE:,.2f}")
print(f"Total Profit  : ₹{TOTAL_PROFIT:,.2f}")
print(f"Total Orders  : {TOTAL_ORDERS}")
print(f"Units Sold    : {TOTAL_QUANTITY}")
print(f"Profit Margin : {PROFIT_MARGIN:.2f}%")

print("\nETL Pipeline Completed Successfully")
print(f"Execution Time: {datetime.now()}")

# ------------------------------
# EXPORT JSON FOR REACT
# ------------------------------

print("\nStep 5: Exporting JSON files")

monthly_revenue.to_json(
    'src/data/monthlyData.json',
    orient='records'
)

category_analysis.to_json(
    'src/data/categoryData.json',
    orient='records'
)

payment_analysis.to_json(
    'src/data/paymentData.json',
    orient='records'
)

state_analysis.to_json(
    'src/data/stateData.json',
    orient='records'
)

top_products.to_json(
    'src/data/subcatData.json',
    orient='records'
)

print("JSON export completed")