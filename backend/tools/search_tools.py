from langchain_core.tools import tool
from connectors.search import MockSearchConnector

search_conn = MockSearchConnector()

@tool
async def search_web(query: str) -> dict:
    """
    Cari berita, tren pasar, atau informasi kompetitor secara online lewat search engine (Tavily/SerpAPI).
    
    Args:
        query: Kata kunci pencarian.
        
    Returns:
        List berita dan snippet terkait berserta link URL sumber referensinya.
    """
    return await search_conn.fetch_data({"query": query})
