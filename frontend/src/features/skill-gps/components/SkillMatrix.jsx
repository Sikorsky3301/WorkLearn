import { useState } from 'react'
import { ChevronRight, Check, Circle } from 'lucide-react'
import { CATEGORY_STYLE } from '../../../lib/skillCategories'

// The gap analysis, as a dense scannable table rather than a stack of cards.
//
// Each row expands to the specific tasks that award that skill, taken from
// SimulationTask.skill_awards — the same column the points are actually paid
// from. That is the difference between telling a student they are 40 points
// short of Component Design and telling them which three tasks close it.

export default function SkillMatrix({ skills, filter, onFilter, counts, roleLabel, onOpenTask }) {
  const [openKey, setOpenKey] = useState(null)

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h2 className="text-sm font-bold text-on-surface">Skill matrix</h2>
          <p className="text-xs text-on-surface-variant">
            Your score against every {roleLabel} benchmark
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-border bg-surface-low p-0.5">
          {[
            ['all', `All ${counts.all}`],
            ['gap', `Gaps ${counts.gap}`],
            ['met', `Met ${counts.met}`],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => onFilter(key)}
              aria-pressed={filter === key}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold tabular-nums transition-colors ${
                filter === key ? 'bg-white text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* Column headings — the numbers only mean something once they are
          named, and naming them once beats repeating units on every row. */}
      <div className="hidden grid-cols-[1fr_9rem_5.5rem_2rem] items-center gap-3 border-b border-border bg-surface-low/60 px-5 py-2 text-[0.6rem] font-bold uppercase tracking-widest text-on-surface-variant sm:grid">
        <span>Skill</span>
        <span>Progress to benchmark</span>
        <span className="text-right">Score</span>
        <span />
      </div>

      {skills.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-on-surface-variant">
          {filter === 'gap'
            ? `No gaps left — you meet every ${roleLabel} benchmark.`
            : 'Nothing here yet. Complete tasks to earn points in these skills.'}
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {skills.map((s) => (
            <SkillRow
              key={s.skill_key}
              skill={s}
              open={openKey === s.skill_key}
              onToggle={() => setOpenKey(openKey === s.skill_key ? null : s.skill_key)}
              onOpenTask={onOpenTask}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

function SkillRow({ skill, open, onToggle, onOpenTask }) {
  const isGap = skill.status === 'gap'
  const current = skill.current ?? 0
  const required = skill.required ?? 0
  const delta = required - current
  const cat = CATEGORY_STYLE[skill.category] ?? CATEGORY_STYLE.Technical
  const sources = skill.sources ?? []
  const remaining = sources.filter((t) => !t.completed)

  return (
    <li>
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="grid w-full grid-cols-[1fr_auto] items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-surface-low/60 sm:grid-cols-[1fr_9rem_5.5rem_2rem]"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span className={`h-2 w-2 shrink-0 rounded-full ${cat.dot}`} aria-hidden="true" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-on-surface">{skill.skill}</span>
            <span className="text-[0.7rem] text-on-surface-variant">
              {skill.category}
              {sources.length > 0 && ` · ${sources.length} task${sources.length === 1 ? '' : 's'} award this`}
            </span>
          </span>
        </span>

        {/* One bar carrying two facts: how far you are, and where the line is.
            The benchmark tick is what makes "62%" mean something. */}
        <span className="hidden sm:block">
          <span className="relative block h-2 w-full overflow-hidden rounded-full bg-surface-high">
            <span
              className={`absolute inset-y-0 left-0 rounded-full ${isGap ? 'bg-primary' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(100, current)}%` }}
            />
            <span
              className="absolute inset-y-0 w-0.5 bg-on-surface/45"
              style={{ left: `${Math.min(100, required)}%` }}
              title={`Benchmark ${required}`}
            />
          </span>
        </span>

        <span className="flex items-center justify-end gap-2 sm:block sm:text-right">
          <span className="block text-sm font-bold tabular-nums text-on-surface">
            {current}
            <span className="text-on-surface-variant">/{required}</span>
          </span>
          <span className={`block text-[0.7rem] font-semibold tabular-nums ${isGap ? 'text-amber-600' : 'text-emerald-600'}`}>
            {isGap ? `−${delta}` : `+${Math.abs(delta)}`}
          </span>
        </span>

        <ChevronRight
          className={`hidden h-4 w-4 justify-self-end text-on-surface-variant transition-transform sm:block ${open ? 'rotate-90' : ''}`}
        />
      </button>

      {open && (
        <div className="border-t border-border bg-surface-low/50 px-5 py-4">
          {sources.length === 0 ? (
            <p className="text-xs text-on-surface-variant">
              No task on the platform currently awards this skill.
            </p>
          ) : (
            <>
              <p className="mb-3 text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant">
                Where these points come from
                {remaining.length > 0 && (
                  <span className="ml-2 font-semibold normal-case tracking-normal text-on-surface">
                    {skill.points_available} still available
                  </span>
                )}
              </p>
              <ul className="space-y-1.5">
                {sources.map((t) => (
                  <li key={`${t.simulation_slug}-${t.task_index}`}>
                    <button
                      onClick={() => onOpenTask(t)}
                      className="flex w-full items-center gap-3 rounded-lg border border-border bg-white px-3 py-2 text-left transition-colors hover:border-primary/40"
                    >
                      {t.completed ? (
                        <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 shrink-0 text-on-surface-variant" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold text-on-surface">
                          {t.task_title}
                        </span>
                        <span className="block truncate text-[0.65rem] text-on-surface-variant">
                          {t.simulation_title}
                          {t.week != null && ` · Week ${t.week}`}
                        </span>
                      </span>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[0.65rem] font-bold tabular-nums ${
                          t.completed
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-border bg-surface-low text-on-surface-variant'
                        }`}
                      >
                        {t.completed ? `+${t.points} earned` : `+${t.points}`}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </li>
  )
}
