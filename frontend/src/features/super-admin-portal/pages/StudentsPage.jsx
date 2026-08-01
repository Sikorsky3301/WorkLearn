import { useAdminStats } from '../../../hooks'

export default function StudentsPage() {
  const { data: stats, isLoading } = useAdminStats()

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-white dark:bg-slate-900">
      {isLoading ? (
        <div className="h-40 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
      ) : (
        <>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Showing university students across {stats?.universities ?? 0} institution{(stats?.universities ?? 0) !== 1 ? 's' : ''}.
          </p>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Total University Students', value: (stats?.university_students ?? 0).toLocaleString() },
              { label: 'Active Today', value: (stats?.active_today ?? 0).toLocaleString() },
              { label: 'Certificates Issued', value: (stats?.certificates ?? 0).toLocaleString() },
            ].map((s) => (
              <div key={s.label} className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4">
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">{s.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400">Drill into a specific university in the Universities tab to see institution details.</p>
        </>
      )}
    </div>
  )
}
