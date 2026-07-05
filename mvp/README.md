# Future Chief of Staff (CoS) — MVP

> AI Executive Copilot with **Generative UI**, Agentic Loop architecture, and premium **Apple Light Mode (TypeUI)**.

Built on **Next.js App Router + Google Gemini 2.5 Flash** for frontend & API, and **FastAPI + LangChain** for Python backend. Data stored in **Google Firestore** (cloud) and local JSON files.

---

## 🌐 Production URLs (Google Cloud Run)

| Service | URL |
|---------|-----|
| **Frontend** | https://cos-frontend-934594569799.asia-southeast1.run.app |
| **Backend** | https://cos-backend-934594569799.asia-southeast1.run.app |
| **GCP Project** | `gen-ai-academy-492602` |

---

## 🌟 Full Feature Set — 5 Phases

### Phase 1 — 📋 Daily Briefing & Task Management

| Feature | Description |
|-------|------------|
| **Executive Daily Briefing** | AI automatically gathers financial data (finance fixture), sales pipeline (CRM fixture), and meeting agenda (calendar fixture), then renders a `BriefingCard` with metrics, priority highlights, today’s agenda, and an AI‑generated *Reasoning Trail* for trust. |
| **Interactive Task List (GenUI)** | AI auto‑tags tasks with priority (`High`, `Medium`, `Low`) and category (`Tech`, `Design`, `Marketing`). Inline filter tabs (All / Active / Completed). Real‑time checkbox sync to `db_<username>.json`. |
| **Project Summary Card** | SVG donut chart showing task completion, urgency breakdown, and Apple‑style status badge (`On Track`, `At Risk`, `Off Track`). |
| **Multi‑Project Board** | Create, switch, and manage multiple projects, each with its own task list and notes. |
| **Project Notes / Wiki** | Store memos, technical specs, and meeting summaries per project. |
| **Automatic API‑Key Rotation** | Server detects 429 rate‑limit errors and rotates to a backup API key without interruption. |

---

### Phase 2 — 🧠 Strategic Decision Log

| Feature | Description |
|-------|------------|
| **DecisionLogCard (GenUI)** | When AI detects a strategic discussion (e.g., hiring, fundraising, product changes), it automatically renders a draft decision card with fields: *Final Decision*, *Rationale*, *Assumptions*, *Considered Alternatives*, *Confidence Score*, *Tags*. |
| **Save to Firestore** | The "✅ Save to Decision Log" button persists the decision to the `decisions` collection in Firestore. |
| **Search Similar Decisions** | The `search_similar_decisions` tool finds historically relevant decisions based on keywords to support data‑driven decision‑making. |

**Trigger prompt:**
```
I decide to change the subscription price from $29 to $39 starting next month.
```

---

### Phase 3 — 📈 Scenario Simulator (What‑If Analysis)

| Feature | Description |
|-------|------------|
| **ScenarioChart (GenUI)** | Interactive SVG chart (line / bar) visualizing 12‑month projections. Three modes: **Revenue Growth**, **Hiring Impact**, **Pricing Impact**. |
| **Deterministic Calculations** | All numbers are computed on the server (not by the LLM) using price‑elasticity, burn‑rate, and compound‑revenue formulas for accurate, consistent results. |
| **Auto‑Render** | Once a `calculate_*` tool finishes, `ScenarioChart` renders automatically without a separate Gemini render call. |
| **Default Values** | If the user does not specify numbers, AI uses default fixture data: cash IDR 750M, burn IDR 91.5M/month, revenue IDR 180M/month. |

**Trigger prompt:**
```
Simulate a scenario where we hire 2 new salespeople with a salary of 100M per year.
What is the projection if we increase the subscription price by 20%?
Analyze runway if revenue grows 5% per month.
```

---

### Phase 4 — 📄 Board & Investor Reporting

| Feature | Description |
|-------|------------|
| **ReportCard (GenUI)** | Preview a full report draft in a chat card with **📋 Copy** and **📥 Download (.md)** buttons. |
| **Two Report Types** | *Board* — internal governance report; *Investor* — performance report for shareholders. |
| **Integrated Data** | Reports combine financial data (MRR, cash, runway), CRM data (pipeline, NPS, churn), and strategic decision logs from Firestore. |
| **Auto‑Generate** | `generate_board_report_draft` tool produces a complete Markdown draft and renders the card without extra steps. |

**Trigger prompt:**
```
Create a draft board meeting report for this month.
Create an investor performance report for Q2 2026.
```

---

### Phase 5 — 🔍 Market Intelligence

| Feature | Description |
|-------|------------|
| **MarketDigestCard (GenUI)** | Market‑intelligence card showing competitor list, latest pricing, news snippets, and AI‑generated analysis summary. |
| **Firestore Caching** | Research results are cached in the `market_intelligence_cache` collection for 24 hours to avoid repeated searches. |
| **Force Refresh** | "🔄 Force Refresh" button forces a fresh search, bypassing the cache. |
| **Fixture Search** | Uses data from `search_results.json` (can be swapped for Google Search API or Serper in production). |

