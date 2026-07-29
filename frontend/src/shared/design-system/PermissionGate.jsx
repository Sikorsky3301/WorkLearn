import { useAuth } from '../../features/auth/AuthContext'

/**
 * UI-only gating so nav items/buttons don't dead-end into a 403 — the real
 * enforcement is always server-side (see backend's require_permission).
 * SUPER_ADMIN always passes, matching the backend's unconditional bypass.
 */
export default function PermissionGate({ need, children, fallback = null }) {
  const { user } = useAuth()
  if (user?.role === 'SUPER_ADMIN') return children
  if (user?.permissions?.includes(need)) return children
  return fallback
}
