import os
import json
from typing import Dict, List, Any
from .base import BaseConnector

class MockCalendarConnector(BaseConnector):
    def __init__(self):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        self.fixture_path = os.path.join(current_dir, "..", "fixtures", "calendar.json")
        
    def _load_data(self) -> Dict[str, Any]:
        if not os.path.exists(self.fixture_path):
            raise FileNotFoundError(f"Calendar fixture not found at {self.fixture_path}")
        with open(self.fixture_path, "r") as f:
            return json.load(f)

    async def fetch_data(self, query: Dict[str, Any]) -> Dict[str, Any]:
        data = self._load_data()
        return data

    async def get_latest(self, limit: int = 10) -> List[Dict[str, Any]]:
        data = self._load_data()
        return data.get("events_today", [])[:limit]

    def get_metadata(self) -> Dict[str, Any]:
        return {
            "source": "Mock Google Calendar",
            "status": "connected",
            "data_freshness_hours": 0
        }
