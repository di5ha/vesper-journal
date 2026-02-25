import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { getEntries, getEntry, createEntry, updateEntry, deleteEntry } from '../lib/api'
import {
    BookOpen, LogOut, Plus, Search, BookMarked,
    Loader2, ArrowRight, Trash2, MoreHorizontal,
    BarChart2, FileText,
} from 'lucide-react'
import { format, isToday, formatDistanceToNow } from 'date-fns'

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

// ─────────────────────────────────────────────────────────────────────────────
// Content format helpers
// New entries are stored as:
//   [V]\n<title>\n[mood: xxx]\n<body>   — if mood set
//   [V]\n<title>\n<body>               — if no mood
// Old entries (no [V] sentinel): treat everything as body, title = ''
// ─────────────────────────────────────────────────────────────────────────────
function packContent(title, mood, body) {
    const parts = ['[V]', title.trim()]
    if (mood) parts.push(`[mood: ${mood}]`)
    parts.push(body)
    return parts.join('\n')
}

function unpackContent(raw) {
    if (!raw) return { title: '', mood: '', body: '' }
    const lines = raw.split('\n')
    if (lines[0] !== '[V]') {
        // Old format: whole thing is body
        return { title: '', mood: '', body: raw }
    }
    const title = lines[1] ?? ''
    const moodMatch = (lines[2] ?? '').match(/^\[mood: (\w+)\]$/)
    if (moodMatch) {
        return { title, mood: moodMatch[1], body: lines.slice(3).join('\n').trimStart() }
    }
    return { title, mood: '', body: lines.slice(2).join('\n').trimStart() }
}

