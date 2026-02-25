import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import {
    getEntries, getEntry, createEntry, updateEntry,
    deleteEntry, getAnalysis, getDashboardStats,
} from '../lib/api'
import {
    BookOpen, LogOut, Plus, Search, BookMarked,
    Loader2, Trash2, MoreHorizontal, BarChart2, FileText,
    TrendingUp, Flame, Sparkles,
} from 'lucide-react'
import { format, isToday, formatDistanceToNow } from 'date-fns'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const MOODS = [
    { value: 'happy', emoji: '😊', label: 'Happy' },
    { value: 'calm', emoji: '😌', label: 'Calm' },
    { value: 'grateful', emoji: '🙏', label: 'Grateful' },
    { value: 'reflective', emoji: '🤔', label: 'Reflective' },
    { value: 'anxious', emoji: '😰', label: 'Anxious' },
    { value: 'sad', emoji: '😔', label: 'Sad' },
]

// Content format: [V]\n<title>\n[mood: xxx]\n<body>  — or old raw content
function packContent(title, mood, body) {
    const parts = ['[V]', title.trim()]
    if (mood) parts.push(`[mood: ${mood}]`)
    parts.push(body)
    return parts.join('\n')
}
function unpackContent(raw) {
    if (!raw) return { title: '', mood: '', body: '' }
    const lines = raw.split('\n')
    if (lines[0] !== '[V]') return { title: '', mood: '', body: raw }
    const title = lines[1] ?? ''
    const moodMatch = (lines[2] ?? '').match(/^\[mood: (\w+)\]$/)
    if (moodMatch) return { title, mood: moodMatch[1], body: lines.slice(3).join('\n').trimStart() }
    return { title, mood: '', body: lines.slice(2).join('\n').trimStart() }
}

function moodColor(score) {
    if (score == null) return 'var(--color-muted-fg)'
    const hue = Math.round(((score - 1) / 9) * 140)   // 0=red, 140=green
    return `hsl(${hue},72%,48%)`
}

// ─────────────────────────────────────────────────────────────────────────────
// Mood Arc SVG (semicircle gauge)
// ─────────────────────────────────────────────────────────────────────────────
function MoodArc({ score }) {
    const pct = (score - 1) / 9
    const r = 48, cx = 60, cy = 60
    const startX = cx - r, startY = cy
    const angle = Math.PI - pct * Math.PI
    const endX = cx + r * Math.cos(Math.PI - angle)
    const endY = cy - r * Math.sin(angle)
    const largeArc = pct > 0.5 ? 0 : 1
    const color = moodColor(score)
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <svg width="120" height="68" viewBox="0 0 120 72" aria-label={`Mood score ${score} out of 10`}>
                {/* Track */}
                <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                    fill="none" stroke="var(--color-muted)" strokeWidth="9" strokeLinecap="round" />
                {/* Fill */}
                {pct > 0.01 && (
                    <path d={`M ${startX} ${startY} A ${r} ${r} 0 ${largeArc} 0 ${endX} ${endY}`}
                        fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" />
                )}
                {/* Score */}
                <text x={cx} y={cy + 14} textAnchor="middle"
                    fill={color} fontSize="22" fontWeight="700" fontFamily="var(--font-serif)">
                    {score.toFixed(1)}
                </text>
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '6rem', fontSize: '0.625rem', color: 'var(--color-muted-fg)', marginTop: '-4px' }}>
                <span>low</span><span>high</span>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Right panel: Dashboard stats (shown when no entry selected)
