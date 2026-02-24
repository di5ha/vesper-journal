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

/**
 * Dashboard — writing shell with stats bar, editor, and insight panel.
 *
 *  ┌──────────────────────────────────────────────────────────┐
 *  │                      Top Nav                             │
 *  ├──────────┬───────────────────────────┬───────────────────┤
 *  │          │  Stats Bar (streak/spark) │                   │
 *  │ Sidebar  │  ────────────────────────  │  InsightPanel     │
 *  │  272px   │  JournalEditor (flex-1)   │   288px           │
 *  └──────────┴───────────────────────────┴───────────────────┘
 */
export default function Dashboard() {
    const { user } = useAuth()
    const navigate = useNavigate()

    const [active, setActive] = useState(null)
    const [refreshTick, setRefreshTick] = useState(0)
    const [lastSavedAt, setLastSavedAt] = useState(null)

    // AI analysis — polls automatically when active.id changes
    const { analysis, analyzing } = useAnalysis(active?.id ?? null)

    // Dashboard stats
    const [stats, setStats] = useState(null)
    const [generating, setGenerating] = useState(false)

    useEffect(() => {
        getDashboardStats()
            .then(setStats)
            .catch(console.error)
    }, [refreshTick])

    async function handleSignOut() {
        await supabase.auth.signOut()
        navigate('/auth')
    }

    const handleSaved = useCallback((entry) => {
        setLastSavedAt(entry.updated_at)
        setActive((prev) => {
            if (!prev || prev.id !== entry.id) {
                return { id: entry.id, content: entry.content }
            }
            return prev
        })
        setRefreshTick((t) => t + 1)
    }, [])

    function handleSelectEntry(entry) {
        setActive({ id: entry.id, content: entry.content })
    }

    function handleNewEntry() {
        setActive(null)
    }

    function handleEntryDeleted(deletedId) {
        if (active?.id === deletedId) setActive(null)
    }

    async function handleGenerateReport() {
        setGenerating(true)
        try {
            await generateReport()
            navigate('/reports')
        } catch (err) {
            alert(`Report generation failed: ${err.message}`)
        } finally {
            setGenerating(false)
        }
    }

    const editorKey = active?.id ?? 'new'

    return (
        <div className="min-h-screen bg-[#0f0f13] flex flex-col">
            {/* ── Top nav ── */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
                <span className="text-white font-semibold tracking-tight select-none">✦ vesper</span>
                <div className="flex items-center gap-4">
                    {lastSavedAt && (
                        <span className="text-xs text-white/25 hidden sm:block">
                            Last saved{' '}
                            {new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                    <span className="w-7 h-7 rounded-full bg-violet-600/30 border border-violet-500/30 flex items-center justify-center text-violet-300 text-xs font-medium select-none">
                        {user?.email?.[0]?.toUpperCase() ?? '?'}
                    </span>
                    <button
                        onClick={handleSignOut}
                        className="text-xs text-white/30 hover:text-red-400 transition-colors"
                    >
                        Sign out
                    </button>
                </div>
            </header>

            {/* ── Body: sidebar | main | insight panel ── */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <Sidebar
                    activeEntryId={active?.id ?? null}
                    onSelectEntry={handleSelectEntry}
                    onNewEntry={handleNewEntry}
                    onEntryDeleted={handleEntryDeleted}
                    refreshTick={refreshTick}
                />

                {/* Centre column: stats bar + editor */}
                <main className="flex-1 overflow-y-auto min-w-0 flex flex-col">
                    {/* Stats bar */}
                    <div className="border-b border-white/5 px-6 py-4">
                        <div className="max-w-2xl mx-auto flex flex-wrap items-center gap-3">
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

                    {/* Editor — main writing area */}
                    <div className="flex-1">
                        <div className="max-w-2xl mx-auto h-full">
                            <JournalEditor
                                key={editorKey}
                                initialEntryId={active?.id ?? null}
                                initialContent={active?.content ?? ''}
                                onSaved={handleSaved}
                            />
                        </div>
                    </div>
                </main>

                {/* Insight Panel — right column, hidden on small screens */}
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
