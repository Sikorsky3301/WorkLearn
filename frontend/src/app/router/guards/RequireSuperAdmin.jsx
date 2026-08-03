import { useAuth } from '../../../features/auth/AuthContext'
import { ROLES } from '../../../rbac/roles'
import SuperAdminLoginPage from '../../../features/auth/global/SuperAdminLogin'
import PortalSpinner from './PortalSpinner'

// Gates every /super-admin* route — SuperAdmin-exclusive surface (Admin
// Management, Roles & Permissions, Config Center, Audit Log, etc.). Shows a
// spinner while auth resolves, SuperAdminLoginPage if not a signed-in
// SUPER_ADMIN, or the requested page otherwise.
//
// An Admin session does NOT bounce back to /admin here — it shows the
// SuperAdmin login form instead, same as anyone else without a SUPER_ADMIN
// session. That used to auto-redirect, which meant typing /super-admin into
// the address bar while signed in as Admin just landed back on /admin with
// no way to actually sign in as a super admin from there. The real
// authorization boundary is server-side anyway (an Admin's token can't call
// any SuperAdmin-only endpoint regardless of what page the SPA shows), so
// there's nothing this redirect was protecting — successfully logging in
// here just replaces the session token/user for this tab, same as any login.
export default function RequireSuperAdmin({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <PortalSpinner />
  if (!user || user.role !== ROLES.SUPER_ADMIN) return <SuperAdminLoginPage />
  return children
}
