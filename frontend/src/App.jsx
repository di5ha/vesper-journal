import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import ProtectedRoute from './components/ProtectedRoute'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import JournalEditor from './pages/JournalEditor'
import DriftTimeline from './pages/DriftTimeline'
import Reports from './pages/Reports'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/auth" element={<Auth />} />

          {/* Protected — journal home */}
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />

          {/* Protected — new entry */}
          <Route path="/journal/new" element={
            <ProtectedRoute><JournalEditor /></ProtectedRoute>
          } />

          {/* Protected — edit existing entry */}
          <Route path="/journal/:id" element={
            <ProtectedRoute><JournalEditor /></ProtectedRoute>
          } />

          {/* Protected — Drift & Reports (keep from main but styled) */}
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
