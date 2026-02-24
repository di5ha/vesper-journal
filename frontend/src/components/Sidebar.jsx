import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { listEntries, deleteEntry, searchEntries } from '../lib/api'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(iso) {
    const d = new Date(iso)
    const now = new Date()
    const diffDays = Math.floor((now - d) / 86400000)
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return d.toLocaleDateString('en-US', { weekday: 'long' })
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function snippet(content, maxLen = 80) {
    const text = content?.trim().replace(/\s+/g, ' ') ?? ''
    return text.length <= maxLen ? text : text.slice(0, maxLen) + '…'
}

// ---------------------------------------------------------------------------
// EntryRow
// ---------------------------------------------------------------------------
function EntryRow({ entry, isActive, onSelect, onDelete, similarity }) {
    async function handleDelete(e) {
        e.stopPropagation()
        if (!window.confirm('Delete this entry? This cannot be undone.')) return
        try {
            await deleteEntry(entry.id)
            onDelete(entry.id)
        } catch (err) {
            alert(`Delete failed: ${err.message}`)
        }
    }

    return (
        <button
            onClick={() => onSelect(entry)}
            className={[
                'group w-full text-left px-4 py-3 rounded-xl transition-all',
                'flex flex-col gap-1 relative',
                isActive
                    ? 'bg-violet-500/15 border border-violet-500/25'
                    : 'hover:bg-white/5 border border-transparent',
            ].join(' ')}
        >
            {/* Date + similarity badge + delete */}
            <div className="flex items-center justify-between">
                <span className={[
                    'text-xs font-medium',
                    isActive ? 'text-violet-300' : 'text-white/40',
                ].join(' ')}>
                    {formatDate(entry.created_at)}
                </span>
                <div className="flex items-center gap-1">
                    {similarity != null && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-300 font-mono">
                            {Math.round(similarity * 100)}%
                        </span>
                    )}
                    <button
                        onClick={handleDelete}
                        title="Delete entry"
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-white/25 hover:text-red-400"
                        aria-label="Delete entry"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Content snippet */}
            <p className={[
                'text-xs leading-relaxed line-clamp-2',
                isActive ? 'text-white/70' : 'text-white/30',
            ].join(' ')}>
                {snippet(entry.content) || <em className="italic">Empty entry</em>}
            </p>

            {/* Mood score pill */}
            {entry.mood_score != null && (
                <span className="text-[10px] text-white/30 mt-0.5">
                    Mood {entry.mood_score.toFixed(1)}
                </span>
            )}
        </button>
    )
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------
/**
 * Sidebar — scrollable entry history with debounced semantic search.
 *
 * Props:
 *   activeEntryId        — id of the entry currently open in the editor
 *   onSelectEntry(entry) — called when user clicks an entry row
 *   onNewEntry()         — called when user clicks "New Entry"
 *   onEntryDeleted(id)   — called after a successful delete
 *   refreshTick          — increment to trigger a list refresh
 */
