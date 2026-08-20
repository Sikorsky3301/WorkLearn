import { Navigate } from 'react-router-dom'
import { useAuth } from '../../../features/auth/AuthContext'
import { portalPathForRole } from '../../../rbac/roles'
import PortalSpinner from './PortalSpinner'

/** Auth entry pages — bounce signed-in users to their portal so the browser
 * back button can't strand them on a login form with a live session. */
export default function GuestOnlyRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <PortalSpinner />
  if (user) return <Navigate to={portalPathForRole(user.role)} replace />
  return children
}
