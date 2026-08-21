// The headline numbers, as one bordered strip with hairline dividers rather
// than five floating cards — five cards read as five unrelated widgets, one
// strip reads as a single summary of one thing.
//
// Every figure here is measured, not estimated: points are the skill points
// the benchmark asks for versus what graded tasks have awarded, and the task
// counts are tasks that award at least one skill this role is benchmarked on.
export default function MetricStrip({ readiness, met, total, totals }) {
  const pointsPct = totals?.points_required
    ? Math.round((totals.points_earned / totals.points_required) * 100)
    : 0
  const tasksPct = totals?.tasks_total
    ? Math.round((totals.tasks_completed / totals.tasks_total) * 100)
    : 0

  return (
    <div className="grid grid-cols-2 divide-y divide-border overflow-hidden rounded-xl border border-border bg-white sm:grid-cols-2 lg:grid-cols-4 lg:divide-y-0">
      <Metric
        label="Role readiness"
        value={`${readiness}%`}
        detail={readiness >= 100 ? 'Benchmark cleared' : `${100 - readiness} points of progress to go`}
        bar={readiness}
        emphasis
      />
      <Metric
        label="Skills at benchmark"
        value={`${met}`}
        suffix={`/ ${total}`}
        detail={total - met === 0 ? 'Every skill met' : `${total - met} still short`}
        bar={total ? Math.round((met / total) * 100) : 0}
      />
      <Metric
        label="Skill points"
        value={`${totals?.points_earned ?? 0}`}
        suffix={`/ ${totals?.points_required ?? 0}`}
        detail={`${totals?.points_remaining ?? 0} points remaining`}
        bar={pointsPct}
      />
      <Metric
        label="Qualifying tasks"
        value={`${totals?.tasks_completed ?? 0}`}
        suffix={`/ ${totals?.tasks_total ?? 0}`}
        detail="Tasks that award these skills"
        bar={tasksPct}
      />
    </div>
  )
}

function Metric({ label, value, suffix, detail, bar, emphasis }) {
  return (
    <div className="border-border p-5 lg:border-l lg:first:border-l-0">
      <p className="text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant">
        {label}
      </p>
      <p className="mt-2 flex items-baseline gap-1.5">
        <span className={`font-bold tabular-nums text-on-surface ${emphasis ? 'text-4xl' : 'text-3xl'}`}>
          {value}
        </span>
        {suffix && <span className="text-sm font-semibold tabular-nums text-on-surface-variant">{suffix}</span>}
      </p>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-surface-high">
        <div
          className={`h-full rounded-full ${bar >= 100 ? 'bg-emerald-500' : 'bg-primary'}`}
          style={{ width: `${Math.min(100, Math.max(0, bar))}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-on-surface-variant">{detail}</p>
    </div>
  )
}
