import { ArrowRight } from 'lucide-react'

// Per-simulation standing.
//
// The old page's only statement at this level was a single "Simulations Done"
// count, which tells a student enrolled in three simulations nothing about any
// of them. Every figure here is counted from their own completions: how far in,
// how well graded, and when they last touched it.

const STATUS = {
  COMPLETED:   { label: 'Completed',   chip: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  IN_PROGRESS: { label: 'In progress', chip: 'border-primary/20 bg-primary/5 text-primary' },
  ENROLLED:    { label: 'Not started', chip: 'border-border bg-surface-low text-on-surface-variant' },
}

export default function SimulationProgress({ simulations, onOpen }) {
  const sims = simulations ?? []

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-white">
      <header className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-bold text-on-surface">Your simulations</h2>
        <p className="text-xs text-on-surface-variant">Progress and grades, per enrollment</p>
      </header>

      {sims.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-on-surface-variant">
          You aren&apos;t enrolled in a simulation yet.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {sims.map((s) => {
            const status = STATUS[s.status] ?? STATUS.ENROLLED
            return (
              <li key={s.slug}>
                <button
                  onClick={() => onOpen(s)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-low/60"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-semibold text-on-surface">{s.title}</span>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[0.65rem] font-bold ${status.chip}`}>
                        {status.label}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-on-surface-variant">
                      {s.domain}
                      {s.last_activity ? ` · last worked ${s.last_activity}` : ' · not started'}
                    </span>

                    <span className="mt-2 flex items-center gap-2.5">
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-high">
                        <span
                          className={`block h-full rounded-full ${s.percent >= 100 ? 'bg-emerald-500' : 'bg-primary'}`}
                          style={{ width: `${Math.min(100, s.percent)}%` }}
                        />
                      </span>
                      <span className="shrink-0 text-[0.7rem] font-semibold tabular-nums text-on-surface-variant">
                        {s.tasks_completed}/{s.tasks_total} tasks
                      </span>
                    </span>
                  </span>

                  <span className="shrink-0 text-right">
                    {/* An average of nothing is not zero — an ungraded
                        simulation says so rather than showing 0/100. */}
                    {s.avg_score == null ? (
                      <span className="block text-sm font-bold text-on-surface-variant">—</span>
                    ) : (
                      <span className="block text-lg font-bold tabular-nums text-on-surface">
                        {s.avg_score}
                      </span>
                    )}
                    <span className="block text-[0.65rem] text-on-surface-variant">
                      {s.graded_tasks > 0 ? `avg of ${s.graded_tasks}` : 'no grades yet'}
                    </span>
                  </span>

                  <ArrowRight className="h-4 w-4 shrink-0 text-on-surface-variant" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
