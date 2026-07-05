# Future CoS — MASTER PLAN

> Version: 1.0 | Created: 2026-07-05 | Status: **ACTIVE**

---

## 🎯 Product Vision

**Future CoS** is an AI Executive Copilot that helps founders and the C‑Suite accelerate strategic decision‑making through agentic AI with a Generative UI — not just a ordinary chatbot.

**Tagline:** *"Your AI‑powered Chief of Staff — always prepared, always insightful."

---

## 🏗️ Repository & Work Structure

```
C:\dev\FutureCos\
├── docs/                    ← All planning documents (this folder)
│   ├── MASTERPLAN.md        ← This document
│   ├── ARCHITECTURE.md      ← Technical architecture details
│   ├── PHASE.md             ← Roadmap and phase breakdown
│   ├── SKILLS.md            ← List of AI agent skills/tools
│   ├── DATA.md              ← Data model & schema
│   └── DEPLOY.md            ← GCP Free Tier deployment guide
├── mvp/                     ← Next.js frontend (ALREADY EXISTS)
│   └── src/
│       ├── app/             ← App Router pages
│       ├── lib/             ← Database utilities
│       └── components/      ← UI components
├── backend/                 ← Python FastAPI + LangGraph (ALREADY EXISTS)
│   ├── agent.py             ← Agent graph definition
│   └── server.py            ← FastAPI server
└── PROJECT_BRIEF.md         ← Original product brief
```

---

## 🔁 Transformation: MVP → Future CoS

### Current State (MVP)
| Aspect | Current Situation |
|---|---|
| **Name** | FutureAI Proman |
| **Function** | Task/project management AI chat |
| **Backend** | Python FastAPI + LangGraph + CopilotKit |
| **Frontend** | Next.js 16 + Gemini SDK directly |
| **Database** | Local JSON per user |
| **AI** | Gemini 2.5 Flash (via @google/generative‑ai) |
| **GenUI** | TaskList, ProjectSummary, Notes cards |
| **Auth** | Username/PIN stored in localStorage |

### Target State (Future CoS v1.0)
| Aspect | Target |
|---|---|
| **Name** | Future Chief of Staff (CoS) |
| **Function** | Executive AI Copilot — strategic decision support |
| **Backend** | Python FastAPI + LangGraph multi‑agent |
| **Frontend** | Next.js 16 + AG‑UI/CopilotKit Generative UI |
| **Database** | Firestore (structured) + Firestore Vector (RAG) |
| **AI** | Gemini 2.5 Flash via AI Studio API |
| **GenUI** | Briefing Cards, Charts, Scenario Widgets, Report Drafts |
| **Auth** | Firebase Authentication (email/Google) |

---

## 💡 Five Core Features to Build

### Phase 1 — Executive Daily/Weekly Briefing (New MVP)
Synthesize cross‑functional data (finance, sales, ops) into an automated morning brief via a full Agentic Loop.

**Value:** Founder no longer needs to open five separate dashboards. One briefing card shows all highlights.

### Phase 2 — Decision Log with Reasoning Trail
Record strategic decisions with assumptions, confidence scores, and an audit trail for accountability.

**Value:** No more "who decided what and why" lost in Slack.

### Phase 3 — Scenario Simulator ("What‑If" Copilot)
Simulate the impact of decisions (pricing, hiring, expansion) on cash‑flow & business metrics.

**Value:** Data‑driven calculations instead of guesswork.

### Phase 4 — Board & Investor Reporting Assistant
Automatically draft investor/board decks from real‑time operational data.

**Value:** Board reports ready in minutes, not days.

### Phase 5 — Competitive & Market Intelligence Digest
Track competitors, pricing, and market trends with clear source citations.

**Value:** Always know what’s happening in the market without a full research team.

---

## 🎨 Product Design Principles
| Principle | Implementation |
|---|---|
| **Agentic Loop Required** | Plan → Execute → Synthesize → Self‑Reflect on every request |
| **RAG as Truth Source** | No answers from "general knowledge" for internal data |
| **Reasoning Trail Mandatory** | Every output includes metadata: source, assumptions, confidence |
| **Single Generative UI Protocol** | One component library for all features |
| **Human‑in‑the‑Loop** | Explicit autonomy rules — approve vs auto‑execute |
| **Self‑Reflect Before Display** | Agent evaluates itself before returning output |

---

## 🧱 Final Tech Stack

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **UI Protocol:** AG‑UI / @copilotkit/react‑ui
- **Styling:** Vanilla CSS + CSS Variables (Apple‑inspired)
- **Charts:** Recharts
- **Fonts:** Inter / Geist