**Trigger prompt:**
```
Find market research and competitor news.
How do competitor prices compare in the project‑management SaaS segment?
```

---

## 🏗️ System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                     User Browser (http://localhost:3000)    │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP / Fetch
                         ▼
┌─────────────────────────────────────────────────────────────┐
│          Next.js App Router (Frontend + API Routes)         │
│  ┌──────────────────┐   ┌───────────────────────────────┐   │
│  │   /app/chat      │   │     /api/chat (route.ts)      │   │
│  │   Chat.tsx       │   │   Agentic Loop + Tool Router  │   │
│  │   GenUI Renderer │   │   Auto-Render Dispatcher      │   │
│  └──────────────────┘   └───────────────┬───────────────┘   │
│                                         │                   │
│  ┌──────────────────────────────────────▼──────────────┐   │
│  │            GenUI Components                          │   │
│  │  BriefingCard | DecisionLogCard | ScenarioChart      │   │
│  │  ReportCard   | MarketDigestCard | TaskList          │   │
│  │  ProjectSummary | ProjectNotes | ProjectList         │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
            ┌────────────┴────────────┐
            │                         │
            ▼                         ▼
┌───────────────────┐     ┌───────────────────────┐
│  Google Gemini    │     │  Google Firestore      │
│  2.5 Flash API    │     │  (gen-ai-academy-...)  │
│  (Key Rotation)   │     │  decisions             │
└───────────────────┘     │  market_intelligence_  │
                          │  cache                 │
                          └───────────────────────┘
                                     │
                          ┌──────────▼──────────┐
                          │  Local JSON DB       │
                          │  db_<username>.json  │
                          │  (tasks, projects,   │
                          │   notes)             │
                          └─────────────────────┘

[Backend Python — Separate]
FastAPI + LangChain + Uvicorn
http://localhost:8000 (local)
https://cos-backend-934594569799.asia-southeast1.run.app (prod)
```

---

## 🚀 Running Locally

### 1. Configure Environment Variables

Create a `.env.local` file inside the `mvp/` folder:

```env
# Gemini API — separate multiple keys with commas for automatic rotation
GEMINI_API_KEY="API_KEY_PRIMARY"
GEMINI_API_KEYS="API_KEY_PRIMARY,API_KEY_BACKUP_1,API_KEY_BACKUP_2"

# Backend URL (Next.js → FastAPI)
NEXT_PUBLIC_BACKEND_URL="http://localhost:8000"

# Firebase / Firestore (optional, connects to production Firestore)
NEXT_PUBLIC_FIREBASE_API_KEY="..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
NEXT_PUBLIC_FIREBASE_PROJECT_ID="gen-ai-academy-492602"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="..."
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="..."
```

### 2. Install Dependencies & Start Dev Server

```bash
# Inside mvp/
npm install
npm run dev
```

Open a browser at **[http://localhost:3000](http://localhost:3000)**

### 3. Run Python Backend (optional)

```bash
# Inside backend/
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn server:app --port 8000
```

| `search_results.json` | Data kompetitor untuk market intelligence |

---

## 📁 Struktur Direktori Utama

```
mvp/
├── src/
│   └── app/
│       ├── api/
│       │   ├── chat/route.ts        ← Inti: Agentic Loop + Tool Router
│       │   ├── tasks/route.ts
│       │   ├── projects/route.ts
│       │   └── notes/route.ts
│       ├── components/
│       │   ├── Chat.tsx             ← UI Chat + GenUI Renderer
│       │   └── genui/
│       │       ├── BriefingCard.tsx         (Fase 1)
│       │       ├── DecisionLogCard.tsx      (Fase 2)
│       │       ├── ScenarioChart.tsx        (Fase 3)
│       │       ├── ReportCard.tsx           (Fase 4)
│       │       ├── MarketDigestCard.tsx     (Fase 5)
│       │       ├── TaskList.tsx
│       │       ├── ProjectSummary.tsx
│       │       ├── ProjectNotes.tsx
│       │       ├── ProjectList.tsx
│       │       └── ReasoningTrailPanel.tsx
│       ├── dashboard/page.tsx       ← Dashboard dengan Gantt Chart 14 Hari
│       ├── page.tsx                 ← Landing Page
│       └── chat/page.tsx            ← Halaman Chat Utama
├── fixtures/                        ← Mock data (finance, crm, calendar, search)
├── .env.local                       ← API Keys & config lokal
└── README.md
```

---

## 🛠️ Stack Teknologi

| Kategori | Teknologi |
|----------|-----------|
| **Frontend Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **AI Model** | Google Gemini 2.5 Flash (via `@google/generative-ai` SDK) |
| **Database Cloud** | Google Firestore (Native Mode) |
| **Database Lokal** | JSON flat-file (`db_<username>.json`) |
| **Backend Python** | FastAPI + LangChain + Uvicorn |
| **Styling** | Vanilla CSS (Apple Light Mode / TypeUI) |
| **Charts** | SVG murni (tanpa library eksternal) |
| **Deployment** | Google Cloud Run (asia-southeast1) |
| **Container** | Docker (multi-stage build) |

---

## 🔧 Arsitektur Agentic Loop

Setiap pesan chat melalui alur berikut di [`/api/chat/route.ts`](./src/app/api/chat/route.ts):

```
User Message
    │
    ▼
