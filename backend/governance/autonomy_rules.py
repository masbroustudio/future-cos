from typing import Dict

# Autonomy levels for different CoS tools and actions
# "auto": execute automatically
# "suggest": ask the user to confirm via chat before executing
# "approval": require strict admin/user approval before executing
AUTONOMY_RULES: Dict[str, str] = {
    # Finance and CRM tools (Safe reads)
    "fetch_finance_summary": "auto",
    "fetch_revenue_history": "auto",
    "fetch_sales_highlights": "auto",
    "fetch_customer_health": "auto",
    
    # Calendar (Safe read)
    "fetch_calendar_today": "auto",
    
    # Search and Market Intel
    "search_web": "auto",
    "fetch_competitor_info": "auto",
    
    # Document retrieve
    "retrieve_relevant_documents": "auto",
    "embed_and_store_document": "auto",
    
    # Scenario Simulator (Math logic is safe)
    "calculate_revenue_scenario": "auto",
    "calculate_hiring_impact": "auto",
    "calculate_pricing_impact": "auto",
    "calculate_cash_runway": "auto",
    
    # Reporting
    "generate_report_structure": "auto",
    "save_report_draft": "suggest",
    "send_report_email": "approval",  # Requires user click in the UI to approve email sending
    
    # Decision Log writes
    "save_decision_to_log": "suggest",  # CoS detects decision, suggests saving, user confirms
    "search_similar_decisions": "auto"
}

def get_autonomy_level(tool_name: str) -> str:
    """
    Get the autonomy level for a given tool.
    Returns 'suggest' by default for safety.
    """
    return AUTONOMY_RULES.get(tool_name, "suggest")
