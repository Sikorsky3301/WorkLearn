import { ClipboardList } from 'lucide-react'
import { useAdminActivity } from '../../../hooks'
import EmptyState from '../../../components/design-system/EmptyState'

const DOT_COLOR = {
  success: 'bg-emerald-500', cert: 'bg-purple-500',
  request: 'bg-orange-500', warn: 'bg-amber-500',
}

/**
 * The XP event stream.
 *
 * `limit` used to be a CLIENT-side slice of a fixed 20-row fetch — the route
 * accepted a `limit` the hook never sent. So the Activity page, whose whole job
 * is this feed, could never show more than twenty events and had no way to ask
 * for more. It is now the number actually requested, and the page raises it.
 */
export default function ActivityFeed({ limit = 20, emptyDescription }) {
  const { data: activity, isLoading } = useAdminActivity(limit)
  const items = activity ?? []

  if (isLoading) {
    return (
      <div className="space-y-2 py-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="py-3">
        <EmptyState
          icon={ClipboardList}
          title="No activity yet"
          description={emptyDescription ?? 'XP events appear here as users complete tasks.'}
        />
      </div>
    )
  }

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {items.map((a, i) => (
        <div key={i} className="flex items-start gap-3 py-2.5">
          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT_COLOR[a.type] || 'bg-slate-400'}`} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.82rem] text-slate-700 dark:text-slate-300">{a.action}</p>
            <p className="truncate text-[0.7rem] text-slate-400 dark:text-slate-500">{a.user}</p>
          </div>
          <span className="shrink-0 whitespace-nowrap text-[0.7rem] tabular-nums text-slate-400 dark:text-slate-500">
            {a.time}
          </span>
        </div>
      ))}
    </div>
  )
}
