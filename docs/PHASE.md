# Future CoS — PHASE ROADMAP

> Version: 1.0 | Created: 2026-07-05

---

## Overview Timeline
```
PHASE 0   PHASE 1      PHASE 2      PHASE 3      PHASE 4      PHASE 5      DEPLOY
[Setup]  [Briefing]  [DecisionLog][Scenario]   [Report]    [Market]    [GCP]
├───────┤├─────────┤├──────────┤├────────┤├───────┤├───────┤├──────┤
W1  W2   W3  W4  W5  W6  W7  W8  W9 W10 W11 W12 W13 W14 W15 W16+
```

---

## Phase 0 — Foundation & Setup (Weeks 1‑2)
### Goal
Prepare all core infrastructure before building any new feature. This foundation must be completed before any later phase.
### Checklist
#### 0.1 — Rebranding & Cleanup
- Replace all references to **"Proman"** / **"FutureAI"** with **"Future CoS"**.
- Update `layout.tsx` metadata (title, description).
- Update landing page (`page.tsx`) with new name and tagline.
- Update backend system prompt (role: Project Manager → Chief of Staff).
- Update `README.md`.
#### 0.2 — Backend Restructure
- Create folders: `backend/agents/`, `backend/connectors/`, `backend/fixtures/`, `backend/tools/`, `backend/reasoning/`, `backend/governance/`, `backend/db/`.
- Expand `requirements.txt` with all new dependencies.
- Refactor `agent.py` → `agents/orchestrator_agent.py` (skeleton).
- Add `connectors/base.py` defining a standard interface.
- Add mock fixtures: `fixtures/finance.json`, `fixtures/crm.json`, `fixtures/calendar.json`.
- Verify backend runs with the new structure.
#### 0.3 — Firebase Authentication Setup
- Create a Firebase project (or reuse an existing one).
- Enable Firebase Auth (Email/Password + Google OAuth).
- Install `firebase-admin` in the backend.
- Install `firebase` in the frontend.
- Add `src/lib/firebase.ts` for client‑side config.
- Create `/login` and `/signup` pages.
- Replace localStorage auth with Firebase Auth.
- Add auth middleware to the Next.js App Router.
#### 0.4 — Firestore Setup (Local Emulator)
- Install Firebase CLI and Firestore emulator.
- Configure `firebase.json` and `.firebaserc`.
- Implement `backend/db/firestore_client.py`.
- Test Firestore connections from Python and from Next.js.
- Define initial collections: `users`, `decisions`, `metrics`, `briefings`, `audit_log`.
#### 0.5 — Development Environment
- Create a `.env.local` template with all required variables.
- Update `.gitignore` to exclude the new env files.
- Ensure `npm run dev` (frontend) + `uvicorn` (backend) + Firestore emulator can run simultaneously.
- Document the local dev workflow in the README.
### Definition of Done (Phase 0)
- ✅ Frontend loads with the name **"Future CoS"**.
- ✅ Users can log in/out via Firebase Auth.
- ✅ Firestore emulator reads/writes from both frontend and backend.
- ✅ Backend runs with the new folder structure.
- ✅ Mock fixtures are available.
---

## Phase 1 — Executive Daily Briefing (Weeks 3‑5)
### Goal
Implement the first complete feature with a full Agentic Loop. This will serve as a template for subsequent features.
### Business Value
Founders/CEOs open the app in the morning and instantly see a concise briefing: *"What do I need to know today?"* – synthesized from all business data.
### Checklist
#### 1.1 — BriefingAgent (Backend)
- Create `agents/briefing_agent.py` implementing the full Agentic Loop:
  - `generate_plan()` – decide which areas need highlighting (anomalies → routine).
  - `select_and_execute()` – invoke MockFinance, MockCRM, MockCalendar, MockNews.
  - `synthesize()` – LLM combines data into a narrative + highlights.
  - `self_reflect()` – verify data completeness, confidence, warnings.
- Register BriefingAgent with the Orchestrator.
#### 1.2 — Mock Connectors
- `connectors/finance.py`: `MockFinanceConnector` reads `fixtures/finance.json`.
- `connectors/crm.py`: `MockCRMConnector` reads `fixtures/crm.json`.
- `connectors/calendar.py`: `MockCalendarConnector` reads `fixtures/calendar.json`.
- Populate realistic mock data for an Indonesian‑style startup.
#### 1.3 — BriefingCard (GenUI Component – Frontend)
- Create `src/components/genui/BriefingCard.tsx` displaying:
  - Date header.
  - Critical highlights (e.g., revenue dip, pipeline stalls, latency spikes).
  - Today’s metrics (MRR, open deals, team capacity).
  - Important agenda items.
  - Buttons: **View Reasoning**, **Save**.