// ─────────────────────────────────────────────────────────────────────────────
// Mood picker (emoji grid)
// ─────────────────────────────────────────────────────────────────────────────
function MoodPicker({ mood, onChange }) {
    const [open, setOpen] = useState(false)
    const selected = MOODS.find(m => m.value === mood)
    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <button onClick={() => setOpen(o => !o)} title="Set mood"
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.125rem', padding: '4px', borderRadius: '6px', transition: 'background 0.1s' }}>
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
                                style={{
                                    width: '100%', padding: '0.4rem 0.75rem', border: 'none',
                                    borderTop: '1px solid var(--color-border)', background: 'transparent',
                                    cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--color-muted-fg)',
                                }}>
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
// Options menu (delete)
// ─────────────────────────────────────────────────────────────────────────────
function OptionsMenu({ onDelete, deleting }) {
    const [open, setOpen] = useState(false)
    return (
        <div style={{ position: 'relative' }}>
            <button onClick={() => setOpen(o => !o)} className="btn-icon" title="Options">
                <MoreHorizontal size={18} />
            </button>
            {open && (
                <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
                    <div style={{
                        position: 'absolute', right: 0, top: '2.25rem', zIndex: 50,
                        background: 'var(--color-card)', border: '1px solid var(--color-border)',
                        borderRadius: '0.75rem', boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                        minWidth: '140px', overflow: 'hidden',
                    }}>
                        <button onClick={() => { setOpen(false); onDelete() }} disabled={deleting}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                width: '100%', padding: '0.6rem 0.875rem', border: 'none',
                                background: 'transparent', cursor: 'pointer',
                                color: 'var(--color-destructive)', fontSize: '0.875rem', fontWeight: 500,
                            }}>
                            <Trash2 size={14} /> {deleting ? 'Deleting…' : 'Delete'}
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline Entry Editor (shown in main panel)
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

    // Load existing entry
    useEffect(() => {
        if (isNew) {
            setTitle(''); setBody(''); setMood('')
            setDateLabel(format(new Date(), 'EEEE, MMMM d, yyyy'))
            setDirty(false); setLoading(false)
            return
        }
        setLoading(true)
        getEntry(entryId)
            .then(entry => {
                const { title: t, mood: m, body: b } = unpackContent(entry.content)
                setTitle(t); setMood(m); setBody(b)
                setDateLabel(format(new Date(entry.created_at), 'EEEE, MMMM d, yyyy'))
                setDirty(false)
            })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false))
    }, [entryId, isNew])

    function markDirty() { setDirty(true) }

    async function handleSave() {
        setSaving(true); setError(null)
        try {
            const packed = packContent(title, mood, body)
            if (isNew) {
                const entry = await createEntry(packed)
                setDirty(false)
                onSaved(entry)
            } else {
                const entry = await updateEntry(entryId, packed)
                setDirty(false)
                onSaved(entry)
            }
        } catch (e) {
            setError(e.message)
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete() {
        if (!confirm('Delete this entry permanently?')) return
        try {
            await deleteEntry(entryId)
            onDeleted()
        } catch (e) {
            setError(e.message)
        }
    }

    if (loading) return (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
        </div>
    )

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* Editor top bar */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.875rem 1.5rem', borderBottom: '1px solid var(--color-border)',
                flexShrink: 0,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-muted-fg)', fontWeight: 500 }}>
                        {dateLabel}
                    </span>
                    <MoodPicker mood={mood} onChange={(m) => { setMood(m); markDirty() }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {!isNew && <OptionsMenu onDelete={handleDelete} deleting={false} />}
                    {error && <span style={{ fontSize: '0.8125rem', color: 'var(--color-destructive)' }}>{error}</span>}
                    <button onClick={handleSave} disabled={saving || !dirty} className="btn-primary"
                        style={{ padding: '0.5rem 1.25rem', borderRadius: '9999px', fontSize: '0.875rem', opacity: (!dirty && !isNew) ? 0.5 : 1 }}>
                        {saving ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : isNew ? 'Save entry' : 'Update'}
                    </button>
                </div>
            </div>

            {/* Writing area */}
            <div style={{ flex: 1, overflow: 'auto', padding: '2rem 3rem' }}>
                <input
                    placeholder="Entry title…"
                    value={title}
                    onChange={e => { setTitle(e.target.value); markDirty() }}
                    style={{
                        width: '100%', border: 'none', outline: 'none', padding: 0,
                        fontFamily: 'var(--font-serif)', fontSize: '1.75rem', fontWeight: 700,
                        color: 'var(--color-foreground)', background: 'transparent',
                        marginBottom: '1rem', lineHeight: 1.3,
                    }}
                />
                <textarea
                    placeholder="Start writing your thoughts…"
                    value={body}
                    onChange={e => { setBody(e.target.value); markDirty() }}
                    style={{
                        width: '100%', minHeight: '60vh', border: 'none', outline: 'none',
                        resize: 'none', padding: 0,
                        fontSize: '1rem', lineHeight: 1.8,
                        color: 'var(--color-foreground)', background: 'transparent',
                        fontFamily: 'var(--font-sans)',
                    }}
                />
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Welcome / empty state for main panel
// ─────────────────────────────────────────────────────────────────────────────
function WelcomePanel({ onNewEntry }) {
    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', textAlign: 'center' }}>
            <img src="/journal-hero.png" alt="Journaling" style={{ width: '180px', opacity: 0.85, marginBottom: '1.5rem' }} />
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.375rem', fontWeight: 700, margin: '0 0 0.5rem', color: 'var(--color-foreground)' }}>
                Select an entry or start a new one
            </h2>
            <p style={{ fontSize: '0.9375rem', color: 'var(--color-muted-fg)', maxWidth: '20rem', lineHeight: 1.6, margin: '0 0 2rem' }}>
                Pick an entry from the sidebar to read or edit it, or create a new entry to capture today's thoughts.
            </p>
            <button onClick={onNewEntry} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={16} /> New entry
            </button>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar entry row
// ─────────────────────────────────────────────────────────────────────────────
function SidebarEntry({ entry, selected, onClick }) {
    const { title, mood } = unpackContent(entry.content)
    const moodObj = MOODS.find(m => m.value === mood)
    const displayTitle = title || 'Untitled'
    const timeAgo = isToday(new Date(entry.created_at))
        ? format(new Date(entry.created_at), 'HH:mm')
        : formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })

    return (
        <button onClick={onClick}
            style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.625rem',
                width: '100%', padding: '0.75rem 1rem', border: 'none',
                textAlign: 'left', cursor: 'pointer', transition: 'background 0.1s',
                background: selected ? 'oklch(0.50 0.10 170 / 0.08)' : 'transparent',
                borderLeft: selected ? '3px solid var(--color-primary)' : '3px solid transparent',
            }}
            onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'var(--color-muted)' }}
            onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: '0.875rem', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: selected ? 'var(--color-primary)' : 'var(--color-foreground)' }}>
                    {displayTitle}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-muted-fg)', margin: 0 }}>{timeAgo}</p>
            </div>
            {moodObj && <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: '2px' }}>{moodObj.emoji}</span>}
        </button>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard — two-panel layout
