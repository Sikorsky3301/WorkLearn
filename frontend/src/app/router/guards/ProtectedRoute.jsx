import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../../features/auth/AuthContext'
import { ROLES } from '../../../rbac/roles'
import PortalSpinner from './PortalSpinner'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <PortalSpinner />
  if (!user) return <Navigate to="/login" replace />
  // Admins/SuperAdmins have no student profile — keep them in their own portal
  if (user.role === ROLES.SUPER_ADMIN) return <Navigate to="/super-admin" replace />
  if (user.role === ROLES.ADMIN) return <Navigate to="/admin" replace />
  // First-login onboarding wizard (features/onboarding/) — gated to the two
  // student-facing roles; CLASS_MENTOR never sees it (mentors aren't picking
  // a job-simulation domain). Existing accounts were backfilled to
  // onboarding_completed=true by migration 0005, so this only ever fires for
  // genuinely new sign-ups.
  const needsOnboarding = (user.role === ROLES.DIRECT_USER || user.role === ROLES.UNIVERSITY_STUDENT) && !user.onboarding_completed
  if (needsOnboarding && location.pathname !== '/onboarding') return <Navigate to="/onboarding" replace />
  return <Outlet />
}
