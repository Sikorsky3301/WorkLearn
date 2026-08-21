import { useNavigate, useLocation } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import PortalShell from '../../../components/design-system/PortalShell'
import Sidebar from '../../../components/design-system/Sidebar'
import Topbar from '../../../components/design-system/Topbar'
import ThemeToggle from '../../../components/design-system/ThemeToggle'
import { ADMIN_NAV_SECTIONS, adminTitleForPath, isAdminCmsEditorPath } from './adminNav'

/**
 * Portal chrome for AppRouter CMS routes (/admin/simulations*, /admin/sim-builder*).
 * Same sidebar/topbar/theme as AdminPortal so authors can switch tabs without
 * leaving the shell.
 */
export default function AdminCmsLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, hasPermission } = useAuth()

  const sections = ADMIN_NAV_SECTIONS
    .map((section) => ({ ...section, items: section.items.filter((item) => !item.need || hasPermission(item.need)) }))
    .filter((section) => section.items.length > 0)

  const title = adminTitleForPath(location.pathname)
  const editor = isAdminCmsEditorPath(location.pathname)

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
              type="button"
              onClick={() => { logout(); navigate('/admin') }}
              className="w-full flex items-center gap-2 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors text-left px-2 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        }
      />
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <Topbar title={title} description="Admin Portal · WorkLearn AI" actions={<ThemeToggle />} />
        <main className={editor ? 'flex-1 min-h-0 overflow-hidden flex flex-col' : 'flex-1 overflow-y-auto p-6'}>
          {children}
        </main>
      </div>
    </PortalShell>
  )
}
