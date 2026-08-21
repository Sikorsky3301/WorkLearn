import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'

// The four headline numbers, with comparisons that are real.
//
// The old version drew `↑` on every card followed by an empty string: the
// backend hardcoded `up: true` on some cards and never sent the `delta` the
// page rendered next to the arrow. There are three honest states and each one
// looks different here — a measured change, a window with nothing in it to
// compare against, and an all-time view where a comparison is meaningless.
export default function StatStrip({ stats }) {
  return (
    <div className="grid grid-cols-2 divide-y divide-border overflow-hidden rounded-xl border border-border bg-white lg:grid-cols-4 lg:divide-y-0">
      {stats.map((s) => (
        <Stat key={s.key} stat={s} />
      ))}
    </div>
  )
}

function Stat({ stat }) {
  const { value, unit, delta, direction, comparison, label } = stat
  const hasValue = value !== null && value !== undefined
  const hasDelta = delta !== null && delta !== undefined

  const tone =
    direction === 'up' ? 'text-emerald-600'
      : direction === 'down' ? 'text-rose-600'
        : 'text-on-surface-variant'
  const Icon = direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : Minus

  return (
    <div className="border-border p-5 lg:border-l lg:first:border-l-0">
      <p className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant">
        {label}
      </p>

      <p className="mt-2 flex items-baseline gap-1.5">
        {hasValue ? (
          <>
            <span className="text-3xl font-bold tabular-nums text-on-surface">{value}</span>
            <span className="text-sm font-semibold text-on-surface-variant">{unit}</span>
          </>
        ) : (
          // A missing average is not zero. Showing 0/100 for a student with no
          // graded tasks would read as a failing grade.
          <span className="text-3xl font-bold text-on-surface-variant">—</span>
        )}
      </p>

      <div className="mt-2 flex items-center gap-1.5 text-xs">
        {hasDelta ? (
          <span className={`inline-flex items-center gap-0.5 font-bold tabular-nums ${tone}`}>
            <Icon className="h-3.5 w-3.5" />
            {delta > 0 ? '+' : ''}{delta}
          </span>
        ) : null}
        <span className="truncate text-on-surface-variant">
          {comparison ?? (hasValue ? 'Over the whole period' : 'No graded tasks yet')}
        </span>
      </div>
    </div>
  )
}
