import { Users, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../../auth/AuthContext'
import { useAdminStats } from '../../../../hooks'
import StatCard from '../../../../components/design-system/StatCard'
import EmptyState from '../../../../components/design-system/EmptyState'

export default function OverviewPage() {
  const { user, hasPermission } = useAuth()
  const canViewStats = hasPermission('analytics.view_platform')
  const { data: stats, isLoading } = useAdminStats()

  return (
    <div className="space-y-6">
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-white dark:bg-slate-900">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Welcome, {user?.name}. You're signed in as{' '}
          <span className="font-semibold text-slate-900 dark:text-slate-100">{user?.admin_role_name || 'Admin'}</span> — the sidebar
          only shows what your role is granted.
        </p>
      </div>

      {canViewStats ? (
        <div className="grid grid-cols-2 gap-4">
          <StatCard label="Total Users" value={isLoading ? '—' : (stats?.total_users ?? 0).toLocaleString()} icon={Users} />
          <StatCard label="Active Today" value={isLoading ? '—' : (stats?.active_today ?? 0).toLocaleString()} icon={ShieldCheck} />
        </div>
      ) : (
        <EmptyState
          icon={ShieldCheck}
          title="No permissions granted yet"
          description="Ask your Super Admin to assign a role with the permissions you need."
        />
      )}
    </div>
  )
}
