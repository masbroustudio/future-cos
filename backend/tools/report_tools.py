import json
import os
from datetime import datetime
from typing import List, Dict, Any
from langchain_core.tools import tool
from db.firestore_client import get_firestore_client

# Helper to read fixtures
def _load_fixture(filename: str) -> dict:
    try:
        filepath = os.path.join(os.path.dirname(__file__), "..", "fixtures", filename)
        if os.path.exists(filepath):
            with open(filepath, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception as e:
        print(f"Error reading fixture {filename}: {e}")
    return {}

@tool
def generate_board_report_draft(
    report_type: str,            # "board" | "investor"
    period: str,                 # e.g. "Q2 2026" or "Juni 2026"
    user_id: str = "default_user"
) -> dict:
    """
    Hasilkan draf laporan resmi untuk Board of Directors (Dewan Direksi) atau Investor.
    Laporan ini secara otomatis mengonsolidasikan data finansial terkini, sales highlights, 
    dan keputusan-keputusan strategis yang diambil dari database.
    
    Args:
        report_type: Tipe laporan, 'board' (formal, tata kelola) atau 'investor' (ringkas, metrik pertumbuhan).
        period: Periode laporan (misal: 'Q2 2026' atau 'Juli 2026').
        user_id: ID pengguna.
        
    Returns:
        Dictionary berisi judul laporan, metadata, dan isi konten laporan dalam format Markdown.
    """
    # 1. Fetch Finance Summary
    finance_data = _load_fixture("finance.json")
    curr_month = finance_data.get("current_month", {})
    cash_balance = curr_month.get("cash_balance", 750000000)
    monthly_revenue = curr_month.get("mrr", 180000000)
    runway = curr_month.get("cash_runway_months", 8.2)
    
    # 2. Fetch CRM highlights
    crm_data = _load_fixture("crm.json")
    open_deals = crm_data.get("sales_pipeline", {}).get("open_deals", 12)
    deals_value = crm_data.get("sales_pipeline", {}).get("pipeline_value", 450000000)
    customer_health = crm_data.get("customer_health", {})
    nps = customer_health.get("nps_score", 72)
    churn = customer_health.get("churn_rate_percent", 1.8)

    # 3. Fetch recent decisions from Firestore
    decisions_list = []
    try:
        db = get_firestore_client()
        docs = db.collection("decisions").where("userId", "==", user_id).limit(5).stream()
        for doc in docs:
            data = doc.to_dict()
            decisions_list.append(f"- **{data.get('title')}**: {data.get('decisionMade')} (Alasan: {data.get('rationale')})")
    except Exception as e:
        print("Error fetching decisions for report:", e)
        
    if not decisions_list:
        decisions_list = [
            "- *Tidak ada keputusan strategis baru yang tercatat pada periode ini.*"
        ]
        
    decisions_text = "\n".join(decisions_list)
    
    # 4. Generate content based on report type
    title = f"Laporan Kinerja {report_type.capitalize()} - {period}"
    
    if report_type == "investor":
        markdown_content = f"""# {title}
**Kepada**: Pemegang Saham & Investor Future Chief of Staff (CoS)
**Tanggal**: {datetime.utcnow().strftime('%d %B %Y')}
**Periode**: {period}

---

## 1. Ringkasan Eksekutif
Bisnis beroperasi dengan kinerja solid pada periode {period}. Fokus utama kami adalah ekspansi pasar dan optimalisasi retensi pelanggan. Cash runway saat ini berada di level aman mendukung pertumbuhan berkelanjutan.

## 2. Metrik Keuangan Kunci (Financial Health)
*   **Pendapatan Bulanan (MRR)**: Rp {monthly_revenue:,.0f}
*   **Saldo Kas & Setara Kas**: Rp {cash_balance:,.0f}
*   **Cash Runway**: {runway} Bulan

## 3. Metrik Pertumbuhan & Sales (CRM)
*   **Pipeline Sales Aktif**: {open_deals} Kesepakatan (Total Nilai: Rp {deals_value:,.0f})
*   **Net Promoter Score (NPS)**: {nps}
*   **Tingkat Churn Bulanan**: {churn}%

## 4. Keputusan Strategis & Penggunaan Dana
{decisions_text}

---
*Dibuat secara otomatis oleh Future Chief of Staff (CoS) Assistant.*
"""
    else:
        # Board of Directors Report
        markdown_content = f"""# {title}
**Kepada**: Dewan Direksi & Komisaris
**Tanggal**: {datetime.utcnow().strftime('%d %B %Y')}
**Periode**: {period}
**Klasifikasi**: Rahasia / Internal Only

---

## I. Tinjauan Finansial & Tata Kelola
Laporan tata kelola kinerja keuangan dan rencana alokasi modal perusahaan.
*   **Total Kas Tersedia**: Rp {cash_balance:,.0f}
*   **Kesehatan Kas**: Runway kas {runway} bulan memberikan fleksibilitas operasional yang memadai.
*   **Pendapatan Operasional Bulanan**: Rp {monthly_revenue:,.0f}

## II. Operasional & Manajemen Hubungan Pelanggan (CRM)
*   **Aktivitas Pipeline**: Penjualan menunjukkan prospek kuat dengan {open_deals} open deals senilai Rp {deals_value:,.0f}.
*   **Kepuasan Pelanggan**: NPS bertahan tinggi di angka {nps}, dengan target mempertahankan churn di bawah 2% (saat ini {churn}%).

## III. Log Keputusan Tata Kelola Board
Berikut adalah keputusan-keputusan strategis utama yang diambil dan memerlukan pengawasan Board:
{decisions_text}

## IV. Rencana Tindak Lanjut (Next Steps)
1. Menjaga stabilitas runway dengan pengendalian burn rate bulanan.
2. Mempercepat siklus closing sales pipeline.
3. Optimalisasi onboarding staf kunci baru.

---
*Laporan ini disajikan untuk keperluan evaluasi Dewan Direksi.*
"""

    return {
        "title": title,
        "report_type": report_type,
        "period": period,
        "content_markdown": markdown_content.strip(),
        "generated_at": datetime.utcnow().isoformat() + "Z"
    }

@tool
def render_report_card(
    title: str,
    report_type: str,
    period: str,
    content_markdown: str
) -> str:
    """
    Tampilkan draf laporan Board/Investor secara visual di layar obrolan pengguna (Generative UI).
    Panggil tool ini setelah Anda memanggil 'generate_board_report_draft' untuk menyajikan pratinjau laporan kepada pengguna.
    
    Args:
        title: Judul laporan.
        report_type: Jenis laporan ('board' atau 'investor').
        period: Periode laporan (misal: 'Q2 2026').
        content_markdown: Konten lengkap laporan dalam Markdown.
    """
    return "Menampilkan Draf Laporan..."