- Add `ReasoningTrailPanel.tsx` (expand/collapse).
- Add `ConfidenceWidget.tsx` (visual confidence score).
#### 1.4 — Briefing History (Firestore)
- Persist each generated briefing to `briefings/` collection.
- Create `/briefing` page showing a history of briefings.
- Add a chat command: *"Generate today’s briefing"*.
#### 1.5 — Auto‑Trigger (optional in this phase)
- Endpoint `/api/trigger-briefing` for Cloud Scheduler (later).
- Manual trigger button on the dashboard.
### Definition of Done (Phase 1)
- ✅ Users can request a briefing via chat and receive an accurate `BriefingCard`.
- ✅ `BriefingCard` shows highlights, metrics, agenda.
- ✅ Reasoning trail is expandable/collapsible.
- ✅ Confidence score is clearly visible.
- ✅ Briefings are stored in Firestore.
---

## Phase 2 — Decision Log with Reasoning Trail (Weeks 6‑8)
### Goal
Provide a permanent decision‑logging system with a full audit trail.
### Checklist
#### 2.1 — DecisionAgent (Backend)
- Create `agents/decision_agent.py`:
  - Detect when a conversation contains a decision.
  - Pull prior related decisions from Firestore.
  - Extract assumptions, supporting data, options, confidence.
  - Flag if a similar decision already exists (and its outcome).
- Implement `tools/decision_tools.py`:
  - `save_decision_to_log` → Firestore.
  - `search_similar_decisions` → Vector search.
  - `get_decision_history` → Firestore retrieval.
#### 2.2 — Firestore Decision Schema
```
decisions/{decision_id}/
  - title: string
  - description: string
  - decision_made: string            # The actual decision
  - rationale: string                # Why the decision
  - assumptions: string[]
  - data_sources: string[]
  - alternatives_considered: string[]
  - confidence_score: float
  - made_by: string                  # user_id
  - made_at: timestamp
  - status: "open" | "executed" | "cancelled"
  - outcome: string                  # Filled after execution
  - tags: string[]
```
#### 2.3 — DecisionLogCard (GenUI)
- `DecisionLogCard.tsx` – entry view.
- `DecisionHistoryCard.tsx` – related entries.
- `/decisions` page – list, filter, search.
- **Approve & Save** button with confirmation.
- Ability to edit outcome later.
#### 2.4 — Vector Search for Decision Similarity
- Use `text-embedding-004` (Google AI) to embed decisions.
- `backend/db/vector_store.py` wraps Firestore Vector Search.
- On new decision: embed → search for similar decisions.
### Definition of Done (Phase 2)
- ✅ Users can say *"Log decision: we will raise Series A next month"*.
- ✅ Agent extracts and creates a full entry with reasoning trail.
- ✅ Decisions persist permanently in Firestore.
- ✅ `/decisions` page shows all entries with filters.
---

## Phase 3 — Scenario Simulator (Weeks 9‑12)
### Goal
Simulate the business impact of decisions (pricing, hiring, expansion) using deterministic calculation tools.
### Checklist
#### 3.1 — ScenarioAgent (Backend)
- Create `agents/scenario_agent.py`:
  - Parse variables: what changes, which metrics, time horizon.
  - Call pure‑Python calculation tools (no LLM).
  - Synthesize a narrative + chart data.
  - Self‑reflect on assumption realism (range vs single value).
#### 3.2 — Calculation Tools (Sandbox)
- `tools/scenario_tools.py` – pure Python math:
  ```python
  def calculate_revenue_scenario(base_revenue, growth_rate, months, churn_rate):
      """Deterministic, reproducible, testable"""
      ...

  def calculate_hiring_impact(headcount_delta, avg_salary, ramp_months, revenue_per_head):
      ...

  def calculate_pricing_impact(current_price, new_price, price_elasticity, current_volume):
      ...

  def calculate_cash_runway(current_cash, monthly_burn, revenue_monthly):
      ...
  ```
