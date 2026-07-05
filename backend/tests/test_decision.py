import pytest
from unittest.mock import MagicMock, patch
from tools.decision_tools import save_decision_to_log, search_similar_decisions

@pytest.fixture
def mock_firestore():
    with patch("tools.decision_tools.get_firestore_client") as mock_get_client:
        mock_db = MagicMock()
        mock_get_client.return_value = mock_db
        yield mock_db

def test_save_decision_to_log_success(mock_firestore):
    # Mock firestore collection and document calls
    mock_collection = MagicMock()
    mock_doc = MagicMock()
    mock_firestore.collection.return_value = mock_collection
    mock_collection.document.return_value = mock_doc
    
    result = save_decision_to_log.invoke({
        "title": "Hiring Frontend Engineer",
        "description": "Butuh engineer tambahan untuk scale up dashboard.",
        "decision_made": "Hire 1 senior engineer remote",
        "rationale": "Lebih murah dan cepat onboard",
        "assumptions": ["Salary budget < Rp 20jt/bln"],
        "alternatives_considered": ["Outsource agency"],
        "confidence_score": 0.9,
        "data_sources": ["dashboard_stats"],
        "tags": ["hiring", "people"]
    })
    
    assert result["success"] is True
    assert "decision_id" in result
    mock_firestore.collection.assert_called_once_with("decisions")
    mock_collection.document.assert_called_once()
    mock_doc.set.assert_called_once()

def test_search_similar_decisions(mock_firestore):
    # Mock data to return from stream
    mock_doc1 = MagicMock()
    mock_doc1.to_dict.return_value = {
        "id": "dec_1",
        "title": "Hiring Backend Engineer",
        "decisionMade": "Hire 1 senior backend remote",
        "madeAt": "2026-06-01"
    }
    
    # Properly mock chained calls: collection().where().limit().stream()
    mock_limit = MagicMock()
    mock_limit.stream.return_value = [mock_doc1]
    
    mock_query = MagicMock()
    mock_query.limit.return_value = mock_limit
    
    mock_collection = MagicMock()
    mock_collection.where.return_value = mock_query
    
    mock_firestore.collection.return_value = mock_collection
    
    result = search_similar_decisions.invoke({
        "query": "Hiring engineer",
        "user_id": "default_user"
    })
    
    assert "similar_decisions" in result
    assert len(result["similar_decisions"]) == 1
    assert result["similar_decisions"][0]["title"] == "Hiring Backend Engineer"
    mock_firestore.collection.assert_called_once_with("decisions")
    mock_collection.where.assert_called_once_with("userId", "==", "default_user")
    mock_query.limit.assert_called_once_with(10)
    mock_limit.stream.assert_called_once()
