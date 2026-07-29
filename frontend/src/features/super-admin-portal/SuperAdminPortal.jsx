import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, UserCircle2, GraduationCap,
  ClipboardList, LogOut, UsersRound, KeyRound, LineChart, ScrollText,
} from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import PortalShell from '../../shared/design-system/PortalShell'
import Sidebar from '../../shared/design-system/Sidebar'
import Topbar from '../../shared/design-system/Topbar'
import ThemeToggle from '../../shared/design-system/ThemeToggle'
import OverviewPage from './pages/OverviewPage'
import AnalyticsPage from './pages/AnalyticsPage'
import DirectUsersPage from './pages/DirectUsersPage'
import StudentsPage from './pages/StudentsPage'
import AdminManagementPage from './pages/AdminManagementPage'
import RolesPermissionsPage from './pages/RolesPermissionsPage'
import ActivityLogPage from './pages/ActivityLogPage'
import AuditLogPage from './pages/AuditLogPage'

const SECTIONS = [
  {
    items: [
      { label: 'Overview', icon: LayoutDashboard, to: '/super-admin', end: true },
      { label: 'Analytics', icon: LineChart, to: '/super-admin/analytics' },
    ],
  },
  {
    label: 'People',
    items: [
      { label: 'Direct Users', icon: UserCircle2, to: '/super-admin/users' },
      { label: 'All Students', icon: GraduationCap, to: '/super-admin/students' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { label: 'Admins', icon: UsersRound, to: '/super-admin/admins' },
      { label: 'Roles & Permissions', icon: KeyRound, to: '/super-admin/roles' },
      { label: 'Activity Log', icon: ClipboardList, to: '/super-admin/activity' },
      { label: 'Audit Log', icon: ScrollText, to: '/super-admin/audit-log' },
    ],
  },
]

const TITLES = {
  '/super-admin': 'Overview',
  '/super-admin/analytics': 'Analytics',
  '/super-admin/users': 'Direct Users',
  '/super-admin/students': 'All Students',
  '/super-admin/admins': 'Admins',
  '/super-admin/roles': 'Roles & Permissions',
  '/super-admin/activity': 'Activity Log',
  '/super-admin/audit-log': 'Audit Log',
}

/**
 * SuperAdmin portal shell — platform-level concerns only (Overview/Analytics,
 * People, Admin Management, Roles & Permissions, Activity/Audit logs).
 * Simulations, Sim Builder, Feature Flags, Universities, and the
 * Configuration Center all live in the Admin portal instead
 * (src/features/admin-portal/) — SUPER_ADMIN can still reach them there (see
 * App.jsx's RequireAdmin), they're just not part of this portal's own nav.
 *
 * App.jsx mounts this at `path="/super-admin/*"` and lazy-loads it (see
 * React.lazy there) — every page below is imported by THIS file, not
 * App.jsx, so the whole subtree lands in one code-split chunk a regular
 * student never downloads.
 */
export default function SuperAdminPortal() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const title = TITLES[location.pathname] || 'Super Admin'

  return (
    <PortalShell>
      <Sidebar
        title="WorkLearn AI"
        subtitle="Super Admin"
        sections={SECTIONS}
        footer={
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                {(user?.name || 'SA').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{user?.name || 'Super Admin'}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => { logout(); navigate('/super-admin') }}
              className="w-full flex items-center gap-2 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors text-left px-2 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        }
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={title} description="Platform management · WorkLearn AI" actions={<ThemeToggle />} />
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route index element={<OverviewPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="users" element={<DirectUsersPage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="admins" element={<AdminManagementPage />} />
            <Route path="roles" element={<RolesPermissionsPage />} />
            <Route path="activity" element={<ActivityLogPage />} />
            <Route path="audit-log" element={<AuditLogPage />} />
          </Routes>
        </main>
      </div>
    </PortalShell>
  )
}
