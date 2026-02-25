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
        <div className="flex gap-1.5">
            {days.map((d, i) => {
                const isToday = d.toDateString() === today.toDateString()
                return (
                    <div key={i} className="flex flex-col items-center gap-1 w-9">
                        <span className="text-[10px] font-semibold text-[rgba(17,17,17,0.4)] uppercase tracking-wide">{DAY_ABBR[i]}</span>
                        <span className={[
                            'w-9 h-9 flex items-center justify-center text-sm font-bold rounded-full transition-all',
                            isToday
                                ? 'bg-[#111111] text-white shadow-sm'
                                : 'text-[rgba(17,17,17,0.5)] hover:bg-[rgba(17,17,17,0.06)]',
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

    useEffect(() => { getDashboardStats().then(setStats).catch(console.error) }, [refreshTick])

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
        <div className="min-h-screen bg-[#F6F5F3] flex flex-col">
            {/* ── Glassmorphism top nav ── */}
            <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 bg-white/70 backdrop-blur-xl border-b border-[rgba(17,17,17,0.08)]">
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-[#111111] rounded flex items-center justify-center">
                        <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 fill-white">
                            <path d="M10 2L3 7.5V18h5.5v-5h3v5H18V7.5L10 2z" />
                        </svg>
                    </div>
                    <span className="font-extrabold text-[#111111] tracking-tight">vesper</span>
                </div>
                <div className="flex items-center gap-4">
                    {lastSavedAt && (
                        <span className="text-xs text-[rgba(17,17,17,0.5)] hidden sm:block">
                            Saved {new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                    <div className="w-7 h-7 bg-[#111111] text-white flex items-center justify-center text-xs font-bold rounded-full select-none">
                        {user?.email?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <button onClick={handleSignOut} className="text-xs text-[rgba(17,17,17,0.55)] hover:text-[#FF6B4A] transition-colors font-medium">
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

                {/* Centre */}
                <main className="flex-1 overflow-y-auto min-w-0 flex flex-col bg-[#F6F5F3]">
                    {/* Section header */}
                    <div className="border-b border-[rgba(17,17,17,0.06)] px-8 py-8 bg-[#F6F5F3]">
                        <div className="max-w-2xl mx-auto">
                            <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
                                <div>
                                    <h1 className="heading-tight text-2xl text-[#111111]">
                                        {greeting}, {name}
                                    </h1>
                                    <p className="text-sm text-[rgba(17,17,17,0.55)] mt-1">
                                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                                <WeekCalendar />
                            </div>

                            <div className="flex flex-wrap items-center gap-3 pt-5 border-t border-[rgba(17,17,17,0.08)]">
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
                    <div className="flex-1 bg-white border-t border-[rgba(17,17,17,0.04)]">
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
