# AI Chief of Staff — Product & Technical Blueprint

### Executive AI Copilot for Founder & C‑Suite

---

## 1. Executive Summary

AI Chief of Staff is a chat application with **agentic generative UI** that helps founders and the C‑suite accelerate strategic decision‑making — not merely automating operational tasks. The product is built on five pillars of best‑practice agentic AI 2026:

| Pillar | Role in product |
|---|---|
| **Agentic Loop** (Plan → Select Tools & Execute → Synthesize → Self‑Reflect) | Every request is processed through this cycle, not a single LLM call |
| **RAG (Retrieval‑Augmented Generation)** | All insights are based on real company data, not model hallucinations |
| **System Thinking / Reasoning Transparency** | Each recommendation shows assumptions, data sources, confidence, and alternatives |
| **Generative UI** | Agent output is rendered as interactive cards/charts/forms rather than long text |
| **Human‑in‑the‑Loop Governance** | Autonomy rules per decision category — when the agent may act automatically vs. require approval |

---

## 2. Five Core Features

### 2.1 Executive Daily/Weekly Briefing
Synthesis of cross‑functional data (finance, sales, ops) into an automatic morning summary.

### 2.2 Scenario Simulator ("What‑If" Copilot)
Simulate the impact of decisions (pricing, hiring, expansion) on cash flow & business metrics.

### 2.3 Board & Investor Reporting Assistant
Automatically draft investor reports/decks from real‑time operational data.

### 2.4 Competitive & Market Intelligence Digest
Monitor competitors, pricing, and market trends with clearly sourced information.

### 2.5 Decision Log with Reasoning Trail
Record strategic decisions with full assumptions, supporting data, confidence scores, and alternative options considered — providing an audit trail of accountability.

---

## 3. Agentic Loop Implementation per Feature

Each feature runs the same **Generate Plan → Select Tools & Execute → Synthesize → Self‑Reflect** cycle, only the tools and data differ:

| Feature | Generate Plan | Select Tools & Execute | Synthesize | Self‑Reflect |
|---|---|---|---|---|
| Daily Briefing | Determine which areas need to be highlighted today (anomaly > routine) | Query Finance API, CRM API, Calendar, News feed | Compose into one summary card + priority highlights | Check: any missing or stale data? Mark if confidence is low |
| Scenario Simulator | Outline variables to change & metrics to measure, specify time period | Retrieve historical cash‑flow data from Vector/Structured DB; call forecasting tool (sandbox, not LLM) | Render scenario chart + narrative impact | Validate assumptions are reasonable; show ranges instead of precise numbers |
| Board Reporting | Define report structure for audience (investor vs internal) | Pull growth/finance data, generate draft slides | Assemble draft deck + justification for each number | Verify consistency across sections before display |
| Market Intelligence | Identify relevant competitors/topics to monitor | Web search + RAG over stored research documents | Summarize insights with source citations | Warn if sources are scarce or contradictory; avoid over‑claiming |
| Decision Log | Detect a decision‑making discussion (from chat/meeting) | Retrieve related decision history from database | Build log entry: assumptions, data, options, confidence | Flag if a similar decision was previously made & failed |

**Self‑Reflect** is what separates agentic AI from a regular chatbot — the agent evaluates its own output before showing it (checks consistency, data completeness, confidence) before passing to the Generative UI layer.

---

## 4. Required Data

| Data Category | Source | Used By Feature |
|---|---|---|
| Financial data (P&L, cash flow, transactions) | Accounting software (Accurate/Jurnal/Xero), bank accounts | Briefing, Simulator, Reporting |
| Sales/CRM data | HubSpot/Salesforce/local POS | Briefing, Reporting |
| Operational data | Notion/Asana/Trello | Briefing |
| Communication (email, calendar, internal chat) | Gmail/Outlook, Google Calendar, Slack/WhatsApp Business | Briefing, Decision Log |
| Documents & minutes | Google Drive, meeting transcript recordings | Reporting, Decision Log |
| External data | Web search, news API, competitor pricing pages | Market Intelligence |
| Decision history | Internal append‑only database | Decision Log, Self‑Reflect for all features |

---

## 5. End‑to‑End Flow (Example: Scenario Simulator)
```
User asks in chat
    │
    ▼
[1] Orchestrator Agent detects intent → routes to Scenario Agent
    │
    ▼
[2] GENERATE PLAN
    Scenario Agent outlines: which variables to change, which metrics to measure, time period
    │
    ▼
[3] SELECT TOOLS & EXECUTE
    - RAG: fetch historical cash‑flow data from Vector/Structured DB
    - Tool call: forecasting calculation (sandbox, not LLM)
    │
    ▼
[4] SYNTHESIZE
    Combine calculation results + business context into narrative & chart data
    │
    ▼
[5] SELF‑REFLECT
    Check: are assumptions realistic? Is any data missing?
    If confidence low → clearly flag in output
    │
    ▼
[6] REASONING TRAIL BUILDER
    Assemble metadata: data sources, assumptions, confidence, alternative options
    │
    ▼
[7] GENERATIVE UI LAYER (AG‑UI/A2UI protocol)
    Render as interactive chart + expandable "reasoning" card
    │
    ▼
[8] User sees result on Canvas → can click "approve/save to Decision Log" or "request another scenario"
```

The same pattern applies to the other four features — only steps 2‑4 vary according to the domain.

---

