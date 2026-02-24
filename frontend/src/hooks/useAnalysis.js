import { useState, useEffect, useRef, useCallback } from 'react'
import { getAnalysis } from '../lib/api'

/**
 * useAnalysis — polls GET /entries/{id}/analysis every 3s until analyzed=true.
 *
 * Returns:
 *   analysis   — the full result object (null while loading)
 *   analyzing  — true while waiting for the backend to finish
 *   error      — string if the poll itself hard-fails
 */
export function useAnalysis(entryId) {
    const [analysis, setAnalysis] = useState(null)
    const [analyzing, setAnalyzing] = useState(false)
    const [error, setError] = useState(null)
    const intervalRef = useRef(null)

    const stopPolling = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }
    }, [])

    const poll = useCallback(async (id) => {
        try {
            const data = await getAnalysis(id)
            if (data.analyzed) {
                setAnalysis(data)
                setAnalyzing(false)
                stopPolling()
            }
        } catch (err) {
            // Don't crash — just keep polling on transient errors
            console.warn('[useAnalysis] poll error:', err.message)
        }
    }, [stopPolling])

    useEffect(() => {
        stopPolling()

        if (!entryId) {
            setAnalysis(null)
            setAnalyzing(false)
            setError(null)
            return
        }

        // Reset for the new entry
        setAnalysis(null)
        setError(null)
        setAnalyzing(true)

        // Poll immediately, then every 3 seconds
        poll(entryId)
        intervalRef.current = setInterval(() => poll(entryId), 3000)

        return stopPolling
    }, [entryId, poll, stopPolling])

    return { analysis, analyzing, error }
}
