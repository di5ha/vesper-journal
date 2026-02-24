"""
app/services/pdf.py — In-memory PDF generation via ReportLab.

generate_report_pdf(report) takes a report dict and returns raw PDF bytes.
Designed to be streamed directly as a FastAPI response — nothing written to disk.
"""

import io
from datetime import date

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    HRFlowable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle,
)

# ---------------------------------------------------------------------------
# Palette
# ---------------------------------------------------------------------------
VIOLET    = colors.HexColor("#7c3aed")
VIOLET_LT = colors.HexColor("#ede9fe")
DARK      = colors.HexColor("#1e1b4b")
MID       = colors.HexColor("#4c1d95")
GREY      = colors.HexColor("#6b7280")
LIGHT_BG  = colors.HexColor("#f5f3ff")


def _styles():
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "Title",
            parent=base["Title"],
            fontName="Helvetica-Bold",
            fontSize=26,
            textColor=DARK,
            spaceAfter=4,
        ),
        "subtitle": ParagraphStyle(
            "Subtitle",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=11,
            textColor=GREY,
            spaceAfter=16,
        ),
        "section": ParagraphStyle(
            "Section",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=10,
            textColor=VIOLET,
            spaceBefore=18,
            spaceAfter=6,
            textTransform="uppercase",
            letterSpacing=1.2,
        ),
        "body": ParagraphStyle(
            "Body",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=11,
            textColor=DARK,
            leading=17,
            spaceAfter=8,
        ),
        "footer": ParagraphStyle(
            "Footer",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8,
            textColor=GREY,
            alignment=1,  # centred
        ),
    }


def generate_report_pdf(report: dict) -> bytes:
    """
    Generate a clean A4 PDF report in memory and return raw bytes.

    report dict keys: id, dominant_emotion, top_themes, emotional_arc,
                      ai_observation, week_start, created_at (optional)
    """
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=2.5 * cm,
        rightMargin=2.5 * cm,
        topMargin=2.5 * cm,
        bottomMargin=2.0 * cm,
        title="Vesper Weekly Report",
        author="Vesper AI",
    )

    s = _styles()
    story = []
    W = A4[0] - 5 * cm   # usable width

    # ── Header ──────────────────────────────────────────────────────────────
    week_start = report.get("week_start") or date.today().isoformat()
    story.append(Paragraph("✦ Vesper", s["title"]))
    story.append(Paragraph(f"Weekly Insight Report · {week_start}", s["subtitle"]))
    story.append(HRFlowable(width="100%", thickness=1, color=VIOLET_LT, spaceAfter=12))

    # ── Dominant emotion ────────────────────────────────────────────────────
    emotion = (report.get("dominant_emotion") or "—").strip().title()
    story.append(Paragraph("Dominant Emotion", s["section"]))
    emotion_table = Table(
        [[Paragraph(emotion, ParagraphStyle(
            "Emotion",
            fontName="Helvetica-Bold",
            fontSize=18,
            textColor=VIOLET,
        ))]],
        colWidths=[W],
    )
    emotion_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BG),
        ("ROUNDEDCORNERS", [6]),
        ("TOPPADDING",    (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("LEFTPADDING",   (0, 0), (-1, -1), 14),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 14),
    ]))
    story.append(emotion_table)
    story.append(Spacer(1, 10))

    # ── Top themes ──────────────────────────────────────────────────────────
    themes = report.get("top_themes") or []
    if themes:
        story.append(Paragraph("Top Themes", s["section"]))
        theme_data = [[Paragraph(f"• {t.strip().capitalize()}", s["body"])] for t in themes]
        t_table = Table(theme_data, colWidths=[W])
        t_table.setStyle(TableStyle([
            ("LEFTPADDING",  (0, 0), (-1, -1), 4),
            ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING",(0, 0), (-1, -1), 2),
        ]))
        story.append(t_table)

    # ── Emotional arc ────────────────────────────────────────────────────────
    arc = (report.get("emotional_arc") or "").strip()
    if arc:
        story.append(Paragraph("Emotional Arc", s["section"]))
        story.append(Paragraph(arc, s["body"]))

    # ── AI observation ───────────────────────────────────────────────────────
    obs = (report.get("ai_observation") or "").strip()
    if obs:
        story.append(Paragraph("Psychological Insight", s["section"]))
        obs_table = Table(
            [[Paragraph(f"\u201c{obs}\u201d", ParagraphStyle(
                "Obs",
                fontName="Helvetica-Oblique",
                fontSize=11,
                textColor=MID,
                leading=17,
            ))]],
            colWidths=[W],
        )
        obs_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BG),
            ("LEFTPADDING",   (0, 0), (-1, -1), 14),
            ("RIGHTPADDING",  (0, 0), (-1, -1), 14),
            ("TOPPADDING",    (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ]))
        story.append(obs_table)

    # ── Footer ───────────────────────────────────────────────────────────────
    story.append(Spacer(1, 24))
    story.append(HRFlowable(width="100%", thickness=1, color=VIOLET_LT))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        f"Generated by Vesper · {date.today().strftime('%B %d, %Y')} · For personal use only",
        s["footer"],
    ))

    doc.build(story)
    return buf.getvalue()
