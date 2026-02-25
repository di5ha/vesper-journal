import { useState } from 'react'
import { downloadReportPdf } from '../lib/api'

function fmtDate(iso) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function emotionStyle(emotion) {
    const e = (emotion || '').toLowerCase()
    if (/anxi|stress|fear|panic/.test(e)) return 'text-accent-deep'
    if (/sad|grief|low|depress/.test(e)) return 'text-caption'
    if (/hope|joy|content|calm/.test(e)) return 'text-accent'
    if (/anger|frustrat/.test(e)) return 'text-accent-deep'
    return 'text-navy'
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

    return (
        <article className="bg-surface border border-grey p-5 flex flex-col gap-4 hover:border-accent transition-colors">
            {/* Date + week badge */}
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs text-muted font-semibold mb-1">{fmtDate(report.created_at)}</p>
                    <p className={`text-xl font-bold capitalize ${emotionStyle(report.dominant_emotion)}`}>
                        {report.dominant_emotion || '—'}
                    </p>
                </div>
                <span className="text-[10px] px-2 py-1 bg-sky text-caption font-bold shrink-0">
                    Week of {report.week_start}
                </span>
            </div>

            {/* Top themes */}
            {report.top_themes?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {report.top_themes.map(t => (
                        <span key={t} className="text-[10px] px-2 py-1 bg-baby-blue text-navy font-semibold capitalize">
                            {t}
                        </span>
                    ))}
                </div>
            )}

            {/* Emotional arc */}
            {report.emotional_arc && (
                <div>
                    <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">Emotional Arc</p>
                    <p className="text-sm text-muted leading-relaxed line-clamp-3">{report.emotional_arc}</p>
                </div>
            )}

            {/* AI observation */}
            {report.ai_observation && (
                <div>
                    <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">Insight</p>
                    <p className="text-xs text-caption font-serif italic leading-relaxed line-clamp-4">
                        "{report.ai_observation}"
                    </p>
                </div>
            )}

            {/* Download */}
            <div className="pt-2 border-t border-grey">
                {dlError && <p className="text-xs text-red-500 mb-2">{dlError}</p>}
                <button onClick={handleDownload} disabled={downloading}
                    className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-deep disabled:opacity-40 font-semibold transition-colors">
                    {downloading ? (
                        <span className="animate-pulse">Generating PDF…</span>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download PDF
                        </>
                    )}
                </button>
            </div>
        </article>
    )
}
