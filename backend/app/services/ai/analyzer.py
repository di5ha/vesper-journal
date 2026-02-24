"""
app/services/ai/analyzer.py — LiteLLM analysis + OpenAI text-embedding-3-small.

Two public async functions:
  analyse_entry(text) → AnalysisResult    (chat completion via gpt-5-nano)
  embed_text(text)    → list[float]       (384-dim via text-embedding-3-small)

Both use the same AsyncOpenAI client pointed at the LiteLLM proxy.
sentence-transformers removed — embedding is now done server-side via API.
"""

import json
import logging

from openai import AsyncOpenAI
from pydantic import BaseModel, Field, ValidationError

from app.core.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

EMBEDDING_MODEL    = "text-embedding-3-small"
EMBEDDING_DIMS     = 384   # must match Supabase vector(384) column — no migration needed

VALID_DISTORTIONS = {
    "Catastrophizing",
    "All-or-nothing thinking",
    "Mind reading",
    "Overgeneralization",
    "Emotional reasoning",
    "Personalization",
    "Filtering",
    "Should statements",
}

SYSTEM_PROMPT = """\
You are a compassionate AI assistant trained in Cognitive Behavioural Therapy (CBT).
When given a personal journal entry, you analyse it and return ONLY a JSON object
with no markdown, no explanation, and no surrounding text.

JSON schema (respond with this exact shape):
{
  "mood_score": <float 1.0-10.0, where 1=severely distressed, 10=extremely positive>,
  "themes": [<2-3 concise lowercase topic strings, e.g. "work pressure", "self-doubt">],
  "distortions": [<ONLY distortions clearly present — use exact labels from the list, or []>],
  "observation": "<one specific empathetic sentence, 15-25 words, do not start with 'You'>"
}

Valid distortion labels: Catastrophizing, All-or-nothing thinking, Mind reading,
Overgeneralization, Emotional reasoning, Personalization, Filtering, Should statements.
"""

# ---------------------------------------------------------------------------
# Pydantic output schema
# ---------------------------------------------------------------------------

class AnalysisResult(BaseModel):
    mood_score: float = Field(..., ge=1.0, le=10.0)
    themes: list[str] = Field(default_factory=list)
    distortions: list[str] = Field(default_factory=list)
    observation: str = Field(...)


# ---------------------------------------------------------------------------
# Shared AsyncOpenAI client (LiteLLM proxy) — lazy singleton
# ---------------------------------------------------------------------------

_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        if not settings.litellm_api_key:
            raise RuntimeError("LITELLM_API_KEY is not set in environment.")
        if not settings.litellm_base_url:
            raise RuntimeError("LITELLM_BASE_URL is not set in environment.")
        _client = AsyncOpenAI(
            api_key=settings.litellm_api_key,
            base_url=settings.litellm_base_url,
        )
        logger.info(
            "LiteLLM client initialised — chat: %s, embedding: %s",
            settings.litellm_model,
            EMBEDDING_MODEL,
        )
    return _client


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def analyse_entry(text: str) -> AnalysisResult:
    """
    Analyse a journal entry using the configured LiteLLM chat model.
    Returns a validated AnalysisResult. Raises on API or schema failure.
    """
    client = _get_client()

    response = await client.chat.completions.create(
        model=settings.litellm_model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Journal entry:\n\"\"\"\n{text}\n\"\"\""},
        ],
        temperature=0.4,
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content.strip()
    if raw.startswith("```"):
        raw = "\n".join(raw.split("\n")[1:-1])

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError(f"LLM returned non-JSON: {raw[:300]}") from exc

    # Normalise / clamp
    valid_lower = {d.lower(): d for d in VALID_DISTORTIONS}
    data["distortions"] = [
        valid_lower[d.lower()] for d in data.get("distortions", []) if d.lower() in valid_lower
    ]
    data["mood_score"] = max(1.0, min(10.0, float(data.get("mood_score", 5.0))))
    data.setdefault("themes", [])
    data.setdefault("observation", "")

    try:
        return AnalysisResult(**data)
    except ValidationError as exc:
        raise ValueError(f"Schema validation failed: {exc}") from exc


async def embed_text(text: str) -> list[float]:
    """
    Generate a 384-dim embedding via OpenAI text-embedding-3-small through
    the LiteLLM proxy. dimensions=384 matches the Supabase vector(384) column.
    """
    client = _get_client()

    response = await client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=text,
        dimensions=EMBEDDING_DIMS,
    )
    return response.data[0].embedding
