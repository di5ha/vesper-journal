import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateReport, listReports } from '../lib/api'
import ReportCard from '../components/ReportCard'

export default function Reports() {
    const navigate = useNavigate()

    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [generating, setGenerating] = useState(false)
    const [genError, setGenError] = useState(null)

    async function fetchReports() {
        setLoading(true)
        setError(null)
        try {
            const data = await listReports()
            setReports(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchReports() }, [])

    async function handleGenerate() {
        setGenerating(true)
        setGenError(null)
        try {
            const newReport = await generateReport()
            setReports(prev => [newReport, ...prev])
        } catch (err) {
            setGenError(err.message)
        } finally {
            setGenerating(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#0f0f13] flex flex-col">
            {/* Top nav */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-4">
                    <span className="text-white font-semibold tracking-tight select-none">✦ vesper</span>
                    <span className="text-white/15 text-xs">·</span>
                    <span className="text-xs text-violet-300 font-medium">Weekly Reports</span>
                </div>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-xs text-white/30 hover:text-white/60 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none"
                        viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Journal
                </button>
            </header>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-8 max-w-5xl mx-auto w-full">
                {/* Title row */}
                <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
                    <div>
                        <h1 className="text-2xl font-semibold text-white tracking-tight mb-1">
                            Weekly Reports
                        </h1>
                        <p className="text-sm text-white/30">
                            AI-synthesised summaries of your recent emotional patterns
                        </p>
                    </div>

                    {/* Generate button */}
                    <div className="flex flex-col items-end gap-1">
                        <button
                            onClick={handleGenerate}
                            disabled={generating}
                            className={[
                                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                                generating
                                    ? 'bg-violet-500/10 text-violet-400 cursor-not-allowed'
                                    : 'bg-violet-500/20 text-violet-300 border border-violet-500/30 hover:bg-violet-500/30',
                            ].join(' ')}
                        >
                            {generating ? (
                                <>
                                    <span className="animate-spin text-base">◌</span>
                                    Synthesising…
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none"
                                        viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round"
                                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    Generate New Report
                                </>
                            )}
                        </button>
                        {genError && (
                            <p className="text-xs text-red-400 text-right max-w-xs">{genError}</p>
                        )}
                    </div>
                </div>

                {/* States */}
                {loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="rounded-2xl p-5 bg-white/[0.03] animate-pulse border border-white/5">
                                <div className="h-3 w-24 bg-white/10 rounded mb-3" />
                                <div className="h-6 w-36 bg-white/10 rounded mb-4" />
                                <div className="flex gap-2 mb-4">
                                    {[...Array(3)].map((_, j) => <div key={j} className="h-5 w-16 bg-white/5 rounded-full" />)}
                                </div>
                                <div className="h-3 w-full bg-white/5 rounded mb-1" />
                                <div className="h-3 w-3/4 bg-white/5 rounded" />
                            </div>
                        ))}
                    </div>
                )}

                {!loading && error && (
                    <p className="text-red-400 text-sm text-center py-16">{error}</p>
                )}

                {!loading && !error && reports.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="text-4xl opacity-20">📋</div>
                        <p className="text-white/25 text-sm text-center leading-relaxed">
                            No reports yet.<br />Click <span className="text-violet-300">Generate New Report</span> to synthesise your first insight.
                        </p>
                    </div>
                )}

                {!loading && !error && reports.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {reports.map(r => (
                            <ReportCard key={r.id} report={r} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
