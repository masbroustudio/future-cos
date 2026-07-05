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
    Simpan keputusan strategis bisnis yang diambil ke dalam database Firestore Decision Log.
    Panggil tool ini ketika pengguna menyetujui (klik Approve/Simpan) atau secara eksplisit meminta untuk menyimpan keputusan ke database log.
    
    Args:
        title: Judul singkat keputusan strategis (max 100 karakter).
        description: Latar belakang dan konteks lengkap mengapa keputusan ini dibahas.
        decision_made: Hasil keputusan akhir yang diambil/dipilih.
        rationale: Alasan utama mengapa opsi ini dipilih dibanding alternatif lain.
        assumptions: Daftar asumsi utama yang dijadikan landasan keputusan.
        alternatives_considered: Opsi alternatif lain yang dipertimbangkan tapi ditolak beserta alasannya.
        confidence_score: Confidence score AI (0.0 - 1.0) terhadap keputusan ini.
        data_sources: Dokumen, data, atau dashboard yang dirujuk.
        tags: Label kategori (contoh: ['hiring', 'pricing', 'fundraising']).
        user_id: ID pengguna, default 'default_user'.
        
    Returns:
        Dictionary status berisi success: True, decision_id, dan timestamp penyimpanan.
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
    Cari keputusan-keputusan serupa yang pernah diambil sebelumnya di masa lalu untuk referensi dan pembanding.
    
    Args:
        query: Kata kunci pencarian keputusan terkait.
        user_id: ID pengguna.
        
    Returns:
        Dictionary berisi array 'similar_decisions' dengan judul, keputusan, dan hasil (outcome) jika ada.
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
                "outcome": data.get("outcome", "Belum terekam"),
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
    Tampilkan draf pencatatan keputusan strategis di layar obrolan pengguna (Generative UI).
    Panggil tool ini ketika AI mendeteksi diskusi tentang keputusan strategis atau ketika pengguna ingin membuat catatan keputusan strategis baru.
    
    Args:
        title: Judul singkat keputusan strategis (max 100 karakter).
        description: Deskripsi latar belakang / konteks keputusan.
        decision_made: Keputusan final yang diambil.
        rationale: Alasan utama keputusan tersebut.
        assumptions: Daftar asumsi utama yang mendasari keputusan.
        alternatives_considered: Opsi alternatif lain yang ditolak dan alasannya.
        confidence_score: Confidence score AI (0.0 - 1.0) terhadap keputusan ini.
        data_sources: Dokumen, data, atau dashboard yang dirujuk.
        tags: Label kategori (contoh: ['hiring', 'pricing', 'fundraising']).
    """
    return "Menampilkan Draf Pencatatan Keputusan..."
