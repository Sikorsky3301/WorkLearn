import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../../features/auth/AuthContext'
import { ROLES } from '../../../rbac/roles'
import PortalSpinner from './PortalSpinner'

/**
 * Teachers with CMS access must use /mentor/simulations* and
 * /mentor/sim-builder* — never the platform Admin URL prefix.
 */
export default function RedirectTeacherAwayFromAdminCms({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <PortalSpinner />
  if (user?.role === ROLES.TEACHER) {
    const to = `${location.pathname.replace(/^\/admin/, '/mentor')}${location.search}${location.hash}`
    return <Navigate to={to} replace />
  }
  return children
}
