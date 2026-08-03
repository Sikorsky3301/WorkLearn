import { useAuth } from '../features/auth/AuthContext'

// Thin wrapper over AuthContext's hasPermission — UI-nav gating only, never
// the real authorization boundary (that's always server-side, see backend's
// require_permission).
export function usePermission(key) {
  const { hasPermission } = useAuth()
  return hasPermission(key)
}
