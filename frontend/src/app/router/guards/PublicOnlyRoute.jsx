import { Navigate } from 'react-router-dom'
import { useAuth } from '../../../features/auth/AuthContext'
import PortalSpinner from './PortalSpinner'

/** Wraps the public marketing pages. A signed-in user hitting `/` should
 * land in the app, not on the sales page — before the landing page existed,
 * `/` sat inside ProtectedRoute and simply redirected to /dashboard, and
 * this preserves that for authenticated sessions while letting logged-out
 * visitors actually see the site. */
export default function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <PortalSpinner />
  if (user) return <Navigate to="/dashboard" replace />
  return children
}
