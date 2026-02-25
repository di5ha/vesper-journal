import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import ProtectedRoute from './components/ProtectedRoute'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import DriftTimeline from './pages/DriftTimeline'
import Reports from './pages/Reports'

// Redirect /journal/:id → /dashboard?entry=<id>
// Redirect /journal/new → /dashboard?new=1
function EntryRedirect() {
  const { id } = useParams()
  return <Navigate to={`/dashboard?entry=${id}`} replace />
}
function NewEntryRedirect() {
  return <Navigate to="/dashboard?new=1" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/auth" element={<Auth />} />

          {/* Protected — main two-panel dashboard */}
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />

          {/* Redirect old journal routes into dashboard panels */}
          <Route path="/journal/new" element={
            <ProtectedRoute><NewEntryRedirect /></ProtectedRoute>
          } />
          <Route path="/journal/:id" element={
            <ProtectedRoute><EntryRedirect /></ProtectedRoute>
          } />

          {/* Protected — Drift & Reports */}
          <Route path="/drift" element={
            <ProtectedRoute><DriftTimeline /></ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute><Reports /></ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
