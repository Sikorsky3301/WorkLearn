import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import RoadmapTaskCard from './RoadmapTaskCard'
import { TASK_STATUS } from '../lib/roadmapModel'

// A week's worth of tasks, hung off the vertical spine.
//
// Collapsible, because the roadmap grew from 5 tasks to 10 across 4 sections
// and a fully expanded programme is a long scroll to find the one task you're
// actually on.
//
// WHICH SECTIONS OPEN BY DEFAULT is the whole design here. Not "the first",
// and not "all": the one containing your current task, plus any section still
// unfinished. A finished week collapses itself and gets out of the way, so the
// page opens on the work in front of you rather than on week 1 forever.

export default function RoadmapSection({ section, isLast, onOpenTask, onViewResults }) {
  const { label, tasks, completedCount, total, avgScore } = section
  const allDone = completedCount === total
  const started = completedCount > 0
  const hasCurrent = tasks.some((t) => t.status === TASK_STATUS.CURRENT)

  const [open, setOpen] = useState(hasCurrent || !allDone)

  // Finishing the last task of a section should fold it away, and starting a
  // new one should open it — without stamping over a student who has just
  // collapsed or expanded something by hand. Keyed on the section's actual
  // state so it only fires when that state changes.
  useEffect(() => {
    setOpen(hasCurrent || !allDone)
  }, [hasCurrent, allDone])

  const sectionId = `roadmap-section-${section.key}`

  return (
    <section className="relative">
      {/* Section header — the whole row is the toggle. */}
      <div className="relative mb-4 pl-12">
        <span
          className={`absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ring-4 ring-white ${
            allDone ? 'bg-emerald-500 text-white' : started ? 'bg-primary text-white' : 'bg-surface-high text-on-surface-variant'
          }`}
          aria-hidden="true"
        >
          {completedCount}/{total}
        </span>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={sectionId}
          className="group w-full text-left"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight text-on-surface">
              {label}
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-on-surface-variant transition-transform duration-200 ${
                  open ? 'rotate-180' : ''
                }`}
                aria-hidden="true"
              />
            </h3>
            <span className="flex items-center gap-3 text-xs font-semibold text-on-surface-variant">
              {avgScore != null && (
                <span>
                  Section average <span className="font-mono text-on-surface">{avgScore}</span>
                </span>
              )}
              {/* Says what is hidden, so a collapsed section is not a mystery. */}
              {!open && (
                <span className="text-on-surface-variant/70">
                  {total - completedCount > 0
                    ? `${total - completedCount} left`
                    : 'All done'}
                </span>
              )}
            </span>
          </div>

          <div className="mt-2 h-1.5 max-w-xs overflow-hidden rounded-full bg-surface-high">
            <div
              className={`h-full rounded-full transition-all duration-500 ${allDone ? 'bg-emerald-500' : 'bg-primary'}`}
              style={{ width: `${total ? (completedCount / total) * 100 : 0}%` }}
            />
          </div>
        </button>
      </div>

      {/* The spine — stops short on the last section so the line doesn't dangle
          past the final card, and is not drawn at all for a collapsed section
          where there are no cards for it to run alongside. */}
      {!isLast && open && (
        <span
          className="absolute bottom-0 left-4 top-10 -ml-px w-0.5 bg-gradient-to-b from-border to-border/40"
          aria-hidden="true"
        />
      )}

      <div id={sectionId} className={open ? 'space-y-3 pb-10' : 'pb-6'}>
        {open && tasks.map((task) => (
          <RoadmapTaskCard
            key={task.task_index}
            task={task}
            onOpen={onOpenTask}
            onViewResults={onViewResults}
          />
        ))}
      </div>
    </section>
  )
}
