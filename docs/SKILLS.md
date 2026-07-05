# Future CoS — SKILLS (Agent Tools & Capabilities)

> Versi: 1.0 | Dibuat: 2026-07-05

Dokumen ini mendefinisikan semua **tools/skills** yang dapat dipanggil oleh agent dalam sistem Future CoS. Tools ini adalah implementasi LangChain `@tool` di Python backend.

---

## Prinsip Desain Tool

> "**Kalkulasi dilakukan oleh tool (deterministik), bukan oleh LLM (probabilistik)**"

- Setiap tool memiliki satu tanggung jawab
- Tool harus idempotent jika memungkinkan
- Tool mengembalikan structured dict, bukan string
- Setiap tool dicatat dalam audit_log
- Tool dengan side-effect (write) memerlukan approval dari Autonomy Rules

---

## 1. Finance Tools (`backend/tools/finance_tools.py`)

### `fetch_finance_summary`
```python
@tool
def fetch_finance_summary(period: str = "current_month") -> dict:
    """
    Ambil ringkasan keuangan dari connector (Mock/Xero/Accurate).
    
    Args:
        period: "today" | "current_week" | "current_month" | "current_quarter" | "YYYY-MM"
    
    Returns:
        {
          "revenue": float,            # Total revenue period ini
          "revenue_vs_target": float,  # % terhadap target
          "revenue_trend": float,      # % vs period sebelumnya
          "expenses": float,
          "gross_margin": float,       # %
          "cash_balance": float,
          "cash_runway_months": float,
          "monthly_burn": float,
          "period": str,
          "data_freshness_hours": int  # Berapa jam yang lalu data di-sync
        }
    """
```

### `fetch_revenue_history`
```python
@tool
def fetch_revenue_history(months: int = 12) -> dict:
    """
    Ambil data historis revenue untuk trend analysis dan scenario simulator.
    
    Returns:
        {
          "history": [{"month": "2026-01", "revenue": float, "target": float}, ...],
          "avg_growth_rate": float,
          "volatility": float          # Std deviation growth rate
        }
    """
```

### `calculate_cash_runway`
```python
@tool
def calculate_cash_runway(
    current_cash: float, 
    monthly_burn: float, 
    monthly_revenue: float,
    growth_rate_monthly: float = 0.0
) -> dict:
    """
    Kalkulasi murni Python — BUKAN LLM.
    Hitung cash runway dengan dan tanpa asumsi growth.
    
    Returns:
        {
          "runway_months_no_growth": float,
          "runway_months_with_growth": float,
          "break_even_month": str | None,
          "warning": str | None          # "< 3 bulan" → critical warning
        }
    """
```

---

## 2. CRM/Sales Tools (`backend/tools/crm_tools.py`)

### `fetch_sales_highlights`
```python
@tool
def fetch_sales_highlights() -> dict:
    """
    Ambil highlight sales/pipeline dari connector.
    
    Returns:
        {
          "open_deals": int,
          "pipeline_value": float,
          "deals_closing_this_week": list[dict],
          "deals_stalled": list[dict],   # > 14 hari tanpa progress
          "conversion_rate": float,
          "avg_deal_size": float,
          "top_opportunities": list[dict]
        }
    """
```

### `fetch_customer_health`
```python
@tool
def fetch_customer_health() -> dict:
    """
    Ambil data customer health (churn risk, NPS trend, dll).
    
    Returns:
        {
          "total_customers": int,
          "churn_risk_count": int,
          "nps_score": float,
          "mrr": float,
          "arr": float,
          "churn_rate": float
        }
    """
```

---

## 3. Calendar & Communication Tools (`backend/tools/calendar_tools.py`)

