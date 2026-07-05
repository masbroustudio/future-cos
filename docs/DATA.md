# Future CoS — DATA MODEL & SCHEMA

> Versi: 1.0 | Dibuat: 2026-07-05

---

## 1. Firestore Database Structure

```
firestore/
├── users/
│   └── {uid}/
│       ├── profile
│       ├── settings
│       └── onboarding
├── decisions/
│   └── {decision_id}/
├── metrics/
│   └── {metric_id}/
├── briefings/
│   └── {briefing_id}/
├── scenarios/
│   └── {scenario_id}/
├── cos_documents/         ← Vector Store
│   └── {doc_id}/
└── audit_log/
    └── {log_id}/
```

---

## 2. User Profile Schema

```typescript
// Firestore: users/{uid}/profile
type UserProfile = {
  uid: string;                    // Firebase Auth UID
  email: string;
  displayName: string;
  role: "founder" | "c_suite" | "staff";
  company: string;
  timezone: string;               // "Asia/Jakarta"
  currency: string;               // "IDR" | "USD"
  language: string;               // "id" | "en"
  createdAt: Timestamp;
  lastActiveAt: Timestamp;
};

// Firestore: users/{uid}/settings
type UserSettings = {
  briefingSchedule: {
    enabled: boolean;
    time: string;                 // "07:00" (local time)
    days: ("mon"|"tue"|"wed"|"thu"|"fri"|"sat"|"sun")[];
  };
  notificationPreferences: {
    email: boolean;
    inApp: boolean;
  };
  connectors: {
    finance: {
      type: "mock" | "xero" | "accurate" | "jurnal";
      enabled: boolean;
      lastSync: Timestamp | null;
    };
    crm: {
      type: "mock" | "hubspot" | "salesforce";
      enabled: boolean;
      lastSync: Timestamp | null;
    };
    calendar: {
      type: "mock" | "google_calendar" | "outlook";
      enabled: boolean;
    };
  };
  autonomyPreferences: {
    briefingAutoGenerate: boolean;       // Default: true
    decisionAutoDetect: boolean;         // Default: true
    requireApprovalForReports: boolean;  // Default: true
  };
};
```

---

## 3. Decision Log Schema

```typescript
// Firestore: decisions/{decision_id}
type DecisionEntry = {
  id: string;
  userId: string;                        // Firebase UID
  
  // Content
  title: string;                         // Max 100 char
  description: string;                   // Konteks lengkap keputusan
  decisionMade: string;                  // Keputusan final yang diambil
  rationale: string;                     // Alasan/reasoning
  
  // Reasoning Trail
  assumptions: string[];                 // List asumsi yang dibuat
  dataSources: string[];                 // ["finance_q2.pdf", "CRM export June"]
  alternativesConsidered: string[];      // Opsi yang ditolak + alasannya
  confidenceScore: number;               // 0.0 – 1.0
  confidenceLabel: "High" | "Medium" | "Low";
  warnings: string[];                    // Jika ada data yang kurang/stale
  
  // Metadata
  tags: string[];                        // ["hiring", "fundraising", "pricing"]
  category: "strategic" | "operational" | "financial" | "people" | "product";
  impact: "high" | "medium" | "low";
  reversibility: "reversible" | "partially_reversible" | "irreversible";
  
  // Status & Lifecycle
  status: "draft" | "confirmed" | "executed" | "cancelled";
  madeAt: Timestamp;                     // Waktu keputusan diambil
  executedAt: Timestamp | null;
  
  // Outcome (diisi nanti)
  outcome: string | null;               // Hasil nyata setelah eksekusi
  outcomeRecordedAt: Timestamp | null;
  lessonsLearned: string | null;
  
  // Similarity (auto-filled)
  embeddingVector: Vector | null;        // Firestore Vector (768 dim)
  similarDecisionIds: string[];
  
  // Audit
  createdByAgent: string;               // "decision_agent_v1"
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
```

---

## 4. Daily Briefing Schema

