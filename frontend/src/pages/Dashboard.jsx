import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useAnalysis } from '../hooks/useAnalysis'
import { getDashboardStats, generateReport } from '../lib/api'
import JournalEditor from '../components/JournalEditor'
import Sidebar from '../components/Sidebar'
import InsightPanel from '../components/InsightPanel'
import StreakCounter from '../components/StreakCounter'
import MoodSparkline from '../components/MoodSparkline'
import QuickLinks from '../components/QuickLinks'

// ---------------------------------------------------------------------------
// Week calendar strip
// ---------------------------------------------------------------------------
const DAY_ABBR = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function WeekCalendar() {
    const today = new Date()
    const dow = today.getDay()
    const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today)
        d.setDate(today.getDate() - dow + i)
        return d
    })
    return (
        <div className="flex gap-1">
            {days.map((d, i) => {
                const isToday = d.toDateString() === today.toDateString()
                return (
                    <div key={i} className="flex flex-col items-center gap-1 w-8">
                        <span className="text-[10px] text-muted font-medium">{DAY_ABBR[i]}</span>
                        <span className={[
                            'w-8 h-8 flex items-center justify-center text-xs font-semibold transition-all',
                            isToday
                                ? 'bg-accent text-white'
                                : 'text-muted hover:bg-off-blue',
                        ].join(' ')}>
                            {d.getDate()}
                        </span>
                    </div>
                )
            })}
        </div>
    )
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
export default function Dashboard() {
    const { user } = useAuth()
    const navigate = useNavigate()

    const [active, setActive] = useState(null)
    const [refreshTick, setRefreshTick] = useState(0)
    const [lastSavedAt, setLastSavedAt] = useState(null)
    const [stats, setStats] = useState(null)
    const [generating, setGenerating] = useState(false)

    const { analysis, analyzing } = useAnalysis(active?.id ?? null)

    useEffect(() => {
        getDashboardStats().then(setStats).catch(console.error)
    }, [refreshTick])

    async function handleSignOut() {
        await supabase.auth.signOut()
        navigate('/auth')
    }

    const handleSaved = useCallback((entry) => {
        setLastSavedAt(entry.updated_at)
        setActive(prev => (!prev || prev.id !== entry.id)
            ? { id: entry.id, content: entry.content }
            : prev)
        setRefreshTick(t => t + 1)
    }, [])

    function handleSelectEntry(entry) { setActive({ id: entry.id, content: entry.content }) }
    function handleNewEntry() { setActive(null) }
    function handleEntryDeleted(id) { if (active?.id === id) setActive(null) }

    async function handleGenerateReport() {
        setGenerating(true)
        try { await generateReport(); navigate('/reports') }
        catch (err) { alert(`Report failed: ${err.message}`) }
        finally { setGenerating(false) }
    }

    const hour = new Date().getHours()
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
    const name = user?.email?.split('@')[0] ?? 'there'

    return (
        <div className="min-h-screen bg-surface flex flex-col">
            {/* ── Top nav ── */}
            <header className="flex items-center justify-between px-6 py-3.5 border-b border-grey bg-surface shrink-0">
                <span className="font-bold text-ink text-xl tracking-tight">✦ vesper</span>
                <div className="flex items-center gap-5">
                    {lastSavedAt && (
                        <span className="text-xs text-muted hidden sm:block">
                            Saved {new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                    <span className="w-7 h-7 bg-navy text-white flex items-center justify-center text-xs font-bold select-none">
                        {user?.email?.[0]?.toUpperCase() ?? '?'}
                    </span>
                    <button onClick={handleSignOut} className="text-xs text-muted hover:text-accent transition-colors font-medium">
                        Sign out
                    </button>
                </div>
            </header>

            {/* ── Body ── */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <Sidebar
                    activeEntryId={active?.id ?? null}
                    onSelectEntry={handleSelectEntry}
                    onNewEntry={handleNewEntry}
                    onEntryDeleted={handleEntryDeleted}
                    refreshTick={refreshTick}
                />

                {/* Centre column */}
                <main className="flex-1 overflow-y-auto min-w-0 flex flex-col bg-surface">
                    {/* Section header — Redo numbered style */}
                    <div className="border-b border-grey px-8 py-6">
                        <div className="max-w-2xl mx-auto">
                            {/* Greeting row */}
                            <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
                                <div>
                                    <span className="text-accent font-bold text-sm">01</span>
                                    <h1 className="text-2xl font-bold text-ink mt-0.5">
                                        {greeting}, {name}
                                    </h1>
                                    <p className="text-muted text-sm mt-1">
                                        {new Date().toLocaleDateString('en-US', {
                                            weekday: 'long', month: 'long', day: 'numeric'
                                        })}
                                    </p>
                                </div>
                                <WeekCalendar />
                            </div>

                            {/* Stats strip */}
                            <div className="flex flex-wrap items-center gap-3 pt-5 border-t border-grey">
                                <StreakCounter streak={stats?.current_streak ?? 0} />
                                <div className="flex-1 min-w-[140px]">
                                    <MoodSparkline data={stats?.mood_sparkline ?? []} />
                                </div>
                                <QuickLinks
                                    onNewEntry={handleNewEntry}
                                    onGenerateReport={handleGenerateReport}
                                    generating={generating}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Editor */}
                    <div className="flex-1">
                        <div className="max-w-2xl mx-auto h-full">
                            <JournalEditor
                                key={active?.id ?? 'new'}
                                initialEntryId={active?.id ?? null}
                                initialContent={active?.content ?? ''}
                                onSaved={handleSaved}
                            />
                        </div>
                    </div>
                </main>

                {/* Insight panel */}
                <div className="hidden lg:block">
                    <InsightPanel
                        entryId={active?.id ?? null}
                        analysis={analysis}
                        analyzing={analyzing}
                    />
                </div>
            </div>
        </div>
    )
}
