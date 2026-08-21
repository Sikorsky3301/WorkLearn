import { useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import PortalShell from '../../components/design-system/PortalShell'
import Sidebar from '../../components/design-system/Sidebar'
import Topbar from '../../components/design-system/Topbar'
import ThemeToggle from '../../components/design-system/ThemeToggle'
import TenantBrandMark from '../../components/TenantBrandMark'
import { buildMentorNavSections, mentorTitleForPath, isMentorCmsEditorPath } from './mentorNav'

/**
 * Portal chrome for AppRouter CMS routes (/mentor/simulations*, /mentor/sim-builder*).
 * Mirrors MentorPortal so teachers can switch tabs without leaving the shell.
 */
export default function MentorCmsLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, hasFeature } = useAuth()
  const uniLabel = user?.university?.name || user?.institution || 'Your university'
  const cms = hasFeature('cms_access')

  const sections = useMemo(() => buildMentorNavSections(cms), [cms])
  const title = mentorTitleForPath(location.pathname)
  const editor = isMentorCmsEditorPath(location.pathname)

  return (
    <PortalShell>
      <Sidebar
        title="WorkLearn AI"
        subtitle="Mentor"
        brand={
          <div>
            <TenantBrandMark size="sm" />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">Mentor</p>
          </div>
        }
        sections={sections}
        footer={
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                {(user?.name || 'T').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{user?.name || 'Teacher'}</p>
                <p className="text-[10px] text-slate-400 truncate">{uniLabel}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { logout(); navigate('/login') }}
              className="w-full flex items-center gap-2 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors text-left px-2 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        }
      />
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <Topbar title={title} description={`${uniLabel} · Mentor`} actions={<ThemeToggle />} />
        <main className={editor ? 'flex-1 min-h-0 overflow-hidden flex flex-col' : 'flex-1 overflow-y-auto p-6'}>
          {children}
        </main>
      </div>
    </PortalShell>
  )
}
