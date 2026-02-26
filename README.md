<div align="center">

# ✦ Vesper

### AI-powered journaling and emotional analytics

*Write daily. Watch your mind evolve.*

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Supabase](https://img.shields.io/badge/Supabase-pgvector-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![LiteLLM](https://img.shields.io/badge/LiteLLM-proxy-7C3AED?style=flat-square)](https://litellm.ai)
[![Live](https://img.shields.io/badge/Live-vesper--journal.vercel.app-000000?style=flat-square&logo=vercel)](https://vesper-journal.vercel.app)

</div>

---

## What is Vesper?

Vesper is a private, AI-powered journal that doesn't just store your thoughts — it **analyses them**. Every entry is automatically processed for mood score, recurring themes, and cognitive distortion patterns (CBT framework). Over time, Vesper builds a **Drift Timeline** — a visual map showing how your emotional relationship with any topic has shifted week by week.

### Core Features

| Feature | Description |
|---|---|
| **Drift Timeline** | Pick any topic and watch your mood around it change across time |
| **Real-time AI Analysis** | Mood score, themes, and cognitive distortion detection on every save |
| **Semantic Search** | Meaning-based search — *"show entries where I felt hopeful"* |
| **Weekly Report** | AI-synthesised emotional digest with PDF export |
| **Insight Panel** | Per-entry mood arc, theme chips, and AI observation |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS v4, framer-motion, recharts |
| **Backend** | FastAPI, Python 3.10+, Uvicorn |
| **Database** | Supabase (PostgreSQL + pgvector for embeddings) |
| **Auth** | Supabase Auth (email/password + JWT) |
| **AI — Chat** | LiteLLM proxy → OpenAI **gpt-5-nano** (mood analysis, reports) |
| **AI — Embeddings** | LiteLLM proxy → OpenAI **text-embedding-3-small** (semantic search) |
| **PDF** | ReportLab (server-side PDF generation) |

---

## Project Structure

```
vesper/
├── backend/                  # FastAPI backend
│   ├── app/
│   │   ├── api/              # Route handlers (entries, drift, reports, dashboard)
│   │   ├── core/             # Config, auth helpers
│   │   ├── services/ai/      # LiteLLM analysis + embedding pipeline
│   │   └── main.py           # App entry point, CORS
│   ├── requirements.txt
│   └── .env.example
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── pages/            # Auth, Dashboard, DriftTimeline, Reports
│   │   ├── components/       # InsightPanel, Sidebar, ReportCard, etc.
│   │   ├── hooks/            # useAuth, useAnalysis, useAutoSave
│   │   └── lib/              # api.js, supabase.js
│   └── .env.example
├── render.yaml               # Render IaC (backend deployment)
├── SMOKE_TEST.md             # Manual QA checklist
└── README.md
```

---

## Local Development Setup

### Prerequisites

- Node.js 18+
- Python 3.10+
- A [Supabase](https://supabase.com) project with `pgvector` enabled
- A [LiteLLM](https://litellm.ai) proxy with `gpt-5-nano` and `text-embedding-3-small` accessible

### 1. Clone & configure

```bash
git clone https://github.com/di5ha/vesper-journal.git
cd vesper-journal
```

### 2. Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env with your Supabase + LiteLLM credentials

uvicorn app.main:app --reload --port 8000 --env-file .env
```

API docs available at **<http://localhost:8000/docs>**

### 3. Frontend

```bash
cd frontend
npm install

cp .env.example .env.local
# Edit .env.local — set VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL

npm run dev
```

App available at **<http://localhost:5173>**

---

## Deployment

### Backend → Render

1. Push this repo to GitHub.
2. Go to [render.com](https://render.com) → **New** → **Blueprint** → select this repo.
3. Render will detect `render.yaml` and create the `vesper-api` service automatically.
4. In the Render dashboard, set the **secret** environment variables:
   - `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_KEY`
   - `LITELLM_API_KEY`, `LITELLM_BASE_URL`
   - `FRONTEND_URL` → `https://vesper-journal.vercel.app`

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project** → import this repo.
2. Set **Root Directory** to `frontend`.
3. Add environment variables in Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_URL` → your Render backend URL (e.g. `https://vesper-api.onrender.com`)
4. Deploy.

---

## Environment Variables Reference

### Backend (Render)

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (server-side only) |
| `LITELLM_API_KEY` | API key for your LiteLLM proxy |
| `LITELLM_BASE_URL` | LiteLLM proxy base URL (`/v1` suffix) |
| `LITELLM_MODEL` | Model alias for chat, default `openai5nano` |
| `FRONTEND_URL` | Comma-separated allowed CORS origins |
| `APP_ENV` | `development` or `production` |

### Frontend (Vercel)

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key (safe for browser) |
| `VITE_API_URL` | Backend API base URL |

---

## Smoke Testing

See **[SMOKE_TEST.md](./SMOKE_TEST.md)** for the 5-step production verification checklist.

---

<div align="center">
Built with ✦ by <a href="https://github.com/di5ha">di5ha</a>
</div>
