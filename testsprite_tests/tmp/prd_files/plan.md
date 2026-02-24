# Vesper — Implementation Plan

> Source of truth for what to build. Every task must be checked off before moving to the next.

---

## Phase 1: Foundation

> **Goal:** Project scaffold, Supabase config, auth flow, basic journal CRUD.
> **Exit Criteria:** User can sign up, log in, write entries, view/edit/delete them. Sessions persist. Data scoped via RLS.

### 1.1 Project Scaffold

- [x] Initialize React 19 + Vite frontend with Tailwind CSS v4
  - **Files:** `frontend/vite.config.js`, `frontend/src/index.css`
  - **Deps:** `react`, `react-dom`, `tailwindcss`, `@tailwindcss/vite`
- [x] Create frontend directory structure (`/src/components`, `/src/pages`, `/src/lib`, `/src/hooks`)
- [x] Initialize FastAPI backend with modular structure (`/app/api`, `/app/core`, `/app/models`, `/app/services/ai`)
  - **Files:** `backend/app/main.py`, `backend/app/core/config.py`
- [x] Create `requirements.txt` with all backend dependencies
  - **File:** `backend/requirements.txt`
  - **Deps:** fastapi, uvicorn, supabase, langchain, google-generativeai, sentence-transformers, reportlab

### 1.2 Supabase Configuration

- [ ] Create Supabase project and obtain credentials
- [x] Enable `pgvector` extension via SQL editor (`CREATE EXTENSION IF NOT EXISTS vector;`)
- [x] Create `entries` table with schema from PRD
  - **Schema:** id (uuid PK), user_id (uuid FK), content (text), created_at, updated_at, mood_score (float), themes (text[]), distortions (jsonb), observation (text), embedding (vector(384)), analyzed (boolean)
  - **File:** `supabase_init.sql`
- [x] Create `reports` table with schema from PRD
  - **Schema:** id (uuid PK), user_id (uuid FK), created_at, week_start (date), dominant_emotion (text), top_themes (text[]), emotional_arc (text), ai_observation (text), pdf_url (text)
  - **File:** `supabase_init.sql`
- [x] Configure Row Level Security (RLS) policies on both tables
  - **Policy:** Users can only SELECT/INSERT/UPDATE/DELETE their own rows (`auth.uid() = user_id`)
  - **File:** `supabase_init.sql`
- [x] Add `updated_at` auto-update trigger on `entries` table
  - **File:** `supabase_init.sql` (`set_updated_at` function + trigger)
- [x] Add pgvector IVFFlat cosine index on `entries.embedding`
  - **File:** `supabase_init.sql`
- [x] Wire Supabase client in backend (`app/core/supabase.py`)
  - **Deps:** `supabase` Python SDK

### 1.3 Authentication Flow

- [x] Install `@supabase/supabase-js` and `react-router-dom` in frontend
  - **File:** `frontend/src/lib/supabase.js`, `frontend/.env.local`
- [x] Build combined Sign Up / Login page with mode toggle
  - **File:** `frontend/src/pages/Auth.jsx`
- [x] Implement sign out functionality
  - **File:** `frontend/src/pages/Dashboard.jsx` (Sign Out button)
- [x] Add session persistence (auto-restore on refresh via `getSession()` + `onAuthStateChange`)
  - **File:** `frontend/src/hooks/useAuth.jsx`
- [x] Create auth context/provider to wrap the app
  - **File:** `frontend/src/hooks/useAuth.jsx` (`AuthProvider` + `useAuth` hook)
- [x] Add protected route wrapper (redirect to /auth if unauthenticated)
  - **File:** `frontend/src/components/ProtectedRoute.jsx`
  - **Deps:** `react-router-dom`

### 1.4 Journal Entry CRUD (Backend)

- [x] `POST /entries` — Create new entry
  - **File:** `backend/app/api/entries.py`
