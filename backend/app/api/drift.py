"""
app/api/drift.py — Drift Timeline analytics endpoints.

Routes:
  GET /drift/themes          Distinct themes across the user's analyzed entries
  GET /drift/timeline        Mood-score timeline, oldest→newest (optional ?theme filter)
"""

from fastapi import APIRouter, Depends, Query

from app.core.auth import get_token
from app.core.supabase import get_supabase

router = APIRouter(prefix="/drift", tags=["drift"])


def _supabase(token: str = Depends(get_token)):
    return get_supabase(access_token=token)


# ---------------------------------------------------------------------------
# GET /drift/themes
# ---------------------------------------------------------------------------

@router.get("/themes")
async def get_themes(sb=Depends(_supabase)):
    """
    Return a sorted list of all distinct themes found across the
    authenticated user's analyzed journal entries.

    themes is stored as text[] — we fetch and flatten in Python to avoid
    needing an extra RPC / pgvector function.
    """
    result = (
        sb.table("entries")
        .select("themes")
        .eq("analyzed", True)
        .not_.is_("themes", "null")
        .execute()
    )

    themes: set[str] = set()
    for row in result.data or []:
        for t in (row.get("themes") or []):
            cleaned = t.strip()
            if cleaned:
                themes.add(cleaned)

    return sorted(themes)


# ---------------------------------------------------------------------------
# GET /drift/timeline
# ---------------------------------------------------------------------------

@router.get("/timeline")
async def get_timeline(
    theme: str | None = Query(default=None, description="Filter by theme substring"),
    sb=Depends(_supabase),
):
    """
    Return lightweight analyzed entries ordered chronologically (oldest first)
    so they plot left→right on a mood chart.

    Optional ?theme=X parameter narrows results to entries whose themes array
    contains a case-insensitive match for X.
    """
    result = (
        sb.table("entries")
        .select("id, created_at, mood_score, themes, observation")
        .eq("analyzed", True)
        .not_.is_("mood_score", "null")
        .order("created_at", desc=False)   # ascending — oldest first
        .execute()
    )

    data = result.data or []

    if theme:
        term = theme.strip().lower()
        data = [
            row for row in data
            if any(term in t.lower() for t in (row.get("themes") or []))
        ]

    return data
