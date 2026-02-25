import { useNavigate } from 'react-router-dom'

export default function QuickLinks({ onNewEntry, onGenerateReport, generating = false }) {
    const navigate = useNavigate()

    const links = [
        {
            label: 'New Entry',
            style: 'bg-accent hover:bg-accent-deep text-white',
            onClick: onNewEntry,
            icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />,
        },
        {
            label: 'Drift',
            style: 'bg-navy hover:bg-navy/85 text-white',
            onClick: () => navigate('/drift'),
            icon: <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4" />,
        },
        {
            label: generating ? 'Generating…' : 'Report',
            style: generating
                ? 'bg-off-blue text-muted cursor-not-allowed'
                : 'border border-grey text-ink hover:border-accent hover:text-accent bg-surface',
            onClick: generating ? undefined : onGenerateReport,
            icon: generating
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M4 12a8 8 0 018-8v8l4 4" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
        },
    ]

    return (
        <div className="flex gap-2">
            {links.map(l => (
                <button
                    key={l.label}
                    onClick={l.onClick}
                    disabled={!l.onClick}
                    className={`flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold transition-all ${l.style}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        {l.icon}
                    </svg>
                    {l.label}
                </button>
            ))}
        </div>
    )
}
