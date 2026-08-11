import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '../../../auth/AuthContext'
import { ROLES } from '../../../../rbac/roles'
import SimulationsListPanel from '../../../builder/cms/SimulationsListPanel'

/** Standalone CMS list (RequireCmsAccess) — /admin for platform admins,
 * /mentor for teachers with cms_access. */
export default function SimulationsPage() {
  const { user } = useAuth()
  const isTeacher = user?.role === ROLES.TEACHER
  const backTo = isTeacher ? '/mentor' : '/admin'
  const backLabel = isTeacher ? 'Mentor' : 'Admin'

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center gap-3">
        <Link
          to={backTo}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to {backLabel}
        </Link>
        <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100">Simulations</h1>
      </div>
      <div className="p-6 max-w-6xl mx-auto">
        <SimulationsListPanel />
      </div>
    </div>
  )
}
