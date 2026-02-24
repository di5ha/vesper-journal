"""
app/models/schemas.py — Pydantic models for request/response validation.
"""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Entry schemas
# ---------------------------------------------------------------------------

class EntryCreate(BaseModel):
    """Payload for creating a new journal entry."""
    content: str = Field(..., min_length=1, description="Raw journal entry text")


class EntryUpdate(BaseModel):
    """Payload for updating an existing entry's content."""
    content: str = Field(..., min_length=1, description="Updated journal entry text")


class EntryResponse(BaseModel):
    """Full entry as returned from the database."""
    id: UUID
    user_id: UUID
    content: str
    created_at: datetime
    updated_at: datetime
    mood_score: float | None = None
    themes: list[str] = []
    distortions: list[dict[str, Any]] = []
    observation: str | None = None
    analyzed: bool = False
    # embedding is excluded from responses — it's large and not useful to the UI

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# Generic response helpers
# ---------------------------------------------------------------------------

class DeleteResponse(BaseModel):
    """Confirmation payload returned after a successful delete."""
    id: UUID
    deleted: bool = True
