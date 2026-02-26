import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AuthProvider } from './hooks/useAuth'
import ProtectedRoute from './components/ProtectedRoute'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import DriftTimeline from './pages/DriftTimeline'
import Reports from './pages/Reports'

// Redirect /journal/:id → /dashboard?entry=<id>
function EntryRedirect() {
  const { id } = useParams()
  return <Navigate to={`/dashboard?entry=${id}`} replace />
}
function NewEntryRedirect() {
  return <Navigate to="/dashboard?new=1" replace />
}

// Framer-motion page wrapper — fade + subtle slide up
const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.15, ease: 'easeIn' } },
}

function PageWrapper({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ height: '100%', display: 'contents' }}
    >
      {children}
    </motion.div>
  )
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public */}
        <Route path="/auth" element={<PageWrapper><Auth /></PageWrapper>} />

        {/* Protected — main dashboard */}
        <Route path="/dashboard" element={
          <ProtectedRoute><PageWrapper><Dashboard /></PageWrapper></ProtectedRoute>
        } />

        {/* Redirect old journal routes */}
        <Route path="/journal/new" element={
          <ProtectedRoute><NewEntryRedirect /></ProtectedRoute>
        } />
        <Route path="/journal/:id" element={
          <ProtectedRoute><EntryRedirect /></ProtectedRoute>
        } />

        {/* Protected — Drift & Reports */}
        <Route path="/drift" element={
          <ProtectedRoute><PageWrapper><DriftTimeline /></PageWrapper></ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute><PageWrapper><Reports /></PageWrapper></ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AnimatedRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
