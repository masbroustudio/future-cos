# Future CoS — DEV ENVIRONMENT GUIDE

> Guide to running the application locally for development.

---

## Prerequisites

- **Node.js** v20+ (for frontend)
- **Python** 3.11+ (for backend)
- **Firebase CLI** (for Firestore emulator)
- **Git**

---

## 1. Clone & Initial Setup

```bash
# Already present at C:\dev\FutureCos — no need to re-clone

# Install frontend dependencies
cd C:\dev\FutureCos\mvp
npm install

# Set up Python environment for backend
cd C:\dev\FutureCos\backend
python -m venv venv
.\venv\Scripts\activate   # Windows
pip install -r requirements.txt
```

---

## 2. Environment Variables

### Frontend: `mvp/.env.local`
```env
# Gemini API (required)
GEMINI_API_KEY=your_gemini_api_key
GEMINI_API_KEYS=key1,key2   # Multiple keys for rotation

# Firebase (fill after creating Firebase project)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Backend URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# Firestore Emulator (for local dev)
FIRESTORE_EMULATOR_HOST=localhost:8080
```

### Backend: `backend/.env`
```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_API_KEYS=key1,key2
ENVIRONMENT=development

# Firebase Admin (fill after creating Firebase project)
GOOGLE_APPLICATION_CREDENTIALS=./.credentials/service-account-dev.json
FIRESTORE_PROJECT_ID=your-project-id

# Firestore Emulator
FIRESTORE_EMULATOR_HOST=localhost:8080
```

---

## 3. Run Firebase Emulator (Firestore)

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login
firebase login

# At project root C:\dev\FutureCos
firebase init emulators
# Select: Firestore, Authentication

# Start emulator
firebase emulators:start --only firestore,auth
# Firestore UI: http://localhost:4000
# Firestore API: localhost:8080
# Auth: localhost:9099
```

---

## 4. Run Backend

```bash
cd C:\dev\FutureCos\backend
.\venv\Scripts\activate

# Development mode with hot reload
uvicorn server:app --host 0.0.0.0 --port 8000 --reload

# Backend runs at: http://localhost:8000
# API docs: http://localhost:8000/docs
```

---

## 5. Run Frontend

```bash
cd C:\dev\FutureCos\mvp
npm run dev

# Frontend runs at: http://localhost:3000
```

---

## 6. Correct Startup Order

```
1. firebase emulators:start    → localhost:4000 (Firestore UI), 8080 (API)
2. uvicorn server:app --reload → localhost:8000 (Backend)
3. npm run dev                 → localhost:3000 (Frontend)
```

---

## 7. Testing

```bash
# Backend unit tests (scenario calculation tools)
cd C:\dev\FutureCos\backend
pytest tests/ -v

# Frontend type check
cd C:\dev\FutureCos\mvp
npx tsc --noEmit
```

---

## 8. General Troubleshooting

### "Module not found" in backend
```bash
pip install -r requirements.txt
```

### Port 3000 already in use
```bash
# Kill process using port 3000
netstat -ano | findstr :3000
taskkill /PID {PID_NUMBER} /F
```

### Firestore emulator fails to connect
```bash
# Ensure env var FIRESTORE_EMULATOR_HOST=localhost:8080 is set
# In PowerShell:
$env:FIRESTORE_EMULATOR_HOST="localhost:8080"
```

### CORS error from frontend to backend
- Ensure `NEXT_PUBLIC_BACKEND_URL=http://localhost:8000` is set in `.env.local`
- Ensure `allow_origins` in `server.py` includes `http://localhost:3000`