```typescript
// Firestore: briefings/{briefing_id}
type BriefingEntry = {
  id: string;
  userId: string;
  
  // Content
  date: string;                          // "2026-07-07"
  generatedAt: Timestamp;
  
  // Highlights
  criticalHighlights: {
    title: string;
    description: string;
    severity: "critical" | "warning" | "info";
    source: string;
  }[];
  
  // Metrics Snapshot
  metricsSnapshot: {
    revenue: {
      current: number;
      target: number;
      trend: number;               // % vs last period
    };
    mrr: number;
    openDeals: number;
    pipelineValue: number;
    cashBalance: number;
    cashRunwayMonths: number;
    teamCapacityPercent: number;
  };
  
  // Agenda
  agendaItems: {
    time: string;
    title: string;
    attendees: string[];
    isImportant: boolean;
    preparationNote: string;
  }[];
  
  // Reasoning Trail
  reasoningTrail: ReasoningTrail;
  
  // Actions
  savedToDashboard: boolean;
  userFeedback: "helpful" | "not_helpful" | null;
};

// Shared type - digunakan di semua fitur
type ReasoningTrail = {
  dataSources: string[];
  assumptions: string[];
  confidenceScore: number;
  confidenceLabel: "High" | "Medium" | "Low";
  alternativeOptions: string[];
  warnings: string[];
  generatedAt: string;
  agentVersion: string;
};
```

---

## 5. Scenario Schema

```typescript
// Firestore: scenarios/{scenario_id}
type ScenarioEntry = {
  id: string;
  userId: string;
  
  // Input
  scenarioType: "revenue_growth" | "hiring" | "pricing" | "expansion" | "custom";
  title: string;
  question: string;                 // "Kalau kita hire 3 orang, runway kita berapa?"
  
  // Variables
  inputVariables: Record<string, number | string>;
  
  // Results
  projections: {
    month: string;
    baseline: number;
    scenario: number;
    lowerBound: number;
    upperBound: number;
  }[];
  
  summaryMetrics: Record<string, number>;
  
  // Reasoning Trail
  reasoningTrail: ReasoningTrail;
  
  // Comparison
  comparedWithScenarioIds: string[];
  
  // Metadata
  createdAt: Timestamp;
  savedByUser: boolean;
};
```

---

## 6. Report Draft Schema

```typescript
// Firestore: reports/{report_id}
type ReportDraft = {
  id: string;
  userId: string;
  
  reportType: "investor_update" | "board_report" | "monthly_ops" | "custom";
  period: string;                   // "Q2 2026" | "June 2026"
  audience: "investor" | "board_internal" | "team";
  title: string;
  
  // Content (Markdown sections)
  sections: {
    title: string;
    content: string;                // Markdown
    dataReferences: string[];       // Sumber data per section
    isApproved: boolean;
  }[];
  
  // Status
  status: "draft" | "review" | "approved" | "sent";
  
  // Reasoning Trail
  reasoningTrail: ReasoningTrail;
  
  // Storage (Fase deploy)
  storageUrl: string | null;        // Cloud Storage URL
  
  // Timestamps
  createdAt: Timestamp;
  approvedAt: Timestamp | null;
  sentAt: Timestamp | null;
};
```

---

## 7. Vector Store Document Schema

```typescript
// Firestore: cos_documents/{doc_id}
type CoSDocument = {
  id: string;
  userId: string;
  
  // Content
  content: string;                  // Teks chunk (max 1000 token)
  chunkIndex: number;               // Chunk ke-N dari dokumen asli
  sourceDocId: string;              // ID dokumen asli (jika multi-chunk)
  
  // Source Metadata
  source: string;                   // "finance_q2_report.pdf"
  sourceUrl: string | null;
  docType: "report" | "meeting_notes" | "research" | "contract" | "other";
  
  // Embedding
  embedding: number[];              // Vector 768 dim (text-embedding-004)
  
  // Metadata
  createdAt: Timestamp;
  processedAt: Timestamp;
  tokenCount: number;
};
```

---

## 8. Audit Log Schema

```typescript
// Firestore: audit_log/{log_id}
type AuditLogEntry = {
  id: string;
  userId: string;
  
  // Action
  action: string;               // "decision.create" | "briefing.generate"
  agentName: string;            // "briefing_agent" | "decision_agent"
  toolsUsed: string[];
  
  // Input/Output Summary
  inputSummary: string;
  outputSummary: string;
  
  // Governance
  autonomyLevel: "auto" | "suggest" | "approval";
  requiresApproval: boolean;
  approved: boolean | null;
  approvedBy: string | null;
  
  // Performance
  durationMs: number;
  llmCallCount: number;
  llmTokensUsed: number;
  
  // Result
  success: boolean;
  errorMessage: string | null;
  
  createdAt: Timestamp;
};
```

