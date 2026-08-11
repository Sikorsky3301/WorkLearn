import { useAuth } from '../features/auth/AuthContext'
import { ROLES } from '../rbac/roles'

/** CMS / Sim Builder live under /admin for platform admins and /mentor for teachers. */
export function useCmsBasePath() {
  const { user } = useAuth()
  return user?.role === ROLES.TEACHER ? '/mentor' : '/admin'
}
