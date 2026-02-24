"""
app/api/reports.py — Weekly report CRUD + PDF export.

Routes:
  POST /reports/generate     Fetch last 7 entries, synthesise AI report, save
  GET  /reports              List all reports (newest first)
  GET  /reports/{id}         Get a single report
  GET  /reports/{id}/pdf     Generate and stream a PDF in-memory
"""

import asyncio
import logging
from datetime import date, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse

from app.core.auth import get_current_user_id, get_token
from app.core.supabase import get_supabase
from app.services.ai.report import synthesise_report
from app.services.pdf import generate_report_pdf

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reports", tags=["reports"])


def _supabase(token: str = Depends(get_token)):
    return get_supabase(access_token=token)


def _not_found(report_id: UUID) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Report {report_id} not found.",
    )


# ---------------------------------------------------------------------------
# POST /reports/generate
# ---------------------------------------------------------------------------

@router.post("/generate", status_code=status.HTTP_201_CREATED)
async def generate_report(
    sb=Depends(_supabase),
    token: str = Depends(get_token),
    user_id: UUID = Depends(get_current_user_id),
):
    """
    Fetch the 7 most recent analyzed entries, synthesise an AI weekly report,
    save it to the reports table, and return the saved record.
    """
    # Fetch last 7 analyzed entries (newest first, trim to 7)
    result = (
        sb.table("entries")
        .select("id, content, created_at, mood_score, themes, observation")
        .eq("analyzed", True)
        .not_.is_("mood_score", "null")
        .order("created_at", desc=True)
        .limit(7)
        .execute()
    )

    entries = result.data or []
    if not entries:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No analyzed entries found. Write and save some journal entries first.",
        )

    # AI synthesis (in event loop — it's async)
    report_data = await synthesise_report(entries)

    # Determine week_start (most recent Monday)
    today = date.today()
    week_start = today - timedelta(days=today.weekday())

    # Save to Supabase
    insert_result = (
        sb.table("reports")
        .insert({
            "user_id":          str(user_id),
            "week_start":       week_start.isoformat(),
            "dominant_emotion": report_data["dominant_emotion"],
            "top_themes":       report_data["top_themes"],
            "emotional_arc":    report_data["emotional_arc"],
            "ai_observation":   report_data["ai_observation"],
        })
        .execute()
    )

    if not insert_result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save report.",
        )

    return insert_result.data[0]


# ---------------------------------------------------------------------------
# GET /reports
# ---------------------------------------------------------------------------

@router.get("")
async def list_reports(sb=Depends(_supabase)):
    """Return all past reports for the authenticated user (newest first)."""
    result = (
        sb.table("reports")
        .select("id, created_at, week_start, dominant_emotion, top_themes, emotional_arc, ai_observation")
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


# ---------------------------------------------------------------------------
# GET /reports/{id}
# ---------------------------------------------------------------------------

@router.get("/{report_id}")
async def get_report(report_id: UUID, sb=Depends(_supabase)):
    """Fetch a single report."""
    result = (
        sb.table("reports")
        .select("*")
        .eq("id", str(report_id))
        .limit(1)
        .execute()
    )
    if not result.data:
        raise _not_found(report_id)
    return result.data[0]


# ---------------------------------------------------------------------------
# GET /reports/{id}/pdf
# ---------------------------------------------------------------------------

@router.get("/{report_id}/pdf")
async def download_report_pdf(report_id: UUID, sb=Depends(_supabase)):
    """
    Dynamically generate a PDF from the report data and stream it.
    The client receives Content-Disposition: attachment which triggers a download.
    """
    result = (
        sb.table("reports")
        .select("*")
        .eq("id", str(report_id))
        .limit(1)
        .execute()
    )
    if not result.data:
        raise _not_found(report_id)

    report = result.data[0]

    # PDF generation is CPU-bound — run in thread pool
    loop = asyncio.get_running_loop()
    pdf_bytes = await loop.run_in_executor(None, generate_report_pdf, report)

    week = report.get("week_start", "report").replace("-", "")
    filename = f"vesper_report_{week}.pdf"

    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
