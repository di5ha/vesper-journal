import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import ProtectedRoute from './components/ProtectedRoute'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import DriftTimeline from './pages/DriftTimeline'
import Reports from './pages/Reports'

/**
 * App — root router.
 *
 * Routes:
 *   /           → redirect to /dashboard
 *   /auth       → login / signup (public)
 *   /dashboard  → protected; redirects to /auth if unauthenticated
 *
 * More routes will be added in Phase 1.5+ (editor, entries, drift, reports).
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/auth" element={<Auth />} />

          {/* Protected */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/drift"
            element={
              <ProtectedRoute>
                <DriftTimeline />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />


          {/* Fallback: redirect root → dashboard (ProtectedRoute handles auth check) */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
