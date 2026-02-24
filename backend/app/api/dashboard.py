"""
app/api/dashboard.py — Lightweight dashboard statistics endpoint.

GET /dashboard/stats returns:
  current_streak  — consecutive days with ≥1 entry (checking up through yesterday)
  mood_sparkline  — last 7 days' average mood scores (one per day, null if no entry that day)
  latest_analysis — full AI analysis of the most recent analyzed entry
"""

from datetime import date, timedelta

from fastapi import APIRouter, Depends

from app.core.auth import get_token
from app.core.supabase import get_supabase

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _supabase(token: str = Depends(get_token)):
    return get_supabase(access_token=token)


@router.get("/stats")
async def get_stats(sb=Depends(_supabase)):
    """
    Calculate dashboard stats in a single request:
    streak, 7-day sparkline, and latest AI analysis.
    """

    # ── 1. Fetch all entries (just dates + mood + analysis fields) ───────
    result = (
        sb.table("entries")
        .select("created_at, mood_score, themes, distortions, observation, analyzed")
        .order("created_at", desc=True)
        .execute()
    )
    entries = result.data or []

    # ── 2. Current streak —————————————————————————————————————————————————
    # Build set of dates that have entries
    entry_dates: set[date] = set()
    for e in entries:
        entry_dates.add(date.fromisoformat(e["created_at"][:10]))

    streak = 0
    check = date.today()
    # If today has an entry, count it; otherwise start checking from yesterday
    if check not in entry_dates:
        check = check - timedelta(days=1)
    while check in entry_dates:
        streak += 1
        check -= timedelta(days=1)

    # ── 3. 7-day mood sparkline ———————————————————————————————————————————
    today = date.today()
    sparkline: list[dict] = []
    for i in range(6, -1, -1):   # 6 days ago → today
        d = today - timedelta(days=i)
        day_moods = [
            e["mood_score"]
            for e in entries
            if e["created_at"][:10] == d.isoformat()
            and e.get("mood_score") is not None
        ]
        avg = round(sum(day_moods) / len(day_moods), 1) if day_moods else None
        sparkline.append({
            "date": d.isoformat(),
            "mood": avg,
        })

    # ── 4. Latest analysis ————————————————————————————————————————————————
    latest = None
    for e in entries:
        if e.get("analyzed"):
            latest = {
                "mood_score":  e.get("mood_score"),
                "themes":      e.get("themes"),
                "distortions": e.get("distortions"),
                "observation": e.get("observation"),
            }
            break     # entries are already sorted newest-first

    return {
        "current_streak":  streak,
        "mood_sparkline":  sparkline,
        "latest_analysis": latest,
    }
