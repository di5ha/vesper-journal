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

// ─────────────────────────────────────────────────────────────────────────────
// SVG Sketch helpers — small decorations only (main sketch is PNG)
// ─────────────────────────────────────────────────────────────────────────────
function UNUSED_SketchJourneyFigure() {
    return (
        <svg viewBox="0 0 170 230" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" aria-hidden>
            {/* ── Head ─────────────────────────────────────── */}
            <circle cx="85" cy="29" r="21" stroke="#111111" strokeWidth="2.5" />
            {/* Hair wisps — like the amplemarket figure */}
            <path d="M66 21 Q59 5 70 2" stroke="#111111" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M71 12 Q78 -2 88 3" stroke="#111111" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M104 21 Q111 5 100 2" stroke="#111111" strokeWidth="2.2" strokeLinecap="round" />
            {/* Eyes */}
            <circle cx="77" cy="26" r="3" fill="#111111" />
            <circle cx="93" cy="26" r="3" fill="#111111" />
            {/* Big joyful smile */}
            <path d="M76 37 Q85 44 94 37" stroke="#111111" strokeWidth="2.2" strokeLinecap="round" />

            {/* ── Body ─────────────────────────────────────── */}
            <path d="M85 50 L85 102" stroke="#111111" strokeWidth="3" strokeLinecap="round" />

            {/* ── Left arm — raised high and wide (triumphant, like amplemarket figure) */}
            <path d="M85 65 L60 46 L45 34" stroke="#111111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="45" cy="34" r="4" stroke="#111111" strokeWidth="2.2" fill="none" />

            {/* ── Right arm — raised and slightly bent */}
            <path d="M85 65 L112 47 L124 36" stroke="#111111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="124" cy="36" r="4" stroke="#111111" strokeWidth="2.2" fill="none" />

            {/* ── Legs — dangling loose beneath (like amplemarket figure on rocket) */}
            <path d="M79 102 L70 132 L65 148" stroke="#111111" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M91 102 L100 132 L105 148" stroke="#111111" strokeWidth="2.5" strokeLinecap="round" />
            {/* Shoes */}
            <path d="M59 147 L71 150" stroke="#111111" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M99 150 L111 147" stroke="#111111" strokeWidth="2.2" strokeLinecap="round" />

            {/* ── Open Journal (replacing the rocket) — person sits on spine ── */}
            {/* Left page */}
            <path d="M20 160 Q28 150 85 148 L85 176 Q30 178 20 160Z"
                stroke="#111111" strokeWidth="2.2" fill="white" fillOpacity="0.45" />
            {/* Right page */}
            <path d="M85 148 Q142 150 150 160 Q140 178 85 176 L85 148Z"
                stroke="#111111" strokeWidth="2.2" fill="white" fillOpacity="0.45" />
            {/* Spine */}
            <path d="M85 148 L85 177" stroke="#111111" strokeWidth="2.2" />
            {/* Writing lines — left page */}
            <path d="M33 159 L77 157" stroke="#111111" strokeWidth="1.2" opacity="0.5" />
            <path d="M31 166 L77 165" stroke="#111111" strokeWidth="1.2" opacity="0.5" />
            <path d="M33 173 L75 172" stroke="#111111" strokeWidth="1.2" opacity="0.5" />
            {/* Writing lines — right page */}
            <path d="M93 157 L137 159" stroke="#111111" strokeWidth="1.2" opacity="0.5" />
            <path d="M93 165 L139 166" stroke="#111111" strokeWidth="1.2" opacity="0.5" />
            {/* Pen scratching on right page */}
            <path d="M93 173 Q100 170 106 173 Q113 176 120 173" stroke="#111111" strokeWidth="1.2" opacity="0.5" fill="none" />

            {/* ── Motion lines below the journal (like rocket exhaust) ── */}
            <path d="M48 181 Q42 196 38 210" stroke="#111111" strokeWidth="2" strokeLinecap="round" />
            <path d="M63 184 Q59 200 57 215" stroke="#111111" strokeWidth="2" strokeLinecap="round" />
            <path d="M85 185 L85 218" stroke="#111111" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M107 184 Q111 200 113 215" stroke="#111111" strokeWidth="2" strokeLinecap="round" />
            <path d="M122 181 Q128 196 132 210" stroke="#111111" strokeWidth="2" strokeLinecap="round" />

            {/* ── Stars scattered around — Amplemarket style ── */}
            {/* Large 8-pointed star — upper left */}
            <path d="M16 56 L19.5 44 L23 56 L35 59.5 L23 63 L19.5 75 L16 63 L4 59.5 Z"
                stroke="#111111" strokeWidth="2" fill="none" />
            {/* Medium star — upper right */}
            <path d="M140 42 L143 32 L146 42 L156 45 L146 48 L143 58 L140 48 L130 45 Z"
                stroke="#111111" strokeWidth="1.8" fill="none" />
            {/* Tiny 4-point sparkle — near left hand */}
            <path d="M28 20 L30 14 L32 20 L38 22 L32 24 L30 30 L28 24 L22 22 Z"
                stroke="#111111" strokeWidth="1.4" fill="none" />
            {/* Small circle sparkle — right area */}
            <circle cx="140" cy="68" r="4" stroke="#111111" strokeWidth="1.8" fill="none" />
            <circle cx="18" cy="90" r="2.8" stroke="#111111" strokeWidth="1.5" fill="none" />
            <circle cx="152" cy="100" r="2" stroke="#111111" strokeWidth="1.4" fill="none" />
        </svg>
    )
}

