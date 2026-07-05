import os
import json
from typing import Dict, List, Any
from .base import BaseConnector

class MockFinanceConnector(BaseConnector):
    def __init__(self):
        # Resolve fixtures path relative to this file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        self.fixture_path = os.path.join(current_dir, "..", "fixtures", "finance.json")
        
    def _load_data(self) -> Dict[str, Any]:
        if not os.path.exists(self.fixture_path):
            raise FileNotFoundError(f"Finance fixture not found at {self.fixture_path}")
        with open(self.fixture_path, "r") as f:
            return json.load(f)

    async def fetch_data(self, query: Dict[str, Any]) -> Dict[str, Any]:
        """
        Mock fetching finance data. Period can be specified.
        """
        data = self._load_data()
        period = query.get("period", "current_month")
        
        if period == "current_month" and "current_month" in data:
            return data["current_month"]
        elif period == "history" and "history_monthly" in data:
            return {"history": data["history_monthly"]}
            
        return data.get(period, data["current_month"])

    async def get_latest(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get latest financial transactions/snapshots.
        """
        data = self._load_data()
        return data.get("history_monthly", [])[:limit]

    def get_metadata(self) -> Dict[str, Any]:
        data = self._load_data()
        return {
            "source": "Mock Accounting Software (Xero/Accurate)",
            "status": "connected",
            "data_freshness_hours": data.get("data_freshness_hours", 2)
        }