- Unit tests for all calculation functions.
#### 3.3 — ScenarioChart (GenUI)
- `ScenarioChart.tsx`:
  - Line chart: baseline vs scenario A vs scenario B.
  - Confidence band (shaded area).
  - Highlight assumptions.
  - **Request another scenario** button.
#### 3.4 — Multiple Scenario Comparison
- Store scenarios in Firestore `scenarios/` collection.
- Side‑by‑side comparison view (up to 3 scenarios).
### Definition of Done (Phase 3)
- ✅ Users can ask: *"If we hire 3 engineers next month, what is our cash runway?"*
- ✅ Agent runs deterministic calculations (no guessing).
- ✅ Interactive chart appears in chat.
- ✅ Confidence band and assumptions are clearly shown.
- ✅ Users can request alternative scenarios.
---

## Phase 4 — Board & Investor Reporting (Weeks 13‑14)
### Goal
Generate draft investor/board reports from real‑time operational data.
### Checklist
#### 4.1 — ReportingAgent (Backend)
- Create `agents/reporting_agent.py`.
- Define report structure based on audience (investor vs internal board).
- Pull data: growth metrics, financial highlights, KPIs.
- Generate draft with justification for each number.
- Self‑reflect on consistency across sections.
#### 4.2 — ReportDraft (GenUI)
- `InvestorReportDraft.tsx`:
  - Rich‑text editable inline.
  - Tooltip on every number showing its data source.
  - Export to Markdown / Google Docs.
  - **Approve** button to save to Cloud Storage.
#### 4.3 — Approval Governance
- `ApprovalRequest.tsx` component.
- `governance/autonomy_rules.py` – `report_send = "approval"`.
- Pre‑send notification before external distribution.
### Definition of Done (Phase 4)
- ✅ Users can request: *"Create a Q2 2026 investor deck"*.
- ✅ Draft generated with live data from mock connectors.
- ✅ All numbers have source tooltips.
- ✅ Draft saved to Firestore + Cloud Storage.
---

## Phase 5 — Market Intelligence (Weeks 15‑16)
### Goal
Monitor competitors, pricing, and market trends with explicit source citations.
### Checklist
#### 5.1 — MarketIntelAgent (Backend)
- Create `agents/market_intel_agent.py`.
- `connectors/search.py` – use Tavily API or SERPAPI (mock for dev).
- Cache search results in Firestore to conserve quota.
- Self‑reflect: if sources are limited or contradictory, warn the user.
#### 5.2 — MarketIntelDigest (GenUI)
- `MarketIntelDigest.tsx`:
  - Card per competitor/topic.
  - Citations for each piece of information.
  - **Monitor continuously** button → schedule weekly digest.
#### 5.3 — Scheduled Intelligence
- `/api/trigger-market-intel` endpoint.
- Cloud Scheduler triggers weekly.
### Definition of Done (Phase 5)
- ✅ Users can say: *"Monitor our competitor pricing this week"*.
- ✅ Digest appears with source citations.
- ✅ Warning shown if source confidence is low.
---

## Deploy — GCP Free Tier (After All Phases Completed)
> ⚠️ **Do not start deployment before every development phase is finished and locally tested.**
> Wait for sign‑off from the product owner.
> See `DEPLOY.md` for the full guide.

### Deploy Checklist
- ✅ Production Firebase project.
- ✅ Firestore production security rules.
- ✅ Cloud Run: frontend container.
- ✅ Cloud Run: backend container.
- ✅ Cloud Scheduler: daily briefing job.
- ✅ Budget alert setup ($0 threshold).
- ✅ Environment variables configured in Cloud Run.
- ✅ (Optional) Custom domain.

---

## Status Tracker
| Phase | Status | Started | Completed |
|---|---|---|---|
| Phase 0 — Setup | 🟢 Completed | 2026-07-05 | 2026-07-05 |
| Phase 1 — Briefing | 🟢 Completed | 2026-07-05 | 2026-07-05 |
| Phase 2 — Decision Log | 🟢 Completed | 2026-07-05 | 2026-07-05 |
| Phase 3 — Scenario | 🟢 Completed | 2026-07-05 | 2026-07-05 |
| Phase 4 — Reporting | 🟢 Completed | 2026-07-05 | 2026-07-05 |
| Phase 5 — Market Intel | 🟢 Completed | 2026-07-05 | 2026-07-05 |
| Deploy GCP | ⏸️ On Hold | — | — |

*Update the Status column and dates whenever progress changes.*
