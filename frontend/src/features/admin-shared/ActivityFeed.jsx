import { ClipboardList } from 'lucide-react'
import { useAdminActivity } from '../../shared/api/hooks'
import EmptyState from '../../shared/design-system/EmptyState'

const DOT_COLOR = { success: 'bg-emerald-500', cert: 'bg-purple-500', request: 'bg-orange-500', warn: 'bg-amber-500' }

export default function ActivityFeed({ limit }) {
  const { data: activity, isLoading } = useAdminActivity()
  const items = limit ? (activity ?? []).slice(0, limit) : (activity ?? [])

  if (isLoading) {
    return <div className="h-40 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
  }
  if (items.length === 0) {
    return <EmptyState icon={ClipboardList} title="No activity yet" description="XP events will appear here as users complete tasks." />
  }
  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {items.map((a, i) => (
        <div key={i} className="flex items-start gap-3 py-3">
          <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${DOT_COLOR[a.type] || 'bg-slate-400'}`} />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-700 dark:text-slate-300">{a.action}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{a.user}</p>
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">{a.time}</span>
        </div>
      ))}
    </div>
  )
}
