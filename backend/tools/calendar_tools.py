from langchain_core.tools import tool
from connectors.calendar import MockCalendarConnector

calendar_conn = MockCalendarConnector()

@tool
async def fetch_calendar_today() -> dict:
    """
    Ambil agenda rapat dan focus blocks hari ini dari Google Calendar.
    
    Returns:
        Dictionary berisi array 'events_today' (list rapat dengan deskripsi persiapan) dan focus blocks.
    """
    return await calendar_conn.fetch_data({})
