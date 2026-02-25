import { useEffect, useState } from 'react'

// ---------------------------------------------------------------------------
// Mood arc — orange stroke, grey track
// ---------------------------------------------------------------------------
function MoodArc({ score }) {
    const pct = (score - 1) / 9
    const radius = 52
    const cx = 64, cy = 64
    const startAngle = Math.PI
    const sweepAngle = (0 - Math.PI) * pct + Math.PI
    const x1 = cx + radius * Math.cos(startAngle)
    const y1 = cy + radius * Math.sin(startAngle)
    const x2 = cx + radius * Math.cos(sweepAngle)
    const y2 = cy + radius * Math.sin(sweepAngle)
    const largeArc = pct > 0.5 ? 0 : 1

    // Orange for high, navy for low
    const colour = pct > 0.6 ? '#FA9819' : pct > 0.3 ? '#48749E' : '#1E3D59'

    return (
        <div className="flex flex-col items-center gap-1">
            <svg width="128" height="72" viewBox="0 0 128 80" aria-label={`Mood score ${score} out of 10`}>
                {/* Track */}
                <path d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
                    fill="none" stroke="#E5E5E5" strokeWidth="10" strokeLinecap="round" />
                {/* Fill */}
                {pct > 0.01 && (
                    <path d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 0 ${x2} ${y2}`}
                        fill="none" stroke={colour} strokeWidth="10" strokeLinecap="round" />
                )}
                {/* Score */}
                <text x={cx} y={cy + 16} textAnchor="middle"
                    fill={colour} fontSize="26" fontWeight="700" fontFamily="Rethink Sans,sans-serif">
                    {score.toFixed(1)}
                </text>
            </svg>
            <div className="flex justify-between w-28 text-[10px] text-muted -mt-1 font-semibold uppercase tracking-wider">
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
            <div className="mx-auto w-28 h-14 bg-off-blue" />
            <div className="h-2.5 w-20 bg-grey mx-auto" />
            <div className="flex gap-2 flex-wrap mt-2">
                {[70, 90, 60].map((w, i) => <div key={i} className="h-6 bg-grey" style={{ width: w }} />)}
            </div>
            <div className="h-3 bg-grey w-full" />
            <div className="h-3 bg-grey w-3/4" />
        </div>
    )
}

// ---------------------------------------------------------------------------
// InsightPanel
// ---------------------------------------------------------------------------
export default function InsightPanel({ entryId, analysis, analyzing }) {
    const [visible, setVisible] = useState(false)
    useEffect(() => {
        setVisible(false)
        const t = setTimeout(() => setVisible(true), 50)
        return () => clearTimeout(t)
    }, [entryId])

    if (!entryId) {
        return (
            <aside className="w-72 shrink-0 border-l border-grey bg-surface flex items-center justify-center px-6">
                <p className="text-muted text-sm text-center leading-loose font-serif italic">
                    Write your first entry<br />to see AI insights here.
                </p>
            </aside>
        )
    }

    if (analyzing || !analysis) {
        return (
            <aside className="w-72 shrink-0 border-l border-grey bg-surface overflow-y-auto">
                <header className="px-5 pt-5 pb-3 border-b border-grey">
                    <span className="text-accent font-bold text-xs">04</span>
                    <h2 className="font-bold text-ink mt-0.5">Insights</h2>
                </header>
                <Skeleton />
                <p className="text-center text-xs text-muted pb-4 animate-pulse">Analysing…</p>
            </aside>
        )
    }

    const { mood_score, themes = [], distortions = [], observation } = analysis

    return (
        <aside className={`w-72 shrink-0 border-l border-grey bg-surface overflow-y-auto transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
            {/* Header */}
            <header className="px-5 pt-5 pb-3 border-b border-grey">
                <span className="text-accent font-bold text-xs">04</span>
                <h2 className="font-bold text-ink mt-0.5">Insights</h2>
            </header>

            {/* Mood arc */}
            <section className="px-5 py-5 border-b border-grey">
                <p className="text-[10px] font-semibold text-muted uppercase tracking-wider text-center mb-3">Mood Score</p>
                <MoodArc score={mood_score} />
            </section>

            {/* Themes */}
            {themes.length > 0 && (
                <section className="px-5 py-4 border-b border-grey">
                    <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-3">Themes</p>
                    <div className="flex flex-wrap gap-2">
                        {themes.map(t => (
                            <span key={t} className="px-2.5 py-1 text-xs font-semibold bg-baby-blue text-navy capitalize">
                                {t}
                            </span>
                        ))}
                    </div>
                </section>
            )}

            {/* Cognitive patterns */}
            <section className="px-5 py-4 border-b border-grey">
                <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-3">Cognitive Patterns</p>
                {distortions.length === 0 ? (
                    <p className="text-xs text-muted flex items-center gap-2">
                        <span className="w-5 h-5 bg-sky flex items-center justify-center text-caption font-bold text-[10px]">✓</span>
                        No distortions flagged
                    </p>
                ) : (
                    <div className="flex flex-col gap-2">
                        {distortions.map(d => {
                            const label = d?.label ?? d
                            return (
                                <div key={label} className="px-3 py-2 bg-sky border-l-2 border-accent">
                                    <p className="text-xs font-semibold text-navy">{label}</p>
                                </div>
                            )
                        })}
                    </div>
                )}
            </section>

            {/* Observation */}
            {observation && (
                <section className="px-5 py-4">
                    <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-3">Observation</p>
                    <p className="text-sm text-caption font-serif italic leading-relaxed">
                        "{observation}"
                    </p>
                </section>
            )}
        </aside>
    )
}
