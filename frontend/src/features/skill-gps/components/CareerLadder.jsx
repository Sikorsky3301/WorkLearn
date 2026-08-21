import { Check } from 'lucide-react'

// The track's rungs, each with its own measured readiness.
//
// The previous version drew a fixed four-step Data Analyst ladder and hardcoded
// "(You)" onto the first entry regardless of what the student had done — the
// numbers on it were not numbers at all. Every figure here comes from
// track_progress, computed against the same skill points as the headline score.
export default function CareerLadder({ trackLabel, rungs, onSelect }) {
  if (!rungs?.length) return null

  return (
    <section className="rounded-xl border border-border bg-white p-5">
      <header className="mb-4">
        <h2 className="text-sm font-bold text-on-surface">Career path</h2>
        <p className="text-xs text-on-surface-variant">{trackLabel} track</p>
      </header>

      <ol className="relative space-y-4 pl-6">
        <span className="absolute left-[0.3125rem] top-2 bottom-2 w-px bg-border" aria-hidden="true" />
        {rungs.map((r) => {
          const cleared = r.readiness >= 100
          return (
            <li key={r.key} className="relative">
              <span
                className={`absolute -left-6 top-0.5 flex h-2.5 w-2.5 items-center justify-center rounded-full border-2 ${
                  cleared ? 'border-emerald-500 bg-emerald-500'
                    : r.is_target ? 'border-primary bg-primary'
                    : 'border-outline-variant bg-white'
                }`}
                aria-hidden="true"
              />
              <button
                onClick={() => onSelect(r.key)}
                className="w-full rounded-lg px-2 py-1.5 -mx-2 text-left transition-colors hover:bg-surface-low"
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className={`flex min-w-0 items-center gap-1.5 truncate text-xs font-semibold ${
                    r.is_target ? 'text-primary' : cleared ? 'text-emerald-700' : 'text-on-surface-variant'
                  }`}>
                    {cleared && <Check className="h-3 w-3 shrink-0" />}
                    {r.label}
                  </span>
                  <span className="shrink-0 text-[0.7rem] font-bold tabular-nums text-on-surface">
                    {r.readiness}%
                  </span>
                </span>
                <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-surface-high">
                  <span
                    className={`block h-full rounded-full ${cleared ? 'bg-emerald-500' : 'bg-primary'}`}
                    style={{ width: `${Math.min(100, r.readiness)}%` }}
                  />
                </span>
                {r.is_target && (
                  <span className="mt-1 block text-[0.65rem] font-semibold uppercase tracking-wider text-primary">
                    Current benchmark
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