### `fetch_calendar_today`
```python
@tool
def fetch_calendar_today() -> dict:
    """
    Ambil agenda hari ini dari Google Calendar (atau mock).
    
    Returns:
        {
          "events": [
            {
              "title": str,
              "start_time": str,
              "duration_minutes": int,
              "attendees": list[str],
              "is_important": bool,
              "preparation_needed": bool
            }
          ],
          "total_meeting_hours": float,
          "focus_blocks": list[dict]   # Waktu tanpa meeting
        }
    """
```

---

## 4. Search & Market Intelligence Tools (`backend/tools/search_tools.py`)

### `search_web`
```python
@tool
def search_web(query: str, num_results: int = 5) -> dict:
    """
    Web search via Tavily API (atau mock untuk dev).
    Cache hasil ke Firestore untuk hemat kuota.
    
    Returns:
        {
          "results": [
            {
              "title": str,
              "url": str,
              "snippet": str,
              "published_date": str,
              "source": str
            }
          ],
          "query": str,
          "cached": bool,           # Apakah dari cache?
          "cache_age_hours": int
        }
    """
```

### `fetch_competitor_info`
```python
@tool
def fetch_competitor_info(competitor_name: str) -> dict:
    """
    Cari informasi kompetitor dari cache dan web search.
    
    Returns:
        {
          "name": str,
          "recent_news": list[dict],
          "pricing_info": str | None,
          "product_updates": list[str],
          "last_updated": str,
          "data_confidence": str    # "high" | "medium" | "low"
        }
    """
```

---

## 5. Decision Log Tools (`backend/tools/decision_tools.py`)

### `save_decision_to_log`
```python
@tool
def save_decision_to_log(
    title: str,
    description: str,
    decision_made: str,
    rationale: str,
    assumptions: list[str],
    alternatives_considered: list[str],
    confidence_score: float,
    data_sources: list[str],
    tags: list[str],
    user_id: str
) -> dict:
    """
    Simpan keputusan ke Firestore Decision Log.
    REQUIRES APPROVAL (autonomy: "suggest").
    
    Returns:
        {
          "decision_id": str,
          "saved_at": str,
          "success": bool
        }
    """
```

### `search_similar_decisions`
```python
@tool
def search_similar_decisions(query: str, limit: int = 3) -> dict:
    """
    Cari keputusan serupa menggunakan vector similarity search.
    Firestore Vector Search dengan text-embedding-004.
    
    Returns:
        {
          "similar_decisions": [
            {
              "decision_id": str,
              "title": str,
              "decision_made": str,
              "outcome": str | None,    # Apakah keputusan itu berhasil?
              "similarity_score": float,
              "made_at": str
            }
          ]
        }
    """
```

---

## 6. Scenario Calculation Tools (`backend/tools/scenario_tools.py`)

> **PENTING: Semua fungsi di file ini adalah pure Python math. Zero LLM call.**

### `calculate_revenue_scenario`
```python
@tool
def calculate_revenue_scenario(
    base_monthly_revenue: float,
    growth_rate_change: float,    # delta % (misal: +0.02 = +2%)
    months: int,
    churn_rate: float = 0.02
) -> dict:
    """
    Proyeksi revenue dengan pertumbuhan berbeda.
    
    Returns:
        {
          "monthly_projections": [{"month": str, "baseline": float, "scenario": float}, ...],
          "total_revenue_baseline": float,
          "total_revenue_scenario": float,
          "revenue_delta": float,
          "revenue_delta_percent": float
        }
    """
```

### `calculate_hiring_impact`
```python
@tool
def calculate_hiring_impact(
    headcount_delta: int,
    avg_annual_salary: float,
    ramp_months: int = 3,
    revenue_per_head_monthly: float = 0,
    current_cash: float = 0,
    current_monthly_burn: float = 0
) -> dict:
    """
    Hitung dampak hiring terhadap burn rate dan runway.
    
    Returns:
        {
          "additional_monthly_burn": float,
          "new_monthly_burn": float,
          "new_runway_months": float,
          "time_to_productivity_months": int,
          "break_even_months": float | None
        }
    """
```

