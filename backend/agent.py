import os
import uuid
import json
from typing import Optional
from typing_extensions import TypedDict
from dotenv import load_dotenv

# Load env variables at start
load_dotenv()

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.agents import create_agent
from langchain.tools import tool, ToolRuntime
from langchain_core.messages import ToolMessage
from langgraph.types import Command
from copilotkit import CopilotKitMiddleware, CopilotKitState
from langgraph.checkpoint.memory import MemorySaver

# Import Future CoS Specialist Tools
from tools.finance_tools import fetch_finance_summary, fetch_revenue_history, render_briefing_card
from tools.crm_tools import fetch_sales_highlights, fetch_customer_health
from tools.calendar_tools import fetch_calendar_today
from tools.search_tools import search_web
from tools.decision_tools import save_decision_to_log, search_similar_decisions, render_decision_log_card
from tools.scenario_tools import calculate_revenue_scenario, calculate_hiring_impact, calculate_pricing_impact, render_scenario_chart
from tools.report_tools import generate_board_report_draft, render_report_card
from tools.market_tools import fetch_market_intelligence, render_market_digest_card

# State Schema
class Todo(TypedDict):
    id: str
    title: str
    completed: bool

class AgentState(CopilotKitState):
    todos: list[Todo]
    briefing: Optional[dict]
    decisions: Optional[list]
    scenarios: Optional[list]
    reasoning_trail: Optional[dict]

# Existing Todo Helpers (for backward compatibility)
def load_db_todos():
    path = "/tmp/db.json" if os.getenv("NODE_ENV") == "production" else "../mvp/db.json"
    if not os.path.exists(path):
        return []
    try:
        with open(path, "r") as f:
            tasks = json.load(f)
        return [
            {
                "id": t["id"],
                "title": t["title"],
                "completed": t["status"] == "completed"
            }
        ]
    except Exception as e:
        print("Failed to load db todos:", e)
        return []

def save_db_todos(todos):
    path = "/tmp/db.json" if os.getenv("NODE_ENV") == "production" else "../mvp/db.json"
    try:
        tasks = [
            {
                "id": t["id"],
                "title": t["title"],
                "status": "completed" if t.get("completed") else "pending"
            }
            for t in todos
        ]
        with open(path, "w") as f:
            json.dump(tasks, f, indent=2)
    except Exception as e:
        print("Failed to save db todos:", e)

@tool
def manage_todos(todos: list[Todo], runtime: ToolRuntime) -> Command:
    """Replace the entire todo list. Use this to add, edit, or remove todos."""
    for todo in todos:
        if not todo.get("id"):
            todo["id"] = str(uuid.uuid4())
    
    save_db_todos(todos)

    return Command(update={
        "todos": todos,
        "messages": [
            ToolMessage(
                content="Successfully updated todos",
                tool_call_id=runtime.tool_call_id,
            )
        ],
    })

@tool
def get_todos(runtime: ToolRuntime):
    """Get the current todo list."""
    todos = load_db_todos()
    return todos

# All registered tools
cos_tools = [
    manage_todos, 
    get_todos,
    fetch_finance_summary,
    fetch_revenue_history,
    render_briefing_card,
    fetch_sales_highlights,
    fetch_customer_health,
    fetch_calendar_today,
    search_web,
    save_decision_to_log,
    search_similar_decisions,
    render_decision_log_card,
    calculate_revenue_scenario,
    calculate_hiring_impact,
    calculate_pricing_impact,
    render_scenario_chart,
    generate_board_report_draft,
    render_report_card,
    fetch_market_intelligence,
    render_market_digest_card
]

# Google Gemini model
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash", 
    google_api_key=os.getenv("GEMINI_API_KEY")
)

