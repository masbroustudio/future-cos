# Future CoS — DEPLOY GUIDE (GCP Free Tier)

> Versi: 1.0 | Dibuat: 2026-07-05
> ⏸️ **Dokumen ini HANYA digunakan setelah semua fase development selesai dan mendapat aba-aba dari owner.**

---

## ⚠️ Peringatan Sebelum Deploy

1. **Jangan deploy ke GCP sebelum semua fase (0-5) selesai dan teruji lokal.**
2. **Daftarkan kartu kredit/debit ke Google Cloud** — walau tidak ditagih jika di bawah kuota, Cloud Storage (bucket default) memerlukan project di Blaze plan sejak Feb 2026.
3. **Set Budget Alert $0** segera setelah project dibuat. Ini WAJIB.
4. **Semua LLM call menggunakan Gemini AI Studio API** — bukan Vertex AI.
5. Kuota Gemini Free Tier: ~1.000 request/hari (Gemini Flash). Cukup untuk 1 founder + tim kecil.

---

## 1. GCP Services yang Digunakan

| Service | Fungsi | Free Tier Limit |
|---|---|---|
| **Cloud Run** | Hosting frontend + backend container | 2 juta request/bulan |
| **Gemini API (AI Studio)** | LLM inference | ~1.000 req/hari (Flash) |
| **Firestore** | Database structured + vector | 1GB storage, 50rb reads/20rb writes per hari |
| **Cloud Storage** | File dokumen, report drafts | 5GB regional/bulan |
| **Cloud Scheduler** | Trigger daily briefing | 3 jobs gratis/bulan |
| **Cloud Functions** | Scenario kalkulasi terpisah | 2 juta invocations/bulan |
| **Firebase Auth** | Autentikasi user | Gratis untuk basic auth |

---

## 2. Pre-Deploy Checklist

### 2.1 — GCP Project Setup
- [ ] Buat GCP project baru: `future-cos-prod`
- [ ] Aktifkan APIs:
  ```bash
  gcloud services enable run.googleapis.com
  gcloud services enable firestore.googleapis.com
  gcloud services enable storage.googleapis.com
  gcloud services enable cloudfunctions.googleapis.com
  gcloud services enable cloudscheduler.googleapis.com
  gcloud services enable firebase.googleapis.com
  ```
- [ ] Setup Budget Alert:
  - Billing → Budgets & Alerts → Create Budget
  - Amount: $1 (aman margin kecil)
  - Alert: 50%, 90%, 100%
  - Kirim ke email owner

### 2.2 — Firebase Production Setup
- [ ] Buat Firebase project (link ke GCP project `future-cos-prod`)
- [ ] Enable Firebase Auth: Email/Password + Google
- [ ] Deploy Firestore rules production:
  ```bash
  firebase deploy --only firestore:rules
  ```
- [ ] Enable Firestore Vector Search (extension atau built-in)

### 2.3 — Service Account
- [ ] Buat service account: `cos-backend@future-cos-prod.iam.gserviceaccount.com`
- [ ] Grant roles:
  - `roles/datastore.user` (Firestore)
  - `roles/storage.objectAdmin` (Cloud Storage)
  - `roles/firebase.sdkAdminServiceAgent` (Firebase Admin)
- [ ] Download JSON key → simpan sebagai `backend/.credentials/service-account.json` (JANGAN commit ke git!)

---

## 3. Environment Variables Production

### Frontend (Cloud Run — Next.js)
```env
# .env.production (atau Cloud Run env vars)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=future-cos-prod.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=future-cos-prod
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=future-cos-prod.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxx
NEXT_PUBLIC_BACKEND_URL=https://cos-backend-xxxx-uc.a.run.app
```

### Backend (Cloud Run — FastAPI)
```env
GEMINI_API_KEY=your_ai_studio_key
GEMINI_API_KEYS=key1,key2,key3
GOOGLE_APPLICATION_CREDENTIALS=/app/.credentials/service-account.json
FIRESTORE_PROJECT_ID=future-cos-prod
GCS_BUCKET_NAME=future-cos-prod-docs
ENVIRONMENT=production
FRONTEND_URL=https://future-cos-xxxx-uc.a.run.app
```

---

## 4. Dockerfile

### Frontend (mvp/Dockerfile — sudah ada, update jika perlu)
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 8080
ENV PORT 8080
CMD ["node", "server.js"]
```

### Backend (backend/Dockerfile — perlu dibuat baru)
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8080
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8080"]
```

---

## 5. Deploy Frontend ke Cloud Run

```bash
# Di dalam folder mvp/
gcloud run deploy cos-frontend \
  --source . \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3 \
  --set-env-vars NEXT_PUBLIC_FIREBASE_API_KEY=xxx,...
```

---

## 6. Deploy Backend ke Cloud Run

```bash
# Di dalam folder backend/
gcloud run deploy cos-backend \
  --source . \
  --platform managed \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 2 \
  --set-secrets GEMINI_API_KEY=gemini-api-key:latest \
  --set-env-vars ENVIRONMENT=production,...
```

---

## 7. Cloud Scheduler — Daily Briefing

```bash
# Trigger briefing setiap hari jam 06:30 WIB (UTC+7 = 23:30 UTC)
gcloud scheduler jobs create http daily-briefing \
  --location asia-southeast1 \
  --schedule "30 23 * * *" \
  --uri "https://cos-backend-xxxx-uc.a.run.app/api/trigger-briefing" \
  --http-method POST \
  --headers "Authorization=Bearer {SCHEDULER_TOKEN}" \
  --time-zone "Asia/Jakarta"
```

---

## 8. Monitoring & Alerting

### Budget Alert (WAJIB)
Setup di GCP Console → Billing → Budgets & Alerts.

### Logging
```bash
# Lihat logs backend
gcloud run services logs read cos-backend --region asia-southeast1 --limit 50

# Lihat logs frontend
gcloud run services logs read cos-frontend --region asia-southeast1 --limit 50
```

### Uptime Check
- GCP Console → Monitoring → Uptime Checks
- Monitor: `https://future-cos-xxxx-uc.a.run.app/` (frontend)
- Monitor: `https://cos-backend-xxxx-uc.a.run.app/` (backend root endpoint)

---

## 9. Post-Deploy Checklist

- [ ] Frontend loading dan login berfungsi
- [ ] Backend health check: `GET /` mengembalikan status OK
- [ ] Firebase Auth: user bisa register dan login
- [ ] Firestore: data tersimpan dengan benar
- [ ] Briefing Agent: test request via chat
- [ ] Cloud Scheduler: verifikasi job terdaftar
- [ ] Budget Alert: konfirmasi email notifikasi aktif
- [ ] Set URL frontend di backend CORS settings

---

## 10. Rollback Plan

Jika ada issue setelah deploy:

```bash
# Lihat revision history
gcloud run revisions list --service cos-backend --region asia-southeast1

# Rollback ke revision sebelumnya
gcloud run services update-traffic cos-backend \
  --to-revisions REVISION_NAME=100 \
  --region asia-southeast1
```

---

*Dokumen ini update saat konfigurasi GCP berubah atau ada service baru yang ditambahkan.*
