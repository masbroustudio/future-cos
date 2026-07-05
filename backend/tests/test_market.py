import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from tools.market_tools import fetch_market_intelligence

@pytest.fixture
def mock_dependencies():
    with patch("tools.market_tools.get_firestore_client") as mock_get_client, \
         patch("tools.market_tools.search_web", new_callable=AsyncMock) as mock_search_web:
        mock_db = MagicMock()
        mock_get_client.return_value = mock_db
        
        # mock search_web return value
        mock_search_web.return_value = {
            "results": [
                {
                    "title": "Pricing updates for CompetitorA",
                    "url": "http://competitora.com",
                    "snippet": "Plans: Basic $10, Pro $20",
                    "source": "CompetitorA"
                }
            ]
        }
        
        yield mock_db, mock_search_web

def test_fetch_market_intelligence_cache_hit(mock_dependencies):
    mock_db, mock_search_web = mock_dependencies
    
    # Mock doc to exist (cache hit)
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = {
        "query": "pricing",
        "results": [{"title": "Cached result"}],
        "insights": "Cached insights",
        "cached_at": "2026-07-05T12:00:00Z"
    }
    
    mock_db.collection.return_value.document.return_value.get.return_value = mock_doc
    
    result = fetch_market_intelligence.invoke({
        "query_text": "pricing",
        "force_refresh": False
    })
    
    assert result["cache_hit"] is True
    assert result["insights"] == "Cached insights"
    mock_search_web.assert_not_called()

def test_fetch_market_intelligence_cache_miss(mock_dependencies):
    mock_db, mock_search_web = mock_dependencies
    
    # Mock doc to NOT exist (cache miss)
    mock_doc = MagicMock()
    mock_doc.exists = False
    
    mock_db.collection.return_value.document.return_value.get.return_value = mock_doc
    
    result = fetch_market_intelligence.invoke({
        "query_text": "competitor pricing",
        "force_refresh": False
    })
    
    assert result["cache_hit"] is False
    assert len(result["results"]) == 1
    assert "CompetitorA" in result["results"][0]["title"]
    mock_search_web.assert_called_once_with("competitor pricing")
    mock_db.collection.return_value.document.return_value.set.assert_called_once()
