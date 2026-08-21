import { useState } from 'react'

// XP and tasks across the selected period.
//
// This is the chart the period selector never used to reach: the old one always
// drew the current Monday-to-Sunday week no matter which period was chosen, so
// switching to "month" or "all time" changed nothing on screen. Buckets now come
// from the server at the granularity that period deserves — daily up to a month,
// weekly beyond it.
//
// Two series on one frame: XP as bars, tasks as a line, because they answer
// different questions ("how much did I earn" vs "how often did I show up") and
// stacking them would hide the second.

export default function ActivityChart({ activity, periodLabel }) {
  const [hover, setHover] = useState(null)
  const points = activity?.points ?? []
  const maxXp = Math.max(activity?.max_xp ?? 0, 1)
  const maxTasks = Math.max(...points.map((p) => p.tasks), 1)

  const active = points.filter((p) => p.xp > 0 || p.tasks > 0).length

  if (points.length === 0) {
    return (
      <Frame periodLabel={periodLabel} granularity={activity?.granularity}>
        <p className="py-12 text-center text-sm text-on-surface-variant">
          No activity in this period.
        </p>
      </Frame>
    )
  }

  return (
    <Frame
      periodLabel={periodLabel}
      granularity={activity?.granularity}
      summary={`${activity.total_xp} XP · ${activity.total_tasks} tasks · ${active} active ${
        activity.granularity === 'day' ? 'days' : 'weeks'
      }`}
    >
      <div className="relative">
        {/* Gridlines behind the bars give the eye something to measure against;
            without them a bar chart is just relative heights. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40">
          {[0, 0.5, 1].map((f) => (
            <div
              key={f}
              className="absolute inset-x-0 border-t border-dashed border-border"
              style={{ top: `${f * 100}%` }}
            />
          ))}
        </div>

        <div className="relative flex h-40 items-end gap-[3px]">
          {points.map((p, i) => {
            const xpH = p.xp > 0 ? Math.max((p.xp / maxXp) * 100, 3) : 0
            return (
              <div
                key={p.bucket}
                className="group relative flex h-full flex-1 items-end"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              >
                <div
                  className={`w-full rounded-t transition-colors ${
                    hover === i ? 'bg-primary' : p.xp > 0 ? 'bg-primary/75' : 'bg-surface-high'
                  }`}
                  style={{ height: `${Math.max(xpH, 2)}%` }}
                />
                {/* Task count as a marker riding above its bar — one dot per
                    task-bearing bucket, sized by how busy it was. */}
                {p.tasks > 0 && (
                  <span
                    className="absolute left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-amber-500 ring-2 ring-white"
                    style={{ bottom: `calc(${xpH}% + 4px)`, transform: `translateX(-50%) scale(${1 + (p.tasks / maxTasks) * 0.8})` }}
                  />
                )}
              </div>
            )
          })}
        </div>

        {hover != null && (
          <div
            className="pointer-events-none absolute bottom-full z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-white px-2.5 py-1.5 shadow-panel"
            style={{ left: `${((hover + 0.5) / points.length) * 100}%` }}
          >
            <p className="text-[0.7rem] font-bold text-on-surface">{points[hover].label}</p>
            <p className="text-[0.65rem] tabular-nums text-on-surface-variant">
              {points[hover].xp} XP · {points[hover].tasks} task{points[hover].tasks === 1 ? '' : 's'}
            </p>
          </div>
        )}
      </div>

      {/* Only ever a handful of tick labels — one under every daily bar across
          90 days is unreadable. */}
      <div className="mt-2 flex justify-between text-[0.65rem] tabular-nums text-on-surface-variant">
        <span>{points[0]?.label}</span>
        {points.length > 2 && <span>{points[Math.floor(points.length / 2)]?.label}</span>}
        <span>{points[points.length - 1]?.label}</span>
      </div>

      <div className="mt-4 flex items-center gap-4 border-t border-border pt-3 text-[0.7rem] text-on-surface-variant">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-primary/75" /> XP earned
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500" /> Tasks completed
        </span>
      </div>
    </Frame>
  )
}

function Frame({ periodLabel, granularity, summary, children }) {
  return (
    <section className="rounded-xl border border-border bg-white p-5">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-on-surface">Activity</h2>
          <p className="text-xs text-on-surface-variant">
            {periodLabel}
            {granularity && ` · one bar per ${granularity}`}
          </p>
        </div>
        {summary && (
          <p className="text-xs font-semibold tabular-nums text-on-surface">{summary}</p>
        )}
      </header>
      {children}
    </section>
  )
}
