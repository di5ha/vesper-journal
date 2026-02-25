import { useState, useCallback, useEffect } from 'react'
import { createEntry, updateEntry } from '../lib/api'
import { useAutoSave } from '../hooks/useAutoSave'

function SaveBadge({ saving, saved, error, hasContent }) {
    if (error) return <span className="text-xs text-red-500 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />Save failed</span>
    if (saving) return <span className="text-xs text-[rgba(17,17,17,0.4)] flex items-center gap-1.5 animate-pulse"><span className="w-1.5 h-1.5 rounded-full bg-[rgba(17,17,17,0.3)]" />Saving…</span>
    if (saved) return <span className="text-xs text-[#FF6B4A] flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#FF6B4A]" />Saved</span>
    if (hasContent) return <span className="text-xs text-[rgba(17,17,17,0.4)] flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[rgba(17,17,17,0.2)]" />Draft</span>
    return null
}

export default function JournalEditor({ initialEntryId = null, initialContent = '', onSaved }) {
    const [content, setContent] = useState(initialContent)
    const [entryId, setEntryId] = useState(initialEntryId)

    useEffect(() => { setContent(initialContent); setEntryId(initialEntryId) }, [initialContent, initialEntryId])

    const saveFn = useCallback(async (text) => {
        let entry
        if (!entryId) { entry = await createEntry(text); setEntryId(entry.id) }
        else { entry = await updateEntry(entryId, text) }
        onSaved?.(entry)
        return entry
    }, [entryId, onSaved])

    const { saving, saved, error } = useAutoSave(content, saveFn, 3000)
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-8 py-4 border-b border-[rgba(17,17,17,0.06)]">
                <span className="text-sm font-medium text-[rgba(17,17,17,0.55)]">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
                <div className="flex items-center gap-5">
                    <SaveBadge saving={saving} saved={saved} error={error} hasContent={!!content.trim()} />
                    <span className="text-xs text-[rgba(17,17,17,0.4)] font-medium tabular-nums">
                        {wordCount} {wordCount === 1 ? 'word' : 'words'}
                    </span>
                </div>
            </div>

            {/* Editor */}
            <div className="flex-1 relative">
                {!content && (
                    <p className="absolute top-8 left-0 right-0 px-8 text-[rgba(17,17,17,0.3)] text-lg leading-relaxed pointer-events-none select-none italic">
                        What's on your mind today?
                    </p>
                )}
                <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    spellCheck
                    autoFocus
                    className="w-full h-full min-h-[400px] bg-transparent resize-none px-8 py-8 text-[#111111] text-[17px] leading-[1.75] focus:outline-none font-sans"
                    aria-label="Journal entry"
                />
            </div>

            {!content && (
                <p className="px-8 pb-5 text-xs text-[rgba(17,17,17,0.35)] select-none">
                    Auto-saves 3 s after you stop typing.
                </p>
            )}
        </div>
    )
}
