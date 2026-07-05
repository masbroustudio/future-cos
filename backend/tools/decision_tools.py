import os
import uuid
from datetime import datetime
from typing import List, Dict, Any
from langchain_core.tools import tool
from db.firestore_client import get_firestore_client

@tool
def save_decision_to_log(
    title: str,
    description: str,
    decision_made: str,
    rationale: str,
    assumptions: List[str],
    alternatives_considered: List[str],
    confidence_score: float,
    data_sources: List[str],
    tags: List[str],
    user_id: str = "default_user"
) -> dict:
    """
    Save the strategic business decision taken into the Firestore Decision Log database.
    Call this tool when the user approves (clicks Approve/Save) or explicitly requests to save the decision to the log database.
    
    Args:
        title: Short title of the strategic decision (max 100 characters).
        description: Full background and context of why this decision is being discussed.
        decision_made: The final decision made/selected.
        rationale: Main reason why this option was chosen over alternatives.
        assumptions: List of key assumptions behind the decision.
        alternatives_considered: Other alternative options considered but rejected and the reasons why.
        confidence_score: AI confidence score (0.0 - 1.0) for this decision.
        data_sources: Documents, data, or dashboards referenced.
        tags: Category labels (e.g. ['hiring', 'pricing', 'fundraising']).
        user_id: User ID, default 'default_user'.
        
    Returns:
        Dictionary status containing success: True, decision_id, and save timestamp.
    """
    try:
        db = get_firestore_client()
        decision_id = f"dec_{uuid.uuid4().hex[:12]}"
        
        # Determine confidence label
        if confidence_score >= 0.8:
            confidence_label = "High"
        elif confidence_score >= 0.5:
            confidence_label = "Medium"
        else:
            confidence_label = "Low"
            
        doc_data = {
            "id": decision_id,
            "userId": user_id,
            "title": title,
            "description": description,
            "decisionMade": decision_made,
            "rationale": rationale,
            "assumptions": assumptions,
            "alternativesConsidered": alternatives_considered,
            "confidenceScore": confidence_score,
            "confidenceLabel": confidence_label,
            "dataSources": data_sources,
            "tags": tags,
            "status": "confirmed",
            "madeAt": datetime.utcnow(),
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
            "createdByAgent": "CoS_Orchestrator_v1"
        }
        
        # Write to Firestore
        db.collection("decisions").document(decision_id).set(doc_data)
        
        return {
            "success": True,
            "decision_id": decision_id,
            "title": title,
            "saved_at": datetime.utcnow().isoformat() + "Z"
        }
    except Exception as e:
        print("Error saving decision:", e)
        return {
            "success": False,
            "error": str(e)
        }

@tool
def search_similar_decisions(query: str, user_id: str = "default_user") -> dict:
    """
    Search for similar decisions previously taken in the past for reference and comparison.
    
    Args:
        query: Search keywords for related decisions.
        user_id: User ID.
        
    Returns:
        Dictionary containing 'similar_decisions' array with title, decision, and outcome if any.
    """
    try:
        db = get_firestore_client()
        
        # Retrieve recent decisions for matching as a fallback mock vector search
        docs = db.collection("decisions").where("userId", "==", user_id).limit(10).stream()
        
        similar = []
        query_words = set(query.lower().split())
        
        for doc in docs:
            data = doc.to_dict()
            # Simple text match score based on title/description intersection
            title_words = set(data.get("title", "").lower().split())
            intersection = query_words.intersection(title_words)
            
            score = len(intersection) / max(len(query_words), 1)
            
            # Formatting timestamp
            made_at_dt = data.get("madeAt")
            made_at_str = made_at_dt.isoformat() if hasattr(made_at_dt, "isoformat") else str(made_at_dt)
            
            similar.append({
                "decision_id": data.get("id"),
                "title": data.get("title"),
                "decision_made": data.get("decisionMade"),
                "outcome": data.get("outcome", "Not recorded"),
                "similarity_score": round(score, 2),
                "made_at": made_at_str
            })
            
        # Sort by similarity score, fallback to recent
        similar.sort(key=lambda x: x["similarity_score"], reverse=True)
        
        return {
            "similar_decisions": similar[:3]
        }
    except Exception as e:
        print("Error searching similar decisions:", e)
        return {
            "similar_decisions": []
        }

@tool
def render_decision_log_card(
    title: str,
    description: str,
    decision_made: str,
    rationale: str,
    assumptions: List[str],
    alternatives_considered: List[str],
    confidence_score: float,
    data_sources: List[str],
    tags: List[str]
) -> str:
    """
    Display the draft strategic decision log on the user's chat screen (Generative UI).
    Call this tool when AI detects a discussion about a strategic decision or when the user wants to create a new strategic decision record.
    
    Args:
        title: Short title of the strategic decision (max 100 characters).
        description: Background / context description of the decision.
        decision_made: The final decision made.
        rationale: Main reason for the decision.
        assumptions: List of key assumptions underlying the decision.
        alternatives_considered: Other alternative options rejected and their reasons.
        confidence_score: AI confidence score (0.0 - 1.0) for this decision.
        data_sources: Documents, data, or dashboards referenced.
        tags: Category labels (e.g. ['hiring', 'pricing', 'fundraising']).
    """
    return "Displaying Decision Record Draft..."