### `calculate_pricing_impact`
```python
@tool
def calculate_pricing_impact(
    current_price: float,
    new_price: float,
    price_elasticity: float,     # -1.5 = elastic, -0.5 = inelastic
    current_volume: int,
    cost_per_unit: float = 0
) -> dict:
    """
    Hitung dampak perubahan harga terhadap revenue dan volume.
    
    Returns:
        {
          "new_volume": float,
          "volume_change_percent": float,
          "current_monthly_revenue": float,
          "new_monthly_revenue": float,
          "revenue_change": float,
          "revenue_change_percent": float,
          "current_gross_margin": float,
          "new_gross_margin": float
        }
    """
```

---

## 7. RAG Tools (`backend/tools/rag_tools.py`)

### `retrieve_relevant_documents`
```python
@tool
def retrieve_relevant_documents(query: str, limit: int = 5, user_id: str = "") -> dict:
    """
    Ambil dokumen relevan dari Firestore Vector Store.
    
    Returns:
        {
          "documents": [
            {
              "id": str,
              "content": str,
              "source": str,         # "finance_q2_report.pdf"
              "relevance_score": float,
              "created_at": str
            }
          ],
          "query": str
        }
    """
```

### `embed_and_store_document`
```python
@tool
def embed_and_store_document(
    content: str,
    source: str,
    doc_type: str,    # "report" | "meeting_notes" | "research"
    user_id: str
) -> dict:
    """
    Embed dokumen dan simpan ke Firestore Vector Store.
    REQUIRES APPROVAL (autonomy: "auto" untuk dokumen internal).
    
    Returns:
        {
          "doc_id": str,
          "chunks_stored": int,
          "success": bool
        }
    """
```

---

## 8. Reporting Tools (`backend/tools/reporting_tools.py`)

### `generate_report_structure`
```python
@tool
def generate_report_structure(
    report_type: str,    # "investor_update" | "board_report" | "monthly_ops"
    period: str,
    audience: str        # "investor" | "board_internal" | "team"
) -> dict:
    """
    Generate struktur laporan yang sesuai audiens.
    Output ini kemudian di-filled oleh LLM dengan data nyata.
    
    Returns:
        {
          "sections": [
            {"title": str, "description": str, "data_needed": list[str]},
            ...
          ],
          "recommended_tone": str,
          "max_length_words": int
        }
    """
```

---

## Tool Registry per Agent

| Agent | Tools yang Digunakan |
|---|---|
| **OrchestratorAgent** | (tidak memanggil tools, hanya routing) |
| **BriefingAgent** | fetch_finance_summary, fetch_sales_highlights, fetch_calendar_today, search_web (news), retrieve_relevant_documents |
| **DecisionAgent** | search_similar_decisions, save_decision_to_log, retrieve_relevant_documents |
| **ScenarioAgent** | fetch_revenue_history, calculate_revenue_scenario, calculate_hiring_impact, calculate_pricing_impact, calculate_cash_runway |
| **ReportingAgent** | fetch_finance_summary, fetch_sales_highlights, generate_report_structure, retrieve_relevant_documents |
| **MarketIntelAgent** | search_web, fetch_competitor_info, retrieve_relevant_documents |

---

## Autonomy Level per Tool

| Tool | Autonomy Level | Alasan |
|---|---|---|
| fetch_* (semua read) | `auto` | Baca data tidak ada risk |
| calculate_* (semua) | `auto` | Kalkulasi deterministik |
| search_web | `auto` | Search saja, tidak ada side-effect |
| save_decision_to_log | `suggest` | Perlu konfirmasi user |
| embed_and_store_document | `auto` | Dokumen internal user sendiri |
| generate_report_structure | `auto` | Hanya template |
| [nanti] send_report_email | `approval` | WAJIB approval sebelum kirim |
| [nanti] write_to_external_crm | `approval` | Menulis ke sistem eksternal |

---

*Dokumen ini update setiap ada tool baru ditambahkan.*