export default function Sidebar({
    activeEntryId,
    onSelectEntry,
    onNewEntry,
    onEntryDeleted,
    refreshTick = 0,
}) {
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const [entries, setEntries] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Search state
    const [query, setQuery] = useState('')
    const [searchResults, setSearchResults] = useState(null)   // null = not searching
    const [searching, setSearching] = useState(false)
    const [searchError, setSearchError] = useState(null)
    const debounceRef = useRef(null)

    // Fetch / refresh list whenever refreshTick changes (and when not searching)
    useEffect(() => {
        let cancelled = false
        setLoading(true)
        listEntries()
            .then((data) => { if (!cancelled) { setEntries(data); setLoading(false) } })
            .catch((err) => { if (!cancelled) { setError(err.message); setLoading(false) } })
        return () => { cancelled = true }
    }, [refreshTick])

    // Debounced search — fires 500ms after the user stops typing
    useEffect(() => {
        clearTimeout(debounceRef.current)

        if (!query.trim()) {
            setSearchResults(null)
            setSearchError(null)
            return
        }

        setSearching(true)
        debounceRef.current = setTimeout(async () => {
            try {
                const results = await searchEntries(query.trim())
                setSearchResults(results)
                setSearchError(null)
            } catch (err) {
                setSearchError(err.message)
                setSearchResults([])
            } finally {
                setSearching(false)
            }
        }, 500)

        return () => clearTimeout(debounceRef.current)
    }, [query])

    function handleDelete(id) {
        setEntries((prev) => prev.filter((e) => e.id !== id))
        if (searchResults) setSearchResults((prev) => prev.filter((e) => e.id !== id))
        onEntryDeleted(id)
    }

    function clearSearch() {
        setQuery('')
        setSearchResults(null)
        setSearchError(null)
    }

    const isSearchMode = query.trim().length > 0
    const displayEntries = isSearchMode ? (searchResults ?? []) : entries
    const isLoading = isSearchMode ? searching : loading

    return (
        <aside className="flex flex-col w-72 shrink-0 border-r border-white/5 bg-white/[0.02] h-full">
            {/* Header */}
            <div className="px-4 pt-5 pb-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-white/30 uppercase tracking-widest">
                    {isSearchMode ? 'Search' : 'Entries'}
                </span>
                {!isSearchMode && (
                    <button
                        onClick={onNewEntry}
                        className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors font-medium"
                    >
                        <span className="text-base leading-none">+</span>
                        New
                    </button>
                )}
            </div>

            {/* Search input */}
            <div className="px-3 pb-3">
                <div className="relative">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20 pointer-events-none"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round"
                            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                    </svg>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search memories…"
                        aria-label="Semantic search"
                        className={[
                            'w-full bg-white/5 rounded-lg pl-8 pr-7 py-2 text-xs text-white/60',
                            'placeholder-white/15 border outline-none transition-all',
                            query
                                ? 'border-violet-500/30 bg-violet-500/5'
                                : 'border-white/5 focus:border-white/15',
                        ].join(' ')}
                    />
                    {query && (
                        <button
                            onClick={clearSearch}
                            aria-label="Clear search"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none"
                                viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
                {isSearchMode && !searching && searchResults && (
                    <p className="text-[10px] text-white/20 mt-1.5 ml-1">
                        {searchResults.length === 0
                            ? 'No similar entries found'
                            : `${searchResults.length} similar ${searchResults.length === 1 ? 'entry' : 'entries'}`}
                    </p>
                )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-3 pb-6 space-y-1">
                {isLoading && (
                    <div className="space-y-2 px-1 pt-2">
                        {[...Array(isSearchMode ? 3 : 4)].map((_, i) => (
                            <div key={i} className="rounded-xl p-3 bg-white/5 animate-pulse">
                                <div className="h-2.5 w-24 bg-white/10 rounded mb-2" />
                                <div className="h-2 w-full bg-white/5 rounded mb-1" />
                                <div className="h-2 w-3/4 bg-white/5 rounded" />
                            </div>
                        ))}
                    </div>
                )}

                {!isLoading && (searchError || error) && (
                    <p className="text-xs text-red-400 px-2 pt-4">
                        {searchError || error}
                    </p>
                )}

                {!isLoading && !searchError && !error && displayEntries.length === 0 && (
                    <div className="pt-8 text-center px-4">
                        <p className="text-white/20 text-xs leading-relaxed">
                            {isSearchMode
                                ? 'Try a different phrase to find related memories.'
                                : <>No entries yet.<br />Start writing to see them here.</>}
                        </p>
                    </div>
                )}

                {!isLoading && !searchError && !error && displayEntries.map((entry) => (
                    <EntryRow
                        key={entry.id}
                        entry={entry}
                        isActive={entry.id === activeEntryId}
                        onSelect={onSelectEntry}
                        onDelete={handleDelete}
                        similarity={isSearchMode ? entry.similarity : null}
                    />
                ))}
            </div>

            {/* Bottom nav — Journal / Drift toggle */}
            <nav className="mt-auto border-t border-white/5 px-3 py-3 grid grid-cols-3 gap-1">
                <button
                    onClick={() => navigate('/dashboard')}
                    className={[
                        'flex flex-col items-center gap-1 py-2 rounded-lg text-[10px] font-medium transition-all',
                        pathname === '/dashboard'
                            ? 'bg-violet-500/15 text-violet-300'
                            : 'text-white/25 hover:bg-white/5 hover:text-white/50',
                    ].join(' ')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Journal
                </button>
                <button
                    onClick={() => navigate('/drift')}
                    className={[
                        'flex flex-col items-center gap-1 py-2 rounded-lg text-[10px] font-medium transition-all',
                        pathname === '/drift'
                            ? 'bg-violet-500/15 text-violet-300'
                            : 'text-white/25 hover:bg-white/5 hover:text-white/50',
                    ].join(' ')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4v16" />
                    </svg>
                    Drift
                </button>
                <button
                    onClick={() => navigate('/reports')}
                    className={[
                        'flex flex-col items-center gap-1 py-2 rounded-lg text-[10px] font-medium transition-all',
                        pathname === '/reports'
                            ? 'bg-violet-500/15 text-violet-300'
                            : 'text-white/25 hover:bg-white/5 hover:text-white/50',
                    ].join(' ')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Reports
                </button>
            </nav>
        </aside>
    )
}

