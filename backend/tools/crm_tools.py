from langchain_core.tools import tool
from connectors.crm import MockCRMConnector

crm_conn = MockCRMConnector()

@tool
async def fetch_sales_highlights() -> dict:
    """
    Ambil ringkasan pipeline penjualan (CRM HubSpot) yang berisi target sales, deal aktif, konversi, dan deals yang terhambat (stalled).
    """
    return await crm_conn.fetch_data({"target": "summary"})

@tool
async def fetch_customer_health() -> dict:
    """
    Ambil metrik kesehatan pelanggan (NPS score, churn rate, total MRR aktif, jumlah customer).
    """
    return await crm_conn.fetch_data({"target": "health"})
