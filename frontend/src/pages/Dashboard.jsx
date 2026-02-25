import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { getEntries } from '../lib/api'
import {
    BookOpen, LogOut, Plus, Search, BookMarked, Loader2,
} from 'lucide-react'
import {
    startOfWeek, addDays, isToday, isSameDay, format,
} from 'date-fns'

// ─────────────────────────────────────────────────────────────────────────────
// Mood constants (matching V0 lib/types)
// ─────────────────────────────────────────────────────────────────────────────
export const MOODS = [
    { value: 'happy', label: 'Happy', emoji: '😊' },
    { value: 'calm', label: 'Calm', emoji: '😌' },
    { value: 'grateful', label: 'Grateful', emoji: '🙏' },
    { value: 'reflective', label: 'Reflective', emoji: '🤔' },
    { value: 'anxious', label: 'Anxious', emoji: '😰' },
    { value: 'sad', label: 'Sad', emoji: '😔' },
]

// Unpack title + mood from packed content string
function parseEntry(entry) {
    const raw = entry.content ?? ''
    const lines = raw.split('\n')
    const title = lines[0] || 'Untitled'
    const moodMatch = (lines[1] ?? '').match(/^\[mood: (\w+)\]$/)
    const mood = moodMatch ? moodMatch[1] : null
    return { title, mood }
}

