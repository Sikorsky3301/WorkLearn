import { Navigate } from 'react-router-dom'
import { useAuth } from '../../../features/auth/AuthContext'
import { portalPathForRole } from '../../../rbac/roles'
import PortalSpinner from './PortalSpinner'

/** Auth entry pages — bounce signed-in users to their portal so the browser
 * back button can't strand them on a login form with a live session.
 *
 * EXCEPT while that page is running its own post-login transition. Signing in
 * sets `user`, and this guard used to redirect on the very same commit — which
 * unmounted the login page before its multi-step loader drew a single frame.
 * The loader existed and worked the whole time; it simply never got to render,
 * so signing in looked like an abrupt jump with no feedback at all.
 *
 * `authTransition` is set by the page when it starts that loader, and cleared
 * on logout. Someone who just signed in ON this form is not stranded on it —
 * they are mid-navigation — so there is nothing here to protect them from.
 */
export default function GuestOnlyRoute({ children }) {
  const { user, loading, authTransition } = useAuth()
  if (loading) return <PortalSpinner />
  if (user && !authTransition) return <Navigate to={portalPathForRole(user.role)} replace />
  return children
}
