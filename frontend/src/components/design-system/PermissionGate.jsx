import { usePermission } from '../../rbac/usePermission'

/**
 * UI-only gating so nav items/buttons don't dead-end into a 403 — the real
 * enforcement is always server-side (see backend's require_permission).
 * SUPER_ADMIN always passes, matching the backend's unconditional bypass.
 */
export default function PermissionGate({ need, children, fallback = null }) {
  return usePermission(need) ? children : fallback
}