// ─────────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()

    const selectedId = searchParams.get('entry')   // uuid or null
    const isNew = searchParams.get('new') === '1'

    const [entries, setEntries] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    const firstName = user?.email?.split('@')[0] ?? 'there'

    const load = useCallback(() => {
        setLoading(true)
        getEntries()
            .then(setEntries)
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => { load() }, [load])

    async function signOut() {
        await supabase.auth.signOut()
        navigate('/auth')
    }

    const filtered = useMemo(() =>
        entries.filter(e =>
            !search || (e.content ?? '').toLowerCase().includes(search.toLowerCase())
        ), [entries, search])

    function selectEntry(id) { setSearchParams({ entry: id }) }
    function newEntry() { setSearchParams({ new: '1' }) }
    function clearSelection() { setSearchParams({}) }

    // After save: refresh list, keep entry selected
    function handleSaved(savedEntry) {
        load()
        if (isNew) setSearchParams({ entry: savedEntry.id })
    }

    // After delete: clear selection + refresh
    function handleDeleted() {
        clearSelection()
        load()
    }

    return (
        <div style={{ display: 'flex', height: '100svh', background: 'var(--color-background)', overflow: 'hidden' }}>

            {/* ───────────── Sidebar ───────────── */}
            <aside style={{
                width: '280px', flexShrink: 0,
                display: 'flex', flexDirection: 'column',
                borderRight: '1px solid var(--color-border)',
                background: 'var(--color-card)',
                overflow: 'hidden',
            }}>
                {/* Brand + sign out */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1rem 0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
                        <BookOpen size={18} />
                        <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.0625rem', fontWeight: 700, letterSpacing: '-0.02em' }}>vesper</span>
                    </div>
                    <button onClick={signOut} className="btn-icon" title="Sign out" style={{ width: '1.875rem', height: '1.875rem' }}>
                        <LogOut size={15} />
                    </button>
                </div>

                {/* New entry btn */}
                <div style={{ padding: '0.5rem 0.875rem 0.75rem' }}>
                    <button onClick={newEntry} className="btn-primary" style={{ width: '100%', justifyContent: 'center', borderRadius: '0.625rem', padding: '0.5625rem 0', gap: '0.375rem', fontSize: '0.875rem' }}>
                        <Plus size={15} /> New entry
                    </button>
                </div>

                {/* Search */}
                <div style={{ padding: '0 0.875rem 0.625rem', position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '1.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted-fg)', pointerEvents: 'none' }} />
                    <input className="input" style={{ paddingLeft: '2.25rem', fontSize: '0.875rem', height: '2.25rem', borderRadius: '0.625rem' }}
                        placeholder="Search entries" value={search} onChange={e => setSearch(e.target.value)} />
                </div>

                {/* Entry list */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {loading && (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                            <Loader2 size={18} style={{ color: 'var(--color-primary)', animation: 'spin 1s linear infinite' }} />
                        </div>
                    )}

                    {!loading && filtered.length === 0 && (
                        <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
                            <BookMarked size={28} style={{ color: 'var(--color-muted-fg)', margin: '0 auto 0.625rem' }} />
                            <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted-fg)', lineHeight: 1.5 }}>
                                {search ? 'No entries match your search.' : 'No entries yet. Write your first one!'}
                            </p>
                        </div>
                    )}

                    {!loading && filtered.map(e => (
                        <SidebarEntry
                            key={e.id}
                            entry={e}
                            selected={e.id === selectedId}
                            onClick={() => selectEntry(e.id)}
                        />
                    ))}
                </div>

                {/* Bottom nav: Drift & Reports */}
                <div style={{ borderTop: '1px solid var(--color-border)', padding: '0.5rem 0.5rem' }}>
                    {[
                        { label: 'Drift', path: '/drift', icon: BarChart2 },
                        { label: 'Reports', path: '/reports', icon: FileText },
                    ].map(({ label, path, icon: Icon }) => (
                        <button key={path} onClick={() => navigate(path)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                width: '100%', padding: '0.5rem 0.5rem', borderRadius: '0.5rem',
                                border: 'none', background: 'transparent', cursor: 'pointer',
                                fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-muted-fg)',
                                transition: 'background 0.1s, color 0.1s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-muted)'; e.currentTarget.style.color = 'var(--color-foreground)' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-muted-fg)' }}>
                            <Icon size={15} />
                            {label}
                        </button>
                    ))}
                </div>
            </aside>

            {/* ───────────── Main panel ───────────── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {!selectedId && !isNew && <WelcomePanel onNewEntry={newEntry} />}
                {isNew && (
                    <InlineEditor
                        key="new"
                        isNew
                        onSaved={handleSaved}
                        onDeleted={handleDeleted}
                    />
                )}
                {selectedId && (
                    <InlineEditor
                        key={selectedId}
                        entryId={selectedId}
                        isNew={false}
                        onSaved={handleSaved}
                        onDeleted={handleDeleted}
                    />
                )}
            </div>
        </div>
    )
}