- [x] `GET /entries` — List all entries for current user (newest first)
- [x] `GET /entries/{id}` — Get single entry with analysis
- [x] `GET /entries/{id}/analysis` — AI analysis polling stub (Phase 2 will activate)
- [x] `PUT /entries/{id}` — Update entry content
- [x] `DELETE /entries/{id}` — Delete entry
- [x] Add JWT extraction dependency (Bearer token → RLS passthrough)
  - **File:** `backend/app/core/auth.py`
- [x] Create Pydantic models for entry request/response
  - **File:** `backend/app/models/schemas.py` (`EntryCreate`, `EntryUpdate`, `EntryResponse`, `DeleteResponse`)
- [x] Register entries router in `main.py`

### 1.5 Journal Editor (Frontend)

- [x] Create authenticated API client
  - **File:** `frontend/src/lib/api.js` (Bearer token injection via `supabase.auth.getSession()`)
- [x] Implement auto-save with 3-second debounce
  - **File:** `frontend/src/hooks/useAutoSave.js` (`useDebounce` + `useAutoSave` hooks)
- [x] Build main editor component — textarea with create-or-update auto-save
  - **File:** `frontend/src/components/JournalEditor.jsx`
- [x] Visual save state indicator: Draft → Saving… → Saved
- [x] Add timestamp display and word count in editor toolbar
- [x] Integrate `JournalEditor` into Dashboard
  - **File:** `frontend/src/pages/Dashboard.jsx`

### 1.6 Entry List / History View

- [x] Build scrollable entry list as sidebar (sorted by date, newest first)
  - **File:** `frontend/src/components/Sidebar.jsx`
- [x] Wire edit action: clicking entry loads content + id into `JournalEditor`
  - Implemented via `onSelectEntry` callback + React `key` remount pattern in `Dashboard.jsx`
- [x] Wire delete action: trash icon with `confirm()` → `DELETE /entries/{id}` → removes from list
- [x] Loading skeleton and empty state in Sidebar

### 1.7 Basic Dashboard Shell

- [x] Build placeholder dashboard (completed ahead of schedule in Phase 1.3)
  - **File:** `frontend/src/pages/Dashboard.jsx`
- [x] Set up React Router with core routes (`/auth`, `/dashboard`, wildcard)
  - **File:** `frontend/src/App.jsx`
- [x] Core routes expansion (`/entries`, `/editor`, `/drift`, `/reports`) — added as features are built
- [x] Create nav/sidebar component
  - **File:** `frontend/src/components/Sidebar.jsx`

---

## Phase 2: Intelligence

> **Goal:** AI analysis engine, embeddings, insight panel.
> **Exit Criteria:** Every saved entry returns structured AI insights (mood, themes, distortions, observation). Embeddings stored.

### 2.1 LLM Setup — LiteLLM / OpenAI

- [x] Configure LiteLLM proxy integration using `AsyncOpenAI` SDK
  - **File:** `backend/app/services/ai/analyzer.py`
  - **Deps:** `openai`, `langchain-openai`
  - **Env vars:** `LITELLM_API_KEY`, `LITELLM_BASE_URL`, `LITELLM_MODEL`
- [x] Create analysis prompt with structured JSON output (System + User messages)
  - **Output:** `{mood_score: float, themes: list[str], distortions: list[str], observation: str}`
  - Uses `response_format={"type": "json_object"}` for reliable parsing
- [x] Add Pydantic output schema with CBT distortion literals and field validation
  - **File:** `backend/app/services/ai/analyzer.py` (`AnalysisResult` model)

### 2.2 Async Analysis Pipeline

- [x] Trigger background analysis task after entry save (POST + PUT)
  - **File:** `backend/app/services/ai/pipeline.py` + `backend/app/api/entries.py`
  - Uses FastAPI `BackgroundTasks` — HTTP response sent before analysis runs
- [x] Update entry row in Supabase with analysis results once complete
- [x] Set `analyzed = true` flag on entry after successful analysis
- [x] Handle failures: entry saved even if AI fails; stores "Analysis unavailable" fallback
- [x] `GET /entries/{id}/analysis` — Polling endpoint live (returns analyzed flag + fields)
  - **File:** `backend/app/api/entries.py`