### Backend
- **Framework:** FastAPI (Python)
- **Agent Engine:** LangGraph + LangChain
- **LLM Protocol:** CopilotKit AG‑UI Protocol
- **LLM:** Gemini 2.5 Flash (Google AI Studio API)

### Database & Storage
- **Structured DB:** Firestore (decision log, metrics, sessions)
- **Vector DB:** Firestore Vector Search (RAG documents)
- **File Storage:** Cloud Storage (reports, docs, minutes)
- **Session:** In‑memory (LangGraph MemorySaver)

### Infrastructure (GCP Free Tier)
- **Hosting:** Cloud Run (frontend + backend)
- **Auth:** Firebase Authentication
- **Cron:** Cloud Scheduler (daily briefing trigger)
- **Functions:** Cloud Functions (scenario calculations)
- **Monitoring:** Cloud Logging (built‑in)

---

## ✅ Feasibility Assessment
Based on existing codebase and `PROJECT_BRIEF.md`:

### Already Available & Re‑usable
- ✅ Next.js App Router setup + routing
- ✅ Gemini API integration with key rotation
- ✅ GenUI architecture (interactive cards in chat bubble)
- ✅ LangGraph agent graph structure (backend)
- ✅ CopilotKit AG‑UI Protocol setup (backend + frontend)
- ✅ FastAPI server with CORS
- ✅ File‑based DB with migration support
- ✅ Multi‑project support logic
- ✅ Landing page with interactive demo

### Net‑New Needed
- 🔨 Orchestrator Agent + 5 Specialist Agents (LangGraph)
- 🔨 Firestore integration (replace JSON files)
- 🔨 Firebase Auth (replace localStorage auth)
- 🔨 RAG pipeline (Vector embeddings + retrieval)
- 🔨 Reasoning Trail Builder component
- 🔨 Daily Briefing GenUI component
- 🔨 Scenario Simulator with calculation tools
- 🔨 Board Report generator
- 🔨 Market Intelligence with web search
- 🔨 Decision Log persistent storage
- 🔨 Autonomy Rules engine
- 🔨 Cloud Scheduler integration
- 🔨 Data connector framework (mock first, real APIs later)

### Refactor / Adapt
- 🔧 Branding: "Proman" → "Future CoS"
- 🔧 System prompt: project management → executive strategy
- 🔧 Auth: localStorage PIN → Firebase Auth
- 🔧 DB: JSON files → Firestore
- 🔧 GenUI components: task cards → executive cards
- 🔧 Backend agent state schema

---

## ⚠️ Risks & Mitigations
| Risk | Level | Mitigation |
|---|---|---|
| Gemini API quota 1000 req/day exhausted | High | Key rotation (already built) + rate limiting + response caching |
| Firestore free‑tier overflow | Low | Monitor usage + compress data |
| LangGraph complexity | Medium | Start with a single agent, scale to multi‑agent later |
| Web search cost/rate limit | Medium | Cache search results + batch per day |
| Cloud Storage requires active billing | Medium | Prepare a credit card, set $0 budget alert |

---

## 📅 Concise Timeline
| Phase | Focus | Estimate |
|---|---|---|
| **Phase 0** | Setup, rebrand, Firestore + Firebase Auth | 1‑2 weeks |
| **Phase 1** | Executive Daily Briefing (1 agent, full loop) | 2‑3 weeks |
| **Phase 2** | Decision Log + Reasoning Trail | 2‑3 weeks |
| **Phase 3** | Scenario Simulator + calculation tools | 3‑4 weeks |
| **Phase 4** | Board & Investor Report | 2‑3 weeks |
| **Phase 5** | Market Intelligence + web search | 2‑3 weeks |
| **Deploy GCP** | Cloud Run + all GCP services | 1‑2 weeks |

**Total Estimate:** 13–20 weeks (solo dev, part‑time)

---

## 🔑 Critical Design Decisions
1. **Backend stays Python** — LangGraph/LangChain ecosystem far more mature in Python than JS.
2. **Frontend stays Next.js** — App Router + server components fit GenUI.
3. **Use CopilotKit AG‑UI Protocol** — not a custom streaming solution; proven and maintained.
4. **Gemini AI Studio (not Vertex AI)** — free tier that matches the project brief.
5. **Firestore as single database** — structured + vector in one service, free.
6. **Mock connectors first** — no need for real HubSpot/Xero integration during development.

---

*This document is living. Update whenever architecture decisions or scope changes.*
