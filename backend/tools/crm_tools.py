from langchain_core.tools import tool
from connectors.crm import MockCRMConnector

crm_conn = MockCRMConnector()

@tool
async def fetch_sales_highlights() -> dict:
    """
    Fetch a sales pipeline summary (HubSpot CRM) containing sales targets, active deals, conversion rates, and stalled deals.
    """
    return await crm_conn.fetch_data({"target": "summary"})

@tool
async def fetch_customer_health() -> dict:
    """
    Fetch customer health metrics (NPS score, churn rate, total active MRR, customer count).
    """
    return await crm_conn.fetch_data({"target": "health"})
