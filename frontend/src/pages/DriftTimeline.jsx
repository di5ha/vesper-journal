import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer,
} from 'recharts'
import { getDriftThemes, getDriftTimeline } from '../lib/api'

// ── Blob background layer — shared util
function BlobBackground() {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            <div className="blob blob-orange absolute w-[680px] h-[680px]"
                style={{ bottom: '-100px', left: '-120px', opacity: 0.50 }} />
            <div className="blob blob-purple absolute w-[620px] h-[620px]"
                style={{ top: '-80px', right: '-80px', opacity: 0.45 }} />
            <div className="blob blob-yellow absolute w-[340px] h-[340px]"
                style={{ top: '40%', left: '-40px', opacity: 0.40 }} />
            <div className="blob blob-teal absolute w-[560px] h-[560px]"
                style={{ bottom: '-120px', right: '-60px', opacity: 0.32 }} />
            <div className="blob blob-pink absolute w-[260px] h-[260px]"
                style={{ top: '8%', left: '43%', opacity: 0.35 }} />
        </div>
    )
}

function fmtDate(iso) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Glassmorphism tooltip
function CustomTooltip({ active, payload }) {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    return (
        <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl p-3.5 shadow-[0_8px_32px_rgba(17,17,17,0.10)] max-w-[220px]">
            <p className="text-[10px] font-semibold text-[rgba(17,17,17,0.45)] uppercase tracking-wider mb-1">{fmtDate(d.created_at)}</p>
            <p className="text-2xl font-extrabold text-[#111111] leading-none mb-1" style={{ letterSpacing: '-0.04em' }}>
                {d.mood_score?.toFixed(1)}
                <span className="text-sm font-normal text-[rgba(17,17,17,0.45)]"> / 10</span>
            </p>
            {d.observation && (
                <p className="text-xs text-[rgba(17,17,17,0.55)] italic leading-relaxed line-clamp-3">"{d.observation}"</p>
            )}
            {d.themes?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                    {d.themes.slice(0, 3).map(t => (
                        <span key={t} className="text-[9px] px-2 py-0.5 bg-[rgba(17,17,17,0.06)] rounded-full font-semibold text-[#111111]">{t}</span>
                    ))}
                </div>
            )}
        </div>
    )
}

