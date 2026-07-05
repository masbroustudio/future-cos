from langchain_core.tools import tool
from connectors.finance import MockFinanceConnector

# Initialize mock finance connector
finance_conn = MockFinanceConnector()

@tool
async def fetch_finance_summary(period: str = "current_month") -> dict:
    """
    Fetch a summary of financial data (P&L, cash flow, cash runway, expenses) from the accounting system (Xero/Accurate).
    
    Args:
        period: Data period, default 'current_month'. Options: 'current_month', 'history'.
        
    Returns:
        Complete financial data dictionary containing revenue, expenses, gross margin, cash balance, and cash runway.
    """
    return await finance_conn.fetch_data({"period": period})

@tool
async def fetch_revenue_history(months: int = 12) -> dict:
    """
    Fetch monthly historical revenue data for trend analysis or forecasting.
    
    Args:
        months: Number of past months to retrieve.
        
    Returns:
        List of monthly historical data containing actual and target revenue.
    """
    return await finance_conn.fetch_data({"period": "history"})

@tool
def render_briefing_card(
    highlights: list,
    metrics: dict,
    agenda: list,
    reasoning_trail: dict
) -> str:
    """
    Display the Executive Daily Briefing card on the user's chat screen (Generative UI).
    Call this tool after you finish gathering and analyzing all business data.
    
    Args:
        highlights: List containing summaries of today's critical events. Each item has 'title', 'description', and 'severity' ('critical' | 'warning' | 'info').
        metrics: Dictionary containing key financial metrics (revenue, cash_balance, cash_runway_months).
        agenda: List of today's important meeting agendas. Each item has 'time', 'title', 'attendees', 'is_important', and 'preparation_note'.
        reasoning_trail: Dictionary containing dataSources, assumptions, confidenceScore, confidenceLabel, alternativeOptions, and warnings.
    """
    return "Displaying Executive Briefing..."
