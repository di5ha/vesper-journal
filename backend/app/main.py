"""
Vesper — AI-Powered Personal Journaling Backend
FastAPI application entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import dashboard, drift, entries, reports

app = FastAPI(
    title="Vesper API",
    description=(
        "AI-powered journaling backend — mood tracking, cognitive analysis, and drift timeline.\n\n"
        "**Testing authenticated endpoints in Swagger UI:**\n"
        "1. Open `localhost:5173`, open Chrome DevTools → Console\n"
        "2. Run: `JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token')))).access_token`\n"
        "3. Copy the `eyJ...` token → click **Authorize 🔒** above → paste → Authorize"
    ),
    version="0.1.0",
)

# ---------------------------------------------------------------------------
# CORS — allow the Vite dev server (and future production domain)
# ---------------------------------------------------------------------------
import os

_raw = os.getenv("FRONTEND_URL", "http://localhost:5173")
_allowed_origins = [o.strip() for o in _raw.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(entries.router)    # /entries
app.include_router(drift.router)      # /drift
app.include_router(reports.router)    # /reports
app.include_router(dashboard.router)  # /dashboard


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health", tags=["meta"])
async def health_check():
    return {"status": "ok", "service": "vesper-api"}
