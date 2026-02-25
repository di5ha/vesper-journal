/**
 * src/lib/api.js — Authenticated API client for the Vesper FastAPI backend.
 *
 * Every function retrieves the current Supabase session and injects
 * the JWT as `Authorization: Bearer <token>` so the backend's
 * get_token() dependency and Postgres RLS work correctly.
 */

import { supabase } from './supabase'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

// ---------------------------------------------------------------------------
// Internal helper — always gets a fresh token
// ---------------------------------------------------------------------------
async function authHeaders() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
        throw new Error('Not authenticated — no active Supabase session.')
    }
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
    }
}

async function request(path, options = {}) {
    const headers = await authHeaders()
    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

    if (!res.ok) {
        const body = await res.json().catch(() => ({ detail: res.statusText }))
        throw new Error(body.detail ?? `API error ${res.status}`)
    }

    // 204 No Content
    if (res.status === 204) return null
    return res.json()
}

// ---------------------------------------------------------------------------
// Entries API
// ---------------------------------------------------------------------------

/** Create a new journal entry. Returns the full EntryResponse. */
export const createEntry = (payload) =>
    request('/entries', {
        method: 'POST',
        body: JSON.stringify(
            typeof payload === 'string'
                ? { content: payload }          // backward compat
                : payload
        ),
    })

/** Update an existing entry. Returns updated EntryResponse. */
export const updateEntry = (id, payload) =>
    request(`/entries/${id}`, {
        method: 'PUT',
        body: JSON.stringify(
            typeof payload === 'string'
                ? { content: payload }          // backward compat
                : payload
        ),
    })

/** List all entries for the current user (newest first). */
export const listEntries = () => request('/entries')
export const getEntries = listEntries   // alias used by V0 Dashboard

/** Get a single entry by ID. */
export const getEntry = (id) => request(`/entries/${id}`)

/** Get AI analysis status for an entry. */
export const getAnalysis = (id) => request(`/entries/${id}/analysis`)

/** Semantic search — returns top-N similar entries. */
export const searchEntries = (query, limit = 8) =>
    request('/entries/search', {
        method: 'POST',
        body: JSON.stringify({ query, limit }),
    })

/** Delete an entry by ID. */
export const deleteEntry = (id) =>
    request(`/entries/${id}`, { method: 'DELETE' })

// ---------------------------------------------------------------------------
// Dashboard Stats API
// ---------------------------------------------------------------------------

/** Streak, 7-day sparkline, latest analysis. */
export const getDashboardStats = () => request('/dashboard/stats')

// ---------------------------------------------------------------------------
// Drift Timeline API
// ---------------------------------------------------------------------------

/** All distinct themes across the user's analyzed entries. */
export const getDriftThemes = () => request('/drift/themes')

/**
 * Mood-score timeline (oldest → newest).
 * Pass a theme string to filter to entries containing that theme.
 */
export const getDriftTimeline = (theme = null) =>
    request(`/drift/timeline${theme ? `?theme=${encodeURIComponent(theme)}` : ''}`)

// ---------------------------------------------------------------------------
// Reports API
// ---------------------------------------------------------------------------

/** Synthesise a new weekly report from the last 7 analyzed entries. */
export const generateReport = () =>
    request('/reports/generate', { method: 'POST' })

/** List all past reports (newest first). */
export const listReports = () => request('/reports')

/** Get a single report by ID. */
export const getReport = (id) => request(`/reports/${id}`)

/**
 * Download the PDF for a report — triggers a browser file download.
 * Uses a blob URL so it works without a new tab opening.
 */
export async function downloadReportPdf(id, weekStart) {
    const { data: { session } } = await (await import('./supabase')).supabase.auth.getSession()
    if (!session?.access_token) throw new Error('Not authenticated')
    const res = await fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:8000'}/reports/${id}/pdf`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
    })
    if (!res.ok) throw new Error(`PDF download failed: ${res.status}`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vesper_report_${(weekStart || '').replace(/-/g, '')}.pdf`
    a.click()
    URL.revokeObjectURL(url)
}


