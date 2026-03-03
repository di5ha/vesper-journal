import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getEntry, createEntry, updateEntry, deleteEntry } from '../lib/api'
import { ArrowLeft, MoreHorizontal, Loader2, Trash2, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'


// ─────────────────────────────────────────────────────────────────────────────
// Options menu (delete)
// ─────────────────────────────────────────────────────────────────────────────
function OptionsMenu({ onDelete, deleting }) {
    const [open, setOpen] = useState(false)
    return (
        <div style={{ position: 'relative' }}>
            <button onClick={() => setOpen(o => !o)} className="btn-icon" title="Options">
                <MoreHorizontal size={20} />
            </button>
            {open && (
                <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
                    <div style={{
                        position: 'absolute', right: 0, top: '2.5rem', zIndex: 50,
                        background: 'var(--color-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '0.875rem',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                        minWidth: '140px', overflow: 'hidden',
                    }}>
                        <button onClick={() => { setOpen(false); onDelete() }} disabled={deleting}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                width: '100%', padding: '0.625rem 0.875rem',
                                border: 'none', cursor: 'pointer',
                                background: 'transparent',
                                color: 'var(--color-destructive)',
                                fontSize: '0.875rem', fontWeight: 500,
                            }}>
                            <Trash2 size={15} />
                            {deleting ? 'Deleting…' : 'Delete entry'}
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// JournalEditor Page
// ─────────────────────────────────────────────────────────────────────────────
export default function JournalEditorPage() {
    const { id } = useParams()   // undefined → new entry
    const isNew = !id
    const navigate = useNavigate()

    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [loading, setLoading] = useState(!isNew)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [error, setError] = useState(null)

    const displayDate = id
        ? null  // will be set after loading
        : format(new Date(), 'EEEE, MMMM d, yyyy')
    const [dateLabel, setDateLabel] = useState(displayDate)

    // Load existing entry — unpack title + mood from content if stored
    useEffect(() => {
        if (isNew) return
        setLoading(true)
        getEntry(id)
            .then(entry => {
                const raw = entry.content ?? ''
                const lines = raw.split('\n')
                const titleLine = lines[0] ?? ''
                // Skip any legacy mood tag line
                const moodMatch = (lines[1] ?? '').match(/^\[mood: (\w+)\]$/)
                setTitle(titleLine)
                setContent(moodMatch
                    ? lines.slice(2).join('\n').trimStart()
                    : lines.slice(1).join('\n').trimStart()
                )
                setDateLabel(format(new Date(entry.created_at), 'EEEE, MMMM d, yyyy'))
            })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false))
    }, [id, isNew])

    // Pack title + body into a single content string for the API
    function packContent() {
        return [title, content].join('\n').trimEnd()
    }

    async function handleSave() {
        setSaving(true); setError(null)
        try {
            const packed = packContent()
            if (isNew) {
                const entry = await createEntry(packed)
                navigate(`/journal/${entry.id}`, { replace: true })
            } else {
                await updateEntry(id, packed)
            }
        } catch (e) {
            setError(e.message)
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete() {
        if (!confirm('Delete this entry?')) return
        setDeleting(true)
        try {
            await deleteEntry(id)
            navigate('/dashboard')
        } catch (e) {
            setError(e.message)
            setDeleting(false)
        }
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100svh', background: 'var(--color-background)' }}>
                <Loader2 size={28} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
            </div>
        )
    }

    return (
        <div style={{ background: 'var(--color-background)', minHeight: '100svh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ maxWidth: '32rem', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', minHeight: '100svh' }}>

                {/* ── Top bar ── */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.25rem' }}>
                    <button onClick={() => navigate('/dashboard')} className="btn-icon" title="Back">
                        <ArrowLeft size={20} />
                    </button>
                    {!isNew && <OptionsMenu onDelete={handleDelete} deleting={deleting} />}
                </div>

                {/* ── Date row ── */}
                <div style={{ padding: '0 1.25rem 0.5rem' }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-muted-fg)', margin: 0 }}>
                        {dateLabel}
                    </p>
                </div>

                {/* ── Writing card ── */}
                <div style={{ flex: 1, margin: '0 1.25rem', display: 'flex', flexDirection: 'column' }}>
                    <div className="card" style={{ flex: 1, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <input
                            placeholder="Entry title..."
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            style={{
                                width: '100%', border: 'none', outline: 'none', padding: 0,
                                fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 700,
                                color: 'var(--color-foreground)', background: 'transparent',
                            }}
                        />
                        <div style={{ height: '1px', background: 'var(--color-border)' }} />
                        <textarea
                            placeholder="Start writing your thoughts..."
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            style={{
                                flex: 1, width: '100%', minHeight: '320px',
                                border: 'none', outline: 'none', resize: 'none', padding: 0,
                                fontSize: '0.9375rem', lineHeight: 1.75,
                                color: 'var(--color-foreground)', background: 'transparent',
                                fontFamily: 'var(--font-sans)',
                            }}
                        />
                    </div>
                </div>

                {/* ── Sticky bottom toolbar ── */}
                <div style={{
                    position: 'sticky', bottom: 0, zIndex: 10,
                    background: 'oklch(0.975 0.005 75 / 0.92)',
                    backdropFilter: 'blur(12px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                    gap: '0.75rem', padding: '1rem 1.25rem',
                    borderTop: '1px solid var(--color-border)',
                }}>
                    {error && <p style={{ fontSize: '0.875rem', color: 'var(--color-destructive)', margin: 0, flex: 1 }}>{error}</p>}
                    <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ borderRadius: '9999px', padding: '0.625rem 1.5rem' }}>
                        {saving
                            ? <><Loader2 size={15} className="animate-spin" /> Saving…</>
                            : isNew ? 'Save entry' : 'Update'}
                    </button>
                </div>
            </div>
        </div>
    )
}
