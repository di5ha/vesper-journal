import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import {
    getEntries, getEntry, createEntry, updateEntry,
    deleteEntry, searchEntries, getAnalysis, getDashboardStats,
} from '../lib/api'
import {
    BookOpen, LogOut, Plus, Search, BookMarked,
    Loader2, Trash2, MoreHorizontal, BarChart2, FileText,
    Flame, Sparkles, X,
} from 'lucide-react'
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns'

// ─────────────────────────────────────────────────────────────────────────────
// Moods
// ─────────────────────────────────────────────────────────────────────────────
const MOODS = [
    { value: 'happy', emoji: '😊', label: 'Happy' },
    { value: 'calm', emoji: '😌', label: 'Calm' },
    { value: 'grateful', emoji: '🙏', label: 'Grateful' },
    { value: 'reflective', emoji: '🤔', label: 'Reflective' },
    { value: 'anxious', emoji: '😰', label: 'Anxious' },
    { value: 'sad', emoji: '😔', label: 'Sad' },
]

// Content stored as raw text (no title).
// Mood tag prepended if set: "[mood: happy]\n<body>"
function packContent(mood, body) {
    if (mood) return `[mood: ${mood}]\n${body}`
    return body
}

function unpackContent(raw) {
    if (!raw) return { mood: '', body: '' }
    // Old V-format with title (from previous iteration) — strip it
    if (raw.startsWith('[V]\n')) {
        const lines = raw.split('\n')
        const moodMatch = (lines[2] ?? '').match(/^\[mood: (\w+)\]$/)
        if (moodMatch) return { mood: moodMatch[1], body: lines.slice(3).join('\n').trimStart() }
        return { mood: '', body: lines.slice(2).join('\n').trimStart() }
    }
    // New format: optional [mood: xxx] on first line
    const moodMatch = raw.match(/^\[mood: (\w+)\]\n?/)
    if (moodMatch) return { mood: moodMatch[1], body: raw.slice(moodMatch[0].length) }
    return { mood: '', body: raw }
}

// Short display snippet for sidebar
function snippet(raw, maxLen = 72) {
    const { body } = unpackContent(raw)
    const text = body.replace(/\s+/g, ' ').trim()
    return text.length > maxLen ? text.slice(0, maxLen) + '…' : text || 'Empty entry'
}

function relativeDate(iso) {
    const d = new Date(iso)
    if (isToday(d)) return format(d, 'h:mm a')
    if (isYesterday(d)) return 'Yesterday'
    return format(d, 'MMM d')
}

function moodColor(score) {
    if (score == null) return 'var(--color-muted-fg)'
    const hue = Math.round(((score - 1) / 9) * 140)
    return `hsl(${hue},72%,48%)`
}

// ─────────────────────────────────────────────────────────────────────────────
// Mood Arc
// ─────────────────────────────────────────────────────────────────────────────
function MoodArc({ score }) {
    const pct = (score - 1) / 9
    const r = 48, cx = 60, cy = 60
    const startX = cx - r, startY = cy
    const angle = Math.PI - pct * Math.PI
    const endX = cx + r * Math.cos(Math.PI - angle)
    const endY = cy - r * Math.sin(angle)
    const large = pct > 0.5 ? 0 : 1
    const color = moodColor(score)
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <svg width="120" height="68" viewBox="0 0 120 72">
                <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                    fill="none" stroke="var(--color-muted)" strokeWidth="9" strokeLinecap="round" />
                {pct > 0.01 && <path d={`M ${startX} ${startY} A ${r} ${r} 0 ${large} 0 ${endX} ${endY}`}
                    fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" />}
                <text x={cx} y={cy + 14} textAnchor="middle" fill={color}
                    fontSize="22" fontWeight="700" fontFamily="var(--font-serif)">{score.toFixed(1)}</text>
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '5.5rem', fontSize: '0.5625rem', color: 'var(--color-muted-fg)', marginTop: '-2px' }}>
                <span>low</span><span>high</span>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard stats (right panel — home state)
