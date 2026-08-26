import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, Building2, LineChart, Flag, ClipboardList,
  Blocks, Wand2, SlidersHorizontal, LogOut,
} from 'lucide-react'
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

// `need: null` items are always shown; everything else is filtered by
// hasPermission — an Admin's nav only ever shows what their assigned
// AdminRole actually grants (the backend enforces the same permission on
// every underlying endpoint regardless of what the nav shows). SUPER_ADMIN's
// hasPermission always returns true, so they see every item too.
//
// "Sim Builder" links to a sibling top-level route
// (/admin/content/sim-builder*, see AppRouter.jsx) rather than an internal
// <Route> below — it's a standalone full-screen tool with its own header, not
// part of this portal's shell. `newTab: true` opens it in its own browser tab:
// building a simulation is a long working session that owns the whole viewport,
// and an author wants the portal still sitting where they left it.
//
// "Simulations" is the CATALOGUE — publish, unpublish, unenrol, delete. It no
// longer opens the editor inline; its Edit action opens the builder in a tab
// too, so there is one place a simulation is built.
const SECTIONS = [
  { items: [{ label: 'Overview', icon: LayoutDashboard, to: '/admin', end: true, need: null }] },
  {
    label: 'People',
    items: [
      { label: 'Users', icon: Users, to: '/admin/users', need: 'users.view' },
      { label: 'Universities', icon: Building2, to: '/admin/universities', need: 'users.view' },
    ],
  },
  {
    label: 'Content',
    items: [
      { label: 'Simulations', icon: Blocks, to: '/admin/simulations', need: 'simulations.view' },
      { label: 'Sim Builder', icon: Wand2, to: '/admin/content/sim-builder', need: 'simulations.view', newTab: true },
    ],
  },
  {
    label: 'Insights',
    items: [
      { label: 'Analytics', icon: LineChart, to: '/admin/analytics', need: 'analytics.view_platform' },
      { label: 'Feature Flags', icon: Flag, to: '/admin/feature-flags', need: 'feature_flags.view' },
      { label: 'Activity', icon: ClipboardList, to: '/admin/activity', need: 'activity.view_feed' },
    ],
  },
  {
    label: 'Platform',
    items: [
      { label: 'Configuration', icon: SlidersHorizontal, to: '/admin/configuration', need: 'config.view' },
    ],
  },
]

const TITLES = {
  '/admin': 'Overview',
  '/admin/users': 'Users',
  '/admin/universities': 'Universities',
  '/admin/simulations': 'Simulations',
  '/admin/analytics': 'Analytics',
  '/admin/feature-flags': 'Feature Flags',
  '/admin/activity': 'Activity',
  '/admin/configuration': 'Configuration',
}

/**
 * Admin portal — the lower RBAC tier, distinct from SuperAdmin. Nav is built
 * dynamically from the signed-in admin's resolved permissions. Also where
 * Simulations, Sim Builder, Feature Flags, Universities, and the
 * Configuration Center live — SuperAdmin no longer has its own copies of
 * these, it reaches them here too (see App.jsx's RequireAdmin, which lets
 * SUPER_ADMIN through).
 *
 * App.jsx mounts this at `path="/admin/*"` and lazy-loads it — every page
 * below is imported by THIS file, not App.jsx, so the whole subtree lands
 * in one code-split chunk a regular student never downloads.
 */
export default function AdminPortal() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, hasPermission } = useAuth()

  const sections = SECTIONS
    .map((section) => ({ ...section, items: section.items.filter((item) => !item.need || hasPermission(item.need)) }))
    .filter((section) => section.items.length > 0)
  const title = TITLES[location.pathname] || 'Admin'

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
