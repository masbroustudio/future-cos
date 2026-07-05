from datetime import datetime
from typing import Dict, List, Any

def build_reasoning_trail(
    data_sources: List[str] = None,
    assumptions: List[str] = None,
    confidence_score: float = 1.0,
    alternative_options: List[str] = None,
    warnings: List[str] = None,
    agent_version: str = "1.0.0"
) -> Dict[str, Any]:
    """
    Construct a structured Reasoning Trail dictionary.
    """
    if data_sources is None:
        data_sources = []
    if assumptions is None:
        assumptions = []
    if alternative_options is None:
        alternative_options = []
    if warnings is None:
        warnings = []
        
    # Determine confidence label
    if confidence_score >= 0.8:
        confidence_label = "High"
    elif confidence_score >= 0.5:
        confidence_label = "Medium"
    else:
        confidence_label = "Low"
        
    return {
        "dataSources": data_sources,
        "assumptions": assumptions,
        "confidenceScore": confidence_score,
        "confidenceLabel": confidence_label,
        "alternativeOptions": alternative_options,
        "warnings": warnings,
        "generatedAt": datetime.utcnow().isoformat() + "Z",
        "agentVersion": agent_version
    }