// ─────────────────────────────────────────────────────────────────────────────
function DashboardStatsPanel({ entryCount }) {
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getDashboardStats()
            .then(setStats)
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    return (
        <aside style={{
            width: '260px', flexShrink: 0, overflowY: 'auto',
            borderLeft: '1px solid var(--color-border)',
            background: 'var(--color-card)',
            display: 'flex', flexDirection: 'column',
        }}>
            <div style={{ padding: '1rem 1rem 0.5rem' }}>
                <p style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-muted-fg)', margin: 0 }}>
                    Dashboard
                </p>
            </div>

            {loading && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                    <Loader2 size={18} style={{ color: 'var(--color-primary)', animation: 'spin 1s linear infinite' }} />
                </div>
            )}

            {!loading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {/* Stat cards row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', padding: '0.625rem 0.875rem' }}>
                        <div style={{ background: 'var(--color-background)', borderRadius: '0.75rem', padding: '0.75rem', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '4px', color: '#e97b5a' }}>
                                <Flame size={14} />
                                <span style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-muted-fg)' }}>Streak</span>
                            </div>
                            <p style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-serif)', margin: 0, color: stats?.current_streak > 0 ? '#e97b5a' : 'var(--color-muted-fg)' }}>
                                {stats?.current_streak ?? 0}
                            </p>
                            <p style={{ fontSize: '0.625rem', color: 'var(--color-muted-fg)', margin: 0 }}>days</p>
                        </div>
                        <div style={{ background: 'var(--color-background)', borderRadius: '0.75rem', padding: '0.75rem', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '4px' }}>
                                <BookOpen size={14} style={{ color: 'var(--color-primary)' }} />
                                <span style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-muted-fg)' }}>Entries</span>
                            </div>
                            <p style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-serif)', margin: 0, color: 'var(--color-primary)' }}>
                                {entryCount}
                            </p>
                            <p style={{ fontSize: '0.625rem', color: 'var(--color-muted-fg)', margin: 0 }}>total</p>
                        </div>
                    </div>

                    {/* Mood sparkline */}
                    {stats?.mood_sparkline?.some(d => d.mood !== null) && (
                        <div style={{ padding: '0.625rem 0.875rem', borderTop: '1px solid var(--color-border)' }}>
                            <p style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-muted-fg)', margin: '0 0 0.5rem' }}>7-day mood</p>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '48px' }}>
                                {stats.mood_sparkline.map((d, i) => {
                                    const h = d.mood ? Math.round(((d.mood - 1) / 9) * 48) : 0
                                    const c = d.mood ? moodColor(d.mood) : 'var(--color-muted)'
                                    return (
                                        <div key={i} title={d.mood ? `${d.date}: ${d.mood}` : d.date}
                                            style={{
                                                flex: 1, height: `${Math.max(h, 4)}px`,
                                                background: c, borderRadius: '3px',
                                                opacity: d.mood ? 1 : 0.3,
                                            }} />
                                    )
                                })}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.5625rem', color: 'var(--color-muted-fg)', marginTop: '3px' }}>
                                {stats.mood_sparkline.map(d => (
                                    <span key={d.date}>{new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'narrow' })}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Latest analysis */}
                    {stats?.latest_analysis && (
                        <div style={{ padding: '0.625rem 0.875rem', borderTop: '1px solid var(--color-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.5rem' }}>
                                <Sparkles size={13} style={{ color: 'var(--color-primary)' }} />
                                <p style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-muted-fg)', margin: 0 }}>Latest Insight</p>
                            </div>
                            {stats.latest_analysis.mood_score != null && (
                                <div style={{ marginBottom: '0.75rem' }}>
                                    <MoodArc score={stats.latest_analysis.mood_score} />
                                </div>
                            )}
                            {stats.latest_analysis.themes?.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.625rem' }}>
                                    {stats.latest_analysis.themes.slice(0, 4).map(t => (
                                        <span key={t} className="badge-primary" style={{ fontSize: '0.6875rem', textTransform: 'capitalize' }}>{t}</span>
                                    ))}
                                </div>
                            )}
                            {stats.latest_analysis.observation && (
                                <p style={{ fontSize: '0.8125rem', fontStyle: 'italic', color: 'var(--color-muted-fg)', lineHeight: 1.6, margin: 0 }}>
                                    "{stats.latest_analysis.observation}"
                                </p>
                            )}
                        </div>
                    )}

                    {/* No analysis yet */}
                    {!stats?.latest_analysis && !loading && (
                        <div style={{ padding: '1rem 0.875rem', borderTop: '1px solid var(--color-border)', textAlign: 'center' }}>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted-fg)', lineHeight: 1.6, margin: 0 }}>
                                Write your first entry to see AI insights here.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </aside>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Right panel: Entry AI analysis
// ─────────────────────────────────────────────────────────────────────────────
function EntryInsightPanel({ entryId }) {
    const [analysis, setAnalysis] = useState(null)
    const [loading, setLoading] = useState(true)
    const [polling, setPolling] = useState(false)

    useEffect(() => {
        if (!entryId) return
        setAnalysis(null); setLoading(true)

        function fetch() {
            getAnalysis(entryId)
                .then(data => {
                    setAnalysis(data)
                    setLoading(false)
                    if (!data.analyzed) {
                        setPolling(true)
                        setTimeout(fetch, 3500)
                    } else {
                        setPolling(false)
                    }
                })
                .catch(() => { setLoading(false) })
        }
        fetch()
    }, [entryId])

    const { mood_score, themes = [], distortions = [], observation, analyzed } = analysis ?? {}

    return (
        <aside style={{
            width: '260px', flexShrink: 0, overflowY: 'auto',
            borderLeft: '1px solid var(--color-border)',
            background: 'var(--color-card)',
            display: 'flex', flexDirection: 'column',
        }}>
            <div style={{ padding: '1rem 1rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={14} style={{ color: 'var(--color-primary)' }} />
                <p style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-muted-fg)', margin: 0 }}>
                    Insights
                </p>
                {polling && <Loader2 size={12} style={{ color: 'var(--color-primary)', animation: 'spin 1s linear infinite', marginLeft: 'auto' }} />}
            </div>

            {loading && (
                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    {[1, 0.6, 0.8].map((w, i) => (
                        <div key={i} style={{ height: '12px', background: 'var(--color-muted)', borderRadius: '6px', width: `${w * 100}%`, animation: 'pulse 1.5s ease-in-out infinite' }} />
                    ))}
                </div>
            )}

            {!loading && !analyzed && !polling && (
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted-fg)', padding: '1rem', lineHeight: 1.6 }}>
                    Analysis hasn't run yet for this entry. Save your entry to trigger it.
                </p>
            )}

            {!loading && polling && !analyzed && (
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted-fg)', padding: '1rem', lineHeight: 1.6, fontStyle: 'italic' }}>
                    Analysing your entry…
                </p>
            )}

            {!loading && analyzed && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {/* Mood arc */}
                    {mood_score != null && (
                        <div style={{ padding: '0.75rem 0.875rem', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                            <p style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-muted-fg)', margin: 0 }}>Mood Score</p>
                            <MoodArc score={mood_score} />
                        </div>
                    )}

                    {/* Themes */}
                    {themes.length > 0 && (
                        <div style={{ padding: '0.75rem 0.875rem', borderBottom: '1px solid var(--color-border)' }}>
                            <p style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-muted-fg)', margin: '0 0 0.5rem' }}>Themes</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                                {themes.map(t => (
                                    <span key={t} className="badge-primary" style={{ fontSize: '0.6875rem', textTransform: 'capitalize' }}>{t}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Cognitive patterns */}
                    <div style={{ padding: '0.75rem 0.875rem', borderBottom: '1px solid var(--color-border)' }}>
                        <p style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-muted-fg)', margin: '0 0 0.5rem' }}>Cognitive Patterns</p>
                        {distortions.length === 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                <span style={{ width: '16px', height: '16px', borderRadius: '9999px', background: 'oklch(0.50 0.10 170 / 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', color: 'var(--color-primary)' }}>✓</span>
                                <span style={{ fontSize: '0.8125rem', color: 'var(--color-muted-fg)' }}>No distortions flagged</span>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                                {distortions.map(d => {
                                    const label = d?.label ?? d
                                    return (
                                        <div key={label} style={{ borderRadius: '0.5rem', padding: '0.375rem 0.625rem', background: 'oklch(0.85 0.15 60 / 0.10)', border: '1px solid oklch(0.85 0.15 60 / 0.20)', display: 'flex', alignItems: 'flex-start', gap: '0.375rem' }}>
                                            <span style={{ color: '#e9a25a', fontSize: '0.75rem', marginTop: '1px' }}>⚠</span>
                                            <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-foreground)' }}>{label}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Observation */}
                    {observation && (
                        <div style={{ padding: '0.75rem 0.875rem' }}>
                            <p style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-muted-fg)', margin: '0 0 0.375rem' }}>Observation</p>
                            <p style={{ fontSize: '0.875rem', fontStyle: 'italic', color: 'var(--color-muted-fg)', lineHeight: 1.65, margin: 0 }}>
                                "{observation}"
                            </p>
                        </div>
                    )}
                </div>
            )}
        </aside>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Mood Picker
// ─────────────────────────────────────────────────────────────────────────────
function MoodPicker({ mood, onChange }) {
    const [open, setOpen] = useState(false)
    const selected = MOODS.find(m => m.value === mood)
    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <button onClick={() => setOpen(o => !o)} title="Set mood"
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.125rem', padding: '4px', borderRadius: '6px' }}>
                {selected ? selected.emoji : '🙂'}
            </button>
            {open && (
                <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
                    <div style={{
                        position: 'absolute', left: 0, top: '2rem', zIndex: 50,
                        background: 'var(--color-card)', border: '1px solid var(--color-border)',
                        borderRadius: '0.75rem', boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                        minWidth: '148px', overflow: 'hidden',
                    }}>
                        {MOODS.map(m => (
                            <button key={m.value} onClick={() => { onChange(mood === m.value ? '' : m.value); setOpen(false) }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    width: '100%', padding: '0.5rem 0.75rem', border: 'none',
                                    background: mood === m.value ? 'var(--color-muted)' : 'transparent',
                                    cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500,
                                    color: 'var(--color-foreground)', transition: 'background 0.1s',
                                }}
                                onMouseEnter={e => { if (mood !== m.value) e.currentTarget.style.background = 'var(--color-muted)' }}
                                onMouseLeave={e => { if (mood !== m.value) e.currentTarget.style.background = 'transparent' }}>
                                <span>{m.emoji}</span>{m.label}
                            </button>
                        ))}
                        {mood && (
                            <button onClick={() => { onChange(''); setOpen(false) }}
                                style={{ width: '100%', padding: '0.4rem 0.75rem', border: 'none', borderTop: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--color-muted-fg)' }}>
                                Clear mood
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Options menu
// ─────────────────────────────────────────────────────────────────────────────
function OptionsMenu({ onDelete }) {
    const [open, setOpen] = useState(false)
    return (
        <div style={{ position: 'relative' }}>
            <button onClick={() => setOpen(o => !o)} className="btn-icon" title="Options"><MoreHorizontal size={18} /></button>
            {open && (
                <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
                    <div style={{ position: 'absolute', right: 0, top: '2.25rem', zIndex: 50, background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '0.75rem', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', minWidth: '140px', overflow: 'hidden' }}>
                        <button onClick={() => { setOpen(false); onDelete() }}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.6rem 0.875rem', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-destructive)', fontSize: '0.875rem', fontWeight: 500 }}>
                            <Trash2 size={14} /> Delete
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline Editor (center panel)
// ─────────────────────────────────────────────────────────────────────────────
function InlineEditor({ entryId, isNew, onSaved, onDeleted }) {
    const [title, setTitle] = useState('')
    const [body, setBody] = useState('')
    const [mood, setMood] = useState('')
    const [loading, setLoading] = useState(!isNew)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)
    const [dirty, setDirty] = useState(false)
    const [dateLabel, setDateLabel] = useState(format(new Date(), 'EEEE, MMMM d, yyyy'))

    useEffect(() => {
        if (isNew) { setTitle(''); setBody(''); setMood(''); setDirty(false); setLoading(false); setDateLabel(format(new Date(), 'EEEE, MMMM d, yyyy')); return }
        setLoading(true)
        getEntry(entryId)
            .then(e => {
                const { title: t, mood: m, body: b } = unpackContent(e.content)
                setTitle(t); setMood(m); setBody(b); setDirty(false)
                setDateLabel(format(new Date(e.created_at), 'EEEE, MMMM d, yyyy'))
            })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false))
    }, [entryId, isNew])

    async function handleSave() {
        setSaving(true); setError(null)
        try {
            const packed = packContent(title, mood, body)
            if (isNew) { const e = await createEntry(packed); setDirty(false); onSaved(e) }
            else { const e = await updateEntry(entryId, packed); setDirty(false); onSaved(e) }
        } catch (e) { setError(e.message) } finally { setSaving(false) }
    }

    async function handleDelete() {
        if (!confirm('Delete this entry?')) return
        try { await deleteEntry(entryId); onDeleted() } catch (e) { setError(e.message) }
    }

    if (loading) return (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
        </div>
    )

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Top bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-muted-fg)', fontWeight: 500 }}>{dateLabel}</span>
                    <MoodPicker mood={mood} onChange={m => { setMood(m); setDirty(true) }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {!isNew && <OptionsMenu onDelete={handleDelete} />}
                    {error && <span style={{ fontSize: '0.8125rem', color: 'var(--color-destructive)' }}>{error}</span>}
                    <button onClick={handleSave} disabled={saving || (!dirty && !isNew)} className="btn-primary"
                        style={{ padding: '0.5rem 1.25rem', borderRadius: '9999px', fontSize: '0.875rem', opacity: (!dirty && !isNew) ? 0.45 : 1 }}>
                        {saving ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : isNew ? 'Save entry' : 'Update'}
                    </button>
                </div>
            </div>
            {/* Writing area */}
            <div style={{ flex: 1, overflow: 'auto', padding: '2.5rem 3rem' }}>
                <input placeholder="Entry title…" value={title}
                    onChange={e => { setTitle(e.target.value); setDirty(true) }}
                    style={{ width: '100%', border: 'none', outline: 'none', padding: 0, fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-foreground)', background: 'transparent', marginBottom: '0.875rem', lineHeight: 1.25 }} />
                <div style={{ height: '1px', background: 'var(--color-border)', marginBottom: '1.25rem' }} />
                <textarea placeholder="Start writing…" value={body}
                    onChange={e => { setBody(e.target.value); setDirty(true) }}
                    style={{ width: '100%', minHeight: '55vh', border: 'none', outline: 'none', resize: 'none', padding: 0, fontSize: '1rem', lineHeight: 1.8, color: 'var(--color-foreground)', background: 'transparent', fontFamily: 'var(--font-sans)' }} />
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar entry row
// ─────────────────────────────────────────────────────────────────────────────
function SidebarEntry({ entry, selected, onClick }) {
    const { title, mood } = unpackContent(entry.content)
    const moodObj = MOODS.find(m => m.value === mood)
    const timeAgo = isToday(new Date(entry.created_at))
        ? format(new Date(entry.created_at), 'HH:mm')
        : formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })
    return (
        <button onClick={onClick}
            style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                width: '100%', padding: '0.625rem 0.875rem', border: 'none',
                textAlign: 'left', cursor: 'pointer', transition: 'background 0.1s',
                background: selected ? 'oklch(0.50 0.10 170 / 0.08)' : 'transparent',
                borderLeft: selected ? '3px solid var(--color-primary)' : '3px solid transparent',
            }}
            onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'var(--color-muted)' }}
            onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: '0.8125rem', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: selected ? 'var(--color-primary)' : 'var(--color-foreground)' }}>
                    {title || 'Untitled'}
                </p>
                <p style={{ fontSize: '0.6875rem', color: 'var(--color-muted-fg)', margin: 0 }}>{timeAgo}</p>
            </div>
            {moodObj && <span style={{ fontSize: '0.9375rem', flexShrink: 0, marginTop: '2px' }}>{moodObj.emoji}</span>}
        </button>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Welcome panel (center, when nothing selected)
// ─────────────────────────────────────────────────────────────────────────────
function WelcomeCenter({ onNewEntry }) {
    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', textAlign: 'center' }}>
            <img src="/journal-hero.png" alt="Journal" style={{ width: '160px', opacity: 0.8, marginBottom: '1.25rem' }} />
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
                Select an entry to edit
            </h2>
            <p style={{ fontSize: '0.9375rem', color: 'var(--color-muted-fg)', lineHeight: 1.6, maxWidth: '18rem', margin: '0 0 1.5rem' }}>
                Choose an entry from the sidebar or start a fresh one.
            </p>
            <button onClick={onNewEntry} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={15} /> New entry
            </button>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard — three-panel layout
// ─────────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()

    const selectedId = searchParams.get('entry')
    const isNew = searchParams.get('new') === '1'

    const [entries, setEntries] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    const load = useCallback(() => {
        setLoading(true)
        getEntries().then(setEntries).catch(console.error).finally(() => setLoading(false))
    }, [])

    useEffect(() => { load() }, [load])

    async function signOut() { await supabase.auth.signOut(); navigate('/auth') }

    const filtered = useMemo(() =>
        entries.filter(e => !search || (e.content ?? '').toLowerCase().includes(search.toLowerCase()))
        , [entries, search])

    function selectEntry(id) { setSearchParams({ entry: id }) }
    function newEntry() { setSearchParams({ new: '1' }) }

    function handleSaved(saved) {
        load()
        if (isNew) setSearchParams({ entry: saved.id })
    }
    function handleDeleted() { setSearchParams({}); load() }

    return (
        <div style={{ display: 'flex', height: '100svh', background: 'var(--color-background)', overflow: 'hidden' }}>

            {/* ── Left sidebar: entry list ── */}
            <aside style={{ width: '260px', flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--color-border)', background: 'var(--color-card)', overflow: 'hidden' }}>
                {/* Brand */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 0.875rem 0.625rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-primary)' }}>
                        <BookOpen size={17} />
                        <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.02em' }}>vesper</span>
                    </div>
                    <button onClick={signOut} className="btn-icon" title="Sign out" style={{ width: '1.75rem', height: '1.75rem' }}>
                        <LogOut size={14} />
                    </button>
                </div>

                {/* New entry */}
                <div style={{ padding: '0 0.75rem 0.625rem' }}>
                    <button onClick={newEntry} className="btn-primary" style={{ width: '100%', borderRadius: '0.5rem', padding: '0.5rem 0', gap: '0.375rem', fontSize: '0.8125rem' }}>
                        <Plus size={13} /> New entry
                    </button>
                </div>

                {/* Search */}
                <div style={{ padding: '0 0.75rem 0.5rem', position: 'relative' }}>
                    <Search size={12} style={{ position: 'absolute', left: '1.375rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted-fg)', pointerEvents: 'none' }} />
                    <input className="input" style={{ paddingLeft: '2rem', fontSize: '0.8125rem', height: '2rem', borderRadius: '0.5rem' }}
                        placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>

                {/* Entry list */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem' }}><Loader2 size={16} style={{ color: 'var(--color-primary)', animation: 'spin 1s linear infinite' }} /></div>}
                    {!loading && filtered.length === 0 && (
                        <div style={{ padding: '1.5rem 0.875rem', textAlign: 'center' }}>
                            <BookMarked size={22} style={{ color: 'var(--color-muted-fg)', margin: '0 auto 0.5rem' }} />
                            <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted-fg)', lineHeight: 1.5, margin: 0 }}>
                                {search ? 'No matches.' : 'No entries yet.'}
                            </p>
                        </div>
                    )}
                    {!loading && filtered.map(e => (
                        <SidebarEntry key={e.id} entry={e} selected={e.id === selectedId} onClick={() => selectEntry(e.id)} />
                    ))}
                </div>

                {/* Bottom nav */}
                <div style={{ borderTop: '1px solid var(--color-border)', padding: '0.375rem 0.375rem 0.5rem' }}>
                    {[
                        { label: 'Drift', path: '/drift', Icon: BarChart2 },
                        { label: 'Reports', path: '/reports', Icon: FileText },
                    ].map(({ label, path, Icon }) => (
                        <button key={path} onClick={() => navigate(path)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.4rem 0.5rem', borderRadius: '0.4rem', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-muted-fg)', transition: 'background 0.1s, color 0.1s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-muted)'; e.currentTarget.style.color = 'var(--color-foreground)' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-muted-fg)' }}>
                            <Icon size={14} />{label}
                        </button>
                    ))}
                </div>
            </aside>

            {/* ── Center: editor or welcome ── */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minWidth: 0 }}>
                {!selectedId && !isNew && <WelcomeCenter onNewEntry={newEntry} />}
                {isNew && <InlineEditor key="new" isNew onSaved={handleSaved} onDeleted={handleDeleted} />}
                {selectedId && <InlineEditor key={selectedId} entryId={selectedId} isNew={false} onSaved={handleSaved} onDeleted={handleDeleted} />}
            </div>

            {/* ── Right: dashboard stats or entry insights ── */}
            {!selectedId && !isNew && <DashboardStatsPanel entryCount={entries.length} />}
            {(selectedId || isNew) && <EntryInsightPanel entryId={selectedId} />}

        </div>
    )
}
