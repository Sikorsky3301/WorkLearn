import { useAuth } from '../../auth/AuthContext'
import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'

export default function UniversityAdminOverviewPage() {
  const { user } = useAuth()
  const uniName = user?.university?.name || 'your university'

  return (
    <div className="max-w-xl space-y-4">
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Welcome, {user?.name?.split(' ')[0] || 'Admin'}</h2>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        You manage students and teachers for <strong>{uniName}</strong>. This is not the platform Admin portal —
        you cannot create universities or other University Admins.
      </p>
      <Link
        to="/university-admin/users"
        className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
      >
        <Users className="h-4 w-4" /> Manage users
      </Link>
    </div>
  )
}
