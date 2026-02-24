import { useEffect, useRef, useState } from 'react'

/**
 * useDebounce — returns a debounced copy of `value`.
 *
 * The returned value only updates after the user has stopped changing
 * `value` for `delay` milliseconds (default 3000ms per PRD spec).
 *
 * @param {any}    value  - Value to debounce
 * @param {number} delay  - Delay in ms (default: 3000)
 * @returns debounced value
 */
export function useDebounce(value, delay = 3000) {
    const [debouncedValue, setDebouncedValue] = useState(value)

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay)
        return () => clearTimeout(timer)
    }, [value, delay])

    return debouncedValue
}

/**
 * useAutoSave — calls `saveFn` after the user stops editing for `delay` ms.
 *
 * Returns `{ saving, saved, error }` for UI status indicators.
 *
 * @param {any}      value   - The value to watch (entry content)
 * @param {Function} saveFn  - Async function called with the debounced value
 * @param {number}   delay   - Debounce delay in ms (default: 3000)
 */
export function useAutoSave(value, saveFn, delay = 3000) {
    const debouncedValue = useDebounce(value, delay)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState(null)

    // Track whether this is the initial mount so we don't save on first render
    const isFirstRender = useRef(true)
    // Track the last value we actually saved to avoid duplicate saves
    const lastSaved = useRef(null)

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false
            lastSaved.current = debouncedValue
            return
        }
        // Don't trigger if nothing changed since last save
        if (debouncedValue === lastSaved.current) return
        // Don't save empty content
        if (!debouncedValue?.trim()) return

        let cancelled = false

        async function doSave() {
            setSaving(true)
            setSaved(false)
            setError(null)
            try {
                await saveFn(debouncedValue)
                if (!cancelled) {
                    lastSaved.current = debouncedValue
                    setSaved(true)
                    // Reset "Saved" indicator after 3 s
                    setTimeout(() => { if (!cancelled) setSaved(false) }, 3000)
                }
            } catch (err) {
                if (!cancelled) setError(err.message)
            } finally {
                if (!cancelled) setSaving(false)
            }
        }

        doSave()
        return () => { cancelled = true }
    }, [debouncedValue]) // eslint-disable-line react-hooks/exhaustive-deps

    return { saving, saved, error }
}
