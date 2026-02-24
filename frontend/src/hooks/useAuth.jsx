import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

/**
 * AuthProvider — wraps the app and exposes auth state via context.
 * Listens to Supabase's onAuthStateChange so all children
 * automatically re-render when the session changes.
 */
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [session, setSession] = useState(null)
    const [loading, setLoading] = useState(true)  // true while Supabase resolves the initial session

    useEffect(() => {
        // 1. Hydrate from the persisted session on first mount
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)
            setLoading(false)
        })

        // 2. Subscribe to future auth events (login, logout, token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session)
                setUser(session?.user ?? null)
                setLoading(false)
            }
        )

        return () => subscription.unsubscribe()
    }, [])

    const value = { user, session, loading }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

/**
 * useAuth — consume the auth context in any component.
 * Returns { user, session, loading }.
 */
export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used inside an <AuthProvider>')
    }
    return context
}
