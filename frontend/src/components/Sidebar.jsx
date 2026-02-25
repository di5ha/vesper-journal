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
                'group relative flex items-stretch cursor-pointer transition-all',
                isActive ? 'bg-sky' : 'hover:bg-off-blue',
            ].join(' ')}
        >
            {/* Orange left bar when active */}
            <div className={`w-0.5 shrink-0 ${isActive ? 'bg-accent' : 'bg-transparent'}`} />

            <div className="flex-1 px-4 py-3 min-w-0">
                <p className={`text-[13px] truncate leading-tight ${isActive ? 'font-semibold text-ink' : 'font-medium text-ink'}`}>
                    {snippet(entry.content)}
                </p>
                <p className="text-[11px] text-muted mt-1">{fmtDate(entry.created_at)}</p>
            </div>

            <button
                onClick={e => { e.stopPropagation(); onDelete(entry.id) }}
                className="opacity-0 group-hover:opacity-100 px-3 flex items-center text-muted hover:text-red-500 transition-all"
                aria-label="Delete"
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
            className={['group flex items-stretch cursor-pointer transition-all', isActive ? 'bg-sky' : 'hover:bg-off-blue'].join(' ')}
        >
            <div className={`w-0.5 shrink-0 ${isActive ? 'bg-accent' : 'bg-transparent'}`} />
            <div className="flex-1 px-4 py-3 min-w-0">
                <p className="text-[13px] font-medium text-ink truncate">{snippet(entry.content)}</p>
                <div className="flex items-center justify-between mt-1">
                    <p className="text-[11px] text-muted">{fmtDate(entry.created_at)}</p>
                    {pct != null && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-baby-blue text-navy font-semibold">
                            {pct}%
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}

// ---------------------------------------------------------------------------
// Nav item — Redo numbered style
// ---------------------------------------------------------------------------
function NavItem({ label, number, path, currentPath, onClick }) {
    const isActive = currentPath === path
    return (
        <button
            onClick={onClick}
            className={[
                'flex flex-col items-start px-4 py-3 w-full text-left transition-all border-b border-grey',
                isActive ? 'bg-sky' : 'hover:bg-off-blue',
            ].join(' ')}
        >
            <span className={`text-xs font-bold mb-0.5 ${isActive ? 'text-accent' : 'text-muted'}`}>
                {number}
            </span>
            <span className={`text-sm font-semibold ${isActive ? 'text-ink' : 'text-ink'}`}>
                {label}
            </span>
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
        <aside className="flex flex-col w-64 shrink-0 border-r border-grey bg-surface h-full">
            {/* Logo */}
            <div className="px-4 pt-5 pb-4 border-b border-grey flex items-center justify-between">
                <span className="font-bold text-sm text-ink">✦ vesper</span>
                <button
                    onClick={onNewEntry}
                    title="New entry"
                    className="w-6 h-6 bg-accent flex items-center justify-center hover:bg-accent-deep transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            </div>

            {/* Navigation — Redo numbered sections */}
            <nav className="border-b border-grey">
                <NavItem label="Journal" number="01" path="/dashboard" currentPath={pathname} onClick={() => navigate('/dashboard')} />
                <NavItem label="Drift" number="02" path="/drift" currentPath={pathname} onClick={() => navigate('/drift')} />
                <NavItem label="Reports" number="03" path="/reports" currentPath={pathname} onClick={() => navigate('/reports')} />
            </nav>

            {/* Search */}
            <div className="px-4 py-3 border-b border-grey">
                <div className="flex items-center gap-2 border border-grey px-3 py-2 bg-off-blue">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        value={query}
                        onChange={handleQueryChange}
                        placeholder="Search entries…"
                        className="flex-1 bg-transparent text-xs text-ink placeholder-muted focus:outline-none"
                    />
                    {isSearchMode && (
                        <button onClick={() => { setQuery(''); setResults([]) }} className="text-muted hover:text-accent">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Entry list */}
            <div className="flex-1 overflow-y-auto">
                {isLoading && [...Array(5)].map((_, i) => (
                    <div key={i} className="px-4 py-3 border-b border-grey animate-pulse">
                        <div className="h-3 bg-grey rounded w-3/4 mb-2" />
                        <div className="h-2.5 bg-grey rounded w-1/3" />
                    </div>
                ))}

                {!isLoading && error && (
                    <p className="text-xs text-red-500 px-4 py-6 text-center">{error}</p>
                )}

                {!isLoading && !error && display.length === 0 && (
                    <p className="text-xs text-muted text-center px-4 py-8 leading-relaxed">
                        {isSearchMode ? 'No results found.' : 'No entries yet.\nClick + to start writing.'}
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