// ─────────────────────────────────────────────────────────────────────────────
function DashboardStatsPanel({ entryCount }) {
    const [stats, setStats] = useState(null)

    useEffect(() => {
        getDashboardStats().then(setStats).catch(console.error)
    }, [])

    return (
        <aside style={{
            position: 'relative', zIndex: 1,
            width: '256px', flexShrink: 0, overflowY: 'auto',
            borderLeft: '1px solid rgba(200,195,185,0.5)',
            background: 'rgba(253,251,248,0.78)',
            backdropFilter: 'blur(22px) saturate(1.3)',
            WebkitBackdropFilter: 'blur(22px) saturate(1.3)',
        }}>
            <div style={{ padding: '1rem 1rem 0.5rem' }}>
                <p style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted-fg)', margin: 0 }}>Dashboard</p>
            </div>

            {!stats && <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem' }}><Loader2 size={16} style={{ color: 'var(--color-primary)', animation: 'spin 1s linear infinite' }} /></div>}

            {stats && (
                <>
                    {/* Stats grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', padding: '0.5rem 0.75rem' }}>
                        {[
                            { label: 'Streak', value: stats.current_streak, unit: 'days', color: stats.current_streak > 0 ? '#e97b5a' : 'var(--color-muted-fg)', icon: '🔥' },
                            { label: 'Entries', value: entryCount, unit: 'total', color: 'var(--color-primary)', icon: '📔' },
                        ].map(s => (
                            <div key={s.label} style={{
                                background: 'var(--color-background)', borderRadius: '0.75rem',
                                padding: '0.75rem 0.5rem', textAlign: 'center',
                                border: '1px solid var(--color-border)',
                            }}>
                                <span style={{ fontSize: '1rem', display: 'block', marginBottom: '3px' }}>{s.icon}</span>
                                <p style={{ fontSize: '1.375rem', fontWeight: 700, fontFamily: 'var(--font-serif)', margin: '0', color: s.color }}>{s.value}</p>
                                <p style={{ fontSize: '0.5625rem', color: 'var(--color-muted-fg)', margin: '1px 0 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.unit}</p>
                            </div>
                        ))}
                    </div>

                    {/* Sparkline */}
                    {stats.mood_sparkline?.some(d => d.mood != null) && (
                        <div style={{ padding: '0.625rem 0.75rem', borderTop: '1px solid var(--color-border)' }}>
                            <p style={{ fontSize: '0.5625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted-fg)', margin: '0 0 0.5rem' }}>7-day mood</p>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '40px' }}>
                                {stats.mood_sparkline.map((d, i) => {
                                    const h = d.mood ? Math.max(Math.round(((d.mood - 1) / 9) * 36), 4) : 4
                                    const c = d.mood ? moodColor(d.mood) : 'var(--color-muted)'
                                    return (
                                        <div key={i} title={d.mood ? `${d.date}: ${d.mood}` : 'No entry'}
                                            style={{ flex: 1, height: `${h}px`, background: c, borderRadius: '3px 3px 0 0', opacity: d.mood ? 1 : 0.25, transition: 'height 0.3s ease' }} />
                                    )
                                })}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
                                {stats.mood_sparkline.map(d => (
                                    <span key={d.date} style={{ fontSize: '0.5rem', color: 'var(--color-muted-fg)', flex: 1, textAlign: 'center' }}>
                                        {new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'narrow' })}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Latest insight */}
                    {stats.latest_analysis ? (
                        <div style={{ padding: '0.625rem 0.75rem', borderTop: '1px solid var(--color-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.5rem' }}>
                                <Sparkles size={12} style={{ color: 'var(--color-primary)' }} />
                                <p style={{ fontSize: '0.5625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted-fg)', margin: 0 }}>Latest Insight</p>
                            </div>
                            {stats.latest_analysis.mood_score != null && <div style={{ marginBottom: '0.625rem' }}><MoodArc score={stats.latest_analysis.mood_score} /></div>}
                            {stats.latest_analysis.themes?.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.5rem' }}>
                                    {stats.latest_analysis.themes.slice(0, 4).map(t => (
                                        <span key={t} className="badge-primary" style={{ fontSize: '0.625rem', textTransform: 'capitalize' }}>{t}</span>
                                    ))}
                                </div>
                            )}
                            {stats.latest_analysis.observation && (
                                <p style={{ fontSize: '0.8125rem', fontStyle: 'italic', color: 'var(--color-muted-fg)', lineHeight: 1.6, margin: 0 }}>
                                    "{stats.latest_analysis.observation}"
                                </p>
                            )}
                        </div>
                    ) : (
                        <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted-fg)', padding: '1rem 0.75rem', borderTop: '1px solid var(--color-border)', lineHeight: 1.6 }}>
                            Write your first entry to see AI insights here.
                        </p>
                    )}
                </>
            )}
        </aside>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry insights (right panel — entry open)