function MoodChart({ data }) {
    return (
        <ResponsiveContainer width="100%" height={340}>
            <AreaChart data={data} margin={{ top: 10, right: 24, left: -16, bottom: 0 }}>
                <defs>
                    <linearGradient id="moodGradDT" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF6B4A" stopOpacity={0.18} />
                        <stop offset="60%" stopColor="#B68DFF" stopOpacity={0.08} />
                        <stop offset="95%" stopColor="#FF6B4A" stopOpacity={0.01} />
                    </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(17,17,17,0.06)" vertical={false} />
                <XAxis dataKey="created_at" tickFormatter={fmtDate}
                    tick={{ fontSize: 10, fill: 'rgba(17,17,17,0.45)', fontFamily: 'Inter,sans-serif', fontWeight: 600 }}
                    axisLine={false} tickLine={false} minTickGap={60} />
                <YAxis domain={[1, 10]} ticks={[1, 3, 5, 7, 10]}
                    tick={{ fontSize: 10, fill: 'rgba(17,17,17,0.45)', fontFamily: 'Inter,sans-serif', fontWeight: 600 }}
                    axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(17,17,17,0.1)', strokeWidth: 1 }} />
                <Area type="monotone" dataKey="mood_score" stroke="#FF6B4A" strokeWidth={2.5}
                    fill="url(#moodGradDT)"
                    dot={({ cx, cy, key }) => <circle key={key} cx={cx} cy={cy} r={4} fill="#FF6B4A" stroke="white" strokeWidth={2} />}
                    activeDot={{ r: 6, stroke: 'white', strokeWidth: 2, fill: '#FF6B4A' }} />
            </AreaChart>
        </ResponsiveContainer>
    )
}

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
        <div className="h-screen bg-[#F6F5F3] flex flex-col overflow-hidden relative">
            <BlobBackground />

            {/* ── Nav ── */}
            <header className="relative z-30 flex items-center justify-between px-6 py-3 bg-white/55 backdrop-blur-xl border-b border-white/40 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-[#111111] rounded flex items-center justify-center">
                        <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 fill-white"><path d="M10 2L3 7.5V18h5.5v-5h3v5H18V7.5L10 2z" /></svg>
                    </div>
                    <span className="font-extrabold text-[#111111] tracking-tight">vesper</span>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-white/60 backdrop-blur rounded-full text-[rgba(17,17,17,0.55)] border border-white/40">Drift</span>
                </div>
                <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-xs text-[rgba(17,17,17,0.55)] hover:text-[#FF6B4A] font-semibold transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Journal
                </button>
            </header>

            {/* ── Body ── */}
            <div className="relative z-10 flex-1 overflow-y-auto px-8 py-8 max-w-5xl mx-auto w-full">

                {/* Heading row */}
                <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
                    <div>
                        <h1 className="heading-tight text-3xl text-[#111111]">Mood Drift</h1>
                        <p className="text-sm text-[rgba(17,17,17,0.55)] mt-2">
                            {activeTheme
                                ? <>Entries tagged <span className="font-semibold text-[#111111]">"{activeTheme}"</span></>
                                : 'Your emotional journey over time'}
                        </p>
                    </div>
                    {avgMood && (
                        <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl px-6 py-3 shadow-[0_2px_16px_rgba(17,17,17,0.06)] text-right">
                            <p className="text-[10px] font-semibold text-[rgba(17,17,17,0.4)] uppercase tracking-wider mb-1">Avg Mood</p>
                            <p className="heading-tight text-3xl text-[#FF6B4A]">{avgMood}</p>
                        </div>
                    )}
                </div>

                {/* Theme pills */}
                {themes.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-5">
                        <button onClick={() => setActive(null)}
                            className={['px-4 py-2 text-xs font-semibold rounded-full border transition-all',
                                !activeTheme ? 'bg-[#111111] text-white border-[#111111]' : 'bg-white/60 backdrop-blur text-[rgba(17,17,17,0.6)] border-white/50 hover:text-[#111111]'].join(' ')}>
                            All entries
                        </button>
                        {themes.map(theme => (
                            <button key={theme} onClick={() => setActive(p => p === theme ? null : theme)}
                                className={['px-4 py-2 text-xs font-semibold rounded-full border capitalize transition-all',
                                    activeTheme === theme ? 'bg-[#111111] text-white border-[#111111]' : 'bg-white/60 backdrop-blur text-[rgba(17,17,17,0.6)] border-white/50 hover:text-[#111111]'].join(' ')}>
                                {theme}
                            </button>
                        ))}
                    </div>
                )}

                {/* Chart card — glassmorphism */}
                <div className="bg-white/65 backdrop-blur-xl border border-white/50 rounded-2xl p-6 shadow-[0_4px_32px_rgba(17,17,17,0.07)]">
                    {error && <p className="text-red-500 text-sm text-center py-8">{error}</p>}
                    {!error && loading && (
                        <div className="h-80 flex items-center justify-center">
                            <p className="text-[rgba(17,17,17,0.4)] text-sm animate-pulse font-semibold">Loading timeline…</p>
                        </div>
                    )}
                    {!error && !loading && timeline.length < 2 && (
                        <div className="flex flex-col items-center justify-center h-64 gap-3">
                            <p className="text-[rgba(17,17,17,0.45)] text-sm text-center">
                                {activeTheme ? 'No entries match this theme.' : 'Write a few entries to see your mood drift.'}
                            </p>
                        </div>
                    )}
                    {!error && !loading && timeline.length >= 2 && <MoodChart data={timeline} />}
                </div>

                {!loading && timeline.length > 0 && (
                    <p className="text-xs text-[rgba(17,17,17,0.4)] text-center mt-4 font-semibold">
                        {timeline.length} {timeline.length === 1 ? 'entry' : 'entries'}
                        {activeTheme ? ` tagged "${activeTheme}"` : ' tracked'}
                    </p>
                )}
            </div>
        </div>
    )
}
