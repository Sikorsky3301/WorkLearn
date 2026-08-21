import { Flame, CalendarCheck } from 'lucide-react'

// Current and longest streak.
//
// The current streak used to require TODAY to be an active day, so a student who
// worked yesterday and opened the page before starting today was told their
// streak was zero — wrong, and the most discouraging thing this page could say.
// It now counts back from today or yesterday, which is what "you haven't lost it
// yet" actually means, and this card says which of the two it is.
export default function StreakCard({ streak }) {
  const current = streak?.current ?? 0
  const longest = streak?.longest ?? 0
  const atRisk = current > 0 && !streak?.active_today

  return (
    <section className="rounded-xl border border-border bg-white p-5">
      <h2 className="mb-4 text-sm font-bold text-on-surface">Streak</h2>

      <div className="flex items-center gap-3">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
          current > 0 ? 'bg-amber-50 text-amber-600' : 'bg-surface-low text-on-surface-variant'
        }`}>
          <Flame className="h-5 w-5" />
        </span>
        <div>
          <p className="text-2xl font-bold leading-none tabular-nums text-on-surface">
            {current}
            <span className="ml-1 text-sm font-semibold text-on-surface-variant">
              day{current === 1 ? '' : 's'}
            </span>
          </p>
          <p className="mt-1 text-xs text-on-surface-variant">
            {current === 0 ? 'Not started' : atRisk ? 'Keep it alive today' : 'Counted today'}
          </p>
        </div>
      </div>

      <dl className="mt-4 space-y-2 border-t border-border pt-3 text-xs">
        <Row term="Longest streak" value={`${longest} day${longest === 1 ? '' : 's'}`} />
        <Row
          term="Last active"
          value={streak?.last_active ?? '—'}
          icon={<CalendarCheck className="h-3.5 w-3.5" />}
        />
      </dl>

      {atRisk && (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[0.7rem] leading-relaxed text-amber-800">
          You haven&apos;t completed a task today. Finish one to extend the streak.
        </p>
      )}
    </section>
  )
}

function Row({ term, value, icon }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="flex items-center gap-1.5 text-on-surface-variant">{icon}{term}</dt>
      <dd className="font-semibold tabular-nums text-on-surface">{value}</dd>
    </div>
  )
}
