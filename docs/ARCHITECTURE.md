# Future CoS — ARCHITECTURE

> Version: 1.0 | Created: 2026-07-05

---

## 1. 6‑Layer Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 6 — GENERATIVE UI + PRESENTATION                             │
│                                                                     │
│  Next.js 16 (App Router) — TypeScript                               │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌───────────┐  │
│  │ BriefingCard │ │ DecisionLog  │ │  ScenarioUI  │ │ ReportUI  │  │
│  │  (GenUI)     │ │  (GenUI)     │ │  (GenUI)     │ │  (GenUI)  │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └───────────┘  │
│                                                                     │
│  Chat Canvas ←→ AG‑UI Protocol ←→ ReasoningTrail Panel               │
├─────────────────────────────────────────────────────────────────────┤
│  LAYER 5 — REASONING & GOVERNANCE                                   │
│                                                                     │
│  ┌───────────────────┐  ┌────────────────┐  ┌──────────────────┐   │
│  │ ReasoningTrail    │  │ Autonomy Rules │  │   Audit Log      │   │
│  │ Builder           │  │ Engine         │  │   (Firestore)    │   │
│  │ (source, assumptions, confidence) │  │ (auto‑exec vs approval) │  │                  │   │
│  └───────────────────┘  └────────────────┘  └──────────────────┘   │
├─────────────────────────────────────────────────────────────────────┤
│  LAYER 4 — AGENT ORCHESTRATION (LangGraph)                          │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Orchestrator Agent                                          │   │
│  │  (intent detection → routing → synthesis)                    │   │
│  └──────┬──────────────┬───────────────┬────────────────┬───────┘   │
│         │              │               │                │           │
│  ┌──────▼───┐  ┌───────▼──┐  ┌────────▼──┐  ┌─────────▼──────┐    │
│  │ Briefing │  │ Decision │  │ Scenario  │  │ Market Intel   │    │
│  │  Agent   │  │  Agent   │  │   Agent   │  │     Agent      │    │
│  └──────────┘  └──────────┘  └───────────┘  └────────────────┘    │
│                    ┌──────────────────┐                            │
│                    │  Reporting Agent │                            │
│                    └──────────────────┘                            │
├─────────────────────────────────────────────────────────────────────┤
│  LAYER 3 — CONTEXT & MEMORY (RAG)                                   │
│                                                                     │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────────────┐   │
│  │ Vector DB      │  │ Structured DB  │  │  Session Memory     │   │
│  │ (Firestore     │  │ (Firestore)   │  │  (LangGraph         │   │
│  │  Vector Search)│  │ Decision Log   │  │   MemorySaver)      │   │
│  │ Documents      │  │ Metrics        │  │                     │   │
│  │ Research       │  │ KPIs           │  │                     │   │
│  └────────────────┘  └────────────────┘  └─────────────────────┘   │
├─────────────────────────────────────────────────────────────────────┤
│  LAYER 2 — INTEGRATION / CONNECTOR (Mock → Real)                    │
│                                                                     │
│  ┌──────────┐ ┌────────┐ ┌───────┐ ┌──────────┐ ┌─────────────┐   │
│  │ Finance  │ │  CRM   │ │  Ops  │ │  Email/  │ │    Web/     │   │
│  │ Mock API │ │  Mock  │ │  Mock │ │ Calendar │ │    News     │   │
│  │ (→ Xero) │ │ (→HubS)│ │(→Not.)│ │   Mock  │ │    API      │   │
│  └──────────┘ └────────┘ └───────┘ └──────────┘ └─────────────┘   │
├─────────────────────────────────────────────────────────────────────┤
│  LAYER 1 — DATA SOURCES                                             │
│                                                                     │
│  Finance | CRM | Ops | Email | Calendar | Documents | Web/News      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Detailed Layer Breakdown

### Layer 1 — Data Sources

| Category | Real Source (future) | Mock Dev |
|---|---|---|
| Financial data | Accurate/Jurnal/Xero API | JSON fixture |
| Sales/CRM data | HubSpot/Salesforce | JSON fixture |
| Operational data | Notion/Asana API | JSON fixture |
| Email & Calendar | Gmail API, Google Calendar | JSON fixture |
| Documents & Minutes | Google Drive, Cloud Storage | Local file upload |
| External data | SerpAPI/Tavily (web search) | Mock search results |
| Decision history | Firestore (internal) | Firestore (local emulator) |

### Layer 2 — Connector Framework

Each connector implements a standard interface:

```python
# backend/connectors/base.py
class BaseConnector:
    async def fetch_data(self, query: dict) -> dict: ...
    async def get_latest(self, limit: int = 10) -> list: ...
    def get_metadata(self) -> dict: ...

# Mock implementation for development
class MockFinanceConnector(BaseConnector):
    async def fetch_data(self, query: dict) -> dict:
        # Read from fixtures/finance.json
        ...
```

