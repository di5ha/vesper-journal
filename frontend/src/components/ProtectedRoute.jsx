import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

/**
 * ProtectedRoute — gates any child routes behind authentication.
 *
 * - While loading: shows a full-screen spinner so there's no flash of the
 *   login page for an already-authenticated user.
 * - Unauthenticated: redirects to /auth (replace so back button doesn't loop).
 * - Authenticated: renders children normally.
 */
export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/auth" replace />
    }

    return children
}