### 2.3 Sentence-Transformers Embeddings

- [x] Load `all-MiniLM-L6-v2` model lazily, cached in memory after first call
  - **File:** `backend/app/services/ai/analyzer.py` (`embed_text()`, `_get_embedder()`)
- [x] Generate 384-dim vector embedding per entry concurrently with Gemini call
- [x] Store embedding in `embedding` column (pgvector) via `asyncio.gather()`

### 2.4 Insight Panel UI

- [x] Build right-side insight panel component
  - **File:** `frontend/src/components/InsightPanel.jsx`
- [x] Display mood score with visual SVG arc (HSL colour-coded 1-10)
- [x] Display themes as styled violet pill tags
- [x] Display cognitive distortions as amber warning cards
- [x] Display AI observation in italic text
- [x] Show pulsing loading skeleton while analysis is running
- [x] Show "No distortions flagged" emerald state when none detected
- [x] Show "Analysis unavailable" fallback (handled by backend pipeline)
- [x] Poll `/entries/{id}/analysis` every 3s until `analyzed: true`
  - **File:** `frontend/src/hooks/useAnalysis.js`

### 2.5 Semantic Search

- [x] Supabase RPC `match_entries(query_embedding, match_count)` — pgvector cosine similarity
  - **File:** `match_entries_rpc.sql` (run in Supabase SQL Editor)
  - Uses `SECURITY INVOKER` so `auth.uid()` scopes results to the caller
- [x] `POST /entries/search` endpoint — embeds query, calls RPC, returns ranked results
  - **File:** `backend/app/api/entries.py`
- [x] `searchEntries(query, limit)` API client function
  - **File:** `frontend/src/lib/api.js`
- [x] Search input in Sidebar with 500ms debounce
  - **File:** `frontend/src/components/Sidebar.jsx`
- [x] Swap chronological list for semantic results when query is active
- [x] Similarity percentage badge on each search result row
- [x] Clear (×) button to return to normal timeline view

---

## Phase 3: Differentiation

> **Goal:** Drift Timeline, Weekly Reports, PDF export, dashboard completion.
> **Exit Criteria:** Timeline renders with theme filtering. Reports work end-to-end with PDF download.

### 3.1 Drift Timeline Backend

- [x] `GET /drift/themes` — all distinct themes across user's entries
  - **File:** `backend/app/api/drift.py`
- [x] `GET /drift/timeline?theme=X` — mood scores chronologically (optional theme filter)
  - **File:** `backend/app/api/drift.py`
- [x] `/drift/search` — covered by Phase 2.5's `POST /entries/search` (reused)

### 3.2 Drift Timeline UI

- [x] Build Drift Timeline page
  - **File:** `frontend/src/pages/DriftTimeline.jsx`
  - **Deps:** `recharts` (installed)
- [x] Clickable theme pills filter timeline (active pill highlighted in violet)
- [x] Recharts AreaChart with violet gradient fill; colour-coded dots (red/amber/lime/emerald)
- [x] Custom tooltip: date, mood score, observation snippet, theme mini-pills
- [x] Average mood callout in top-right corner
- [x] Empty + loading states with graceful messaging
- [x] `/drift` route added to `App.jsx`
- [x] Journal / Drift nav toggle added to `Sidebar.jsx` bottom nav

### 3.3 Weekly Report Backend

- [x] LiteLLM chain: ingest last 7 entries → structured report
  - **Output:** `{dominant_emotion, top_themes[], emotional_arc, ai_observation}`
  - **File:** `backend/app/services/ai/report.py`
- [x] `POST /reports/generate` — synthesise AI report, save to Supabase, return
  - **File:** `backend/app/api/reports.py`
- [x] `GET /reports` — list all past reports (newest first)
- [x] `GET /reports/{id}` — get single report

### 3.4 PDF Export

- [x] ReportLab layout: title, emotion tile, theme bullets, arc paragraph, italic observation box
  - **File:** `backend/app/services/pdf.py`
