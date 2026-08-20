import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { Users, LogOut, LayoutDashboard } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import PortalShell from '../../components/design-system/PortalShell'
import Sidebar from '../../components/design-system/Sidebar'
import Topbar from '../../components/design-system/Topbar'
import ThemeToggle from '../../components/design-system/ThemeToggle'
import TenantBrandMark from '../../components/TenantBrandMark'
import UniversityAdminUsersPage from './pages/UniversityAdminUsersPage'
import UniversityAdminOverviewPage from './pages/UniversityAdminOverviewPage'

const SECTIONS = [
  {
    items: [
      { label: 'Overview', icon: LayoutDashboard, to: '/university-admin', end: true },
      { label: 'Users', icon: Users, to: '/university-admin/users' },
    ],
  },
]

const TITLES = {
  '/university-admin': 'Overview',
  '/university-admin/users': 'Users',
}

/**
 * University Admin portal — org-scoped only (students/teachers in own university).
 * Distinct from Platform Admin (`/admin`). Cannot onboard universities or create
 * other university_admins.
 */
export default function UniversityAdminPortal() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const title = TITLES[location.pathname] || 'University Admin'
  const uniLabel = user?.university?.name || user?.institution || 'Your university'

  return (
    <PortalShell>
      <Sidebar
        title="WorkLearn AI"
        subtitle="University Admin"
        brand={
          <div>
            <TenantBrandMark size="sm" />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">University Admin</p>
          </div>
        }
        sections={SECTIONS}
        footer={
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                {(user?.name || 'U').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{user?.name || 'Admin'}</p>
                <p className="text-[10px] text-slate-400 truncate">{uniLabel}</p>
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
        <Topbar title={title} description={`${uniLabel} · University Admin`} actions={<ThemeToggle />} />
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route index element={<UniversityAdminOverviewPage />} />
            <Route path="users" element={<UniversityAdminUsersPage />} />
          </Routes>
        </main>
      </div>
    </PortalShell>
  )
}
