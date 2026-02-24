import { useState } from 'react'
import { downloadReportPdf } from '../lib/api'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fmtDate(iso) {
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
    })
}

function emotionColor(emotion) {
    const e = (emotion || '').toLowerCase()
    if (/anxi|stress|fear|panic/.test(e)) return 'text-red-400'
    if (/sad|grief|low|depress/.test(e)) return 'text-blue-400'
    if (/hope|joy|content|calm/.test(e)) return 'text-emerald-400'
    if (/anger|frustrat/.test(e)) return 'text-orange-400'
    return 'text-violet-300'
}

// ---------------------------------------------------------------------------
// ReportCard
// ---------------------------------------------------------------------------
export default function ReportCard({ report }) {
    const [downloading, setDownloading] = useState(false)
    const [dlError, setDlError] = useState(null)

    async function handleDownload() {
        setDownloading(true)
        setDlError(null)
        try {
            await downloadReportPdf(report.id, report.week_start)
        } catch (err) {
            setDlError(err.message)
        } finally {
            setDownloading(false)
        }
    }

    const colorClass = emotionColor(report.dominant_emotion)

    return (
        <article className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 flex flex-col gap-4 hover:border-violet-500/20 transition-all">
            {/* Date + emotion badge */}
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs text-white/30 mb-1">{fmtDate(report.created_at)}</p>
                    <p className={`text-xl font-semibold capitalize ${colorClass}`}>
                        {report.dominant_emotion || '—'}
                    </p>
                </div>
                <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 text-white/25 shrink-0">
                    Week of {report.week_start}
                </span>
            </div>

            {/* Top themes */}
            {report.top_themes?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {report.top_themes.map(t => (
                        <span
                            key={t}
                            className="text-[10px] px-2 py-1 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/15 capitalize"
                        >
                            {t}
                        </span>
                    ))}
                </div>
            )}

            {/* Emotional arc */}
            {report.emotional_arc && (
                <div>
                    <p className="text-[10px] text-white/25 uppercase tracking-widest mb-1">Emotional Arc</p>
                    <p className="text-sm text-white/55 leading-relaxed line-clamp-3">
                        {report.emotional_arc}
                    </p>
                </div>
            )}

            {/* AI observation */}
            {report.ai_observation && (
                <div>
                    <p className="text-[10px] text-white/25 uppercase tracking-widest mb-1">Insight</p>
                    <p className="text-xs text-white/40 italic leading-relaxed line-clamp-4">
                        "{report.ai_observation}"
                    </p>
                </div>
            )}

            {/* Download button */}
            <div className="pt-1 border-t border-white/5">
                {dlError && <p className="text-xs text-red-400 mb-2">{dlError}</p>}
                <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300
                               disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    {downloading ? (
                        <span className="animate-pulse">Generating PDF…</span>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none"
                                viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round"
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download PDF
                        </>
                    )}
                </button>
            </div>
        </article>
    )
}