Gemini API (with Tools + System Prompt)
    │
    ▼
Response: FunctionCall?
    │
    ├─── YES ──► Execute Tool Handler
    │               │
    │               ├── Data Tools (fetch/calculate):
    │               │   Jalankan kalkulasi/query, set innerGenUIPayload,
    │               │   feed toolResult back ke Gemini → loop lagi
    │               │
    │               └── Render Tools (render_*/BriefingCard):
    │                   Set innerGenUIPayload, feed dummy {rendered:true},
    │                   BREAK loop
    │
    └─── NO ───► response.text() → kirim ke frontend
    
    ▼
Return JSON: { text: string, genUI: GenUIPayload | null }
    │
    ▼
Chat.tsx → Render komponen GenUI yang sesuai berdasarkan componentName
```

**Catatan kunci**: Semua tool data (`calculate_hiring_impact`, `calculate_revenue_scenario`, `generate_board_report_draft`, `fetch_market_intelligence`) **langsung men-set `innerGenUIPayload`** tanpa bergantung pada Gemini untuk memanggil render tool secara berantai — memastikan komponen selalu muncul.

---

## 📋 Daftar Tool yang Tersedia untuk Gemini

### Data & Computation Tools
| Tool | Fungsi |
|------|--------|
| `fetchFinanceSummary` | Ambil data keuangan dari fixture |
| `fetchSalesHighlights` | Ambil data pipeline CRM dari fixture |
| `fetchCalendarToday` | Ambil agenda rapat hari ini dari fixture |
| `searchWeb` | Cari data kompetitor dari fixture |
| `calculate_revenue_scenario` | Kalkulasi proyeksi revenue 12 bulan |
| `calculate_hiring_impact` | Kalkulasi dampak rekrutmen pada burn & runway |
| `calculate_pricing_impact` | Kalkulasi dampak harga pada volume & margin |
| `generate_board_report_draft` | Generate draf laporan Board/Investor |
| `fetch_market_intelligence` | Ambil & cache data riset pasar/kompetitor |
| `save_decision_to_log` | Simpan keputusan ke Firestore |
| `search_similar_decisions` | Cari keputusan serupa di Firestore |

### CRUD Tools
| Tool | Fungsi |
|------|--------|
| `updateAndRenderTasks` | Update task list |
| `createProject` | Buat proyek baru |
| `switchProject` | Pindah proyek |
| `listProjects` | Lihat semua proyek |
| `updateProjectNotes` | Simpan catatan proyek |

### Render Tools (Generative UI)
| Tool | Komponen |
|------|----------|
| `renderBriefingCard` | `BriefingCard` |
| `render_decision_log_card` | `DecisionLogCard` |
| `render_scenario_chart` | `ScenarioChart` |
| `render_report_card` | `ReportCard` |
| `render_market_digest_card` | `MarketDigestCard` |
| `renderProjectSummary` | `ProjectSummary` |

---

## 🚢 Deploy ke Google Cloud Run

```bash
# Build & push image backend
cd backend/
gcloud builds submit --tag asia-southeast1-docker.pkg.dev/gen-ai-academy-492602/cos-repo/cos-backend:latest

# Build & push image frontend
cd mvp/
gcloud builds submit --tag asia-southeast1-docker.pkg.dev/gen-ai-academy-492602/cos-repo/cos-frontend:latest

# Deploy backend
gcloud run deploy cos-backend \
  --image asia-southeast1-docker.pkg.dev/gen-ai-academy-492602/cos-repo/cos-backend:latest \
  --region asia-southeast1 --allow-unauthenticated

# Deploy frontend
gcloud run deploy cos-frontend \
  --image asia-southeast1-docker.pkg.dev/gen-ai-academy-492602/cos-repo/cos-frontend:latest \
  --region asia-southeast1 --allow-unauthenticated \
  --set-env-vars NEXT_PUBLIC_BACKEND_URL=https://cos-backend-934594569799.asia-southeast1.run.app
```

---

*Dibuat dengan ❤️ menggunakan Google Gemini 2.5 Flash, Next.js, dan Google Cloud Run.*
