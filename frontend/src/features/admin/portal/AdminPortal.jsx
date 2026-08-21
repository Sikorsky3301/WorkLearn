import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import PortalShell from '../../../components/design-system/PortalShell'
import Sidebar from '../../../components/design-system/Sidebar'
import Topbar from '../../../components/design-system/Topbar'
import ThemeToggle from '../../../components/design-system/ThemeToggle'
import OverviewPage from './pages/OverviewPage'
import UsersPage from './pages/UsersPage'
import UniversitiesPage from './pages/UniversitiesPage'
import SimulationsPage from './pages/SimulationsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import FeatureFlagsPage from './pages/FeatureFlagsPage'
import ActivityPage from './pages/ActivityPage'
import ConfigurationPage from './pages/ConfigurationPage'
import { ADMIN_NAV_SECTIONS, ADMIN_TITLES } from './adminNav'

/**
 * Admin portal — the lower RBAC tier, distinct from SuperAdmin. Nav is built
 * dynamically from the signed-in admin's resolved permissions. Also where
 * Simulations, Sim Builder, Feature Flags, Universities, and the
 * Configuration Center live — SuperAdmin no longer has its own copies of
 * these, it reaches them here too (see App.jsx's RequireAdmin, which lets
 * SUPER_ADMIN through).
 *
 * CMS list/editor routes are declared as AppRouter siblings wrapped in
 * AdminCmsLayout (same sidebar). Nested simulations below is a fallback
 * only if that sibling is ever absent.
 *
 * App.jsx mounts this at `path="/admin/*"` and lazy-loads it — every page
 * below is imported by THIS file, not App.jsx, so the whole subtree lands
 * in one code-split chunk a regular student never downloads.
 */
export default function AdminPortal() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, hasPermission } = useAuth()

  const sections = ADMIN_NAV_SECTIONS
    .map((section) => ({ ...section, items: section.items.filter((item) => !item.need || hasPermission(item.need)) }))
    .filter((section) => section.items.length > 0)
  const title = ADMIN_TITLES[location.pathname] || 'Admin'

  return (
    <PortalShell>
      <Sidebar
        title="WorkLearn AI"
        subtitle={user?.admin_role_name || 'Admin'}
        sections={sections}
        footer={
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                {(user?.name || 'A').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{user?.name || 'Admin'}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => { logout(); navigate('/admin') }}
              className="w-full flex items-center gap-2 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors text-left px-2 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        }
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={title} description="Admin Portal · WorkLearn AI" actions={<ThemeToggle />} />
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route index element={<OverviewPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="universities" element={<UniversitiesPage />} />
            <Route path="simulations" element={<SimulationsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="feature-flags" element={<FeatureFlagsPage />} />
            <Route path="activity" element={<ActivityPage />} />
            <Route path="configuration" element={<ConfigurationPage />} />
          </Routes>
        </main>
      </div>
    </PortalShell>
  )
}
