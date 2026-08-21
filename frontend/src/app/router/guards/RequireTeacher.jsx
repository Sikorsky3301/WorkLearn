import { Navigate } from 'react-router-dom'
import { useAuth } from '../../../features/auth/AuthContext'
import { ROLES } from '../../../rbac/roles'
import PortalSpinner from './PortalSpinner'

/** Teacher / Mentor portal only. */
export default function RequireTeacher({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <PortalSpinner />
  if (!user || user.role !== ROLES.TEACHER) {
    return <Navigate to="/login" replace />
  }
  return children
}