// ── Smaller sparkle for scattered decoration
function SketchSparkle({ size = 24 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden>
            <path d="M20 3 L22.5 17 L37 20 L22.5 23 L20 37 L17.5 23 L3 20 L17.5 17 Z"
                stroke="#111111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

// ── Moon sketch for sidebar corner
function SketchMoon() {
    return (
        <svg viewBox="0 0 90 105" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" aria-hidden>
            <path d="M58 14 Q86 30 83 60 Q80 90 52 98 Q28 98 18 80 Q8 60 22 40 Q36 20 58 14Z"
                stroke="#111111" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M55 22 Q42 38 44 64 Q45 78 52 86"
                stroke="#111111" strokeWidth="1.2" strokeLinecap="round" opacity="0.3" />
            <path d="M70 10 L73 2 L76 10 L84 13 L76 16 L73 24 L70 16 L62 13 Z"
                stroke="#111111" strokeWidth="2" fill="none" />
            <circle cx="87" cy="36" r="3.5" stroke="#111111" strokeWidth="1.8" fill="none" />
            <circle cx="12" cy="28" r="2.2" stroke="#111111" strokeWidth="1.5" fill="none" />
        </svg>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Week calendar
// ─────────────────────────────────────────────────────────────────────────────
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
                        <span className="text-[9px] font-bold text-[rgba(17,17,17,0.4)] uppercase tracking-wide">{DAY_ABBR[i]}</span>
                        <span className={[
                            'w-8 h-8 flex items-center justify-center text-xs font-bold rounded-full transition-all',
                            isToday ? 'bg-[#111111] text-white shadow-md' : 'text-[rgba(17,17,17,0.5)] hover:bg-[rgba(17,17,17,0.08)]',
                        ].join(' ')}>
                            {d.getDate()}
                        </span>
                    </div>
                )
            })}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────────────────────────
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

    async function handleSignOut() { await supabase.auth.signOut(); navigate('/auth') }

    const handleSaved = useCallback((entry) => {
        setLastSavedAt(entry.updated_at)
        setActive(prev => (!prev || prev.id !== entry.id)
            ? { id: entry.id, content: entry.content }
            : prev)
        setRefreshTick(t => t + 1)
    }, [])

    function handleSelectEntry(e) { setActive({ id: e.id, content: e.content }) }
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
        <div className="h-screen bg-[#F6F5F3] flex flex-col overflow-hidden relative">

            {/* ══════════════════════════════════════════════════════════
                FIXED BACKGROUND — vivid blobs + sketch illustrations
            ══════════════════════════════════════════════════════════ */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">

                {/* ── Blobs ── */}
                <div className="blob blob-orange absolute w-[700px] h-[700px]"
                    style={{ bottom: '-90px', left: '-110px', opacity: 0.52 }} />
                <div className="blob blob-purple absolute w-[640px] h-[640px]"
                    style={{ top: '-70px', right: '-70px', opacity: 0.47 }} />
                <div className="blob blob-yellow absolute w-[360px] h-[360px]"
                    style={{ top: '38%', left: '-50px', opacity: 0.42 }} />
                <div className="blob blob-teal absolute w-[580px] h-[580px]"
                    style={{ bottom: '-130px', right: '-50px', opacity: 0.34 }} />
                <div className="blob blob-pink absolute w-[280px] h-[280px]"
                    style={{ top: '7%', left: '43%', opacity: 0.36 }} />

                {/* ── Main sketch — woman journaling illustration (Dribbble style) ── */}
                <div className="absolute bottom-0 right-4 w-56 h-72 sketch-float pointer-events-none"
                    style={{ filter: 'drop-shadow(0 4px 16px rgba(17,17,17,0.10))' }}>
                    <img
                        src="/vesper-sketch.png"
                        alt=""
                        className="w-full h-full object-contain object-bottom"
                        style={{ mixBlendMode: 'multiply' }}
                    />
                </div>

                {/* ── Moon — top-left behind sidebar ── */}
                <div className="absolute top-10 left-10 w-22 h-28 sketch-float2 opacity-60">
                    <SketchMoon />
                </div>

                {/* ── Scattered sparkle stars ── */}
                <div className="absolute top-6 right-[340px] sketch-float3 opacity-65">
                    <SketchSparkle size={30} />
                </div>
                <div className="absolute top-[38%] right-14 sketch-float opacity-50">
                    <SketchSparkle size={22} />
                </div>
                <div className="absolute bottom-[30%] left-[30%] sketch-float2 opacity-45">
                    <SketchSparkle size={18} />
                </div>
                <div className="absolute top-[60%] right-[38%] sketch-float3 opacity-38">
                    <SketchSparkle size={16} />
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════
                UI LAYER — glassmorphism throughout
            ══════════════════════════════════════════════════════════ */}

            {/* ── Nav ── */}
            <header className="relative z-30 flex items-center justify-between px-6 py-3 bg-white/55 backdrop-blur-xl border-b border-white/40 shrink-0">
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
                    <button onClick={handleSignOut} className="text-xs text-[rgba(17,17,17,0.55)] hover:text-[#FF6B4A] font-semibold transition-colors">
                        Sign out
                    </button>
                </div>
            </header>

            {/* ── Body ── */}
            <div className="relative z-10 flex flex-1 overflow-hidden">

                {/* SIDEBAR */}
                <Sidebar
                    activeEntryId={active?.id ?? null}
                    onSelectEntry={handleSelectEntry}
                    onNewEntry={handleNewEntry}
                    onEntryDeleted={handleEntryDeleted}
                    refreshTick={refreshTick}
                />

                {/* CENTRE — transparent so blobs glow through */}
                <main className="flex-1 overflow-y-auto bg-transparent">
                    <div className="flex flex-col h-full max-w-2xl mx-auto p-4 gap-3">

                        {/* ── Compact top bar: greeting left, calendar right ── */}
                        <div className="flex items-center justify-between pt-2 px-1">
                            <div>
                                <h1 className="heading-tight text-xl text-[#111111] leading-tight">
                                    {greeting}, {name}
                                </h1>
                                <p className="text-xs text-[rgba(17,17,17,0.5)] mt-0.5">
                                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                            <WeekCalendar />
                        </div>

                        {/* ── Stats strip — glass pill, compact ── */}
                        <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/50 shadow-[0_4px_24px_rgba(17,17,17,0.07)] px-4 py-3 flex flex-wrap items-center gap-3">
                            <StreakCounter streak={stats?.current_streak ?? 0} />
                            <div className="flex-1 min-w-[120px]">
                                <MoodSparkline data={stats?.mood_sparkline ?? []} />
                            </div>
                            <QuickLinks
                                onNewEntry={handleNewEntry}
                                onGenerateReport={handleGenerateReport}
                                generating={generating}
                            />
                        </div>

                        {/* ── EDITOR — takes all remaining space ── */}
                        <div className="flex-1 bg-white/72 backdrop-blur-xl rounded-2xl border border-white/50 shadow-[0_8px_40px_rgba(17,17,17,0.08)] overflow-hidden min-h-0">
                            <JournalEditor
                                key={active?.id ?? 'new'}
                                initialEntryId={active?.id ?? null}
                                initialContent={active?.content ?? ''}
                                onSaved={handleSaved}
                            />
                        </div>

                    </div>
                </main>

                {/* INSIGHT PANEL */}
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