# System Prompt for the AI Chief of Staff (CoS)
system_prompt = (
    "Kamu adalah Future Chief of Staff (CoS), asisten AI eksekutif tepercaya untuk Founder & C-Suite. "
    "Tugasmu adalah membantu pengambilan keputusan strategis bisnis dengan 5 pilar utama:\n"
    "1. Executive Daily/Weekly Briefing (Gunakan `fetch_finance_summary`, `fetch_sales_highlights`, `fetch_calendar_today`, `render_briefing_card`)\n"
    "2. Decision Log dengan Reasoning Trail (Gunakan `save_decision_to_log`, `search_similar_decisions`, `render_decision_log_card`)\n"
    "3. Scenario Simulator ('What-If' Copilot) (Gunakan `calculate_revenue_scenario`, `calculate_hiring_impact`, `calculate_pricing_impact`, `render_scenario_chart`)\n"
    "4. Board & Investor Reporting (Gunakan `generate_board_report_draft`, `render_report_card`)\n"
    "5. Competitive & Market Intelligence (Gunakan `fetch_market_intelligence`, `render_market_digest_card`)\n\n"
    "Setiap kali mendeteksi diskusi atau pernyataan tentang keputusan strategis bisnis (seperti: 'Kita putuskan untuk...', 'Kita akan...', 'Saya putuskan...', 'Catat keputusan ini...'), kamu HARUS:\n"
    "- PLAN: Pikirkan latar belakang, opsi alternatif, asumsi dasar, dan confidence score.\n"
    "- SELECT & EXECUTE: Panggil 'search_similar_decisions' untuk mencari referensi historis serupa jika ada.\n"
    "- SYNTHESIZE & REFLECT: Panggil 'render_decision_log_card' dengan draf data terstruktur keputusan untuk ditampilkan secara visual di layar pengguna. Jangan langsung menyimpan tanpa konfirmasi jika otonomi adalah 'suggest'.\n\n"
    "Setiap kali pengguna meminta untuk mensimulasikan skenario, mengajukan pertanyaan 'What-If' finansial (misal: 'Bagaimana jika kita hire 2 orang lagi?', 'Bagaimana jika revenue naik 5%?', 'Jika harga naik 10% dampak ke MRR apa?'), kamu HARUS:\n"
    "- PLAN: Identifikasi jenis skenario (revenue_growth, hiring, atau pricing).\n"
    "- SELECT & EXECUTE: Panggil tool kalkulasi yang sesuai (`calculate_revenue_scenario`, `calculate_hiring_impact`, atau `calculate_pricing_impact`). PENTING: Jangan lakukan kalkulasi matematika sendiri di teks, biarkan tool Python yang mengkalkulasinya.\n"
    "- SYNTHESIZE & REFLECT: Panggil 'render_scenario_chart' dengan metrik ringkasan, proyeksi, dan reasoning trail untuk merender visualisasi grafik proyeksi di layar obrolan.\n\n"
    "Setiap kali pengguna meminta draf laporan bulanan/triwulanan untuk Dewan Direksi atau Investor (seperti: 'Buatkan draf report untuk board', 'Generate investor report', 'Buat draf laporan dewan direksi'), kamu HARUS:\n"
    "- PLAN: Identifikasi tipe laporan ('board' atau 'investor') dan periodenya.\n"
    "- SELECT & EXECUTE: Panggil `generate_board_report_draft` untuk mengompilasi data finansial, sales, dan log keputusan dari database.\n"
    "- SYNTHESIZE & REFLECT: Panggil `render_report_card` untuk menampilkan pratinjau draf laporan secara visual dengan antarmuka yang rapi dan opsi unduhan.\n\n"
    "Setiap kali pengguna meminta intelijen pasar atau riset kompetitor (seperti: 'Bagaimana harga kompetitor?', 'Cari berita kompetitor AI', 'Pantau market intelijen'), kamu HARUS:\n"
    "- PLAN: Identifikasi kueri riset pasar kompetitor.\n"
    "- SELECT & EXECUTE: Panggil `fetch_market_intelligence` untuk memindai berita (memanfaatkan cache Firestore untuk hemat kuota API).\n"
    "- SYNTHESIZE & REFLECT: Panggil `render_market_digest_card` untuk merender informasi intelijen pasar secara visual.\n\n"
    "PENTING: Selalu gunakan tool Generative UI (seperti `render_briefing_card`, `render_decision_log_card`, `render_scenario_chart`, `render_report_card`, dan `render_market_digest_card`) untuk menyajikan informasi visual yang interaktif ke pengguna. Jangan tampilkan teks markdown panjang secara mentah.\n"
    "Selalu jawab dalam Bahasa Indonesia yang profesional, lugas, dan terstruktur."
)

memory = MemorySaver()

# Build the LangGraph agent
graph = create_agent(
    model=llm,
    state_schema=AgentState,
    tools=cos_tools,
    middleware=[CopilotKitMiddleware()],
    system_prompt=system_prompt,
    checkpointer=memory
)
