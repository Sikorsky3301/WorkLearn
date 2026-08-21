import { CATEGORY_STYLE, CATEGORY_BLURB } from '../../../lib/skillCategories'

// Readiness split by the kind of skill, not just the total.
//
// Two students on 60% are not in the same position if one is strong technically
// and weak on judgement and the other is the reverse — that is the shape this
// card exists to show, and the headline percentage cannot.
//
// Computed server-side with the same formula as the headline number, so the
// two can never tell different stories.
export default function CategoryBreakdown({ summary }) {
  if (!summary?.length) return null

  return (
    <section className="rounded-xl border border-border bg-white p-5">
      <header className="mb-4">
        <h2 className="text-sm font-bold text-on-surface">Where you&apos;re strong</h2>
        <p className="text-xs text-on-surface-variant">Readiness by kind of skill</p>
      </header>

      <ul className="space-y-4">
        {summary.map((c) => {
          const style = CATEGORY_STYLE[c.category] ?? CATEGORY_STYLE.Technical
          return (
            <li key={c.category}>
              <div className="mb-1.5 flex items-baseline justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${style.dot}`} aria-hidden="true" />
                  <span className="truncate text-xs font-semibold text-on-surface">{c.category}</span>
                </span>
                <span className="shrink-0 text-xs font-bold tabular-nums text-on-surface">{c.readiness}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-high">
                <div
                  className={`h-full rounded-full ${c.readiness >= 100 ? 'bg-emerald-500' : style.bar}`}
                  style={{ width: `${Math.min(100, c.readiness)}%` }}
                />
              </div>
              <p className="mt-1 text-[0.65rem] text-on-surface-variant">
                {c.met}/{c.total} at benchmark · {CATEGORY_BLURB[c.category] ?? ''}
              </p>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