// ─────────────────────────────────────────────────────────────────────────────
function EntryInsightPanel({ entryId }) {
    const [analysis, setAnalysis] = useState(null)
    const [loading, setLoading] = useState(true)
    const [polling, setPolling] = useState(false)
    const timerRef = useRef(null)

    useEffect(() => {
        if (!entryId) return
        setAnalysis(null); setLoading(true); setPolling(false)
        clearTimeout(timerRef.current)

        function fetch() {
            getAnalysis(entryId)
                .then(data => {
                    setAnalysis(data); setLoading(false)
                    if (!data.analyzed) { setPolling(true); timerRef.current = setTimeout(fetch, 3500) }
                    else setPolling(false)
                })
                .catch(() => setLoading(false))
        }
        fetch()
        return () => clearTimeout(timerRef.current)
    }, [entryId])

    const { mood_score, themes = [], distortions = [], observation, analyzed } = analysis ?? {}

    return (
        <aside style={{ position: 'relative', zIndex: 1, width: '256px', flexShrink: 0, overflowY: 'auto', borderLeft: '1px solid rgba(200,195,185,0.5)', background: 'rgba(253,251,248,0.78)', backdropFilter: 'blur(22px) saturate(1.3)', WebkitBackdropFilter: 'blur(22px) saturate(1.3)' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '1rem 0.875rem 0.5rem' }}>
                <Sparkles size={13} style={{ color: 'var(--color-primary)' }} />
                <p style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted-fg)', margin: 0 }}>Insights</p>
                {polling && <Loader2 size={11} style={{ color: 'var(--color-primary)', animation: 'spin 1s linear infinite', marginLeft: 'auto' }} />}
            </div>

            {loading && (
                <div style={{ padding: '1rem 0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {[100, 60, 80, 45].map((w, i) => (
                        <div key={i} style={{ height: '10px', background: 'var(--color-muted)', borderRadius: '6px', width: `${w}%`, animation: 'pulse 1.5s ease-in-out infinite' }} />
                    ))}
                </div>
            )}
            {!loading && !analyzed && (
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted-fg)', padding: '0.875rem', lineHeight: 1.6, fontStyle: polling ? 'italic' : 'normal' }}>
                    {polling ? 'Analysing your entry…' : 'Save the entry to trigger AI analysis.'}
                </p>
            )}
            {!loading && analyzed && (
                <div>
                    {mood_score != null && (
                        <div style={{ padding: '0.625rem 0.875rem', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <p style={{ fontSize: '0.5625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted-fg)', margin: '0 0 0.25rem' }}>Mood Score</p>
                            <MoodArc score={mood_score} />
                        </div>
                    )}
                    {themes.length > 0 && (
                        <div style={{ padding: '0.625rem 0.875rem', borderBottom: '1px solid var(--color-border)' }}>
                            <p style={{ fontSize: '0.5625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted-fg)', margin: '0 0 0.4rem' }}>Themes</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                                {themes.map(t => <span key={t} className="badge-primary" style={{ fontSize: '0.625rem', textTransform: 'capitalize' }}>{t}</span>)}
                            </div>
                        </div>
                    )}
                    <div style={{ padding: '0.625rem 0.875rem', borderBottom: '1px solid var(--color-border)' }}>
                        <p style={{ fontSize: '0.5625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted-fg)', margin: '0 0 0.4rem' }}>Cognitive Patterns</p>
                        {distortions.length === 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                <span style={{ width: '15px', height: '15px', borderRadius: '9999px', background: 'oklch(0.50 0.10 170 / 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5625rem', color: 'var(--color-primary)' }}>✓</span>
                                <span style={{ fontSize: '0.8125rem', color: 'var(--color-muted-fg)' }}>None flagged</span>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                {distortions.map(d => {
                                    const label = d?.label ?? d
                                    return (
                                        <div key={label} style={{ borderRadius: '0.5rem', padding: '0.3rem 0.5rem', background: 'oklch(0.85 0.15 60 / 0.08)', border: '1px solid oklch(0.85 0.15 60 / 0.18)', display: 'flex', gap: '0.375rem' }}>
                                            <span style={{ color: '#e9a25a', fontSize: '0.6875rem' }}>⚠</span>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-foreground)' }}>{label}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                    {observation && (
                        <div style={{ padding: '0.625rem 0.875rem' }}>
                            <p style={{ fontSize: '0.5625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted-fg)', margin: '0 0 0.375rem' }}>Observation</p>
                            <p style={{ fontSize: '0.8125rem', fontStyle: 'italic', color: 'var(--color-muted-fg)', lineHeight: 1.65, margin: 0 }}>"{observation}"</p>
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
        <div style={{ position: 'relative' }}>
            <button onClick={() => setOpen(o => !o)} title="Set mood"
                style={{
                    display: 'flex', alignItems: 'center', gap: '0.375rem',
                    background: mood ? 'oklch(0.50 0.10 170 / 0.10)' : 'var(--color-muted)',
                    border: 'none', borderRadius: '9999px', cursor: 'pointer',
                    padding: '0.3rem 0.625rem', fontSize: '0.8125rem', fontWeight: 600,
                    color: mood ? 'var(--color-primary)' : 'var(--color-muted-fg)',
                    transition: 'all 0.15s',
                }}>
                {selected ? <>{selected.emoji} {selected.label}</> : '🙂 Mood'}
            </button>
            {open && (
                <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
                    <div style={{ position: 'absolute', left: 0, top: '2.25rem', zIndex: 50, background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '0.875rem', boxShadow: '0 12px 40px rgba(0,0,0,0.12)', minWidth: '158px', overflow: 'hidden' }}>
                        {MOODS.map(m => (
                            <button key={m.value} onClick={() => { onChange(mood === m.value ? '' : m.value); setOpen(false) }}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.5rem 0.75rem', border: 'none', background: mood === m.value ? 'oklch(0.50 0.10 170 / 0.10)' : 'transparent', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, color: mood === m.value ? 'var(--color-primary)' : 'var(--color-foreground)', transition: 'background 0.1s' }}
                                onMouseEnter={e => { if (mood !== m.value) e.currentTarget.style.background = 'var(--color-muted)' }}
                                onMouseLeave={e => { if (mood !== m.value) e.currentTarget.style.background = 'transparent' }}>
                                <span>{m.emoji}</span>{m.label}
                            </button>
                        ))}
                        {mood && <button onClick={() => { onChange(''); setOpen(false) }} style={{ width: '100%', padding: '0.4rem 0.75rem', border: 'none', borderTop: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--color-muted-fg)' }}>Clear</button>}
                    </div>
                </>
            )}
        </div>
    )
}

// Options menu
function OptionsMenu({ onDelete }) {
    const [open, setOpen] = useState(false)
    return (
        <div style={{ position: 'relative' }}>
            <button onClick={() => setOpen(o => !o)} className="btn-icon" title="Options"><MoreHorizontal size={16} /></button>
            {open && (
                <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
                    <div style={{ position: 'absolute', right: 0, top: '2.25rem', zIndex: 50, background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: '0.75rem', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', minWidth: '130px', overflow: 'hidden' }}>
                        <button onClick={() => { setOpen(false); onDelete() }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.6rem 0.875rem', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-destructive)', fontSize: '0.875rem', fontWeight: 500 }}>
                            <Trash2 size={13} /> Delete
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline editor (NO title — content only)
// ─────────────────────────────────────────────────────────────────────────────
function InlineEditor({ entryId, isNew, onSaved, onDeleted }) {
    const [body, setBody] = useState('')
    const [mood, setMood] = useState('')
    const [loading, setLoading] = useState(!isNew)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)
    const [dirty, setDirty] = useState(false)
    const [dateLabel, setDateLabel] = useState(format(new Date(), 'EEEE, MMMM d'))

    useEffect(() => {
        if (isNew) { setBody(''); setMood(''); setDirty(false); setLoading(false); setDateLabel(format(new Date(), 'EEEE, MMMM d')); return }
        setLoading(true)
        getEntry(entryId)
            .then(e => {
                const { mood: m, body: b } = unpackContent(e.content)
                setMood(m); setBody(b); setDirty(false)
                setDateLabel(format(new Date(e.created_at), 'EEEE, MMMM d'))
            })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false))
    }, [entryId, isNew])

    async function handleSave() {
        setSaving(true); setError(null)
        try {
            const packed = packContent(mood, body)
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.75rem', borderBottom: '1px solid var(--color-border)', flexShrink: 0, gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-foreground)' }}>{dateLabel}</span>
                    <MoodPicker mood={mood} onChange={m => { setMood(m); setDirty(true) }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {error && <span style={{ fontSize: '0.8125rem', color: 'var(--color-destructive)', flexShrink: 0 }}>{error}</span>}
                    {!isNew && <OptionsMenu onDelete={handleDelete} />}
                    <button onClick={handleSave} disabled={saving || (!dirty && !isNew)} className="btn-primary"
                        style={{ padding: '0.4375rem 1.25rem', borderRadius: '9999px', fontSize: '0.875rem', opacity: (!dirty && !isNew) ? 0.4 : 1 }}>
                        {saving ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : isNew ? 'Save' : 'Update'}
                    </button>
                </div>
            </div>

            {/* Writing area */}
            <div style={{ flex: 1, overflow: 'auto', padding: '2.5rem 4rem' }}>
                <textarea
                    autoFocus
                    placeholder="What's on your mind today?"
                    value={body}
                    onChange={e => { setBody(e.target.value); setDirty(true) }}
                    style={{
                        width: '100%', minHeight: '65vh', border: 'none', outline: 'none',
                        resize: 'none', padding: 0,
                        fontSize: '1.0625rem', lineHeight: 1.85,
                        color: 'var(--color-foreground)', background: 'transparent',
                        fontFamily: 'var(--font-sans)',
                    }}
                />
            </div>

            {/* Word count */}
            <div style={{ padding: '0.5rem 4rem', borderTop: '1px solid var(--color-border)', flexShrink: 0 }}>
                <span style={{ fontSize: '0.6875rem', color: 'var(--color-muted-fg)' }}>
                    {body.trim() ? body.trim().split(/\s+/).length : 0} words
                </span>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar entry row
// ─────────────────────────────────────────────────────────────────────────────
function SidebarEntry({ entry, selected, onClick, score }) {
    const { mood } = unpackContent(entry.content)
    const moodObj = MOODS.find(m => m.value === mood)
    const text = snippet(entry.content)

    return (
        <button onClick={onClick}
            style={{
                display: 'block', width: '100%', padding: '0.625rem 0.875rem',
                border: 'none', textAlign: 'left', cursor: 'pointer',
                background: selected ? 'oklch(0.50 0.10 170 / 0.09)' : 'transparent',
                borderLeft: `3px solid ${selected ? 'var(--color-primary)' : 'transparent'}`,
                transition: 'background 0.12s, border-color 0.12s',
            }}
            onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'var(--color-muted)' }}
            onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent' }}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: selected ? 'var(--color-primary)' : 'var(--color-muted-fg)' }}>
                    {relativeDate(entry.created_at)}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    {score != null && (
                        <span style={{
                            fontSize: '0.5625rem', fontWeight: 700, padding: '1px 5px',
                            borderRadius: '9999px', background: 'oklch(0.50 0.10 170 / 0.12)',
                            color: 'var(--color-primary)', letterSpacing: '0.03em',
                        }}>
                            {Math.round(score * 100)}%
                        </span>
                    )}
                    {moodObj && <span style={{ fontSize: '0.8125rem' }}>{moodObj.emoji}</span>}
                </div>
            </div>

            <p style={{
                fontSize: '0.8125rem', color: selected ? 'var(--color-foreground)' : 'var(--color-muted-fg)',
                margin: 0, lineHeight: 1.45,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                fontWeight: selected ? 500 : 400,
            }}>
                {text}
            </p>
        </button>
    )
}

// Welcome center
function WelcomeCenter({ onNewEntry }) {
    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', textAlign: 'center', background: 'var(--color-background)' }}>
            <img src="/journal-hero.png" alt="Journal" style={{ width: '148px', opacity: 0.75, marginBottom: '1.25rem' }} />
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem' }}>Select an entry to edit</h2>
            <p style={{ fontSize: '0.9375rem', color: 'var(--color-muted-fg)', lineHeight: 1.6, maxWidth: '17rem', margin: '0 0 1.5rem' }}>
                Choose an entry from the sidebar or write something new.
            </p>
            <button onClick={onNewEntry} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={14} /> New entry
            </button>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard — three-panel
// ─────────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()

    const selectedId = searchParams.get('entry')
    const isNew = searchParams.get('new') === '1'

    const [entries, setEntries] = useState([])
    const [loadingList, setLoadingList] = useState(true)
    const [query, setQuery] = useState('')
    const [searchResults, setSearchResults] = useState(null)   // null = not searching
    const [searching, setSearching] = useState(false)
    const debounceRef = useRef(null)

    const load = useCallback(() => {
        setLoadingList(true)
        getEntries().then(setEntries).catch(console.error).finally(() => setLoadingList(false))
    }, [])
    useEffect(() => { load() }, [load])

    // Debounced semantic search
    useEffect(() => {
        clearTimeout(debounceRef.current)
        if (!query.trim()) { setSearchResults(null); setSearching(false); return }
        setSearching(true)
        debounceRef.current = setTimeout(() => {
            searchEntries(query, 10)
                .then(results => setSearchResults(results))
                .catch(() => setSearchResults([]))
                .finally(() => setSearching(false))
        }, 450)
        return () => clearTimeout(debounceRef.current)
    }, [query])

    async function signOut() { await supabase.auth.signOut(); navigate('/auth') }

    // What to show in sidebar list
    const listItems = searchResults !== null
        ? searchResults.map(r => ({ entry: r, score: r.score }))
        : entries.map(e => ({ entry: e, score: null }))

    function selectEntry(id) { setSearchParams({ entry: id }) }
    function newEntry() { setSearchParams({ new: '1' }) }

    function handleSaved(saved) {
        load()
        if (isNew) setSearchParams({ entry: saved.id })
    }
    function handleDeleted() { setSearchParams({}); load() }

    return (
        <div style={{ position: 'relative', display: 'flex', height: '100svh', overflow: 'hidden', background: 'oklch(0.975 0.005 75)' }}>

            {/* ── Blob background ── */}
            <div className="blob-scene">
                <div className="blob blob-teal" style={{ width: '650px', height: '650px', top: '-15%', left: '-10%' }} />
                <div className="blob blob-sage" style={{ width: '700px', height: '700px', top: '30%', right: '-15%' }} />
                <div className="blob blob-amber" style={{ width: '420px', height: '420px', bottom: '-5%', left: '25%' }} />
                <div className="blob blob-blush" style={{ width: '500px', height: '500px', top: '-10%', right: '20%' }} />
                <div className="blob blob-deep" style={{ width: '800px', height: '800px', bottom: '-20%', left: '40%' }} />
            </div>

            {/* ── Left sidebar ── */}
            <aside style={{
                position: 'relative', zIndex: 1,
                width: '256px', flexShrink: 0, display: 'flex', flexDirection: 'column',
                borderRight: '1px solid rgba(200,195,185,0.5)',
                background: 'rgba(253,251,248,0.75)',
                backdropFilter: 'blur(22px) saturate(1.3)',
                WebkitBackdropFilter: 'blur(22px) saturate(1.3)',
                overflow: 'hidden',
            }}>

                {/* Brand row */}
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
                    <button onClick={newEntry} className="btn-primary"
                        style={{ width: '100%', borderRadius: '0.5rem', padding: '0.5rem 0', gap: '0.375rem', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Plus size={13} /> New entry
                    </button>
                </div>

                {/* Semantic search */}
                <div style={{ padding: '0 0.75rem 0.5rem', position: 'relative' }}>
                    <Search size={12} style={{ position: 'absolute', left: '1.375rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted-fg)', pointerEvents: 'none' }} />
                    <input className="input"
                        style={{ paddingLeft: '2rem', paddingRight: query ? '2rem' : '0.75rem', fontSize: '0.8125rem', height: '2rem', borderRadius: '0.5rem' }}
                        placeholder="Search entries…"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
                    {query && (
                        <button onClick={() => { setQuery(''); setSearchResults(null) }}
                            style={{ position: 'absolute', right: '1.375rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-muted-fg)', padding: 0, display: 'flex' }}>
                            <X size={12} />
                        </button>
                    )}
                </div>

                {/* Search hint banner */}
                {query && (
                    <div style={{ margin: '0 0.75rem 0.375rem', padding: '0.3rem 0.625rem', borderRadius: '0.4rem', background: 'oklch(0.50 0.10 170 / 0.08)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        {searching
                            ? <Loader2 size={10} style={{ color: 'var(--color-primary)', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                            : <Search size={10} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />}
                        <span style={{ fontSize: '0.625rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                            {searching ? 'Searching…' : searchResults ? `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''} · similarity` : ''}
                        </span>
                    </div>
                )}

                {/* Entry list */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {(loadingList || searching) && !listItems.length && (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem' }}>
                            <Loader2 size={16} style={{ color: 'var(--color-primary)', animation: 'spin 1s linear infinite' }} />
                        </div>
                    )}
                    {!loadingList && !searching && listItems.length === 0 && (
                        <div style={{ padding: '1.5rem 0.875rem', textAlign: 'center' }}>
                            <BookMarked size={22} style={{ color: 'var(--color-muted-fg)', margin: '0 auto 0.5rem' }} />
                            <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted-fg)', lineHeight: 1.5, margin: 0 }}>
                                {query ? 'No similar entries found.' : 'No entries yet.'}
                            </p>
                        </div>
                    )}
                    {listItems.map(({ entry, score }) => (
                        <SidebarEntry
                            key={entry.id}
                            entry={entry}
                            selected={entry.id === selectedId}
                            onClick={() => selectEntry(entry.id)}
                            score={score}
                        />
                    ))}
                </div>

                {/* Bottom nav */}
                <div style={{ borderTop: '1px solid var(--color-border)', padding: '0.375rem' }}>
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

            {/* ── Center ── */}
            <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', overflow: 'hidden', minWidth: 0, background: 'rgba(250,248,244,0.60)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
                {!selectedId && !isNew && <WelcomeCenter onNewEntry={newEntry} />}
                {isNew && <InlineEditor key="new" isNew onSaved={handleSaved} onDeleted={handleDeleted} />}
                {selectedId && <InlineEditor key={selectedId} entryId={selectedId} isNew={false} onSaved={handleSaved} onDeleted={handleDeleted} />}
            </div>

            {/* ── Right panel ── */}
            {!selectedId && !isNew && <DashboardStatsPanel entryCount={entries.length} />}
            {(selectedId || isNew) && <EntryInsightPanel entryId={selectedId} />}
        </div>
    )
}

