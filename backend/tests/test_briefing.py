import pytest
from tools.finance_tools import fetch_finance_summary, fetch_revenue_history
from tools.crm_tools import fetch_sales_highlights, fetch_customer_health
from tools.calendar_tools import fetch_calendar_today
from tools.search_tools import search_web

@pytest.mark.asyncio
async def test_briefing_tools():
    # Test finance summary tool
    finance = await fetch_finance_summary.ainvoke({"period": "current_month"})
    assert isinstance(finance, dict)
    assert "revenue" in finance
    assert finance["cash_runway_months"] == 8.2
    
    # Test sales highlights tool
    sales = await fetch_sales_highlights.ainvoke({})
    assert isinstance(sales, dict)
    assert "open_deals" in sales
    assert sales["pipeline_value"] == 2100000000.0
    
    # Test calendar today tool
    calendar = await fetch_calendar_today.ainvoke({})
    assert isinstance(calendar, dict)
    assert "events_today" in calendar
    assert len(calendar["events_today"]) == 2
    
    # Test search web tool
    search = await search_web.ainvoke({"query": "SaaS Co A"})
    assert isinstance(search, dict)
    assert "results" in search
    assert len(search["results"]) >= 1
