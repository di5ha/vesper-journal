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
        setLoading(true); setError(null)
        try { setReports(await listReports()) }
        catch (e) { setError(e.message) }
        finally { setLoading(false) }
    }
    useEffect(() => { fetchReports() }, [])

    async function handleGenerate() {
        setGenerating(true); setGenError(null)
        try { setReports(prev => [/*await*/ generateReport(), ...prev]) }
        catch (e) { setGenError(e.message) }
        finally {
            setGenerating(false)
            fetchReports()
        }
    }

    return (
        <div className="min-h-screen bg-surface flex flex-col">
            {/* Top nav */}
            <header className="flex items-center justify-between px-6 py-3.5 border-b border-grey bg-surface shrink-0">
                <div className="flex items-center gap-5">
                    <span className="font-bold text-ink text-xl tracking-tight">✦ vesper</span>
                    <span className="bg-sky px-2.5 py-1 text-[10px] font-bold text-caption uppercase tracking-widest">
                        03 Reports
                    </span>
                </div>
                <button onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-xs text-muted hover:text-accent transition-colors font-semibold">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Journal
                </button>
            </header>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-8 py-10 max-w-5xl mx-auto w-full">
                {/* Section heading */}
                <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
                    <div>
                        <span className="text-accent font-bold text-sm">03</span>
                        <h1 className="text-3xl font-bold text-ink mt-0.5">Weekly Reports</h1>
                        <p className="text-muted text-sm mt-1">AI-synthesised summaries of your emotional patterns</p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                        <button
                            onClick={handleGenerate}
                            disabled={generating}
                            className={[
                                'flex items-center gap-2 px-5 py-2.5 text-sm font-semibold transition-all',
                                generating
                                    ? 'bg-off-blue text-muted cursor-not-allowed'
                                    : 'bg-accent hover:bg-accent-deep text-white',
                            ].join(' ')}
                        >
                            {generating ? (
                                <><span className="animate-spin">◌</span> Synthesising…</>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    Generate New Report
                                </>
                            )}
                        </button>
                        {genError && <p className="text-xs text-red-500">{genError}</p>}
                    </div>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="animate-pulse border border-grey p-5">
                                <div className="h-2.5 w-24 bg-grey mb-3" />
                                <div className="h-6 w-36 bg-grey mb-4" />
                                <div className="flex gap-2 mb-4">
                                    {[...Array(3)].map((_, j) => <div key={j} className="h-5 w-16 bg-off-blue" />)}
                                </div>
                                <div className="h-2.5 w-full bg-grey mb-1" />
                                <div className="h-2.5 w-3/4 bg-grey" />
                            </div>
                        ))}
                    </div>
                )}

                {!loading && error && (
                    <p className="text-red-500 text-sm text-center py-16">{error}</p>
                )}

                {!loading && !error && reports.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 gap-4 border border-grey">
                        <p className="text-muted text-sm text-center leading-relaxed font-serif italic">
                            No reports yet.<br />
                            Click <span className="not-italic font-semibold text-accent">Generate New Report</span> to synthesise your first insight.
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
