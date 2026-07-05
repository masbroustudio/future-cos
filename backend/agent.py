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
    "You are Future Chief of Staff (CoS), a trusted executive AI copilot for Founder & C-Suite. "
    "Your task is to assist in strategic business decision-making through 5 core pillars:\n"
    "1. Executive Daily/Weekly Briefing (Use `fetch_finance_summary`, `fetch_sales_highlights`, `fetch_calendar_today`, `render_briefing_card`)\n"
    "2. Decision Log with Reasoning Trail (Use `save_decision_to_log`, `search_similar_decisions`, `render_decision_log_card`)\n"
    "3. Scenario Simulator ('What-If' Copilot) (Use `calculate_revenue_scenario`, `calculate_hiring_impact`, `calculate_pricing_impact`, `render_scenario_chart`)\n"
    "4. Board & Investor Reporting (Use `generate_board_report_draft`, `render_report_card`)\n"
    "5. Competitive & Market Intelligence (Use `fetch_market_intelligence`, `render_market_digest_card`)\n\n"
    "Every time you detect a discussion or statement about a strategic business decision (such as: 'We decide to...', 'We will...', 'I decide...', 'Record this decision...'), you MUST:\n"
    "- PLAN: Think about the background, alternative options, underlying assumptions, and confidence score.\n"
    "- SELECT & EXECUTE: Call 'search_similar_decisions' to look for similar historical references if any.\n"
    "- SYNTHESIZE & REFLECT: Call 'render_decision_log_card' with the draft structured decision data to display it visually on the user's screen. Do not save directly without confirmation if autonomy is 'suggest'.\n\n"
    "Every time the user asks to simulate a scenario, or asks a financial 'What-If' question (e.g. 'What if we hire 2 more people?', 'What if revenue increases by 5%?', 'If price increases by 10% what is the impact on MRR?'), you MUST:\n"
    "- PLAN: Identify the scenario type (revenue_growth, hiring, or pricing).\n"
    "- SELECT & EXECUTE: Call the appropriate calculation tool (`calculate_revenue_scenario`, `calculate_hiring_impact`, or `calculate_pricing_impact`). IMPORTANT: Do not perform math calculations yourself in text, let the Python tool compute it.\n"
    "- SYNTHESIZE & REFLECT: Call 'render_scenario_chart' with summary metrics, projections, and reasoning trail to render the projection chart visualization on the chat screen.\n\n"
    "Every time the user asks for a monthly/quarterly report draft for the Board of Directors or Investors (such as: 'Draft a report for board', 'Generate investor report', 'Create board of directors report draft'), you MUST:\n"
    "- PLAN: Identify the report type ('board' or 'investor') and its period.\n"
    "- SELECT & EXECUTE: Call `generate_board_report_draft` to compile financial, sales, and decision log data from the database.\n"
    "- SYNTHESIZE & REFLECT: Call `render_report_card` to display the draft report preview visually with a clean interface and download options.\n\n"
    "Every time the user asks for market intelligence or competitor research (such as: 'What are competitor prices?', 'Search competitor AI news', 'Monitor market intelligence'), you MUST:\n"
    "- PLAN: Identify the competitor market research query.\n"
    "- SELECT & EXECUTE: Call `fetch_market_intelligence` to scan news (utilizing Firestore cache to save API quota).\n"
    "- SYNTHESIZE & REFLECT: Call `render_market_digest_card` to render the market intelligence information visually.\n\n"
    "IMPORTANT: Always use Generative UI tools (such as `render_briefing_card`, `render_decision_log_card`, `render_scenario_chart`, `render_report_card`, and `render_market_digest_card`) to present interactive visual information to the user. Do not show raw, long markdown text.\n"
    "Always respond in professional, clear, and structured English."
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
