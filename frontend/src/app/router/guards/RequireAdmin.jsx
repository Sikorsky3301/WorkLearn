import { useAuth } from '../../../features/auth/AuthContext'
import { ROLES } from '../../../rbac/roles'
import AdminPortalLoginPage from '../../../features/auth/global/AdminPortalLogin'
import PortalSpinner from './PortalSpinner'

// Gates every /admin* route (the Admin portal, plus the job-sim CMS editor
// and Sim Builder re-hosted under it). SUPER_ADMIN is allowed straight
// through — the root role can always reach anything a lower tier can, it
// just isn't part of SuperAdmin's own portal nav.
export default function RequireAdmin({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <PortalSpinner />
  if (!user || (user.role !== ROLES.ADMIN && user.role !== ROLES.SUPER_ADMIN)) return <AdminPortalLoginPage />
  return children
}