- [x] `GET /reports/{id}/pdf` — runs ReportLab in thread pool, streams as `application/pdf` (triggers download)
  - **File:** `backend/app/api/reports.py`

### 3.5 Weekly Report UI

- [x] `ReportCard` — emotion badge, theme pills, arc excerpt, observation, PDF download button
  - **File:** `frontend/src/components/ReportCard.jsx`
- [x] Reports page with `Generate New Report` button, 2-column card grid, loading skeleton, empty state
  - **File:** `frontend/src/pages/Reports.jsx`
- [x] `/reports` route added to `App.jsx`
- [x] Reports tab added to Sidebar 3-column nav (Journal / Drift / Reports)
- [x] `downloadReportPdf` uses blob URL — triggers native browser download without navigation

### 3.6 Dashboard Completion

- [ ] Streak counter (consecutive days with entries)
  - **File:** `frontend/src/components/StreakCounter.jsx`
- [ ] 7-day mood sparkline
  - **File:** `frontend/src/components/MoodSparkline.jsx`
- [ ] Summary card of most recent entry's AI analysis
- [ ] Quick access links: new entry, drift timeline, generate report

---

## Phase 4: Frontend & Design

> **Goal:** UI polish, v0 components, responsive layout, motion, accessibility.
> **Exit Criteria:** App looks production-quality, consistent across pages, no placeholder UI.

### 4.1 Visual Identity

- [ ] Define color palette, typography, motion principles
  - **File:** `frontend/src/index.css` (Tailwind theme configuration)
- [ ] Import web fonts (e.g., Inter, Outfit from Google Fonts)

### 4.2 Component Design

- [ ] Design and integrate: auth pages (login/signup)
- [ ] Design and integrate: journal editor layout with insight panel
- [ ] Design and integrate: Drift Timeline page
- [ ] Design and integrate: Weekly Report card
- [ ] Design and integrate: Dashboard layout

### 4.3 Responsive Layout

- [ ] Ensure all pages work on desktop (primary) and tablet screens
- [ ] Sidebar collapses cleanly on smaller viewports

### 4.4 Motion & Transitions

- [ ] Subtle breathing animations on insight cards
- [ ] Chart animate-in on Drift Timeline
- [ ] Smooth page transitions
  - **Deps:** Consider `framer-motion`

### 4.5 Empty States & Edge Cases

- [ ] Empty state: no entries yet
- [ ] Empty state: no themes detected
- [ ] Empty state: report not yet generated
- [ ] Minimum word count prompt for short entries (<50 words)

### 4.6 Accessibility

- [ ] Keyboard navigation on all interactive elements
- [ ] Sufficient color contrast (WCAG AA)
- [ ] Focus states on buttons, links, and form fields

---

## Phase 5: Deployment & QA

> **Goal:** Ship to Vercel + Render, smoke test, README.
> **Exit Criteria:** Full app live on production URLs, all features pass smoke testing.

### 5.1 Frontend Deployment

- [ ] Push frontend to GitHub
- [ ] Connect repo to Vercel
- [ ] Configure environment variables (Supabase URL, anon key)
  - **File:** `frontend/.env.production`

### 5.2 Backend Deployment

- [ ] Push backend to GitHub
- [ ] Connect repo to Render
- [ ] Configure environment variables (Supabase service key, Gemini API key)
- [ ] Verify cold start behavior and add loading indicator

### 5.3 Environment Configuration

- [ ] Separate `.env` for development and production
- [ ] Verify no API keys committed to version control
  - **File:** `.gitignore`

### 5.4 Smoke Testing

- [ ] Test full user flow: sign up → write entry → view insights → drift timeline → generate report → download PDF
- [ ] Verify AI analysis completes within 5 seconds
- [ ] Verify page load < 2 seconds
- [ ] Verify Drift Timeline chart renders within 1 second

### 5.5 Bug Fixes

- [ ] Address any issues found during smoke testing

### 5.6 README & Documentation

- [ ] Write project README with setup instructions, architecture overview, and screenshots
  - **File:** `README.md`
