import pytest
from unittest.mock import MagicMock, patch
from tools.report_tools import generate_board_report_draft

@pytest.fixture
def mock_firestore():
    with patch("tools.report_tools.get_firestore_client") as mock_get_client:
        mock_db = MagicMock()
        mock_get_client.return_value = mock_db
        yield mock_db

def test_generate_board_report_draft_board(mock_firestore):
    # Mock firestore doc streams
    mock_doc = MagicMock()
    mock_doc.to_dict.return_value = {
        "title": "Hiring Sales lead",
        "decisionMade": "Approved budget Rp 15jt/month",
        "rationale": "Accelerate Q3 revenue growth"
    }
    
    mock_limit = MagicMock()
    mock_limit.stream.return_value = [mock_doc]
    
    mock_query = MagicMock()
    mock_query.limit.return_value = mock_limit
    
    mock_collection = MagicMock()
    mock_collection.where.return_value = mock_query
    mock_firestore.collection.return_value = mock_collection
    
    result = generate_board_report_draft.invoke({
        "report_type": "board",
        "period": "Q2 2026",
        "user_id": "default_user"
    })
    
    assert "title" in result
    assert result["report_type"] == "board"
    assert result["period"] == "Q2 2026"
    assert "content_markdown" in result
    # Check that it contains mocked decision title
    assert "Hiring Sales lead" in result["content_markdown"]
    # Check that it contains board specific headers
    assert "Tinjauan Finansial & Tata Kelola" in result["content_markdown"]

def test_generate_board_report_draft_investor(mock_firestore):
    mock_limit = MagicMock()
    mock_limit.stream.return_value = []
    
    mock_query = MagicMock()
    mock_query.limit.return_value = mock_limit
    
    mock_collection = MagicMock()
    mock_collection.where.return_value = mock_query
    mock_firestore.collection.return_value = mock_collection
    
    result = generate_board_report_draft.invoke({
        "report_type": "investor",
        "period": "Juli 2026",
        "user_id": "default_user"
    })
    
    assert result["report_type"] == "investor"
    assert "investor" in result["title"].lower()
    assert "Saldo Kas & Setara Kas" in result["content_markdown"]
    # Should fall back to "no strategic decisions" text
    assert "No new strategic decisions recorded" in result["content_markdown"]
