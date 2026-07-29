import { cn } from '../../../../shared/utils/cn'

/** Week/task navigator above the Stages canvas — "All" plus one pill per
 * distinct `week` value found in the task list (in first-seen order, plus a
 * trailing "Ungrouped" pill if any task has no week). Clicking a pill
 * expands that week (reusing the existing collapsedWeeks state) and scrolls
 * its section header into view. Visible above both List and Flow view;
 * Flow view itself ignores collapse state (a roadmap always shows
 * everything), but the scroll-into-view behavior still works there since
 * every week lane keeps the same `week-section-<week>` id. */
export default function WeekPillStrip({ tasks, sim, collapsedWeeks, onSelectWeek }) {
  const weeks = []
  let hasUngrouped = false
  for (const t of tasks) {
    if (t.week == null) { hasUngrouped = true; continue }
    if (!weeks.includes(t.week)) weeks.push(t.week)
  }

  if (weeks.length === 0 && !hasUngrouped) return null

  function goTo(week) {
    onSelectWeek(week)
    requestAnimationFrame(() => {
      document.getElementById(`week-section-${week}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  function goToTop() {
    document.getElementById('cms-stages-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-4">
      <button
        onClick={goToTop}
        className="rounded-full border border-border bg-white px-3 py-1 text-xs font-semibold text-on-surface-variant hover:border-primary/50 hover:text-on-surface transition-colors cursor-pointer"
      >
        All
      </button>
      {weeks.map((week) => (
        <button
          key={week}
          onClick={() => goTo(week)}
          className={cn(
            'rounded-full border px-3 py-1 text-xs font-semibold transition-colors cursor-pointer',
            collapsedWeeks.has(week)
              ? 'border-border bg-white text-on-surface-variant hover:border-primary/50 hover:text-on-surface'
              : 'border-primary/30 bg-primary/10 text-primary'
          )}
        >
          {sim.section_labels?.[String(week)] || `Week ${week}`}
        </button>
      ))}
      {hasUngrouped && (
        <span className="rounded-full border border-dashed border-border px-3 py-1 text-xs font-medium text-on-surface-variant/70">
          Ungrouped
        </span>
      )}
    </div>
  )
}
