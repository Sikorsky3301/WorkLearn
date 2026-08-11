import { Navigate } from 'react-router-dom'
import { useAuth } from '../../../features/auth/AuthContext'
import { ROLES } from '../../../rbac/roles'
import PortalSpinner from './PortalSpinner'

/** University Admin only — partner-tenant org management portal. */
export default function RequireUniversityAdmin({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <PortalSpinner />
  if (user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN) {
    return <Navigate to="/admin" replace />
  }
  if (!user || user.role !== ROLES.UNIVERSITY_ADMIN) {
    return <Navigate to="/login" replace />
  }
  return children
}
