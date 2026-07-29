import { Users, Building2, Activity as ActivityIcon, Award, DollarSign } from 'lucide-react'
import { useAdminStats, useAdminUniversities } from '../../../shared/api/hooks'
import StatCard from '../../../shared/design-system/StatCard'
import ActivityFeed from '../../admin-shared/ActivityFeed'

// Placeholder — no payment provider is integrated yet (see Platform →
// Configuration → Billing Provider). Swap for a real query once billing
// actually processes transactions.
const MOCK_TOTAL_BILLING = 128450

export default function OverviewPage() {
  const { data: stats, isLoading: statsLoading } = useAdminStats()
  const { data: universities, isLoading: uniLoading } = useAdminUniversities()

  return (
    <div className="space-y-6">
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-slate-900 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Total Billing Earned</p>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">${MOCK_TOTAL_BILLING.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 mt-1">Mock data — no payment provider integrated yet (see Configuration → Billing Provider)</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <DollarSign className="h-6 w-6" />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Users" value={statsLoading ? '—' : (stats?.total_users ?? 0).toLocaleString()} icon={Users} />
        <StatCard label="Partner Universities" value={statsLoading ? '—' : stats?.universities ?? 0} icon={Building2} />
        <StatCard label="Active Today" value={statsLoading ? '—' : (stats?.active_today ?? 0).toLocaleString()} icon={ActivityIcon} />
        <StatCard label="Certificates Issued" value={statsLoading ? '—' : (stats?.certificates ?? 0).toLocaleString()} icon={Award} />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-white dark:bg-slate-900">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-4">Top Universities by Students</h3>
          {uniLoading ? (
            <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
          ) : (universities ?? []).length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">No universities enrolled yet.</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="text-left pb-2 text-slate-500 dark:text-slate-400 font-semibold">Institution</th>
                  <th className="text-right pb-2 text-slate-500 dark:text-slate-400 font-semibold">Students</th>
                  <th className="text-right pb-2 text-slate-500 dark:text-slate-400 font-semibold">Mentors</th>
                  <th className="text-right pb-2 text-slate-500 dark:text-slate-400 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(universities ?? []).slice(0, 6).map((u) => (
                  <tr key={u.code}>
                    <td className="py-2.5 font-medium text-slate-900 dark:text-slate-100">{u.name}</td>
                    <td className="py-2.5 text-right text-slate-500 dark:text-slate-400 tabular-nums">{u.students.toLocaleString()}</td>
                    <td className="py-2.5 text-right text-slate-500 dark:text-slate-400 tabular-nums">{u.mentors}</td>
                    <td className="py-2.5 text-right">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{u.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-white dark:bg-slate-900">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-4">Live Activity</h3>
          <ActivityFeed limit={6} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-white dark:bg-slate-900">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-4">User Breakdown</h3>
          {statsLoading ? (
            <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
          ) : (() => {
            const total = (stats?.university_students ?? 0) + (stats?.direct_users ?? 0)
            const uniPct = total ? Math.round((stats.university_students / total) * 100) : 0
            const dirPct = total ? Math.round((stats.direct_users / total) * 100) : 0
            return (
              <div className="space-y-3">
                {[
                  { label: 'University Students', val: stats?.university_students ?? 0, color: 'bg-orange-500', pct: uniPct },
                  { label: 'Direct Users', val: stats?.direct_users ?? 0, color: 'bg-primary', pct: dirPct },
                ].map((b) => (
                  <div key={b.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500 dark:text-slate-400">{b.label}</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{b.val.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${b.color} rounded-full`} style={{ width: `${b.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}
        </div>
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-white dark:bg-slate-900">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-4">Platform Summary</h3>
          {statsLoading ? (
            <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total Users', val: stats?.total_users ?? 0 },
                { label: 'Universities', val: stats?.universities ?? 0 },
                { label: 'Active Today', val: stats?.active_today ?? 0 },
                { label: 'Certificates', val: stats?.certificates ?? 0 },
              ].map((s) => (
                <div key={s.label} className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-3">
                  <p className="text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums">{s.val.toLocaleString()}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
