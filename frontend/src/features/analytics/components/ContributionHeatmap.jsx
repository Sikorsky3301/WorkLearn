import { useState } from 'react'

// Half a year of activity, one cell per day.
//
// Two things the old grid got wrong. Its columns were rolling 7-day windows
// rather than calendar weeks, so no row corresponded to a weekday and the grid
// did not line up with any calendar a student could check against. And it only
// ever emitted two intensity values, 0 and 3, under a legend that advertised
// four — so "Less → More" described a scale that did not exist.
//
// Levels are now scaled to this student's own busiest day, so the shading means
// "a light day for you" rather than an absolute count that leaves a casual
// learner permanently on one shade.

const LEVEL_CLASS = [
  'bg-surface-high',
  'bg-primary/25',
  'bg-primary/55',
  'bg-primary',
]

// Mon/Wed/Fri only — labelling all seven rows at 12px is a wall of text.
const WEEKDAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', '']

export default function ContributionHeatmap({ heatmap }) {
  const [hover, setHover] = useState(null)
  const weeks = heatmap?.weeks ?? []

  return (
    <section className="rounded-xl border border-border bg-white p-5">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-on-surface">Consistency</h2>
          <p className="text-xs text-on-surface-variant">
            Last {heatmap?.weeks_shown ?? 26} weeks · {heatmap?.active_days ?? 0} active days
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[0.65rem] text-on-surface-variant">
          <span>Less</span>
          {LEVEL_CLASS.map((c, i) => (
            <span key={i} className={`h-3 w-3 rounded-sm ${c}`} />
          ))}
          <span>More</span>
        </div>
      </header>

      {weeks.length === 0 ? (
        <p className="py-8 text-center text-sm text-on-surface-variant">No activity recorded yet.</p>
      ) : (
        <div className="relative">
          {/* Horizontal scroll on its own container so the card never forces the
              page sideways on a narrow screen. */}
          <div className="overflow-x-auto pb-1">
            <div className="inline-flex gap-[3px] pl-8">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((cell) => (
                    <button
                      key={cell.date}
                      type="button"
                      onMouseEnter={() => setHover(cell)}
                      onMouseLeave={() => setHover(null)}
                      onFocus={() => setHover(cell)}
                      onBlur={() => setHover(null)}
                      aria-label={`${cell.date}: ${cell.tasks} tasks, ${cell.xp} XP`}
                      className={`h-3 w-3 rounded-sm transition-transform hover:scale-125 ${
                        cell.future ? 'bg-transparent' : LEVEL_CLASS[cell.level] ?? LEVEL_CLASS[0]
                      }`}
                    />
                  ))}
                </div>
              ))}
            </div>

            <div className="ml-8 mt-1.5 flex gap-[3px]">
              {weeks.map((_, wi) => {
                const month = heatmap.months?.find((m) => m.week_index === wi)
                return (
                  <span key={wi} className="w-3 shrink-0 text-[0.6rem] text-on-surface-variant">
                    {month?.label ?? ''}
                  </span>
                )
              })}
            </div>
          </div>

          <div className="pointer-events-none absolute left-0 top-0 flex flex-col gap-[3px] text-[0.6rem] leading-3 text-on-surface-variant">
            {WEEKDAY_LABELS.map((d, i) => (
              <span key={i} className="h-3">{d}</span>
            ))}
          </div>

          <p className="mt-3 h-4 text-xs text-on-surface-variant" aria-live="polite">
            {hover
              ? hover.future
                ? `${hover.date} — not yet`
                : `${hover.date} — ${hover.tasks} task${hover.tasks === 1 ? '' : 's'}, ${hover.xp} XP`
              : `Busiest day: ${heatmap.busiest_day_tasks} task${heatmap.busiest_day_tasks === 1 ? '' : 's'}`}
          </p>
        </div>
      )}
    </section>
  )
}
