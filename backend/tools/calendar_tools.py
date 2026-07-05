from langchain_core.tools import tool
from connectors.calendar import MockCalendarConnector

calendar_conn = MockCalendarConnector()

@tool
async def fetch_calendar_today() -> dict:
    """
    Fetch today's meeting agenda and focus blocks from Google Calendar.
    
    Returns:
        Dictionary containing 'events_today' array (list of meetings with preparation descriptions) and focus blocks.
    """
    return await calendar_conn.fetch_data({})
