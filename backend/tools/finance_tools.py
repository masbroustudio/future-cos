from langchain_core.tools import tool
from connectors.finance import MockFinanceConnector

# Initialize mock finance connector
finance_conn = MockFinanceConnector()

@tool
async def fetch_finance_summary(period: str = "current_month") -> dict:
    """
    Ambil ringkasan data keuangan (P&L, cash flow, cash runway, expenses) dari accounting system (Xero/Accurate).
    
    Args:
        period: Periode data, default 'current_month'. Pilihan: 'current_month', 'history'.
        
    Returns:
        Dictionary data keuangan lengkap yang berisi revenue, expenses, gross margin, cash balance, dan cash runway.
    """
    return await finance_conn.fetch_data({"period": period})

@tool
async def fetch_revenue_history(months: int = 12) -> dict:
    """
    Ambil data historis revenue bulanan untuk kebutuhan analisa tren atau forecasting.
    
    Args:
        months: Jumlah bulan ke belakang yang ingin diambil.
        
    Returns:
        List data historis bulanan berisi revenue aktual dan target.
    """
    return await finance_conn.fetch_data({"period": "history"})

@tool
def render_briefing_card(
    highlights: list,
    metrics: dict,
    agenda: list,
    reasoning_trail: dict
) -> str:
    """
    Tampilkan kartu Briefing Eksekutif Harian di layar pengguna (Generative UI).
    Panggil tool ini setelah Anda selesai mengumpulkan semua data dan menganalisisnya.
    
    Args:
        highlights: List berisi ringkasan kejadian kritis hari ini. Setiap item memiliki 'title', 'description', dan 'severity' ('critical' | 'warning' | 'info').
        metrics: Dictionary berisi metrik finansial utama (revenue, cash_balance, cash_runway_months).
        agenda: List agenda rapat penting hari ini. Setiap item memiliki 'time', 'title', 'attendees', 'is_important', dan 'preparation_note'.
        reasoning_trail: Dictionary berisi dataSources, assumptions, confidenceScore, confidenceLabel, alternativeOptions, dan warnings.
    """
    return "Menampilkan Briefing Eksekutif..."
