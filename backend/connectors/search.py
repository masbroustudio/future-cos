import os
import json
from typing import Dict, List, Any
from .base import BaseConnector

class MockSearchConnector(BaseConnector):
    def __init__(self):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        self.fixture_path = os.path.join(current_dir, "..", "fixtures", "search_results.json")
        
    def _load_data(self) -> Dict[str, Any]:
        if not os.path.exists(self.fixture_path):
            raise FileNotFoundError(f"Search results fixture not found at {self.fixture_path}")
        with open(self.fixture_path, "r") as f:
            return json.load(f)

    async def fetch_data(self, query: Dict[str, Any]) -> Dict[str, Any]:
        data = self._load_data()
        search_query = query.get("query", "").lower()
        
        # Simple local filtering mock
        results = []
        for comp in data.get("pricing_competitors", []):
            if search_query in comp["competitor"].lower() or search_query in comp["pricing_plans"].lower():
                results.append({
                    "title": f"Pricing updates for {comp['competitor']}",
                    "url": comp["url"],
                    "snippet": f"Plans: {comp['pricing_plans']}. Recent changes: {comp['recent_updates']}",
                    "published_date": "2026-07-01",
                    "source": comp["competitor"]
                })
                
        if not results:
            # Return all as fallback mock results
            for comp in data.get("pricing_competitors", []):
                results.append({
                    "title": f"Pricing updates for {comp['competitor']}",
                    "url": comp["url"],
                    "snippet": f"Plans: {comp['pricing_plans']}. Recent changes: {comp['recent_updates']}",
                    "published_date": "2026-07-01",
                    "source": comp["competitor"]
                })
                
        return {"results": results, "query": search_query}

    async def get_latest(self, limit: int = 10) -> List[Dict[str, Any]]:
        data = self._load_data()
        return data.get("pricing_competitors", [])[:limit]

    def get_metadata(self) -> Dict[str, Any]:
        return {
            "source": "Mock Tavily Search API",
            "status": "connected",
            "data_freshness_hours": 24
        }
