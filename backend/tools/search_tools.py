from langchain_core.tools import tool
from connectors.search import MockSearchConnector

search_conn = MockSearchConnector()

@tool
async def search_web(query: str) -> dict:
    """
    Search for news, market trends, or competitor information online via a search engine (Tavily/SerpAPI).
    
    Args:
        query: Search query keywords.
        
    Returns:
        List of related news and snippets along with source URL references.
    """
    return await search_conn.fetch_data({"query": query})
