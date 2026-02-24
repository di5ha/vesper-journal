"""
app/services/ai/report.py — AI weekly report synthesis via LiteLLM.

synthesise_report(entries) ingests a list of entry dicts and returns a
structured dict: {dominant_emotion, top_themes, emotional_arc, ai_observation}.
"""

import json
import logging

from app.core.config import settings
from app.services.ai.analyzer import _get_client

logger = logging.getLogger(__name__)

REPORT_SYSTEM_PROMPT = """\
You are a compassionate clinical psychologist reviewing a user's recent journal entries.
Analyse the emotional content and cognitive patterns across ALL entries and return ONLY
a JSON object — no markdown, no explanation, no surrounding text.

JSON schema (respond with exactly this shape):
{
  "dominant_emotion": "<single word or short phrase, e.g. 'anxious', 'reflective', 'hopeful'>",
  "top_themes":       ["<theme 1>", "<theme 2>", "<theme 3>"],
  "emotional_arc":    "<2-3 sentences describing the emotional journey across the entries — how did mood shift?>",
  "ai_observation":   "<3-5 sentences of deeper psychological insight — patterns, strengths noticed, gentle suggestion>"
}
"""


async def synthesise_report(entries: list[dict]) -> dict:
    """
    Synthesise a weekly psychological report from a list of entry dicts.
    Each entry should have at least: content, mood_score, themes, observation, created_at.
    Returns the structured report dict.
    """
    if not entries:
        raise ValueError("No entries to synthesise — at least one entry is required.")

    # Build a compact digest of entries for the prompt
    lines: list[str] = []
    for i, e in enumerate(entries, 1):
        mood = f"{e.get('mood_score', '?'):.1f}" if e.get('mood_score') is not None else "?"
        themes = ", ".join(e.get("themes") or []) or "—"
        obs = e.get("observation") or ""
        content_snip = (e.get("content") or "")[:300].strip().replace("\n", " ")
        lines.append(
            f"Entry {i} (mood {mood}/10 | themes: {themes})\n"
            f"  Excerpt: {content_snip}\n"
            f"  AI note: {obs}"
        )

    digest = "\n\n".join(lines)
    user_message = f"Here are the journal entries to analyse:\n\n{digest}"

    client = _get_client()
    response = await client.chat.completions.create(
        model=settings.litellm_model,
        messages=[
            {"role": "system", "content": REPORT_SYSTEM_PROMPT},
            {"role": "user",   "content": user_message},
        ],
        temperature=0.5,
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content.strip()
    if raw.startswith("```"):
        raw = "\n".join(raw.split("\n")[1:-1])

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError(f"LLM returned non-JSON: {raw[:300]}") from exc

    # Normalise
    data.setdefault("dominant_emotion", "reflective")
    data.setdefault("top_themes", [])
    data.setdefault("emotional_arc", "")
    data.setdefault("ai_observation", "")
    if not isinstance(data["top_themes"], list):
        data["top_themes"] = [data["top_themes"]]
    data["top_themes"] = data["top_themes"][:5]   # cap at 5

    logger.info(
        "Report synthesised: emotion=%s themes=%s",
        data["dominant_emotion"],
        data["top_themes"],
    )
    return data