**Connector directory structure:**
```
backend/
├── connectors/
│   ├── base.py
│   ├── finance.py      # MockFinance + XeroConnector
│   ├── crm.py          # MockCRM + HubSpotConnector
│   ├── calendar.py     # MockCalendar + GoogleCalConnector
│   ├── documents.py    # MockDocs + GDriveConnector
│   └── search.py       # TavilySearch + MockSearch
└── fixtures/
    ├── finance.json
    ├── crm.json
    ├── calendar.json
    └── search_results.json
```

### Layer 3 — Context & Memory (RAG)

#### 3.1 Vector Store (Firestore Vector Search)
```
Collection: cos_documents
Document fields:
  - id: string
  - content: string          ← raw text chunk
  - embedding: vector(768)   ← text‑embedding‑004
  - source: string           ← "finance_report", "meeting_notes"
  - created_at: timestamp
  - user_id: string
  - metadata: map
```

#### 3.2 Structured Store (Firestore)
```
Collections:
  - users/{uid}/
  - decisions/{did}/         ← Decision Log entries
  - metrics/{mid}/           ← Daily metrics snapshots
  - briefings/{bid}/         ← Generated briefing history
  - audit_log/{aid}/         ← All agent actions log
```

#### 3.3 Session Memory
```python
# LangGraph MemorySaver for per‑conversation context
# Thread ID = user_id + session_id
memory = MemorySaver()
```

### Layer 4 — Agent Orchestration (LangGraph)

#### Orchestrator Agent
**Responsibilities:**
1. Detect intent from user message
2. Route to the appropriate specialist agent
3. Aggregate results from multiple agents
4. Pass to Reasoning Trail Builder

```python
# Routing logic
intent_map = {
    "briefing": BriefingAgent,
    "decision": DecisionAgent,
    "scenario": ScenarioAgent,
    "report": ReportingAgent,
    "market": MarketIntelAgent,
    "general": GeneralAgent,
}
```

#### Agent State Schema (LangGraph)
```python
class CoSAgentState(CopilotKitState):
    # Core
    user_id: str
    intent: str
    
    # Agentic Loop
    plan: str                    # GENERATED PLAN output
    tool_results: list[dict]     # SELECT & EXECUTE results
    synthesis: str               # SYNTHESIZE output
    reflection: dict             # SELF‑REFLECT output
    
    # Reasoning Trail
    data_sources: list[str]
    assumptions: list[str]
    confidence_score: float      # 0.0 - 1.0
    alternative_options: list[str]
    
    # Governance
    requires_approval: bool
    autonomy_level: str          # "auto" | "suggest" | "approval"
    
    # Output
    genui_component: str
    genui_props: dict
```

#### Agentic Loop Implementation
```python
# Each specialist agent runs this loop:
async def agent_loop(state: CoSAgentState):
    # Step 1: GENERATE PLAN
    plan = await generate_plan(state)
    
    # Step 2: SELECT TOOLS & EXECUTE
    tool_results = await execute_tools(plan, state)
    
    # Step 3: SYNTHESIZE
    synthesis = await synthesize(tool_results, state)
    
    # Step 4: SELF‑REFLECT
    reflection = await self_reflect(synthesis, state)
    
    # Step 5: Build reasoning trail
    trail = build_reasoning_trail(plan, tool_results, synthesis, reflection)
    
    # Step 6: Determine GenUI output
    genui = determine_genui(state.intent, synthesis, reflection)
    
    return {**state, "genui": genui, "reasoning_trail": trail}
```

### Layer 5 — Reasoning & Governance

#### Reasoning Trail Builder
Every agent response includes metadata:
```typescript
type ReasoningTrail = {
  dataSources: string[];         // ["finance_q2_report.pdf", "crm_june.csv"]
  assumptions: string[];         // ["Revenue trend calculated linearly"]
  confidenceScore: number;       // 0.85
  confidenceLabel: string;       // "High" | "Medium" | "Low"
  alternativeOptions: string[];  // ["Option A: Hire 2 people", "Option B: Outsource"]
  warnings: string[];            // ["Finance data not updated for 3 days"]
  generatedAt: string;           // ISO timestamp
};
```

#### Autonomy Rules Engine
```python
AUTONOMY_RULES = {
    "briefing_generate": "auto",        # Generate without approval
    "decision_log_create": "suggest",   # Suggest → user confirm
    "scenario_simulate": "auto",        # Calculations may run automatically
    "report_draft": "suggest",          # Draft first, user approve
    "report_send": "approval",          # MUST be approved by founder
    "external_search": "auto",          # Search can run automatically
    "data_write_external": "approval",  # Writes to external systems require approval
}
```

### Layer 6 — Generative UI

#### AG‑UI Protocol Flow
```
Backend Agent → CopilotKit stream → Frontend @copilotkit/react‑ui
                                              ↓
                                    GenUI Component Renderer
                                              ↓
                        BriefingCard | DecisionCard | etc.
```

