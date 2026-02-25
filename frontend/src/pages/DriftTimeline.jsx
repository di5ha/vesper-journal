import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer,
} from 'recharts'
import { getDriftThemes, getDriftTimeline } from '../lib/api'
import { BookOpen, ArrowLeft, Loader2 } from 'lucide-react'

function fmtDate(iso) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Colour mapped to mood score — warm teal palette
function moodColor(score) {
    if (score == null) return 'var(--color-muted-fg)'
    if (score <= 3) return '#e97b5a'   // low — warm coral
    if (score <= 5) return '#e9b55a'   // mid — amber
    if (score <= 7) return '#5ab3b3'   // good — teal mid
    return 'var(--color-primary)'      // high — full teal
}

// ── Tooltip ──────────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload }) {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    return (
        <div className="card" style={{ padding: '0.75rem 1rem', maxWidth: '200px', boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}>
            <p style={{ fontSize: '0.6875rem', color: 'var(--color-muted-fg)', margin: '0 0 4px' }}>{fmtDate(d.created_at)}</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 6px', color: moodColor(d.mood_score) }}>
                {d.mood_score?.toFixed(1)}
                <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--color-muted-fg)' }}> / 10</span>
            </p>
            {d.observation && (
                <p style={{ fontSize: '0.75rem', color: 'var(--color-muted-fg)', fontStyle: 'italic', lineHeight: 1.5, margin: '0 0 6px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {d.observation}

                </p>
            )}
            {d.themes?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                    {d.themes.slice(0, 3).map(t => (
                        <span key={t} className="badge-primary" style={{ fontSize: '0.625rem' }}>{t}</span>
                    ))}
                </div>
            )}
        </div>
    )
}

// ── Chart ─────────────────────────────────────────────────────────────────────
function MoodChart({ data }) {
    return (
        <ResponsiveContainer width="100%" height={480}>
            <AreaChart data={data} margin={{ top: 16, right: 24, left: -8, bottom: 8 }}>
                <defs>
                    <linearGradient id="moodGradV0" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.50 0.10 170)" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="oklch(0.50 0.10 170)" stopOpacity={0.02} />
                    </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="created_at" tickFormatter={fmtDate}
                    tick={{ fontSize: 11, fill: 'var(--color-muted-fg)', fontFamily: 'Inter,sans-serif', fontWeight: 600 }}
                    axisLine={false} tickLine={false} minTickGap={60} />
                <YAxis domain={[1, 10]} ticks={[1, 3, 5, 7, 10]}
                    tick={{ fontSize: 11, fill: 'var(--color-muted-fg)', fontFamily: 'Inter,sans-serif', fontWeight: 600 }}
                    axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--color-border)', strokeWidth: 1.5 }} />
                <Area type="monotone" dataKey="mood_score"
                    stroke="var(--color-primary)" strokeWidth={3}
                    fill="url(#moodGradV0)"
                    dot={({ cx, cy, payload, key }) => (
                        <circle key={key} cx={cx} cy={cy} r={5}
                            fill={moodColor(payload.mood_score)}
                            stroke="var(--color-card)" strokeWidth={2.5} />
                    )}
                    activeDot={{ r: 7, stroke: 'var(--color-card)', strokeWidth: 2.5, fill: 'var(--color-primary)' }} />
            </AreaChart>
        </ResponsiveContainer>
    )
}

