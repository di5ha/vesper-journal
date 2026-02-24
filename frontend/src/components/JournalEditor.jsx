import { useState, useCallback, useEffect } from 'react'
import { createEntry, updateEntry } from '../lib/api'
import { useAutoSave } from '../hooks/useAutoSave'

// ---------------------------------------------------------------------------
// Save status badge
// ---------------------------------------------------------------------------
function SaveBadge({ saving, saved, error, hasContent }) {
    if (error) {
        return (
            <span className="flex items-center gap-1.5 text-xs text-red-400">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                Save failed
            </span>
        )
    }
    if (saving) {
        return (
            <span className="flex items-center gap-1.5 text-xs text-white/30 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
                Saving…
            </span>
        )
    }
    if (saved) {
        return (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Saved
            </span>
        )
    }
    if (hasContent) {
        return (
            <span className="flex items-center gap-1.5 text-xs text-white/20">
                <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                Draft
            </span>
        )
    }
    return null
}

// ---------------------------------------------------------------------------
// JournalEditor
// ---------------------------------------------------------------------------

/**
 * JournalEditor — distraction-free writing area with auto-save.
 *
 * Auto-save flow (PRD §JRN-02):
 *   - User types → debounce waits 3 s after last keystroke
 *   - First save: POST /entries → stores returned id in state
 *   - Subsequent saves: PUT /entries/{id}
 *
 * Props:
 *   initialEntryId  — pre-populate with an existing entry (edit mode)
 *   initialContent  — content to seed the textarea (edit mode)
 *   onSaved(entry)  — called after each successful save with the latest entry
 *
 * Switching entries: change the `key` prop from Dashboard to force a remount
 *   and reset all internal state cleanly.
 */
export default function JournalEditor({ initialEntryId = null, initialContent = '', onSaved }) {
    const [content, setContent] = useState(initialContent)
    const [entryId, setEntryId] = useState(initialEntryId)

    // Keep in sync if parent passes new initial values (via key-based remount)
    useEffect(() => {
        setContent(initialContent)
        setEntryId(initialEntryId)
    }, [initialContent, initialEntryId])

    const saveFn = useCallback(async (text) => {
        let entry
        if (!entryId) {
            entry = await createEntry(text)
            setEntryId(entry.id)
        } else {
            entry = await updateEntry(entryId, text)
        }
        onSaved?.(entry)
        return entry
    }, [entryId, onSaved])

    const { saving, saved, error } = useAutoSave(content, saveFn, 3000)

    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-8 py-3 border-b border-white/5">
                <span className="text-sm font-medium text-white/40">
                    {new Date().toLocaleDateString('en-US', {
                        weekday: 'long', month: 'long', day: 'numeric'
                    })}
                </span>
                <div className="flex items-center gap-4">
                    <SaveBadge saving={saving} saved={saved} error={error} hasContent={!!content.trim()} />
                    <span className="text-xs text-white/20 tabular-nums">
                        {wordCount} {wordCount === 1 ? 'word' : 'words'}
                    </span>
                </div>
            </div>

            {/* Writing area */}
            <div className="flex-1 relative">
                {!content && (
                    <p className="absolute top-8 left-0 right-0 px-8 text-white/15 text-lg leading-relaxed pointer-events-none select-none">
                        What's on your mind today?
                    </p>
                )}
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    spellCheck
                    autoFocus
                    className="w-full h-full min-h-[400px] bg-transparent resize-none px-8 py-8 text-white/85 text-lg leading-relaxed focus:outline-none placeholder-transparent"
                    aria-label="Journal entry"
                />
            </div>

            {/* Hint */}
            {!content && (
                <p className="px-8 pb-5 text-xs text-white/15 select-none">
                    Vesper auto-saves your entry 3 seconds after you stop typing.
                </p>
            )}
        </div>
    )
}
