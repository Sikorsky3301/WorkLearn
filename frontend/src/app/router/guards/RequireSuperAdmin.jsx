import { Navigate } from 'react-router-dom'
import { useAuth } from '../../../features/auth/AuthContext'
import { ROLES } from '../../../rbac/roles'
import PortalSpinner from './PortalSpinner'

// Gates every /super-admin* route — SuperAdmin-exclusive surface (Admin
// Management, Roles & Permissions, Config Center, Audit Log, etc.). Shows a
// spinner while auth resolves, bounces to the single /login page if not a
// signed-in SUPER_ADMIN, or the requested page otherwise — same pattern as
// RequireAdmin. Everyone signs in on /login; role picks the portal.
export default function RequireSuperAdmin({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <PortalSpinner />
  if (!user || user.role !== ROLES.SUPER_ADMIN) return <Navigate to="/login" replace />
  return children
}
