# Vesper — Production Smoke Test Checklist

Run these 5 tests on the live production URLs immediately after deployment to verify the full stack is connected and functional.

**Backend URL:** `https://vesper-api.onrender.com` (replace with your Render URL)
**Frontend URL:** `https://vesper.vercel.app` (replace with your Vercel URL)

---

## Step 1 — Health Check (Backend)

**What:** Confirm the FastAPI server is running and reachable.

```bash
curl https://vesper-api.onrender.com/health
```

**Expected response:**

```json
{"status": "ok", "service": "vesper-api"}
```

✅ **Pass:** Response is `200 OK` with the above body.
❌ **Fail:** 502/503 → check Render logs; the service may still be cold-starting (free tier sleeps after inactivity).

---

## Step 2 — Auth Flow (Frontend)

**What:** Confirm Supabase auth is wired up and sign-up works end-to-end.

1. Open `https://vesper.vercel.app` in an incognito window.
2. Click **Get started** on the landing page.
3. Enter a test email and password → click **Create account**.
4. You should land on the Dashboard with an empty entry list.

✅ **Pass:** Dashboard loads, sidebar shows "No entries yet."
❌ **Fail:** "Network error" → check `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` in Vercel env vars.

---

## Step 3 — Journal Entry + AI Analysis (Core Feature)

**What:** Confirm an entry saves, auto-triggers AI analysis, and the Insight Panel populates.

1. Click **New entry** in the sidebar.
2. Type at least 30 words of text (any content).
3. Click **Save**.
4. Wait 5–10 seconds.
5. The right-hand **Insight Panel** should show: a mood arc score, at least one theme chip, and an AI observation.

✅ **Pass:** Insight Panel shows mood score + themes.
❌ **Fail:** Panel stays on "Analysing…" → check Render logs for LiteLLM errors; verify `LITELLM_API_KEY` and `LITELLM_BASE_URL` are set correctly on Render.

---

## Step 4 — Semantic Search (Embeddings)

**What:** Confirm pgvector embeddings are being generated and similarity search returns results.

1. Create at least 2 entries with different emotional content (e.g. one anxious, one hopeful).
2. In the sidebar search box, type `anxious` or a feeling you wrote about.
3. Results should appear with **similarity percentage badges** (e.g. `74%`).

✅ **Pass:** Matching entries appear with % badges, ranked by relevance.
❌ **Fail:** No results / error → check that `match_entries` RPC exists in Supabase and that the `text-embedding-3-small` model is accessible via the LiteLLM proxy.

---

## Step 5 — Weekly Report Generation + PDF Download

**What:** Confirm the AI report pipeline and PDF export work end-to-end.

1. Navigate to **Reports** (sidebar bottom-left).
2. Click **Generate Report**.
3. Wait 10–20 seconds (LLM call + PDF generation).
4. A report card should appear showing a dominant emotion and narrative summary.
5. Click **Download PDF** — a `.pdf` file should download to your machine.

✅ **Pass:** Report card appears and PDF downloads correctly.
❌ **Fail:** "Report generation failed" → check Render logs for timeout or LLM errors. PDF not downloading → check ReportLab is in `requirements.txt` and Render build succeeded.

---

## All Tests Pass?

🎉 **Vesper is live and production-ready.**

Update `status.md` to mark Phase 5 complete and note the deployment URLs.
