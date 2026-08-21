import { Navigate } from 'react-router-dom'
import { useAuth } from '../../../features/auth/AuthContext'
import { ROLES } from '../../../rbac/roles'
import PortalSpinner from './PortalSpinner'

/**
 * CMS / Sim Builder tools: platform Admin + Super Admin, or Teacher with
 * University-Admin-granted cms_access feature flag.
 */
export default function RequireCmsAccess({ children }) {
  const { user, loading, hasFeature } = useAuth()
  if (loading) return <PortalSpinner />
  if (!user) return <Navigate to="/login" replace />
  if (user.role === ROLES.ADMIN || user.role === ROLES.SUPER_ADMIN) return children
  if (user.role === ROLES.TEACHER && hasFeature('cms_access')) return children
  if (user.role === ROLES.TEACHER) return <Navigate to="/mentor" replace />
  if (user.role === ROLES.UNIVERSITY_ADMIN) return <Navigate to="/university-admin" replace />
  return <Navigate to="/login" replace />
}
