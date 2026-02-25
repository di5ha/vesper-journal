import { useEffect, useState } from 'react'

// ---------------------------------------------------------------------------
// Mood arc — orange stroke for high, purple for mid, neutral for low
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

    const colour = pct > 0.6 ? '#FF6B4A' : pct > 0.3 ? '#B68DFF' : '#111111'

    return (
        <div className="flex flex-col items-center gap-1">
            <svg width="128" height="72" viewBox="0 0 128 80">
                <path d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
                    fill="none" stroke="rgba(17,17,17,0.08)" strokeWidth="10" strokeLinecap="round" />
                {pct > 0.01 && (
                    <path d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 0 ${x2} ${y2}`}
                        fill="none" stroke={colour} strokeWidth="10" strokeLinecap="round" />
                )}
                <text x={cx} y={cy + 16} textAnchor="middle"
                    fill={colour} fontSize="26" fontWeight="800" fontFamily="Inter,sans-serif">
                    {score.toFixed(1)}
                </text>
            </svg>
            <div className="flex justify-between w-28 text-[10px] text-[rgba(17,17,17,0.4)] -mt-1 font-semibold uppercase tracking-wider">
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
            <div className="mx-auto w-28 h-14 bg-[rgba(17,17,17,0.06)] rounded-xl" />
            <div className="h-2.5 w-20 bg-[rgba(17,17,17,0.06)] rounded mx-auto" />
            <div className="flex gap-2 flex-wrap mt-2">
                {[70, 90, 60].map((w, i) => <div key={i} className="h-6 bg-[rgba(17,17,17,0.06)] rounded-full" style={{ width: w }} />)}
            </div>
            <div className="h-3 bg-[rgba(17,17,17,0.05)] rounded w-full" />
            <div className="h-3 bg-[rgba(17,17,17,0.05)] rounded w-3/4" />
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
            <aside className="w-72 shrink-0 border-l border-[rgba(17,17,17,0.07)] bg-[#F6F5F3] flex items-center justify-center px-6">
                <p className="text-[rgba(17,17,17,0.45)] text-sm text-center leading-loose italic">
                    Write your first entry<br />to see AI insights here.
                </p>
            </aside>
        )
    }

    if (analyzing || !analysis) {
        return (
            <aside className="w-72 shrink-0 border-l border-[rgba(17,17,17,0.07)] bg-[#F6F5F3] overflow-y-auto">
                <header className="px-5 pt-5 pb-4 border-b border-[rgba(17,17,17,0.06)]">
                    <p className="text-[10px] font-semibold text-[rgba(17,17,17,0.4)] uppercase tracking-widest mb-1">AI</p>
                    <h2 className="font-extrabold text-lg text-[#111111] leading-tight tracking-[-0.03em]">Insights</h2>
                </header>
                <Skeleton />
                <p className="text-center text-xs text-[rgba(17,17,17,0.4)] pb-4 animate-pulse">Analysing…</p>
            </aside>
        )
    }

    const { mood_score, themes = [], distortions = [], observation } = analysis

    return (
        <aside className={`w-72 shrink-0 border-l border-[rgba(17,17,17,0.07)] bg-[#F6F5F3] overflow-y-auto transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
            {/* Header */}
            <header className="px-5 pt-5 pb-4 border-b border-[rgba(17,17,17,0.06)]">
                <p className="text-[10px] font-semibold text-[rgba(17,17,17,0.4)] uppercase tracking-widest mb-1">AI</p>
                <h2 className="font-extrabold text-lg text-[#111111] leading-tight tracking-[-0.03em]">Insights</h2>
            </header>

            {/* Mood arc */}
            <section className="px-5 py-5 border-b border-[rgba(17,17,17,0.06)]">
                <p className="text-[10px] font-semibold text-[rgba(17,17,17,0.4)] uppercase tracking-widest text-center mb-3">Mood Score</p>
                <MoodArc score={mood_score} />
            </section>

            {/* Themes */}
            {themes.length > 0 && (
                <section className="px-5 py-4 border-b border-[rgba(17,17,17,0.06)]">
                    <p className="text-[10px] font-semibold text-[rgba(17,17,17,0.4)] uppercase tracking-widest mb-3">Themes</p>
                    <div className="flex flex-wrap gap-2">
                        {themes.map(t => (
                            <span key={t} className="px-3 py-1.5 text-xs font-semibold bg-white text-[#111111] rounded-full border border-[rgba(17,17,17,0.10)] capitalize shadow-[0_1px_4px_rgba(17,17,17,0.06)]">
                                {t}
                            </span>
                        ))}
                    </div>
                </section>
            )}

            {/* Cognitive patterns */}
            <section className="px-5 py-4 border-b border-[rgba(17,17,17,0.06)]">
                <p className="text-[10px] font-semibold text-[rgba(17,17,17,0.4)] uppercase tracking-widest mb-3">Cognitive Patterns</p>
                {distortions.length === 0 ? (
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-white rounded-xl border border-[rgba(17,17,17,0.08)] shadow-[0_1px_4px_rgba(17,17,17,0.04)]">
                        <span className="text-[#FF6B4A]">✓</span>
                        <span className="text-xs text-[rgba(17,17,17,0.55)]">No distortions flagged</span>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {distortions.map(d => {
                            const label = d?.label ?? d
                            return (
                                <div key={label} className="px-3 py-2.5 bg-white rounded-xl border border-[rgba(17,17,17,0.08)] shadow-[0_1px_4px_rgba(17,17,17,0.04)]">
                                    <p className="text-xs font-semibold text-[#111111]">{label}</p>
                                </div>
                            )
                        })}
                    </div>
                )}
            </section>

            {/* Observation */}
            {observation && (
                <section className="px-5 py-4">
                    <p className="text-[10px] font-semibold text-[rgba(17,17,17,0.4)] uppercase tracking-widest mb-3">Observation</p>
                    <p className="text-sm text-[rgba(17,17,17,0.65)] italic leading-relaxed">
                        "{observation}"
                    </p>
                </section>
            )}
        </aside>
    )
}