#### GenUI Components Registry (frontend)
```typescript
const GENUI_COMPONENTS = {
  "BriefingCard": BriefingCard,
  "DecisionLogCard": DecisionLogCard,
  "ScenarioChart": ScenarioChart,
  "ReasoningTrailPanel": ReasoningTrailPanel,
  "InvestorReportDraft": InvestorReportDraft,
  "MarketIntelDigest": MarketIntelDigest,
  "ApprovalRequest": ApprovalRequest,
  "ConfidenceWidget": ConfidenceWidget,
};
```

---

## 3. End‑to‑End Data Flow

### Flow: Daily Briefing
```
1. Cloud Scheduler → POST /api/trigger-briefing (or user chat)
2. Frontend AG‑UI Protocol → Backend /copilotkit endpoint
3. Orchestrator Agent → intent: "briefing"
4. Routing → BriefingAgent
5. GENERATE PLAN:
   - Determine focus areas: Finance anomaly? Sales lag? Ops blocker?
6. SELECT & EXECUTE:
   - fetch_finance_data() → Mock/Xero connector
   - fetch_crm_data() → Mock/HubSpot connector
   - fetch_calendar_today() → Mock/Google Cal connector
   - fetch_news_relevant() → search.py connector
7. SYNTHESIZE:
   - LLM: Combine data into a narrative briefing
8. SELF‑REFLECT:
   - Check for stale/missing data, ensure confidence sufficient
   - If confidence < 0.6, add warning
9. BUILD REASONING TRAIL:
   - data_sources, assumptions, confidence_score
10. RETURN GenUI:
    - component: "BriefingCard"
    - props: { highlights, metrics, warnings, reasoning_trail }
11. Frontend renders BriefingCard with expandable reasoning
```

---

## 4. Security & Authentication Architecture

### Firebase Auth Flow
```
User → Firebase Auth (email/Google) → ID Token (JWT)
                                           │
Frontend → API Header: Authorization: Bearer {token}
                                           │
Backend → firebase_admin.verify_id_token(token)
                                           │
        → user_id extracted → scoped Firestore access
```

### Role‑Based Access Control (RBAC)
```python
ROLES = {
    "founder": ["all"],
    "c_suite": ["briefing", "decision", "scenario", "report"],
    "staff": ["briefing"],
}
```

---

## 5. Local Development Architecture
```
localhost:3000  ← Next.js frontend (npm run dev)
       │
       │ /api/chat     → Next.js API Route (Gemini direct, fallback)
       │ /api/copilotkit → Proxy to backend
       │
localhost:8000  ← FastAPI backend (uvicorn server:app --reload)
       │
       │ Gemini API (AI Studio)
       │ Firebase Emulator (localhost:8080) ← Firestore local
       │ MockConnectors ← fixtures/*.json
```

---

## 6. Target File & Folder Structure
```
C:\dev\FutureCos\
├── docs/
├── mvp/                          ← Frontend (rename to cos-frontend)
│   └── src/
│       ├── app/
│       │   ├── layout.tsx        ← Update metadata "Future CoS"
│       │   ├── page.tsx          ← Landing page branding update
│       │   ├── (auth)/           ← Firebase Auth pages (login, signup)
│       │   ├── dashboard/        ← Executive dashboard
│       │   ├── briefing/         ← Briefing history
│       │   ├── decisions/        ← Decision log
│       │   ├── scenarios/        ← Scenario results
│       │   └── chat/             ← Main AI chat interface
│       ├── components/
│       │   ├── genui/            ← All GenUI components
│       │   │   ├── BriefingCard.tsx
│       │   │   ├── DecisionLogCard.tsx
│       │   │   ├── ScenarioChart.tsx
│       │   │   ├── ReasoningTrailPanel.tsx
│       │   │   └── ApprovalRequest.tsx
│       │   └── ui/               ← Shared UI components
│       └── lib/
│           ├── firebase.ts       ← Firebase client config
│           └── api.ts            ← API call utilities
└── backend/
    ├── server.py                 ← FastAPI server
    ├── agent.py                  ← REFACTOR: Orchestrator agent
    ├── agents/
    │   ├── briefing_agent.py
    │   ├── decision_agent.py
    │   ├── scenario_agent.py
    │   ├── reporting_agent.py
    │   └── market_intel_agent.py
    ├── tools/
    │   ├── finance_tools.py
    │   ├── scenario_tools.py     ← Deterministic calculation tools
    │   └── search_tools.py
    ├── connectors/
    │   ├── base.py
    │   ├── finance.py
    │   ├── crm.py
    │   └── search.py
    ├── fixtures/
    │   ├── finance.json
    │   └── crm.json
    ├── reasoning/
    │   └── trail_builder.py
    ├── governance/
    │   └── autonomy_rules.py
    ├── db/
    │   └── firestore_client.py
    └── requirements.txt
```

---

*See PHASE.md for the implementation breakdown per phase.*