## 6. Technical Architecture (6‑Layer)
```
┌─────────────────────────────────────────────────────────────┐
│ 6. GENERATIVE UI + PRESENTATION                              │
│    AG‑UI/A2UI protocol → cards, charts, forms → Chat + Canvas │
├─────────────────────────────────────────────────────────────┤
│ 5. REASONING & GOVERNANCE                                    │
│    Reasoning Trail Builder | Autonomy Rules | Audit Log      │
├─────────────────────────────────────────────────────────────┤
│ 4. AGENT ORCHESTRATION                                        │
│    Orchestrator → Finance / Market / Reporting / Scenario / │
│    Decision‑Log Agent                                         │
├─────────────────────────────────────────────────────────────┤
│ 3. CONTEXT & MEMORY (RAG)                                    │
│    Vector DB (documents & research) | Structured DB (metrics, │
│    decision log) | Session Memory                            │
├─────────────────────────────────────────────────────────────┤
│ 2. INTEGRATION / CONNECTOR (MCP)                              │
│    MCP server per external system + scheduled sync jobs      │
├─────────────────────────────────────────────────────────────┤
│ 1. DATA SOURCES                                               │
│    Finance | CRM | Ops | Email/Calendar | Docs | Web/News    │
└─────────────────────────────────────────────────────────────┘
```
*(An interactive version of this diagram has been created previously as a separate `.mermaid` file.)*

---

## 7. Mapping Architecture to Google Cloud Free Tier

This is the most critical part because you plan to **deploy 100 % on the free tier**. Below is a realistic mapping per layer, based on the Always Free GCP quotas current as of today:

| Layer | GCP Service (Free Tier) | Free Quota | Important Notes |
|---|---|---|---|
| Hosting backend agent & frontend | **Cloud Run** | 2 M requests/month | Serverless, scale‑to‑zero — suitable for SME/ small‑team traffic |
| LLM inference | **Gemini API via Google AI Studio** (not Vertex AI) | ~1 000 requests/day (Gemini Flash) | This is a truly FREE path without an active billing account. Vertex AI Gemini is paid even when wrapped in an "enterprise" label |
| Structured database (decision log, metrics snapshot) | **Firestore** | 1 GB storage, 50 k reads/20 k writes/20 k deletes per day | Sufficient for decision log + daily metrics for a small team |
| Vector DB / RAG | **Firestore Vector Search** (built‑in) or lightweight self‑host | Included in Firestore quota | Avoid Vertex AI Vector Search — it is paid per query |
| File & document storage (decks, minutes, contracts) | **Cloud Storage** | 5 GB regional storage/month | Store draft investor reports, meeting minutes |
| Daily cron job (daily briefing) | **Cloud Scheduler** | 3 jobs free/month per account | Enough for a single daily briefing job |
| Forecasting sandbox | **Cloud Functions** (within Cloud Run/Functions free quota) | 2 M invocations/month (combined) | Run calculation logic separate from LLM calls |
| Auth & RBAC | **Firebase Authentication** | Free for basic auth | Essential for role‑based access (founder vs staff) |
| Optional analytics (if you scale) | **BigQuery** | 1 TB query/month, 10 GB storage | For long‑term benchmarking/analytics |

### ⚠️ Critical Limits to Know
1. **Do NOT use Vertex AI for LLM calls** if you aim for 100 % free — Vertex AI Gemini is pay‑as‑you‑go with no automatic caps, easy to overspend. Use **Gemini Developer API via AI Studio** which offers a clear daily free quota (1 000 req/day for Flash).
2. **1 000 requests/day is limited** for 5 features × multi‑agent loops (each loop may involve 3‑5 LLM calls). Realistically enough for **1 founder + a small team** using all features a few times per day — not for many simultaneous users.
3. **Cloud Storage** as of Feb 2026 requires the project to be on a Blaze plan (active billing) for the default bucket, even though the free quota still applies — you must register a credit/debit card but will not be charged as long as you stay within the quota.
4. **Set a budget alert** in GCP Billing from day 1, so you are notified immediately if usage spikes (e.g., a daily briefing cron job loops uncontrolled) before any charge occurs.
5. If traction grows and you need to scale beyond the free tier, apply for the **Google for Startups Cloud Program** — you can obtain additional credits without paying full price.

### Deployment Architecture (Brief)
```
[Frontend: Cloud Run - React/Next.js + generative UI renderer]
        │
[Backend: Cloud Run - Orchestrator + Agent logic]
        │
        ├── Gemini API (AI Studio) — LLM reasoning per agent
        ├── Firestore — decision log, metrics, vector search (RAG)
        ├── Cloud Storage — documents, decks, minutes
        ├── Cloud Functions — scenario‑simulator calculations
        ├── Cloud Scheduler — trigger daily briefing each morning
        └── Firebase Auth — login & role‑based access
```

---

## 8. Recommended Implementation Roadmap

| Phase | Focus | Feature |
|---|---|---|
| **MVP (months 1‑2)** | Build orchestrator + one agent first, validate agentic loop & generative UI pattern | Executive Daily Briefing |
| **Phase 2 (months 3‑4)** | Add reasoning trail & governance layer | Decision Log |
| **Phase 3 (months 5‑6)** | Add calculation complexity | Scenario Simulator |
| **Phase 4** | External output features | Board & Investor Reporting |
| **Phase 5** | External research features (intensive web search, most quota‑heavy) | Market Intelligence |

This ordering deliberately places the most quota‑efficient LLM features early (briefing = 1 synthesis/day) and the most quota‑heavy feature (market intelligence = many web searches & RAG) later, giving you time to learn free‑tier quota consumption before adding load.

---

## 9. Design Principles Summary

- **Every agent output must pass Self‑Reflect before display** — never serve raw LLM output directly to the UI.
- **Reasoning trail is mandatory**, not an optional add‑on, sitting between the agent and the Generative UI.
- **RAG is always the source of truth** — never let the agent answer from the model’s "general knowledge" for internal company data.
- **Explicit autonomy rules** — define from the start which decision categories may be executed automatically vs. require founder approval.
- **Generative UI = a single protocol for all features**, so adding new features does not require building UI components from scratch.