---

## 9. Mock Fixtures Format

### `backend/fixtures/finance.json`
```json
{
  "current_month": {
    "revenue": 180000000,
    "revenue_target": 200000000,
    "revenue_vs_target": -0.10,
    "revenue_trend_vs_last_month": 0.03,
    "expenses": 145000000,
    "gross_margin": 0.62,
    "cash_balance": 750000000,
    "cash_runway_months": 8.2,
    "monthly_burn": 91500000
  },
  "history_monthly": [
    {"month": "2026-01", "revenue": 160000000, "target": 170000000},
    {"month": "2026-02", "revenue": 168000000, "target": 175000000},
    {"month": "2026-03", "revenue": 155000000, "target": 180000000},
    {"month": "2026-04", "revenue": 172000000, "target": 190000000},
    {"month": "2026-05", "revenue": 175000000, "target": 195000000},
    {"month": "2026-06", "revenue": 180000000, "target": 200000000}
  ],
  "data_freshness_hours": 2
}
```

### `backend/fixtures/crm.json`
```json
{
  "open_deals": 23,
  "pipeline_value": 2100000000,
  "conversion_rate": 0.32,
  "avg_deal_size": 91304347,
  "deals_stalled": [
    {
      "id": "deal-001",
      "name": "PT Maju Bersama",
      "value": 250000000,
      "days_stalled": 18,
      "owner": "Budi Santoso"
    }
  ],
  "deals_closing_this_week": [
    {
      "id": "deal-005",
      "name": "CV Teknologi Nusantara",
      "value": 150000000,
      "probability": 0.85,
      "close_date": "2026-07-07"
    }
  ],
  "total_customers": 142,
  "mrr": 178500000,
  "arr": 2142000000,
  "churn_rate_monthly": 0.018,
  "nps_score": 52
}
```

### `backend/fixtures/calendar.json`
```json
{
  "events_today": [
    {
      "title": "Board Call — Q2 Review",
      "start_time": "10:00",
      "duration_minutes": 60,
      "attendees": ["Founder", "CFO", "Board Member A"],
      "is_important": true,
      "preparation_needed": true,
      "preparation_note": "Siapkan deck Q2 revenue & pipeline"
    },
    {
      "title": "1:1 Head of Sales",
      "start_time": "14:00",
      "duration_minutes": 30,
      "attendees": ["Founder", "Ahmad Rizky"],
      "is_important": true,
      "preparation_needed": false
    }
  ],
  "total_meeting_hours": 1.5,
  "focus_blocks": [
    {"start": "08:00", "end": "10:00", "label": "Deep Work Block"}
  ]
}
```

---

## 10. Firestore Security Rules (Lokal Emulator)

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Decisions scoped by userId field
    match /decisions/{docId} {
      allow read, write: if request.auth != null && 
                           request.auth.uid == resource.data.userId;
    }
    
    // Briefings scoped by userId
    match /briefings/{docId} {
      allow read, write: if request.auth != null && 
                           request.auth.uid == resource.data.userId;
    }
    
    // Same pattern for all other collections
    match /scenarios/{docId} {
      allow read, write: if request.auth != null && 
                           request.auth.uid == resource.data.userId;
    }
    
    match /cos_documents/{docId} {
      allow read, write: if request.auth != null && 
                           request.auth.uid == resource.data.userId;
    }
    
    match /audit_log/{docId} {
      allow read: if request.auth != null && 
                     request.auth.uid == resource.data.userId;
      // Only backend service account can write
      allow write: if false;
    }
  }
}
```

---

## 11. Embedding Strategy

### Text Embedding Model
- **Model:** `text-embedding-004` (Google AI Studio)
- **Dimensions:** 768
- **Max input tokens:** 2048

### Chunking Strategy
```python
CHUNK_SIZE = 800        # tokens per chunk
CHUNK_OVERLAP = 100     # token overlap antar chunk
```

### Documents yang Di-embed
| Tipe Dokumen | Trigger Embedding |
|---|---|
| Meeting notes upload | Saat user upload |
| Finance reports | Saat connector sync |
| Decision entries | Saat decision saved |
| Search results (market intel) | Cached + embedded otomatis |
| Board report drafts | Saat approved |

---

*Lihat ARCHITECTURE.md untuk detail implementasi Vector Search.*
