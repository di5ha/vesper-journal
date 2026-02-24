import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer,
} from 'recharts'
import { getDriftThemes, getDriftTimeline } from '../lib/api'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fmtDate(iso) {
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric',
    })
}

function moodColor(score) {
    if (score == null) return '#6b7280'
    if (score <= 3) return '#ef4444'
    if (score <= 5) return '#f59e0b'
    if (score <= 7) return '#84cc16'
    return '#10b981'
}

// ---------------------------------------------------------------------------
// Custom Recharts Tooltip
// ---------------------------------------------------------------------------
function CustomTooltip({ active, payload }) {
    if (!active || !payload || !payload.length) return null
    const d = payload[0].payload
    const color = moodColor(d.mood_score)
    return (
        <div className="bg-[#1a1a24] border border-white/10 rounded-xl p-3 shadow-xl max-w-[220px]">
            <p className="text-[10px] text-white/40 mb-1">{fmtDate(d.created_at)}</p>
            <p className="text-lg font-bold mb-1" style={{ color }}>
                {d.mood_score?.toFixed(1)}
                <span className="text-xs font-normal text-white/30"> / 10</span>
            </p>
            {d.observation && (
                <p className="text-xs text-white/50 italic leading-relaxed line-clamp-3">
                    "{d.observation}"
                </p>
            )}
            {d.themes?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                    {d.themes.slice(0, 3).map(t => (
                        <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-300">
                            {t}
                        </span>
                    ))}
                </div>
            )}
        </div>
    )
}

// ---------------------------------------------------------------------------
// Empty / loading states
// ---------------------------------------------------------------------------
function EmptyState({ filtering }) {
    return (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="text-3xl">◌</div>
            <p className="text-white/30 text-sm text-center leading-relaxed">
                {filtering
                    ? 'No entries match this theme yet.'
                    : 'Write and save a few journal entries to see your mood drift here.'}
            </p>
        </div>
    )
}

// ---------------------------------------------------------------------------
// Gradient area chart
// ---------------------------------------------------------------------------
function MoodChart({ data }) {
    return (
        <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={data} margin={{ top: 10, right: 24, left: -16, bottom: 0 }}>
                <defs>
                    <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
                    </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                    dataKey="created_at"
                    tickFormatter={fmtDate}
                    tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.25)', fontFamily: 'Inter,sans-serif' }}
                    axisLine={false} tickLine={false}
                    minTickGap={60}
                />
                <YAxis
                    domain={[1, 10]}
                    ticks={[1, 3, 5, 7, 10]}
                    tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.25)', fontFamily: 'Inter,sans-serif' }}
                    axisLine={false} tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(139,92,246,0.3)', strokeWidth: 1 }} />
                <Area
                    type="monotone"
                    dataKey="mood_score"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fill="url(#moodGradient)"
                    dot={(props) => {
                        const { cx, cy, payload } = props
                        const color = moodColor(payload.mood_score)
                        return (
                            <circle
                                key={`dot-${cx}-${cy}`}
                                cx={cx} cy={cy} r={4}
                                fill={color} stroke="#0f0f13" strokeWidth={2}
                            />
                        )
                    }}
                    activeDot={{ r: 6, strokeWidth: 2, stroke: '#0f0f13' }}
                />
            </AreaChart>
        </ResponsiveContainer>
    )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function DriftTimeline() {
    const navigate = useNavigate()

    const [themes, setThemes] = useState([])
    const [timeline, setTimeline] = useState([])
    const [activeTheme, setActive] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Fetch themes once on mount
    useEffect(() => {
        getDriftThemes()
            .then(setThemes)
            .catch(console.error)
    }, [])

    // Fetch timeline whenever activeTheme changes
    const fetchTimeline = useCallback((theme) => {
        setLoading(true)
        setError(null)
        getDriftTimeline(theme)
            .then(data => { setTimeline(data); setLoading(false) })
            .catch(err => { setError(err.message); setLoading(false) })
    }, [])

    useEffect(() => {
        fetchTimeline(activeTheme)
    }, [activeTheme, fetchTimeline])

    function handleThemeClick(theme) {
        setActive(prev => prev === theme ? null : theme)
    }

    const avgMood = timeline.length
        ? (timeline.reduce((s, e) => s + (e.mood_score ?? 0), 0) / timeline.length).toFixed(1)
        : null

    return (
        <div className="min-h-screen bg-[#0f0f13] flex flex-col">
            {/* Top nav */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-4">
                    <span className="text-white font-semibold tracking-tight select-none">✦ vesper</span>
                    <span className="text-white/15 text-xs">·</span>
                    <span className="text-xs text-violet-300 font-medium">Drift Timeline</span>
                </div>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none"
                        viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Journal
                </button>
            </header>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-8 max-w-5xl mx-auto w-full">
                {/* Title row */}
                <div className="flex items-end justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold text-white tracking-tight mb-1">
                            Mood Drift
                        </h1>
                        <p className="text-sm text-white/30">
                            {activeTheme
                                ? <>Showing entries tagged <span className="text-violet-300">"{activeTheme}"</span></>
                                : 'Your emotional journey over time'}
                        </p>
                    </div>
                    {avgMood && (
                        <div className="text-right">
                            <p className="text-xs text-white/25 mb-0.5">Avg mood</p>
                            <p className="text-2xl font-bold" style={{ color: moodColor(parseFloat(avgMood)) }}>
                                {avgMood}
                            </p>
                        </div>
                    )}
                </div>

                {/* Theme pills */}
                {themes.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                        <button
                            onClick={() => setActive(null)}
                            className={[
                                'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                                !activeTheme
                                    ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                                    : 'bg-white/5 text-white/30 border border-white/5 hover:bg-white/10',
                            ].join(' ')}
                        >
                            All entries
                        </button>
                        {themes.map(theme => (
                            <button
                                key={theme}
                                onClick={() => handleThemeClick(theme)}
                                className={[
                                    'px-3 py-1.5 rounded-full text-xs font-medium transition-all capitalize',
                                    activeTheme === theme
                                        ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                                        : 'bg-white/5 text-white/30 border border-white/5 hover:bg-white/10',
                                ].join(' ')}
                            >
                                {theme}
                            </button>
                        ))}
                    </div>
                )}

                {/* Chart card */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                    {error && (
                        <p className="text-red-400 text-sm text-center py-8">{error}</p>
                    )}
                    {!error && loading && (
                        <div className="h-80 flex items-center justify-center">
                            <div className="text-white/20 text-sm animate-pulse">Loading timeline…</div>
                        </div>
                    )}
                    {!error && !loading && timeline.length < 2 && (
                        <EmptyState filtering={!!activeTheme} />
                    )}
                    {!error && !loading && timeline.length >= 2 && (
                        <MoodChart data={timeline} />
                    )}
                </div>

                {/* Entry count */}
                {!loading && timeline.length > 0 && (
                    <p className="text-xs text-white/20 text-center mt-4">
                        {timeline.length} {timeline.length === 1 ? 'entry' : 'entries'}
                        {activeTheme ? ` tagged "${activeTheme}"` : ' tracked'}
                    </p>
                )}
            </div>
        </div>
    )
}
