"""
app/api/entries.py — Journal entry CRUD endpoints.

Every endpoint:
  1. Extracts the JWT via get_token() dependency
  2. Creates a user-scoped Supabase client (RLS applies automatically)
  3. Operates only on that user's rows

Routes:
  POST   /entries          Create entry
  GET    /entries          List entries (newest first)
  GET    /entries/{id}     Get single entry
  GET    /entries/{id}/analysis  Get AI analysis status (used for polling in Phase 2)
  PUT    /entries/{id}     Update content
  DELETE /entries/{id}     Delete entry
"""

from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.core.auth import get_current_user_id, get_token
from app.core.supabase import get_supabase
from app.models.schemas import DeleteResponse, EntryCreate, EntryResponse, EntryUpdate
from app.services.ai.analyzer import embed_text
from app.services.ai.pipeline import run_analysis_pipeline

router = APIRouter(prefix="/entries", tags=["entries"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _supabase(token: str = Depends(get_token)):
    """Dependency: return a Supabase client scoped to the request's user JWT."""
    return get_supabase(access_token=token)


def _not_found(entry_id: UUID) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Entry {entry_id} not found or does not belong to you.",
    )


# ---------------------------------------------------------------------------
# Schemas (local — only used in this module)
# ---------------------------------------------------------------------------

class SearchQuery(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000)
    limit: int = Field(default=8, ge=1, le=20)


# ---------------------------------------------------------------------------
# POST /entries/search — semantic vector search
# (defined BEFORE /{entry_id} routes to avoid path conflicts)
# ---------------------------------------------------------------------------

@router.post("/search")
async def search_entries(
    body: SearchQuery,
    sb=Depends(_supabase),
):
    """
    Semantic search: embed the user's query, then call the match_entries
    Supabase RPC which uses pgvector cosine similarity to rank results.
    Only returns entries belonging to the authenticated user (via auth.uid()
    inside the RPC definition).
    """

    # embed_text is now async (OpenAI API call) — await directly
    embedding = await embed_text(body.query)

    result = sb.rpc(
        "match_entries",
        {"query_embedding": embedding, "match_count": body.limit},
    ).execute()

    rows = result.data or []

    # Scale raw cosine similarity to feel intuitive:
    # raw 0.4 → ~70%, raw 0.57 → 100% (capped).
    # Formula: min(1.0, raw * 1.75)
    for row in rows:
        if row.get("similarity") is not None:
            row["similarity"] = round(min(1.0, row["similarity"] * 1.75), 4)

    return rows


# ---------------------------------------------------------------------------
# POST /entries — create a new entry
# ---------------------------------------------------------------------------

@router.post("", response_model=EntryResponse, status_code=status.HTTP_201_CREATED)
async def create_entry(
    body: EntryCreate,
    background_tasks: BackgroundTasks,
    sb=Depends(_supabase),
    token: str = Depends(get_token),
    user_id: UUID = Depends(get_current_user_id),
):
    """
    Create a new journal entry, then immediately kick off AI analysis
    as a background task. Response returns before analysis completes.
    """
    result = (
        sb.table("entries")
        .insert({"content": body.content, "user_id": str(user_id)})
        .execute()
    )
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create entry.",
        )
    entry = result.data[0]

    # Fire-and-forget: analyse in background, response already sent
    background_tasks.add_task(
        run_analysis_pipeline,
        entry_id=entry["id"],
        content=body.content,
        supabase_token=token,
    )

    return entry


# ---------------------------------------------------------------------------
# GET /entries — list all entries (newest first)
# ---------------------------------------------------------------------------

@router.get("", response_model=list[EntryResponse])
async def list_entries(
    sb=Depends(_supabase),
):
    """
    Return all entries belonging to the authenticated user,
    ordered by created_at descending (most recent first).
    """
    result = (
        sb.table("entries")
        .select(
            "id, user_id, content, created_at, updated_at, "
            "mood_score, themes, distortions, observation, analyzed"
        )
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


# ---------------------------------------------------------------------------
# GET /entries/{id} — get a single entry
# ---------------------------------------------------------------------------

@router.get("/{entry_id}", response_model=EntryResponse)
async def get_entry(
    entry_id: UUID,
    sb=Depends(_supabase),
):
    """Return a single entry by ID. 404 if not found or owned by another user."""
    result = (
        sb.table("entries")
        .select(
            "id, user_id, content, created_at, updated_at, "
            "mood_score, themes, distortions, observation, analyzed"
        )
        .eq("id", str(entry_id))
        .limit(1)
        .execute()
    )
    if not result.data:
        raise _not_found(entry_id)
    return result.data[0]


# ---------------------------------------------------------------------------
# GET /entries/{id}/analysis — AI analysis status + results
# ---------------------------------------------------------------------------

@router.get("/{entry_id}/analysis")
async def get_analysis(
    entry_id: UUID,
    sb=Depends(_supabase),
):
    """
    Poll for AI analysis status.
    Returns `analyzed: true` with full insight fields once the background
    pipeline completes, or `analyzed: false` while still processing.
    """
    result = (
        sb.table("entries")
        .select("id, analyzed, mood_score, themes, distortions, observation")
        .eq("id", str(entry_id))
        .limit(1)
        .execute()
    )
    if not result.data:
        raise _not_found(entry_id)

    data = result.data[0]
    return {
        "entry_id": data["id"],
        "analyzed": data["analyzed"],
        "mood_score": data.get("mood_score"),
        "themes": data.get("themes") or [],
        "distortions": data.get("distortions") or [],
        "observation": data.get("observation"),
    }


# ---------------------------------------------------------------------------
# PUT /entries/{id} — update entry content
# ---------------------------------------------------------------------------

@router.put("/{entry_id}", response_model=EntryResponse)
async def update_entry(
    entry_id: UUID,
    body: EntryUpdate,
    background_tasks: BackgroundTasks,
    sb=Depends(_supabase),
    token: str = Depends(get_token),
):
    """
    Update an entry's content and re-trigger AI analysis in the background.
    The `updated_at` column is refreshed automatically by the Postgres trigger.
    Returns the updated row immediately.
    """
    result = (
        sb.table("entries")
        .update({"content": body.content, "analyzed": False})
        .eq("id", str(entry_id))
        .execute()
    )
    if not result.data:
        raise _not_found(entry_id)

    # Re-analyse every time content changes
    background_tasks.add_task(
        run_analysis_pipeline,
        entry_id=entry_id,
        content=body.content,
        supabase_token=token,
    )

    return result.data[0]


# ---------------------------------------------------------------------------
# DELETE /entries/{id} — remove an entry
# ---------------------------------------------------------------------------

@router.delete("/{entry_id}", response_model=DeleteResponse)
async def delete_entry(
    entry_id: UUID,
    sb=Depends(_supabase),
):
    """
    Permanently delete an entry.
    RLS guarantees users can only delete their own rows.
    Returns `{id, deleted: true}` on success.
    """
    result = (
        sb.table("entries")
        .delete()
        .eq("id", str(entry_id))
        .execute()
    )
    if not result.data:
        raise _not_found(entry_id)
    return {"id": entry_id, "deleted": True}
