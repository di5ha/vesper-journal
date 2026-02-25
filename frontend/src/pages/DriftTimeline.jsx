import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer,
} from 'recharts'
import { getDriftThemes, getDriftTimeline } from '../lib/api'

function fmtDate(iso) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ---------------------------------------------------------------------------
// Custom tooltip
// ---------------------------------------------------------------------------
function CustomTooltip({ active, payload }) {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    return (
        <div className="bg-surface border border-grey p-3 shadow-lg max-w-[220px]">
            <p className="text-[10px] text-muted font-semibold uppercase tracking-wider mb-1">{fmtDate(d.created_at)}</p>
            <p className="text-xl font-bold text-ink mb-1">
                {d.mood_score?.toFixed(1)}
                <span className="text-sm font-normal text-muted"> / 10</span>
            </p>
            {d.observation && (
                <p className="text-xs text-muted font-serif italic leading-relaxed line-clamp-3">
                    "{d.observation}"
                </p>
            )}
            {d.themes?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                    {d.themes.slice(0, 3).map(t => (
                        <span key={t} className="text-[9px] px-1.5 py-0.5 bg-baby-blue text-navy font-semibold">
                            {t}
                        </span>
                    ))}
                </div>
            )}
        </div>
    )
}

// ---------------------------------------------------------------------------
// Chart
// ---------------------------------------------------------------------------
function MoodChart({ data }) {
    return (
        <ResponsiveContainer width="100%" height={340}>
            <AreaChart data={data} margin={{ top: 10, right: 24, left: -16, bottom: 0 }}>
                <defs>
                    <linearGradient id="moodGradRedo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FA9819" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#FA9819" stopOpacity={0.02} />
                    </linearGradient>
                </defs>
                <CartesianGrid stroke="#E5E5E5" vertical={false} />
                <XAxis
                    dataKey="created_at" tickFormatter={fmtDate}
                    tick={{ fontSize: 10, fill: '#A3A3A3', fontFamily: 'Rethink Sans,sans-serif', fontWeight: 600 }}
                    axisLine={false} tickLine={false} minTickGap={60}
                />
                <YAxis
                    domain={[1, 10]} ticks={[1, 3, 5, 7, 10]}
                    tick={{ fontSize: 10, fill: '#A3A3A3', fontFamily: 'Rethink Sans,sans-serif', fontWeight: 600 }}
                    axisLine={false} tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E5E5E5', strokeWidth: 1 }} />
                <Area
                    type="monotone" dataKey="mood_score"
                    stroke="#FA9819" strokeWidth={2.5}
                    fill="url(#moodGradRedo)"
                    dot={({ cx, cy, payload }) => (
                        <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={4}
                            fill="#FA9819" stroke="#FFFFFF" strokeWidth={2} />
                    )}
                    activeDot={{ r: 6, stroke: '#FFFFFF', strokeWidth: 2, fill: '#FA9819' }}
                />
            </AreaChart>
        </ResponsiveContainer>
    )
}

// ---------------------------------------------------------------------------
// DriftTimeline page
// ---------------------------------------------------------------------------
export default function DriftTimeline() {
    const navigate = useNavigate()

    const [themes, setThemes] = useState([])
    const [timeline, setTimeline] = useState([])
    const [activeTheme, setActive] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => { getDriftThemes().then(setThemes).catch(console.error) }, [])

    const fetchTimeline = useCallback((theme) => {
        setLoading(true); setError(null)
        getDriftTimeline(theme)
            .then(d => { setTimeline(d); setLoading(false) })
            .catch(e => { setError(e.message); setLoading(false) })
    }, [])

    useEffect(() => { fetchTimeline(activeTheme) }, [activeTheme, fetchTimeline])

    const avgMood = timeline.length
        ? (timeline.reduce((s, e) => s + (e.mood_score ?? 0), 0) / timeline.length).toFixed(1)
        : null

    return (
        <div className="min-h-screen bg-surface flex flex-col">
            {/* Top nav */}
            <header className="flex items-center justify-between px-6 py-3.5 border-b border-grey bg-surface shrink-0">
                <div className="flex items-center gap-5">
                    <span className="font-bold text-ink text-xl tracking-tight">✦ vesper</span>
                    <span className="bg-sky px-2.5 py-1 text-[10px] font-bold text-caption uppercase tracking-widest">
                        02 Drift
                    </span>
                </div>
                <button onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-xs text-muted hover:text-accent transition-colors font-semibold">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Journal
                </button>
            </header>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-8 py-10 max-w-5xl mx-auto w-full">
                {/* Section heading — Redo style */}
                <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
                    <div>
                        <span className="text-accent font-bold text-sm">02</span>
                        <h1 className="text-3xl font-bold text-ink mt-0.5">Mood Drift</h1>
                        <p className="text-muted text-sm mt-1">
                            {activeTheme
                                ? <>Entries tagged <span className="text-ink font-semibold">"{activeTheme}"</span></>
                                : 'Your emotional journey over time'}
                        </p>
                    </div>
                    {avgMood && (
                        <div className="text-right border border-grey px-5 py-3">
                            <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">Avg Mood</p>
                            <p className="text-3xl font-bold text-accent">{avgMood}</p>
                        </div>
                    )}
                </div>

                {/* Theme filter pills */}
                {themes.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                        <button
                            onClick={() => setActive(null)}
                            className={['px-3 py-1.5 text-xs font-semibold transition-all border', !activeTheme ? 'bg-accent text-white border-accent' : 'bg-surface text-muted border-grey hover:border-accent hover:text-accent'].join(' ')}
                        >
                            All entries
                        </button>
                        {themes.map(theme => (
                            <button key={theme}
                                onClick={() => setActive(p => p === theme ? null : theme)}
                                className={['px-3 py-1.5 text-xs font-semibold transition-all border capitalize', activeTheme === theme ? 'bg-accent text-white border-accent' : 'bg-surface text-muted border-grey hover:border-accent hover:text-accent'].join(' ')}
                            >
                                {theme}
                            </button>
                        ))}
                    </div>
                )}

                {/* Chart */}
                <div className="bg-surface border border-grey p-6">
                    {error && <p className="text-red-500 text-sm text-center py-8">{error}</p>}
                    {!error && loading && (
                        <div className="h-80 flex items-center justify-center">
                            <p className="text-muted text-sm animate-pulse font-semibold">Loading timeline…</p>
                        </div>
                    )}
                    {!error && !loading && timeline.length < 2 && (
                        <div className="flex flex-col items-center justify-center h-64 gap-3">
                            <p className="text-muted text-sm text-center leading-relaxed">
                                {activeTheme ? 'No entries match this theme.' : 'Write a few entries to see your mood drift.'}
                            </p>
                        </div>
                    )}
                    {!error && !loading && timeline.length >= 2 && <MoodChart data={timeline} />}
                </div>

                {!loading && timeline.length > 0 && (
                    <p className="text-xs text-muted text-center mt-4 font-semibold">
                        {timeline.length} {timeline.length === 1 ? 'entry' : 'entries'}
                        {activeTheme ? ` tagged "${activeTheme}"` : ' tracked'}
                    </p>
                )}
            </div>
        </div>
    )
}
