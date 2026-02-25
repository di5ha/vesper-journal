import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateReport, listReports } from '../lib/api'
import ReportCard from '../components/ReportCard'
import { BookOpen, ArrowLeft, FilePlus, Loader2 } from 'lucide-react'

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
        try {
            const r = await generateReport()
            setReports(prev => [r, ...prev])
        } catch (e) {
            setGenError(e.message)
        } finally {
            setGenerating(false)
        }
    }

    return (
        <div style={{ position: 'relative', background: 'oklch(0.975 0.005 75)', minHeight: '100svh', overflow: 'hidden' }}>

            {/* Blob background */}
            <div className="blob-scene">
                <div className="blob blob-teal" style={{ width: '600px', height: '600px', top: '-15%', left: '-8%' }} />
                <div className="blob blob-sage" style={{ width: '650px', height: '650px', bottom: '-10%', right: '-12%' }} />
                <div className="blob blob-amber" style={{ width: '380px', height: '380px', bottom: '10%', left: '35%' }} />
                <div className="blob blob-blush" style={{ width: '450px', height: '450px', top: '-5%', right: '20%' }} />
            </div>

            {/* ── Nav ── */}
            <header style={{
                position: 'sticky', top: 0, zIndex: 20,
                background: 'rgba(253,251,248,0.80)',
                backdropFilter: 'blur(16px)',
                borderBottom: '1px solid rgba(200,195,185,0.5)',
            }}>

                <div style={{ maxWidth: '32rem', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
                        <BookOpen size={20} />
                        <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem', fontWeight: 700, letterSpacing: '-0.02em' }}>vesper</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-muted-fg)', padding: '2px 10px', background: 'var(--color-muted)', borderRadius: '9999px', marginLeft: '4px' }}>Reports</span>
                    </div>
                    <button onClick={() => navigate('/dashboard')} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <ArrowLeft size={15} />
                        Journal
                    </button>
                </div>
            </header>

            {/* ── Body ── */}
            <main style={{ maxWidth: '32rem', margin: '0 auto', padding: '1.5rem 1.25rem 6rem' }}>
                {/* Heading row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-foreground)', margin: '0 0 4px' }}>
                            Weekly Reports
                        </h1>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-muted-fg)', margin: 0 }}>
                            AI-synthesised summaries of your emotional patterns
                        </p>
                    </div>

                    {/* Generate button */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <button onClick={handleGenerate} disabled={generating} className="btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.25rem', borderRadius: '9999px', fontSize: '0.875rem' }}>
                            {generating
                                ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</>
                                : <><FilePlus size={14} /> Generate</>}
                        </button>
                        {genError && <p style={{ fontSize: '0.75rem', color: 'var(--color-destructive)', margin: 0 }}>{genError}</p>}
                    </div>
                </div>

                {/* Skeleton */}
                {loading && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="card" style={{ padding: '1.25rem', animation: 'pulse 1.5s ease-in-out infinite' }}>
                                <div style={{ height: '10px', width: '6rem', background: 'var(--color-muted)', borderRadius: '9999px', marginBottom: '0.625rem' }} />
                                <div style={{ height: '1.25rem', width: '9rem', background: 'var(--color-muted)', borderRadius: '0.5rem', marginBottom: '0.875rem' }} />
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.875rem' }}>
                                    {[...Array(3)].map((_, j) => <div key={j} style={{ height: '1.25rem', width: '4rem', background: 'var(--color-muted)', borderRadius: '9999px' }} />)}
                                </div>
                                <div style={{ height: '10px', background: 'var(--color-muted)', borderRadius: '9999px', marginBottom: '0.375rem' }} />
                                <div style={{ height: '10px', width: '75%', background: 'var(--color-muted)', borderRadius: '9999px' }} />
                            </div>
                        ))}
                    </div>
                )}

                {!loading && error && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-destructive)', textAlign: 'center', padding: '4rem 0' }}>{error}</p>
                )}

                {!loading && !error && reports.length === 0 && (
                    <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 1rem', gap: '0.875rem', textAlign: 'center', border: '2px dashed var(--color-border)' }}>
                        <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '9999px', background: 'oklch(0.50 0.10 170 / 0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FilePlus size={22} color='var(--color-primary)' />
                        </div>
                        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>No reports yet</h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-muted-fg)', maxWidth: '18rem', lineHeight: 1.6, margin: 0 }}>
                            Click <strong>Generate</strong> to create your first AI-powered weekly insight.
                        </p>
                    </div>
                )}

                {!loading && !error && reports.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {reports.map(r => <ReportCard key={r.id} report={r} />)}
                    </div>
                )}
            </main>
        </div>
    )
}
