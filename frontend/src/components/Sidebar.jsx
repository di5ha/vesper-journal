import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { listEntries, deleteEntry, searchEntries } from '../lib/api'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fmtDate(iso) {
    const d = new Date(iso)
    const now = new Date()
    if (d.toDateString() === now.toDateString()) return 'Today'
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function snippet(content) {
    return content?.replace(/\n/g, ' ').trim().slice(0, 72) || 'Empty entry'
}

// ---------------------------------------------------------------------------
// Entry row
// ---------------------------------------------------------------------------
function EntryRow({ entry, isActive, onClick, onDelete }) {
    return (
        <div
            onClick={onClick}
            className={[
                'group relative flex items-stretch cursor-pointer transition-colors rounded-xl mx-2 my-0.5',
                isActive
                    ? 'bg-[rgba(17,17,17,0.06)]'
                    : 'hover:bg-[rgba(17,17,17,0.04)]',
            ].join(' ')}
        >
            {/* Active indicator dot */}
            {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-[#FF6B4A] rounded-r-full ml-0.5" />}

            <div className="flex-1 px-4 py-3 min-w-0">
                <p className={`text-[13px] truncate leading-tight ${isActive ? 'font-semibold text-[#111111]' : 'font-medium text-[#111111]'}`}>
                    {snippet(entry.content)}
                </p>
                <p className="text-[11px] text-[rgba(17,17,17,0.45)] mt-1">{fmtDate(entry.created_at)}</p>
            </div>

            <button
                onClick={e => { e.stopPropagation(); onDelete(entry.id) }}
                className="opacity-0 group-hover:opacity-100 px-3 flex items-center text-[rgba(17,17,17,0.35)] hover:text-red-500 transition-all"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
        </div>
    )
}

// ---------------------------------------------------------------------------
// Search result row
// ---------------------------------------------------------------------------
function SearchRow({ entry, isActive, onClick }) {
    const pct = entry.similarity != null ? Math.round(entry.similarity * 100) : null
    return (
        <div
            onClick={onClick}
            className={['group flex items-stretch cursor-pointer transition-colors rounded-xl mx-2 my-0.5', isActive ? 'bg-[rgba(17,17,17,0.06)]' : 'hover:bg-[rgba(17,17,17,0.04)]'].join(' ')}
        >
            <div className="flex-1 px-4 py-3 min-w-0">
                <p className="text-[13px] font-medium text-[#111111] truncate">{snippet(entry.content)}</p>
                <div className="flex items-center justify-between mt-1">
                    <p className="text-[11px] text-[rgba(17,17,17,0.45)]">{fmtDate(entry.created_at)}</p>
                    {pct != null && (
                        <span className="text-[10px] px-2 py-0.5 bg-[#F0F0F0] text-[rgba(17,17,17,0.6)] rounded-full font-semibold">
                            {pct}%
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}

// ---------------------------------------------------------------------------
// Nav item — minimal Amplemarket style
// ---------------------------------------------------------------------------
function NavItem({ label, icon, path, currentPath, onClick }) {
    const isActive = currentPath === path
    return (
        <button
            onClick={onClick}
            className={[
                'flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl transition-all text-sm',
                isActive
                    ? 'bg-[rgba(17,17,17,0.07)] text-[#111111] font-semibold'
                    : 'text-[rgba(17,17,17,0.6)] hover:bg-[rgba(17,17,17,0.04)] hover:text-[#111111]',
            ].join(' ')}
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive ? 2.5 : 2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
            </svg>
            {label}
        </button>
    )
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------
export default function Sidebar({ activeEntryId, onSelectEntry, onNewEntry, onEntryDeleted, refreshTick = 0 }) {
    const navigate = useNavigate()
    const { pathname } = useLocation()

    const [entries, setEntries] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [query, setQuery] = useState('')
    const [results, setResults] = useState([])
    const [searching, setSearching] = useState(false)
    const debounceRef = useRef(null)
    const isSearchMode = query.trim().length > 0

    useEffect(() => {
        setLoading(true)
        listEntries()
            .then(data => { setEntries(data); setLoading(false) })
            .catch(err => { setError(err.message); setLoading(false) })
    }, [refreshTick])

    const runSearch = useCallback(q => {
        setSearching(true)
        searchEntries(q).then(data => { setResults(data); setSearching(false) }).catch(() => setSearching(false))
    }, [])

    function handleQueryChange(e) {
        const q = e.target.value; setQuery(q)
        clearTimeout(debounceRef.current)
        if (q.trim()) debounceRef.current = setTimeout(() => runSearch(q.trim()), 500)
    }

    async function handleDelete(id) {
        try { await deleteEntry(id); setEntries(prev => prev.filter(e => e.id !== id)); onEntryDeleted?.(id) }
        catch (err) { console.error(err) }
    }

    const isLoading = isSearchMode ? searching : loading
    const display = isSearchMode ? results : entries

    return (
        <aside className="flex flex-col w-64 shrink-0 bg-[#F6F5F3] border-r border-[rgba(17,17,17,0.07)]">
            {/* Header */}
            <div className="px-4 pt-5 pb-3">
                {/* New entry */}
                <button
                    onClick={onNewEntry}
                    className="w-full flex items-center gap-2.5 h-10 bg-[#111111] hover:bg-[#2a2a2a] text-white text-sm font-semibold rounded-xl px-4 transition-colors mb-4"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    New entry
                </button>

                {/* Nav */}
                <nav className="space-y-0.5">
                    <NavItem label="Journal" path="/dashboard" currentPath={pathname} onClick={() => navigate('/dashboard')}
                        icon="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2m0 0V4a2 2 0 012-2h4a2 2 0 012 2v2M9 12h6m-6 4h6" />
                    <NavItem label="Drift" path="/drift" currentPath={pathname} onClick={() => navigate('/drift')}
                        icon="M22 12h-4l-3 9L9 3l-3 9H2" />
                    <NavItem label="Reports" path="/reports" currentPath={pathname} onClick={() => navigate('/reports')}
                        icon="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </nav>
            </div>

            {/* Search */}
            <div className="px-4 py-3 border-t border-b border-[rgba(17,17,17,0.06)]">
                <div className="flex items-center gap-2 bg-white border border-[rgba(17,17,17,0.10)] rounded-lg px-3 py-2 shadow-[0_1px_4px_rgba(17,17,17,0.06)]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-[rgba(17,17,17,0.35)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text" value={query} onChange={handleQueryChange}
                        placeholder="Search entries…"
                        className="flex-1 bg-transparent text-xs text-[#111111] placeholder-[rgba(17,17,17,0.35)] focus:outline-none"
                    />
                    {isSearchMode && (
                        <button onClick={() => { setQuery(''); setResults([]) }} className="text-[rgba(17,17,17,0.35)] hover:text-[#FF6B4A] transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Section label */}
            <div className="px-4 py-3">
                <p className="text-[10px] font-semibold text-[rgba(17,17,17,0.4)] uppercase tracking-widest">
                    {isSearchMode ? 'Results' : 'Entries'}
                </p>
            </div>

            {/* Entry list */}
            <div className="flex-1 overflow-y-auto pb-4">
                {isLoading && [...Array(5)].map((_, i) => (
                    <div key={i} className="mx-2 px-4 py-3 rounded-xl animate-pulse">
                        <div className="h-3 bg-[rgba(17,17,17,0.08)] rounded-lg w-3/4 mb-2" />
                        <div className="h-2.5 bg-[rgba(17,17,17,0.06)] rounded-lg w-1/3" />
                    </div>
                ))}

                {!isLoading && error && <p className="text-xs text-red-500 px-4 py-6 text-center">{error}</p>}

                {!isLoading && !error && display.length === 0 && (
                    <p className="text-xs text-[rgba(17,17,17,0.4)] text-center px-4 py-8 leading-relaxed">
                        {isSearchMode ? 'No results found.' : 'No entries yet.\nClick "New entry" to start.'}
                    </p>
                )}

                {!isLoading && !error && (
                    isSearchMode
                        ? results.map(e => <SearchRow key={e.id} entry={e} isActive={activeEntryId === e.id} onClick={() => onSelectEntry(e)} />)
                        : entries.map(e => <EntryRow key={e.id} entry={e} isActive={activeEntryId === e.id} onClick={() => onSelectEntry(e)} onDelete={handleDelete} />)
                )}
            </div>
        </aside>
    )
}
