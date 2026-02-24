/**
 * QuickLinks — three action cards: New Entry, Drift Timeline, Generate Report.
 */
import { useNavigate } from 'react-router-dom'

export default function QuickLinks({ onNewEntry, onGenerateReport, generating = false }) {
    const navigate = useNavigate()

    const links = [
        {
            label: 'New Entry',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
            ),
            onClick: onNewEntry,
            color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/15',
        },
        {
            label: 'Drift Timeline',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4" />
                </svg>
            ),
            onClick: () => navigate('/drift'),
            color: 'text-violet-300 bg-violet-500/10 border-violet-500/15',
        },
        {
            label: generating ? 'Generating…' : 'Weekly Report',
            icon: generating ? (
                <span className="animate-spin text-sm">◌</span>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            onClick: generating ? undefined : onGenerateReport,
            color: generating
                ? 'text-amber-400/50 bg-amber-500/5 border-amber-500/10 cursor-not-allowed'
                : 'text-amber-400 bg-amber-500/10 border-amber-500/15',
        },
    ]

    return (
        <div className="flex gap-2">
            {links.map(l => (
                <button
                    key={l.label}
                    onClick={l.onClick}
                    disabled={!l.onClick}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[11px] font-medium transition-all hover:scale-[1.02] active:scale-[0.98] ${l.color}`}
                >
                    {l.icon}
                    {l.label}
                </button>
            ))}
        </div>
    )
}
