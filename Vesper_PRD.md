# Vesper — Product Requirements Document

> *"Your mind is changing. Watch it happen."*

**Version:** 1.0  
**Date:** February 23, 2026  
**Status:** Draft  
**Author:** Vesper Team  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Success Metrics](#3-goals--success-metrics)
4. [Target Users](#4-target-users)
5. [Tech Stack](#5-tech-stack)
6. [Features & Requirements](#6-features--requirements)
7. [User Stories](#7-user-stories)
8. [System Architecture](#8-system-architecture)
9. [Data Models](#9-data-models)
10. [API Endpoints](#10-api-endpoints)
11. [Non-Functional Requirements](#11-non-functional-requirements)
12. [Out of Scope](#12-out-of-scope)
13. [Timeline & Milestones](#13-timeline--milestones)
14. [Risks & Mitigations](#14-risks--mitigations)
15. [Open Questions](#15-open-questions)

---

## 1. Executive Summary

Vesper is an AI-powered personal journaling web application that does something no existing journaling tool does: it tracks **how your thinking, beliefs, and emotional patterns evolve over time** — not just what you felt on a given day.

Named after the evening star — the moment of quiet reflection at the end of the day — Vesper is built for people who want their journal to give something back. Users write daily entries. The AI analyzes each one in real time for mood, recurring themes, and cognitive distortions (using CBT frameworks). Over time, the platform builds a semantic picture of the user's mental landscape and surfaces insights like: *"Three weeks ago you were anxious about your career. Today you sound quietly confident. Here's what shifted."*

The core differentiator is the **Drift Timeline** — a visual, interactive feature that lets users pick any topic and watch their emotional relationship with it change over weeks and months.

---

## 2. Problem Statement

### The Gap in Existing Tools

Current journaling apps fall into two categories:

**Simple journaling apps** (Day One, Daylio, Reflectly) — They let you write and track daily mood. They take snapshots. They don't connect dots over time. There's no evolution layer.

**AI writing tools** (Notion AI, ChatGPT journaling prompts) — They help you write better or summarize entries. But they have no memory across sessions, no longitudinal tracking, and no psychological framework applied to your own writing.

### The Core Problem

People journal to understand themselves. But without a way to see how their perspective evolves, journaling becomes a private archive rather than a tool for self-awareness. Most people give up journaling within weeks because they don't see tangible value from the habit.

**Vesper solves this** by turning journaling from passive documentation into active self-tracking — with AI as the lens.

---

## 3. Goals & Success Metrics

### Product Goals

- Build a fully functional journaling platform with AI analysis in 2–3 days
- Deliver a feature (Drift Timeline) that does not exist in any competing free tool
- Create a UI polished enough to include in a developer portfolio

### Success Metrics

| Metric | Target |
|---|---|
| Core user flow works end to end | 100% |
| AI analysis returns structured output reliably | >95% success rate |
| Drift Timeline renders correctly for 3+ entries | Yes |
| Weekly Report generates without errors | Yes |
| Auth, data isolation, and delete-all work | Yes |
| Page load time (frontend) | < 2 seconds |
| AI analysis response time per entry | < 5 seconds |

---

## 4. Target Users

### Primary User

**Reflective individuals aged 18–35** who already journal or want to start, are curious about self-improvement, and are comfortable with modern web tools. They want more than a blank text box — they want their journal to give something back.

### Secondary User

**Developers and builders** evaluating Vesper as a portfolio project reference or as a base for a mental wellness product.

### User Persona

> **Maya, 27, Product Designer**
> Maya journals 4–5 times a week. She uses Notion for everything but finds its AI journaling plugins shallow. She wants to understand patterns in her anxiety and motivation but doesn't want a therapy app. She'd use Vesper because it respects her intelligence, shows her data about herself, feels personal and beautiful, and doesn't preach.

---

## 5. Tech Stack

### Overview

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | React 19 + Vite + Tailwind CSS v4 | Latest stable, fastest build tooling |
| UI Generation | v0 by Vercel | Generates production-quality component designs |
| Backend | FastAPI (Python 3.12) | Async, AI-native, auto-docs |
| LLM | Google Gemini 2.5 Pro | Most capable free-tier model, strong structured output |
| AI Orchestration | LangChain | Prompt chaining, structured output parsing |
| Embeddings | sentence-transformers (`all-MiniLM-L6-v2`) | Local, free, no API cost |
| Vector Search | pgvector (via Supabase) | Native Postgres vector extension, free tier |
| Database | Supabase (Postgres) | Auth + DB + vector, all on free tier |
| Auth | Supabase Auth | Email/password, row-level security |
| PDF Export | ReportLab (Python) | Server-side PDF generation, open source |
| Frontend Deploy | Vercel | Free tier, auto-deploys from GitHub |
| Backend Deploy | Render | Free tier FastAPI hosting |
| Dev Assistant | Claude Code | AI pair programmer for scaffolding and debugging |

### Key Constraints

- Every tool used must have a free tier sufficient for development and demo
- No paid API calls during development or standard usage
- All user data must be isolated per account at the database level (Supabase RLS)

---

## 6. Features & Requirements

### 6.1 Authentication

| ID | Requirement | Priority |
|---|---|---|
| AUTH-01 | Users can sign up with email and password | Must Have |
| AUTH-02 | Users can log in and log out | Must Have |
| AUTH-03 | Sessions persist across browser refreshes | Must Have |
| AUTH-04 | All journal data is private and tied to the authenticated user | Must Have |
| AUTH-05 | Users can delete their entire account and all associated data | Must Have |

### 6.2 Journal Editor

| ID | Requirement | Priority |
|---|---|---|
| JRN-01 | Users can create a new journal entry with a rich text editor | Must Have |
| JRN-02 | Entries are auto-saved as the user types (debounced, every 3 seconds) | Must Have |
| JRN-03 | Each entry is timestamped automatically | Must Have |
| JRN-04 | Users can edit or delete any past entry | Must Have |
| JRN-05 | Users can view all past entries in a calendar or list view | Must Have |
| JRN-06 | Entries support plain text with basic formatting (bold, italic, line breaks) | Should Have |

### 6.3 AI Analysis Engine

This is the core intelligence layer. Every time an entry is saved, the backend runs a LangChain chain using Gemini 2.5 Pro to extract structured data from the entry text.

| ID | Requirement | Priority |
|---|---|---|
| AI-01 | Extract a mood score (1–10) from the tone of each entry | Must Have |
| AI-02 | Extract 2–3 dominant themes from each entry (e.g. "work pressure", "self-doubt") | Must Have |
| AI-03 | Detect and label cognitive distortions from the CBT framework if present (e.g. "Catastrophizing", "All-or-nothing thinking", "Mind reading") | Must Have |
| AI-04 | Generate a one-line, non-generic observation about the entry (e.g. "You seem to be processing uncertainty about a major decision") | Must Have |
| AI-05 | All AI analysis output is stored as structured JSON alongside the entry in Supabase | Must Have |
| AI-06 | AI analysis runs asynchronously — the user is not blocked from writing while it completes | Must Have |
| AI-07 | Each entry's text is converted to a vector embedding using sentence-transformers and stored in pgvector | Must Have |

**Cognitive Distortion Reference (CBT Framework)**

The AI should detect and label the following distortions when present in entry text:

- Catastrophizing — assuming the worst possible outcome
- All-or-nothing thinking — seeing things in black and white
- Mind reading — assuming you know what others think
- Overgeneralization — drawing broad conclusions from one event
- Emotional reasoning — treating feelings as facts
- Personalization — blaming yourself for things outside your control
- Filtering — focusing only on negatives while ignoring positives
- Should statements — rigid rules about how things must be

### 6.4 Entry Insight Panel

The right-side panel shown alongside the editor after an entry is analyzed.

| ID | Requirement | Priority |
|---|---|---|
| INS-01 | Display the mood score with a visual arc or bar indicator | Must Have |
| INS-02 | Display extracted themes as styled pill tags | Must Have |
| INS-03 | Display any detected cognitive distortion as a subtle labeled card | Must Have |
| INS-04 | Display the AI one-line observation in italic | Must Have |
| INS-05 | Show a loading state while AI analysis is running | Must Have |
| INS-06 | If no distortion is detected, display a neutral "No patterns flagged" state | Must Have |

### 6.5 Drift Timeline (Signature Feature)

| ID | Requirement | Priority |
|---|---|---|
| DFT-01 | User can navigate to a dedicated Drift Timeline page | Must Have |
| DFT-02 | The page displays a list of all recurring themes detected across all entries | Must Have |
| DFT-03 | User can click a theme pill to filter the timeline to that topic | Must Have |
| DFT-04 | A line chart renders showing mood score over time for the selected theme | Must Have |
| DFT-05 | The chart line uses a color gradient (red → yellow → green) based on mood value | Must Have |
| DFT-06 | Hovering over any data point on the chart shows a tooltip with the date and a snippet of the entry | Must Have |
| DFT-07 | The chart animates in smoothly on load | Should Have |
| DFT-08 | User can view a semantic similarity search: "show me all entries related to X" using pgvector | Should Have |

### 6.6 Weekly Mind Map Report

| ID | Requirement | Priority |
|---|---|---|
| RPT-01 | A "Generate Weekly Report" button is accessible from the dashboard | Must Have |
| RPT-02 | Clicking the button sends the last 7 entries to Gemini and returns a structured report | Must Have |
| RPT-03 | Report includes: dominant emotion of the week, top 3 recurring themes, emotional arc description, and one honest AI observation | Must Have |
| RPT-04 | Report is displayed as a beautiful in-app card | Must Have |
| RPT-05 | User can export the report as a PDF using ReportLab | Should Have |
| RPT-06 | Reports are saved and accessible from a reports history page | Should Have |

### 6.7 Dashboard

| ID | Requirement | Priority |
|---|---|---|
| DSH-01 | Show a streak counter (consecutive days with entries) | Must Have |
| DSH-02 | Show a mood trend sparkline for the last 7 days | Must Have |
| DSH-03 | Show a quick summary of the most recent entry's AI analysis | Must Have |
| DSH-04 | Quick access to write a new entry, view the Drift Timeline, and generate a Weekly Report | Must Have |

---

## 7. User Stories

**As a user, I want to** write a journal entry and immediately see AI-generated insights about my mood and thinking patterns, **so that** I get value from journaling without having to analyze my writing myself.

**As a user, I want to** see how my feelings about a specific topic (like my job) have changed over the past month, **so that** I can understand whether my mindset is improving or worsening.

**As a user, I want to** receive a weekly summary of my emotional arc, **so that** I can see my mental landscape at a glance without reading 7 entries.

**As a user, I want to** understand if I'm engaging in unhealthy thinking patterns, **so that** I can become aware of them without being lectured or patronized.

**As a user, I want to** know my data is private and deletable, **so that** I feel safe writing honestly.

---

## 8. System Architecture

```
┌─────────────────────────────────────────────┐
│                  FRONTEND                    │
│         React 19 + Vite + Tailwind v4        │
│              (Deployed: Vercel)              │
└──────────────────┬──────────────────────────┘
                   │ REST API (HTTPS)
┌──────────────────▼──────────────────────────┐
│                  BACKEND                     │
│             FastAPI (Python 3.12)            │
│              (Deployed: Render)              │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │         LangChain Orchestration       │    │
│  │  ┌────────────┐  ┌────────────────┐  │    │
│  │  │ Gemini 2.5 │  │sentence-transf │  │    │
│  │  │    Pro     │  │  (local embed) │  │    │
│  │  └────────────┘  └────────────────┘  │    │
│  └──────────────────────────────────────┘    │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│                 SUPABASE                     │
│  ┌──────────┐ ┌──────────┐ ┌─────────────┐  │
│  │ Postgres │ │  Auth    │ │  pgvector   │  │
│  │   DB     │ │          │ │ (embeddings)│  │
│  └──────────┘ └──────────┘ └─────────────┘  │
└─────────────────────────────────────────────┘
```

### Request Flow (Entry Submission)

1. User writes entry in React editor
2. Auto-save triggers a POST to `/entries` on FastAPI
3. FastAPI stores raw entry in Supabase, returns `entry_id`
4. FastAPI triggers async AI analysis task:
   - LangChain chain sends entry text to Gemini 2.5 Pro
   - Returns structured JSON: `{mood_score, themes[], distortions[], observation}`
   - sentence-transformers generates embedding vector
5. AI results and embedding are stored back to Supabase
6. Frontend polls or receives a response and renders the insight panel

---

## 9. Data Models

### `users` (managed by Supabase Auth)
```
id          uuid (primary key)
email       text
created_at  timestamp
```

### `entries`
```
id              uuid (primary key)
user_id         uuid (foreign key → users.id)
content         text
created_at      timestamp
updated_at      timestamp
mood_score      float (1.0 – 10.0, nullable until analyzed)
themes          text[] (array of theme strings)
distortions     jsonb (array of {label, description})
observation     text
embedding       vector(384) (sentence-transformers output)
analyzed        boolean (default: false)
```

### `reports`
```
id                  uuid (primary key)
user_id             uuid (foreign key → users.id)
created_at          timestamp
week_start          date
dominant_emotion    text
top_themes          text[]
emotional_arc       text
ai_observation      text
pdf_url             text (nullable)
```

---

## 10. API Endpoints

### Auth
Handled entirely by Supabase client SDK. No custom auth endpoints required.

### Entries
```
POST   /entries                  Create new entry
GET    /entries                  List all entries for current user
GET    /entries/{id}             Get single entry with full AI analysis
PUT    /entries/{id}             Update entry content
DELETE /entries/{id}             Delete entry
GET    /entries/{id}/analysis    Get AI analysis status and results
```

### Drift Timeline
```
GET    /drift/themes             Get all themes across user's entries
GET    /drift/timeline?theme=X   Get mood timeline for a specific theme
POST   /drift/search             Semantic search via pgvector (body: {query})
```

### Reports
```
POST   /reports/generate         Generate weekly report for last 7 entries
GET    /reports                  List all past reports
GET    /reports/{id}             Get single report
GET    /reports/{id}/pdf         Download report as PDF
```

---

## 11. Non-Functional Requirements

### Performance
- Frontend initial load < 2 seconds on a standard connection
- AI analysis completes and reflects in UI within 5 seconds of saving
- Drift Timeline chart renders in < 1 second with up to 100 entries

### Security
- All API requests require a valid Supabase JWT
- Row-level security (RLS) enforced at the Supabase level — users can never access another user's data
- No journal content is logged server-side beyond what's stored in the user's own Supabase rows

### Reliability
- If AI analysis fails (e.g. Gemini API timeout), the entry is still saved. Analysis is retried once automatically. A fallback "Analysis unavailable" state is shown in the UI.
- Auto-save retries up to 3 times on network failure with exponential backoff

### Scalability (for future consideration)
- Supabase free tier supports up to 500MB database storage, sufficient for development and demo purposes
- Architecture is stateless on the backend — Render can scale horizontally if needed

---

## 12. Out of Scope (v1.0)

The following features are explicitly excluded from the initial build to keep the timeline achievable. They can be added in future iterations.

- Mobile app (iOS / Android)
- Social or sharing features
- Voice-to-journal (Web Speech API integration)
- "Ask your past self" RAG chat interface
- Collaborative or therapist-facing views
- Push or email notifications
- Third-party OAuth (Google, Apple login)
- Dark/light mode toggle
- Localization / multi-language support
- End-to-end encryption of entry content

---

## 13. Timeline & Milestones

### Phase Overview

| Phase | Name | Focus | Exit Criteria |
|---|---|---|---|
| Phase 1 | Foundation | Project setup, auth, database, and core journal CRUD | User can sign up, write, edit, and delete entries |
| Phase 2 | Intelligence | AI analysis engine, embeddings, insight panel | Every saved entry returns structured AI insights |
| Phase 3 | Differentiation | Drift Timeline, Weekly Report, PDF export | Timeline and reports work end-to-end with real data |
| Phase 4 | Frontend & Design | v0 UI design, polish, responsive layout | App looks production-quality across screen sizes |
| Phase 5 | Deployment & QA | Deploy to Vercel + Render, smoke testing, bug fixes | Full user flow works on live production URLs |

---

### Phase 1 — Foundation

**Objective:** Establish the full project scaffold and deliver a working journaling app with authentication and entry management. No AI yet — just the skeleton everything else will be built on.

**Scope**

| Task | Details |
|---|---|
| Project setup | Create React 19 + Vite app, configure Tailwind v4, initialise FastAPI with Python 3.12, connect both via REST |
| Supabase setup | Create Supabase project, define `entries` and `reports` tables, enable pgvector extension, configure Row Level Security (RLS) policies |
| Auth flow | Sign up, login, logout, and session persistence using Supabase Auth client SDK in React |
| Journal editor | Main editor component with rich text input and auto-save (debounced every 3 seconds) |
| Entry CRUD | POST, GET, PUT, DELETE endpoints in FastAPI wired to Supabase |
| Entry list / calendar view | React page listing all past entries, sortable by date |
| Basic dashboard shell | Placeholder dashboard with navigation to Editor, Timeline, and Reports |

**Exit Criteria:** A user can sign up, log in, write journal entries, view past entries, edit them, and delete them. Sessions persist across browser refresh. All data is correctly scoped to the logged-in user via RLS.

---

### Phase 2 — Intelligence

**Objective:** Wire in the AI analysis engine so that every saved entry is automatically analyzed and insights are stored and surfaced in the UI.

**Scope**

| Task | Details |
|---|---|
| LangChain setup | Install LangChain + Gemini 2.5 Pro integration, configure API keys, test structured output parsing |
| Analysis prompt chain | LangChain chain that takes raw entry text and returns validated JSON: `{mood_score, themes[], distortions[], observation}` |
| Async analysis trigger | After entry save, FastAPI kicks off background analysis task using `asyncio` so the user isn't blocked |
| Store analysis results | Update the entry row in Supabase with analysis JSON once the chain completes |
| sentence-transformers setup | Install library locally, load `all-MiniLM-L6-v2` model on startup, generate 384-dim embedding per entry |
| Store embeddings | Write embedding vector to `embedding` column in Supabase via pgvector |
| Insight panel UI | Right-side panel in React: mood arc indicator, theme pills, distortion card, one-line observation in italic |
| Loading & error states | Frontend polls the analysis status endpoint and shows a loading skeleton until results arrive; surfaces a fallback state if analysis fails |

**Exit Criteria:** User writes an entry, waits approximately 3–5 seconds, and sees a fully populated AI insight panel with mood score, themes, any detected cognitive distortion flags, and an AI observation. If Gemini fails, the entry is still saved and a "Analysis unavailable" state is shown.

---

### Phase 3 — Differentiation

**Objective:** Build the features that make Vesper genuinely unique — the Drift Timeline and the Weekly Mind Map Report.

**Scope**

| Task | Details |
|---|---|
| Drift Timeline backend | `/drift/themes` and `/drift/timeline` endpoints; filter entries by theme, return mood scores over time |
| Drift Timeline UI | Recharts line chart with gradient color (red → yellow → green by mood value), clickable theme pills, tooltip with date + entry snippet on hover, smooth load animation |
| Semantic search | pgvector similarity search endpoint + UI input: "show me all entries related to X" using cosine distance on embeddings |
| Weekly Report backend | LangChain chain that ingests the last 7 entries and returns a structured report: dominant emotion, top 3 themes, emotional arc narrative, one honest AI observation |
| Weekly Report UI | In-app report card displaying all report fields in a visually distinct, screenshot-worthy layout |
| PDF export | ReportLab script generates a formatted PDF from the report data, served via `/reports/{id}/pdf` endpoint |
| Dashboard completion | Streak counter (consecutive days with entries), 7-day mood sparkline, summary card of most recent entry's AI analysis |

**Exit Criteria:** User can navigate to the Drift Timeline, click a theme, and see a correctly rendered and animated mood chart. User can generate a Weekly Report, view it in-app, and download it as a PDF.

---

### Phase 4 — Frontend & Design

**Objective:** Apply the v0-generated UI designs and polish the full app into a production-quality, visually compelling experience. This phase is intentionally separate to allow design research and iteration without blocking the feature build.

**Scope**

| Task | Details |
|---|---|
| Design research | Define Vesper's visual identity: color palette, typography, motion principles |
| v0 component generation | Use v0 to generate: landing/auth page, journal editor layout, insight panel, Drift Timeline page, Weekly Report card |
| Component integration | Drop v0 components into the Vite project, wire up with real data, resolve any Tailwind v4 class conflicts |
| Responsive layout | Ensure all pages work cleanly on desktop (primary) and tablet screen sizes |
| Motion & transitions | Subtle breathing animations on insight cards, chart animate-in, smooth page transitions |
| Empty states | Thoughtful empty states for: no entries yet, no themes detected, report not yet generated |
| Accessibility baseline | Keyboard navigation, sufficient color contrast, focus states on interactive elements |

**Exit Criteria:** The app looks and feels like a real product. All v0 components are integrated with live data. No placeholder UI remains. The design is consistent across all pages.

---

### Phase 5 — Deployment & QA

**Objective:** Ship the app to production and verify the full user flow works end-to-end on live URLs.

**Scope**

| Task | Details |
|---|---|
| Frontend deployment | Push to GitHub, connect repo to Vercel, configure environment variables (Supabase URL, anon key) |
| Backend deployment | Push to GitHub, connect repo to Render, configure environment variables (Supabase service key, Gemini API key), verify cold start behavior |
| Environment configuration | Separate `.env` files for development and production; no API keys committed to version control |
| Smoke testing | Test full user flow on production URLs: sign up → write entry → view insights → drift timeline → generate report → download PDF |
| Bug fixes | Address any issues found during smoke testing |
| Performance check | Verify page load < 2s, AI analysis < 5s, Timeline chart renders within 1s |
| README | Write a clear project README with setup instructions, architecture overview, and screenshots for the portfolio |

**Exit Criteria:** The full app is live and functional on production URLs. All core features pass smoke testing. The GitHub repo is clean, documented, and portfolio-ready.

---

## 14. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Gemini API rate limits hit during testing | Medium | Medium | Use a caching layer for repeated test entries; batch non-critical calls |
| AI analysis returns malformed JSON | Medium | High | Wrap Gemini output in a LangChain output parser with strict schema validation; catch exceptions and store a fallback |
| Render backend cold start delay | High | Low | Show a loading indicator on first API call; document the cold start behavior |
| sentence-transformers model too slow on Render free tier | Medium | Medium | Load model once on startup, not per request; cache in memory |
| pgvector extension not enabled on Supabase | Low | High | Enable via Supabase SQL editor on day 1: `create extension vector;` |
| v0-generated components don't match Tailwind v4 class names | Low | Medium | Test each v0 component in isolation before integrating |

---

## 15. Open Questions

- **Q: Should cognitive distortion labels link to educational descriptions?** A tooltip explaining what "Catastrophizing" means could add value, but risks making the app feel like a therapy tool. Decision deferred to frontend phase.

- **Q: What is the right debounce delay for auto-save?** 3 seconds is the current assumption. This may feel too slow for fast typists or too fast for slow ones. To be validated during Day 1 build.

- **Q: How do we handle entries with fewer than 50 words for AI analysis?** Very short entries may not yield reliable mood or theme extraction. A minimum word count check with a "Write a bit more for AI insights" prompt is a candidate solution.

- **Q: Should the Weekly Report use exactly 7 entries or the last 7 calendar days?** If a user skips days, "last 7 entries" gives better coverage. "Last 7 calendar days" is more intuitive. Default to last 7 entries, with a note in the report showing the date range covered.

---

*Vesper PRD v1.0 — End of Document*  
*Named after the evening star — the moment of quiet reflection at the end of the day.*