// ── Main page ─────────────────────────────────────────────────────────────────
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
        <div style={{ position: 'relative', background: 'oklch(0.975 0.005 75)', minHeight: '100svh', overflow: 'hidden' }}>

            {/* Blob background */}
            <div className="blob-scene">
                <div className="blob blob-teal" style={{ width: '600px', height: '600px', top: '-15%', left: '-8%' }} />
                <div className="blob blob-sage" style={{ width: '650px', height: '650px', top: '40%', right: '-12%' }} />
                <div className="blob blob-amber" style={{ width: '400px', height: '400px', bottom: '0%', left: '30%' }} />
                <div className="blob blob-blush" style={{ width: '450px', height: '450px', top: '-5%', right: '25%' }} />
            </div>


            {/* ── Nav ── */}
            <header style={{
                position: 'sticky', top: 0, zIndex: 20,
                background: 'rgba(253,251,248,0.80)',
                backdropFilter: 'blur(16px)',
                borderBottom: '1px solid rgba(200,195,185,0.5)',
            }}>

                <div style={{ maxWidth: '32rem', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
                        <BookOpen size={20} />
                        <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem', fontWeight: 700, letterSpacing: '-0.02em' }}>vesper</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-muted-fg)', padding: '2px 10px', background: 'var(--color-muted)', borderRadius: '9999px', marginLeft: '4px' }}>Drift</span>
                    </div>
                    <button onClick={() => navigate('/dashboard')} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <ArrowLeft size={15} />
                        Journal
                    </button>
                </div>
            </header>

            {/* ── Body ── */}
            <main style={{ maxWidth: '64rem', margin: '0 auto', padding: '2rem 2rem 6rem' }}>
                {/* Heading row */}
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-foreground)', margin: '0 0 4px' }}>
                            Mood Drift
                        </h1>
                        <p style={{ fontSize: '0.9375rem', color: 'var(--color-muted-fg)', margin: 0 }}>
                            {activeTheme
                                ? <>Entries tagged <strong style={{ color: 'var(--color-foreground)' }}>&#34;{activeTheme}&#34;</strong></>
                                : 'Your emotional journey over time'}
                        </p>
                    </div>
                    {avgMood && (
                        <div className="card" style={{ padding: '0.875rem 1.5rem', textAlign: 'right', background: 'rgba(253,251,248,0.85)', backdropFilter: 'blur(12px)' }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-muted-fg)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Mood</p>
                            <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0, color: moodColor(parseFloat(avgMood)), fontFamily: 'var(--font-serif)' }}>{avgMood}</p>
                        </div>
                    )}
                </div>

                {/* Theme pills */}
                {themes.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
                        <button
                            onClick={() => setActive(null)}
                            style={{
                                padding: '0.4rem 1rem', borderRadius: '9999px', border: 'none',
                                cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, transition: 'all 0.15s',
                                background: !activeTheme ? 'var(--color-primary)' : 'rgba(253,251,248,0.85)',
                                color: !activeTheme ? 'var(--color-primary-fg)' : 'var(--color-muted-fg)',
                                backdropFilter: 'blur(8px)',
                            }}>
                            All entries
                        </button>
                        {themes.map(theme => (
                            <button key={theme}
                                onClick={() => setActive(p => p === theme ? null : theme)}
                                style={{
                                    padding: '0.4rem 1rem', borderRadius: '9999px', border: 'none',
                                    cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, transition: 'all 0.15s',
                                    textTransform: 'capitalize',
                                    background: activeTheme === theme ? 'var(--color-primary)' : 'rgba(253,251,248,0.85)',
                                    color: activeTheme === theme ? 'var(--color-primary-fg)' : 'var(--color-muted-fg)',
                                    backdropFilter: 'blur(8px)',
                                }}>
                                {theme}
                            </button>
                        ))}
                    </div>
                )}

                {/* Chart card */}
                <div style={{ borderRadius: '1.25rem', padding: '1.5rem 1.5rem 1rem', background: 'rgba(253,251,248,0.82)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(200,195,185,0.5)', boxShadow: '0 4px 32px rgba(0,0,0,0.07)' }}>
                    {error && <p style={{ fontSize: '0.875rem', color: 'var(--color-destructive)', textAlign: 'center', padding: '2rem 0' }}>{error}</p>}

                    {!error && loading && (
                        <div style={{ height: '480px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Loader2 size={26} style={{ color: 'var(--color-primary)', animation: 'spin 1s linear infinite' }} />
                        </div>
                    )}

                    {!error && !loading && timeline.length < 2 && (
                        <div style={{ height: '340px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                            <p style={{ fontSize: '1rem', color: 'var(--color-muted-fg)', textAlign: 'center' }}>
                                {activeTheme ? `No entries match "${activeTheme}" yet.` : 'Write a few entries to see your mood drift.'}
                            </p>
                        </div>
                    )}

                    {!error && !loading && timeline.length >= 2 && <MoodChart data={timeline} />}
                </div>

                {!loading && timeline.length > 0 && (
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted-fg)', textAlign: 'center', marginTop: '1rem' }}>
                        {timeline.length} {timeline.length === 1 ? 'entry' : 'entries'}
                        {activeTheme ? ` tagged "${activeTheme}"` : ' tracked'}
                    </p>
                )}
            </main>
        </div>
    )
}