// ─────────────────────────────────────────────────────────────────────────────
// CalendarStrip
// ─────────────────────────────────────────────────────────────────────────────
function CalendarStrip({ selectedDate, onSelectDate }) {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 })
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

    return (
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', padding: '0.75rem' }}>
            {days.map(day => {
                const selected = isSameDay(day, selectedDate)
                const today = isToday(day)
                return (
                    <button
                        key={day.toISOString()}
                        onClick={() => onSelectDate(day)}
                        style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                            padding: '0.5rem 0.625rem',
                            borderRadius: '0.75rem',
                            border: 'none', cursor: 'pointer',
                            background: selected
                                ? 'var(--color-primary)'
                                : today
                                    ? 'oklch(0.50 0.10 170 / 0.10)'
                                    : 'transparent',
                            color: selected ? 'var(--color-primary-fg)'
                                : today ? 'var(--color-primary)'
                                    : 'var(--color-muted-fg)',
                            transition: 'all 0.15s',
                            flex: 1,
                        }}>
                        <span style={{ fontSize: '0.625rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {format(day, 'EEE')}
                        </span>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>{format(day, 'd')}</span>
                    </button>
                )
            })}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// SearchBar
// ─────────────────────────────────────────────────────────────────────────────
function SearchBar({ value, onChange }) {
    return (
        <div style={{ position: 'relative' }}>
            <Search size={16} style={{
                position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--color-muted-fg)', pointerEvents: 'none',
            }} />
            <input
                className="input"
                style={{ paddingLeft: '2.5rem', height: '2.75rem', borderRadius: '0.75rem' }}
                placeholder="Search entries"
                value={value}
                onChange={e => onChange(e.target.value)}
            />
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// TodayCard — teal tile in horizontal scroll
// ─────────────────────────────────────────────────────────────────────────────
function TodayCard({ entry, onClick }) {
    const { title, mood: moodValue } = parseEntry(entry)
    const mood = MOODS.find(m => m.value === moodValue)
    return (
        <button onClick={onClick}
            style={{
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                minWidth: '160px', minHeight: '140px', padding: '1rem',
                borderRadius: '1rem', border: 'none', cursor: 'pointer',
                background: 'var(--color-primary)', color: 'var(--color-primary-fg)',
                textAlign: 'left', transition: 'all 0.15s',
                boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.16)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.10)' }}>
            <div style={{ fontSize: '1.25rem' }}>{mood?.emoji ?? '📖'}</div>
            <div>
                <p style={{ fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.3, margin: '0 0 4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {title}
                </p>
                <p style={{ fontSize: '0.75rem', opacity: 0.8, margin: 0 }}>
                    {format(new Date(entry.created_at), 'HH:mm')}
                </p>
            </div>
        </button>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// EntryCard — row in the entries list
// ─────────────────────────────────────────────────────────────────────────────
function EntryCard({ entry, onClick }) {
    const { title, mood: moodValue } = parseEntry(entry)
    const mood = MOODS.find(m => m.value === moodValue)
    return (
        <button onClick={onClick}
            style={{
                display: 'flex', alignItems: 'center', gap: '0.875rem',
                width: '100%', padding: '0.875rem 1rem',
                background: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                borderLeft: '3px solid var(--color-primary)',
                borderRadius: '0.75rem',
                cursor: 'pointer', textAlign: 'left',
                transition: 'box-shadow 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: '0.9375rem', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--color-foreground)' }}>
                    {title}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-muted-fg)', margin: 0 }}>
                    {format(new Date(entry.created_at), 'MMM d, yyyy')}
                </p>
            </div>
            <span style={{ fontSize: '1.125rem', flexShrink: 0 }}>{mood?.emoji ?? ''}</span>
        </button>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard (Journal Home)
// ─────────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [entries, setEntries] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [selectedDate, setSelectedDate] = useState(new Date())

    // greeting
    const hour = new Date().getHours()
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
    const name = user?.email?.split('@')[0] ?? 'there'

    const load = useCallback(() => {
        setLoading(true)
        getEntries()
            .then(setEntries)
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => { load() }, [load])

    async function handleSignOut() {
        await supabase.auth.signOut()
        navigate('/auth')
    }

    // Filter
    const filtered = useMemo(() =>
        entries.filter(e =>
            !search ||
            (e.title ?? '').toLowerCase().includes(search.toLowerCase()) ||
            (e.content ?? '').toLowerCase().includes(search.toLowerCase())
        ), [entries, search])

    const todayEntries = useMemo(() => filtered.filter(e => isToday(new Date(e.created_at))), [filtered])
    const recentEntries = useMemo(() => filtered.filter(e => !isToday(new Date(e.created_at))), [filtered])

    const goToEntry = (id) => navigate(`/journal/${id}`)

    return (
        <div style={{ background: 'var(--color-background)', minHeight: '100svh' }}>
            {/* ── Nav ── */}
            <header style={{
                position: 'sticky', top: 0, zIndex: 20,
                background: 'oklch(0.975 0.005 75 / 0.92)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid var(--color-border)',
            }}>
                <div style={{ maxWidth: '32rem', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
                        <BookOpen size={20} />
                        <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem', fontWeight: 700, letterSpacing: '-0.02em' }}>vesper</span>
                    </div>
                    <button onClick={handleSignOut} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <LogOut size={15} />
                        <span>Sign out</span>
                    </button>
                </div>
            </header>

            {/* ── Body ── */}
            <main style={{ maxWidth: '32rem', margin: '0 auto', padding: '1.5rem 1.25rem 8rem' }}>
                {/* Greeting */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-foreground)', margin: '0 0 4px' }}>
                        {greeting}, {name}
                    </h1>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-muted-fg)', margin: 0 }}>
                        {format(new Date(), 'EEEE, MMMM d, yyyy')}
                    </p>
                </div>

                {/* Content */}
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
                        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {/* Calendar */}
                        <CalendarStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />

                        {/* Search */}
                        <SearchBar value={search} onChange={setSearch} />

                        {/* Empty state */}
                        {entries.length === 0 && (
                            <div style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                padding: '4rem 1rem', textAlign: 'center',
                                borderRadius: '1rem', border: '2px dashed var(--color-border)',
                                background: 'var(--color-card)', gap: '0.75rem',
                            }}>
                                <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '9999px', background: 'oklch(0.50 0.10 170 / 0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <BookMarked size={22} color='var(--color-primary)' />
                                </div>
                                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Your journal is empty</h3>
                                <p style={{ fontSize: '0.875rem', color: 'var(--color-muted-fg)', maxWidth: '18rem', lineHeight: 1.6, margin: 0 }}>
                                    Start writing your first entry. Capture a thought, reflect on your day, or jot down something you're grateful for.
                                </p>
                            </div>
                        )}

                        {/* Today section */}
                        {todayEntries.length > 0 && (
                            <section>
                                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem', fontWeight: 600, margin: '0 0 0.75rem' }}>Today</h2>
                                <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                                    {todayEntries.map(e => <TodayCard key={e.id} entry={e} onClick={() => goToEntry(e.id)} />)}
                                    {/* New entry tile */}
                                    <button onClick={() => navigate('/journal/new')}
                                        style={{
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                            minWidth: '140px', minHeight: '140px', borderRadius: '1rem',
                                            border: '2px dashed var(--color-border)', background: 'var(--color-card)',
                                            cursor: 'pointer', color: 'var(--color-muted-fg)', fontSize: '2rem', fontWeight: 300,
                                            transition: 'border-color 0.15s, color 0.15s',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)' }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-muted-fg)' }}>
                                        +
                                    </button>
                                </div>
                            </section>
                        )}

                        {/* Recent Entries list */}
                        {(todayEntries.length > 0 ? recentEntries : filtered).length > 0 && (
                            <section>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
                                        {todayEntries.length > 0 ? 'Recent Entries' : 'All Entries'}
                                    </h2>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {(todayEntries.length > 0 ? recentEntries : filtered).map(e => (
                                        <EntryCard key={e.id} entry={e} onClick={() => goToEntry(e.id)} />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </main>

            {/* ── Bottom tab bar ── */}
            <nav style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
                background: 'oklch(0.995 0.002 75 / 0.95)',
                backdropFilter: 'blur(12px)',
                borderTop: '1px solid var(--color-border)',
                display: 'flex', justifyContent: 'center',
            }}>
                <div style={{ display: 'flex', gap: 0, maxWidth: '32rem', width: '100%' }}>
                    {[
                        { label: 'Journal', path: '/dashboard', active: true },
                        { label: 'Drift', path: '/drift', active: false },
                        { label: 'Reports', path: '/reports', active: false },
                    ].map(tab => (
                        <button key={tab.path}
                            onClick={() => navigate(tab.path)}
                            style={{
                                flex: 1, padding: '0.875rem 0 0.6rem', border: 'none', background: 'transparent',
                                cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                                fontSize: '0.6875rem', fontWeight: 600,
                                color: tab.active ? 'var(--color-primary)' : 'var(--color-muted-fg)',
                                borderTop: tab.active ? '2px solid var(--color-primary)' : '2px solid transparent',
                                transition: 'color 0.15s',
                            }}>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </nav>

            {/* FAB — new entry (sits above the tab bar) */}
            <button onClick={() => navigate('/journal/new')} aria-label="New entry"
                style={{
                    position: 'fixed', bottom: '4.25rem', right: '1.25rem', zIndex: 50,
                    width: '3.5rem', height: '3.5rem',
                    borderRadius: '9999px', border: 'none', cursor: 'pointer',
                    background: 'var(--color-primary)', color: 'var(--color-primary-fg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
                    transition: 'transform 0.1s, box-shadow 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}>
                <Plus size={24} />
            </button>
        </div>
    )
}
