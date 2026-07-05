from abc import ABC, abstractmethod
from typing import Dict, List, Any

class BaseConnector(ABC):
    """
    Base class for all data connectors in Future Chief of Staff (CoS).
    Supports fetching and metadata retrieval.
    """
    
    @abstractmethod
    async def fetch_data(self, query: Dict[str, Any]) -> Dict[str, Any]:
        """
        Fetch data matching the given query dict.
        """
        pass
        
    @abstractmethod
    async def get_latest(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Retrieve latest items (e.g. transactions, deals, calendar events).
        """
        pass
        
    @abstractmethod
    def get_metadata(self) -> Dict[str, Any]:
        """
        Return connector information (source name, status, data freshness).
        """
        pass
