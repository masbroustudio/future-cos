import os
import json
from typing import Dict, List, Any
from .base import BaseConnector

class MockCRMConnector(BaseConnector):
    def __init__(self):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        self.fixture_path = os.path.join(current_dir, "..", "fixtures", "crm.json")
        
    def _load_data(self) -> Dict[str, Any]:
        if not os.path.exists(self.fixture_path):
            raise FileNotFoundError(f"CRM fixture not found at {self.fixture_path}")
        with open(self.fixture_path, "r") as f:
            return json.load(f)

    async def fetch_data(self, query: Dict[str, Any]) -> Dict[str, Any]:
        data = self._load_data()
        target = query.get("target", "summary")
        
        if target == "stalled":
            return {"stalled_deals": data.get("deals_stalled", [])}
        elif target == "closing":
            return {"closing_deals": data.get("deals_closing_this_week", [])}
            
        return data

    async def get_latest(self, limit: int = 10) -> List[Dict[str, Any]]:
        data = self._load_data()
        return data.get("deals_closing_this_week", [])[:limit]

    def get_metadata(self) -> Dict[str, Any]:
        return {
            "source": "Mock HubSpot CRM",
            "status": "connected",
            "data_freshness_hours": 1
        }
