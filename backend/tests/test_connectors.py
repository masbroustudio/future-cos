import pytest
import asyncio
from connectors.finance import MockFinanceConnector
from connectors.crm import MockCRMConnector
from connectors.calendar import MockCalendarConnector
from connectors.search import MockSearchConnector

@pytest.mark.asyncio
async def test_finance_connector():
    conn = MockFinanceConnector()
    meta = conn.get_metadata()
    assert meta["status"] == "connected"
    
    data = await conn.fetch_data({"period": "current_month"})
    assert "revenue" in data
    assert data["revenue"] == 180000000.0

@pytest.mark.asyncio
async def test_crm_connector():
    conn = MockCRMConnector()
    meta = conn.get_metadata()
    assert meta["status"] == "connected"
    
    data = await conn.fetch_data({"target": "summary"})
    assert "open_deals" in data
    assert data["open_deals"] == 23

@pytest.mark.asyncio
async def test_calendar_connector():
    conn = MockCalendarConnector()
    meta = conn.get_metadata()
    assert meta["status"] == "connected"
    
    data = await conn.fetch_data({})
    assert "events_today" in data
    assert len(data["events_today"]) == 2

@pytest.mark.asyncio
async def test_search_connector():
    conn = MockSearchConnector()
    meta = conn.get_metadata()
    assert meta["status"] == "connected"
    
    data = await conn.fetch_data({"query": "SaaS Co A"})
    assert "results" in data
    assert len(data["results"]) >= 1
    assert "SaaS Co A" in data["results"][0]["title"]
