import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateReport, listReports } from '../lib/api'
import ReportCard from '../components/ReportCard'

// ── Blob background layer
function BlobBackground() {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            <div className="blob blob-orange absolute w-[680px] h-[680px]"
                style={{ bottom: '-100px', left: '-120px', opacity: 0.50 }} />
            <div className="blob blob-purple absolute w-[620px] h-[620px]"
                style={{ top: '-80px', right: '-80px', opacity: 0.45 }} />
            <div className="blob blob-yellow absolute w-[340px] h-[340px]"
                style={{ top: '40%', left: '-40px', opacity: 0.40 }} />
            <div className="blob blob-teal absolute w-[560px] h-[560px]"
                style={{ bottom: '-120px', right: '-60px', opacity: 0.32 }} />
            <div className="blob blob-pink absolute w-[260px] h-[260px]"
                style={{ top: '8%', left: '43%', opacity: 0.35 }} />
        </div>
    )
}

export default function Reports() {
    const navigate = useNavigate()
    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [generating, setGenerating] = useState(false)
    const [genError, setGenError] = useState(null)

    async function fetchReports() {
        setLoading(true); setError(null)
        try { setReports(await listReports()) }
        catch (e) { setError(e.message) }
        finally { setLoading(false) }
    }
    useEffect(() => { fetchReports() }, [])

    async function handleGenerate() {
        setGenerating(true); setGenError(null)
        try { await generateReport() }
        catch (e) { setGenError(e.message) }
        finally { setGenerating(false); fetchReports() }
    }

    return (
        <div className="h-screen bg-[#F6F5F3] flex flex-col overflow-hidden relative">
            <BlobBackground />

            {/* Sketch decoration — small floating woman journaling */}
            <div className="fixed bottom-0 right-4 w-44 h-56 sketch-float pointer-events-none z-0"
                style={{ filter: 'drop-shadow(0 4px 12px rgba(17,17,17,0.10))' }}>
                <img src="/vesper-sketch.png" alt="" className="w-full h-full object-contain object-bottom"
                    style={{ mixBlendMode: 'multiply' }} />
            </div>

            {/* ── Nav ── */}
            <header className="relative z-30 flex items-center justify-between px-6 py-3 bg-white/55 backdrop-blur-xl border-b border-white/40 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-[#111111] rounded flex items-center justify-center">
                        <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 fill-white"><path d="M10 2L3 7.5V18h5.5v-5h3v5H18V7.5L10 2z" /></svg>
                    </div>
                    <span className="font-extrabold text-[#111111] tracking-tight">vesper</span>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-white/60 backdrop-blur rounded-full text-[rgba(17,17,17,0.55)] border border-white/40">Reports</span>
                </div>
                <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-xs text-[rgba(17,17,17,0.55)] hover:text-[#FF6B4A] font-semibold transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Journal
                </button>
            </header>

            {/* ── Body ── */}
            <div className="relative z-10 flex-1 overflow-y-auto px-8 py-8 max-w-5xl mx-auto w-full">

                {/* Heading + generate */}
                <div className="flex items-end justify-between mb-7 gap-4 flex-wrap">
                    <div>
                        <h1 className="heading-tight text-3xl text-[#111111]">Weekly Reports</h1>
                        <p className="text-sm text-[rgba(17,17,17,0.55)] mt-2">AI-synthesised summaries of your emotional patterns</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <button onClick={handleGenerate} disabled={generating}
                            className={['flex items-center gap-2 h-11 px-5 text-sm font-semibold rounded-xl transition-all',
                                generating
                                    ? 'bg-white/50 backdrop-blur text-[rgba(17,17,17,0.35)] cursor-not-allowed border border-white/40'
                                    : 'bg-[#111111] hover:bg-[#2a2a2a] text-white shadow-[0_4px_20px_rgba(17,17,17,0.18)]',
                            ].join(' ')}>
                            {generating ? (
                                <><span className="animate-spin inline-block">◌</span> Synthesising…</>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    Generate Report
                                </>
                            )}
                        </button>
                        {genError && <p className="text-xs text-red-500">{genError}</p>}
                    </div>
                </div>

                {/* Loading skeletons */}
                {loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="animate-pulse bg-white/60 backdrop-blur-xl border border-white/50 rounded-2xl p-5">
                                <div className="h-2.5 w-24 bg-[rgba(17,17,17,0.07)] rounded-full mb-3" />
                                <div className="h-6 w-36 bg-[rgba(17,17,17,0.07)] rounded-full mb-4" />
                                <div className="flex gap-2 mb-4">
                                    {[...Array(3)].map((_, j) => <div key={j} className="h-5 w-16 bg-[rgba(17,17,17,0.05)] rounded-full" />)}
                                </div>
                                <div className="h-2.5 w-full bg-[rgba(17,17,17,0.05)] rounded-full mb-1" />
                                <div className="h-2.5 w-3/4 bg-[rgba(17,17,17,0.05)] rounded-full" />
                            </div>
                        ))}
                    </div>
                )}

                {!loading && error && <p className="text-red-500 text-sm text-center py-16">{error}</p>}

                {!loading && !error && reports.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 gap-5 bg-white/55 backdrop-blur-xl border border-white/50 rounded-2xl">
                        <div className="w-24 h-24 opacity-50 sketch-float2 pointer-events-none">
                            <img src="/vesper-sketch.png" alt="" className="w-full h-full object-contain" style={{ mixBlendMode: 'multiply' }} />
                        </div>
                        <p className="text-[rgba(17,17,17,0.45)] text-sm text-center italic">
                            No reports yet — generate your first one above.
                        </p>
                    </div>
                )}

                {!loading && !error && reports.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {reports.map(r => <ReportCard key={r.id} report={r} />)}
                    </div>
                )}
            </div>
        </div>
    )
}
