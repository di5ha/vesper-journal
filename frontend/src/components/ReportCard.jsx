import { useState } from 'react'
import { downloadReportPdf } from '../lib/api'
import { Download } from 'lucide-react'

function fmtDate(iso) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function emotionColor(emotion) {
    const e = (emotion || '').toLowerCase()
    if (/anxi|stress|fear|panic/.test(e)) return '#e97b5a'   // coral
    if (/sad|grief|low|depress/.test(e)) return '#5a87c4'   // blue
    if (/hope|joy|content|calm/.test(e)) return 'var(--color-primary)'  // teal
    if (/anger|frustrat/.test(e)) return '#e9a25a'   // amber
    return 'var(--color-primary)'
}

export default function ReportCard({ report }) {
    const [downloading, setDownloading] = useState(false)
    const [dlError, setDlError] = useState(null)

    async function handleDownload() {
        setDownloading(true); setDlError(null)
        try { await downloadReportPdf(report.id, report.week_start) }
        catch (e) { setDlError(e.message) }
        finally { setDownloading(false) }
    }

    const color = emotionColor(report.dominant_emotion)

    return (
        <article className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {/* Date + emotion */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
                <div>
                    <p style={{ fontSize: '0.6875rem', color: 'var(--color-muted-fg)', margin: '0 0 4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {fmtDate(report.created_at)}
                    </p>
                    <p style={{ fontSize: '1.125rem', fontFamily: 'var(--font-serif)', fontWeight: 700, margin: 0, textTransform: 'capitalize', color }}>
                        {report.dominant_emotion || '—'}
                    </p>
                </div>
                <span style={{
                    fontSize: '0.6875rem', padding: '4px 10px', borderRadius: '9999px',
                    background: 'var(--color-muted)', color: 'var(--color-muted-fg)',
                    fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                    Week of {report.week_start}
                </span>
            </div>

            {/* Top themes */}
            {report.top_themes?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                    {report.top_themes.map(t => (
                        <span key={t} className="badge-primary" style={{ textTransform: 'capitalize' }}>{t}</span>
                    ))}
                </div>
            )}

            {/* Emotional arc */}
            {report.emotional_arc && (
                <div>
                    <p style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted-fg)', margin: '0 0 4px' }}>Emotional Arc</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-foreground)', lineHeight: 1.6, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {report.emotional_arc}
                    </p>
                </div>
            )}

            {/* AI insight */}
            {report.ai_observation && (
                <div>
                    <p style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted-fg)', margin: '0 0 4px' }}>Insight</p>
                    <p style={{ fontSize: '0.8125rem', fontStyle: 'italic', color: 'var(--color-muted-fg)', lineHeight: 1.6, margin: 0, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        "{report.ai_observation}"
                    </p>
                </div>
            )}

            {/* Download */}
            <div style={{ paddingTop: '0.625rem', borderTop: '1px solid var(--color-border)' }}>
                {dlError && <p style={{ fontSize: '0.75rem', color: 'var(--color-destructive)', margin: '0 0 6px' }}>{dlError}</p>}
                <button onClick={handleDownload} disabled={downloading}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.375rem',
                        background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                        fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-primary)',
                        opacity: downloading ? 0.5 : 1, transition: 'opacity 0.15s',
                    }}>
                    <Download size={14} />
                    {downloading ? 'Generating PDF…' : 'Download PDF'}
                </button>
            </div>
        </article>
    )
}
