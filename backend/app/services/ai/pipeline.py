"""
app/services/ai/pipeline.py — Async AI analysis background task.

run_analysis_pipeline(entry_id, content, supabase_token) is called by
FastAPI's BackgroundTasks immediately after an entry is saved. It:

  1. Runs the LangChain/Gemini analysis chain (async)
  2. Generates a sentence-transformers embedding (sync, in thread pool)
  3. Updates the entry row in Supabase with results + analyzed = true

On any failure:
  - Sets analyzed = false and observation = "Analysis unavailable"
  - Logs the error — entry is always safe in the DB.
"""

import asyncio
import json
import logging
from uuid import UUID

from app.core.supabase import get_supabase
from app.services.ai.analyzer import AnalysisResult, analyse_entry, embed_text

logger = logging.getLogger(__name__)

# Minimum word count for meaningful AI analysis (PRD open question)
MIN_WORDS = 20


async def run_analysis_pipeline(
    entry_id: UUID,
    content: str,
    supabase_token: str,
) -> None:
    """
    Background task: analyse `content`, store results back to the entry row.

    Uses the caller's JWT so Supabase RLS lets us UPDATE the correct row.
    FastAPI runs this in the background — the HTTP response has already been
    sent to the frontend by the time this executes.
    """
    entry_id_str = str(entry_id)
    sb = get_supabase(access_token=supabase_token)

    # Guard: skip very short entries
    word_count = len(content.strip().split())
    if word_count < MIN_WORDS:
        logger.info("Entry %s too short (%d words) — skipping analysis.", entry_id_str, word_count)
        sb.table("entries").update({
            "analyzed": False,
            "observation": f"Write at least {MIN_WORDS} words for AI insights.",
        }).eq("id", entry_id_str).execute()
        return

    # ---- 1. Run LLM analysis + embedding concurrently (both are async I/O calls) ----
    analysis: AnalysisResult | None = None
    embedding: list[float] | None = None
    error_msg: str | None = None

    try:
        analysis, embedding = await asyncio.gather(
            analyse_entry(content),
            embed_text(content),
        )

    except Exception as exc:
        logger.error("AI analysis failed for entry %s: %s", entry_id_str, exc, exc_info=True)
        error_msg = str(exc)

    # ---- 2. Build the DB update payload ----
    if analysis and embedding:
        # Success path — store full analysis results
        update_payload = {
            "analyzed": True,
            "mood_score": round(analysis.mood_score, 1),
            "themes": analysis.themes,
            # Store distortions as list of {label} dicts to match jsonb schema
            "distortions": [{"label": d} for d in analysis.distortions],
            "observation": analysis.observation,
            "embedding": embedding,   # pgvector accepts a plain list of floats
        }
        logger.info(
            "Entry %s analysed — mood=%.1f themes=%s distortions=%s",
            entry_id_str,
            analysis.mood_score,
            analysis.themes,
            analysis.distortions,
        )
    else:
        # Failure path — mark as unanalyzed with a user-facing fallback
        update_payload = {
            "analyzed": False,
            "observation": "Analysis unavailable — please try again later.",
        }
        logger.warning("Stored fallback state for entry %s (error: %s)", entry_id_str, error_msg)

    # ---- 3. Write back to Supabase ----
    try:
        sb.table("entries").update(update_payload).eq("id", entry_id_str).execute()
    except Exception as db_exc:
        logger.error(
            "Failed to write analysis results to DB for entry %s: %s",
            entry_id_str, db_exc, exc_info=True
        )
