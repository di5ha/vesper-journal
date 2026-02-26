import { useEffect, useState } from 'react'

// ---------------------------------------------------------------------------
// Mood arc — SVG semicircle, colour-coded 1-10
// ---------------------------------------------------------------------------
function MoodArc({ score }) {
    const pct = (score - 1) / 9          // 0→1
    const radius = 52
    const cx = 64, cy = 64
    const startAngle = Math.PI              // left (180°)
    const endAngle = 0                   // right (0°)
    const sweepAngle = (endAngle - startAngle) * pct + startAngle

    const x1 = cx + radius * Math.cos(startAngle)
    const y1 = cy + radius * Math.sin(startAngle)
    const x2 = cx + radius * Math.cos(sweepAngle)
    const y2 = cy + radius * Math.sin(sweepAngle)

    const largeArc = pct > 0.5 ? 0 : 1  // going right, so opposite convention

    // Colour: red at 1, amber at 5, emerald at 10
    const hue = Math.round(pct * 140)    // 0 = red, 140 = green
    const colour = `hsl(${hue},80%,55%)`

    return (
        <div className="flex flex-col items-center gap-1">
            <svg width="128" height="72" viewBox="0 0 128 80" aria-label={`Mood score ${score} out of 10`}>
                {/* Track */}
                <path
                    d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
                    fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" strokeLinecap="round"
                />
                {/* Fill */}
                {pct > 0.01 && (
                    <path
                        d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 0 ${x2} ${y2}`}
                        fill="none" stroke={colour} strokeWidth="10" strokeLinecap="round"
                        style={{ filter: `drop-shadow(0 0 6px ${colour}88)` }}
                    />
                )}
                {/* Score label */}
                <text x={cx} y={cy + 16} textAnchor="middle"
                    fill={colour} fontSize="26" fontWeight="700" fontFamily="Inter,sans-serif">
                    {score.toFixed(1)}
                </text>
            </svg>
            <div className="flex justify-between w-28 text-[10px] text-white/25 -mt-1">
                <span>low</span><span>high</span>
            </div>
        </div>
    )
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
function Skeleton() {
    return (
        <div className="flex flex-col gap-4 animate-pulse px-5 py-6">
            <div className="mx-auto w-28 h-14 bg-white/5 rounded-xl" />
            <div className="h-3 w-20 bg-white/5 rounded mx-auto" />
            <div className="flex gap-2 flex-wrap mt-2">
                {[70, 90, 60].map((w, i) => (
                    <div key={i} className={`h-6 bg-white/5 rounded-full`} style={{ width: w }} />
                ))}
            </div>
            <div className="h-4 w-full bg-white/5 rounded" />
            <div className="h-4 w-3/4 bg-white/5 rounded" />
        </div>
    )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * InsightPanel — displays AI analysis for the active journal entry.
 *
 * Props:
 *   entryId   — current entry ID (null = blank editor, shows empty state)
 *   analysis  — object from useAnalysis hook (null while loading)
 *   analyzing — boolean: background task still running
 */
export default function InsightPanel({ entryId, analysis, analyzing }) {
    // Entrance animation key resets on new entry
    const [visible, setVisible] = useState(false)
    useEffect(() => {
        setVisible(false)
        const t = setTimeout(() => setVisible(true), 50)
        return () => clearTimeout(t)
    }, [entryId])

    // No entry open
    if (!entryId) {
        return (
            <aside className="w-72 shrink-0 border-l border-white/5 flex items-center justify-center px-6">
                <p className="text-white/15 text-sm text-center leading-loose">
                    Write your first entry<br />to see AI insights here.
                </p>
            </aside>
        )
    }

    // Still analysing
    if (analyzing || !analysis) {
        return (
            <aside className="w-72 shrink-0 border-l border-white/5 overflow-y-auto">
                <header className="px-5 pt-5 pb-2">
                    <h2 className="text-xs font-semibold text-white/30 uppercase tracking-widest">
                        Insights
                    </h2>
                </header>
                <Skeleton />
                <p className="text-center text-xs text-white/20 pb-4 -mt-2 animate-pulse">
                    Analysing…
                </p>
            </aside>
        )
    }

    const { mood_score, themes = [], distortions = [], observation } = analysis

    return (
        <aside
            className={`w-72 shrink-0 border-l border-white/5 overflow-y-auto transition-opacity duration-500 insight-pulse ${visible ? 'opacity-100' : 'opacity-0'}`}
        >
            {/* Header */}
            <header className="px-5 pt-5 pb-3">
                <h2 className="text-xs font-semibold text-white/30 uppercase tracking-widest">Insights</h2>
            </header>

            {/* ── Mood arc ── */}
            <section className="px-4 pb-5 border-b border-white/5">
                <p className="text-[10px] text-white/30 uppercase tracking-widest text-center mb-2">
                    Mood Score
                </p>
                <MoodArc score={mood_score} />
            </section>

            {/* ── Themes ── */}
            {themes.length > 0 && (
                <section className="px-5 py-4 border-b border-white/5">
                    <p className="text-[10px] text-white/30 uppercase tracking-widest mb-3">Themes</p>
                    <div className="flex flex-wrap gap-2">
                        {themes.map((t) => (
                            <span
                                key={t}
                                className="px-3 py-1 rounded-full text-xs font-medium bg-violet-500/10 text-violet-300 border border-violet-500/20"
                            >
                                {t}
                            </span>
                        ))}
                    </div>
                </section>
            )}

            {/* ── Cognitive distortions ── */}
            <section className="px-5 py-4 border-b border-white/5">
                <p className="text-[10px] text-white/30 uppercase tracking-widest mb-3">
                    Cognitive Patterns
                </p>
                {distortions.length === 0 ? (
                    <p className="text-xs text-white/30 flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-[10px]">✓</span>
                        No distortions flagged
                    </p>
                ) : (
                    <div className="flex flex-col gap-2">
                        {distortions.map((d) => {
                            const label = d?.label ?? d
                            return (
                                <div
                                    key={label}
                                    className="rounded-lg px-3 py-2 bg-amber-500/10 border border-amber-500/20 flex items-start gap-2"
                                >
                                    <span className="text-amber-400 text-xs mt-0.5">⚠</span>
                                    <span className="text-xs text-amber-200/80 font-medium">{label}</span>
                                </div>
                            )
                        })}
                    </div>
                )}
            </section>

            {/* ── Observation ── */}
            {observation && (
                <section className="px-5 py-4">
                    <p className="text-[10px] text-white/30 uppercase tracking-widest mb-3">
                        Observation
                    </p>
                    <p className="text-sm text-white/60 italic leading-relaxed">
                        "{observation}"
                    </p>
                </section>
            )}
        </aside>
    )
}
