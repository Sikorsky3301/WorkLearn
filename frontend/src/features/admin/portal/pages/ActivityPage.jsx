import { useState } from 'react'
import ActivityFeed from '../../shared/ActivityFeed'

// How many events to pull. The feed was hardwired to 20 with no control at
// all, on the one page whose entire content is the feed.
const SIZES = [25, 50, 100, 200]

export default function ActivityPage() {
  const [limit, setLimit] = useState(50)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 border-t-2 border-slate-900 pt-4 dark:border-slate-100">
        <div>
          <h1 className="font-display text-[1.4rem] font-extrabold leading-tight tracking-tight text-slate-900 dark:text-slate-100">
            Activity
          </h1>
          <p className="mt-1 text-[0.8rem] text-slate-500 dark:text-slate-400">
            Every XP event on the platform, newest first.
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-800 dark:bg-slate-900">
          {SIZES.map((n) => (
            <button
              key={n}
              onClick={() => setLimit(n)}
              aria-pressed={limit === n}
              className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold tabular-nums transition-colors ${
                limit === n
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white px-5 dark:border-slate-800 dark:bg-slate-900">
        <ActivityFeed limit={limit} />
      </div>
    </div>
  )
}
