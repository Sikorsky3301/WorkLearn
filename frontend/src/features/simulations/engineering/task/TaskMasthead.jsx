import { CircleCheck, Code2, ListOrdered, Trophy, Target } from 'lucide-react'

// The top of a task: the assignment card.
//
// ── WHAT THIS REPLACED ─────────────────────────────────────────────────────
//
// A Swiss-editorial masthead — no container at all, a 3.5rem headline, a
// four-cell ruled spec table and a hairline progress scale. It was handsome as
// a printed page and wrong as a product screen: the biggest thing on a page
// whose job is to get somebody working was the *name* of the work, the facts
// were set in a table that had to be read left to right to mean anything, and
// nothing on it looked like something handed to you by an employer.
//
// ── WHAT IT IS NOW ─────────────────────────────────────────────────────────
//
// One card, shaped like the brief a manager drops on your desk:
//
//   · an indigo header band carrying the placement facts — which week, which
//     task, whether it is done — then the title at a size a title needs and
//     the objective directly under it. Reading the band tells you what you
//     have been asked to do and nothing else.
//   · a white foot holding the countable facts as chips, and the one button
//     that starts the work, right-aligned so it is the last thing you pass.
//   · a progress strip only when the week has more than one task.
//
// The chips are the old spec table with the table taken away: a label is only
// needed when a number is ambiguous, and "5 steps", "40 XP" and "HTML & CSS"
// are not. That is where the simplification came from — not from cutting
// anything.

/** A countable fact. An icon and a phrase — no label row, because the phrase
 *  already says what it is. */
function Chip({ icon: Icon, children, tone = 'plain' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.78rem] font-bold ${
        tone === 'accent'
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-surface-low text-on-surface-variant'
      }`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {children}
    </span>
  )
}

export default function TaskMasthead({
  task, section, language, stepCount, liveResult, done, children,
}) {
  const showProgress = section && section.tasks.length > 1
  const pct = showProgress
    ? Math.round((section.completedCount / section.total) * 100)
    : 0

  return (
    <header className="overflow-hidden rounded-2xl border border-border bg-white shadow-panel">

      {/* ── The band: who is asking, for what ── */}
      <div className="relative bg-primary px-6 py-7 sm:px-8">
        {/* A single soft highlight. It keeps a large flat field of indigo from
            reading as a solid block of colour, and it is the only decoration
            on the page. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-white/10 blur-2xl"
        />

        <div className="relative">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2 text-[0.68rem] font-bold uppercase tracking-[0.16em]">
            <span className="text-white">{section?.label ?? 'Task'}</span>
            <span aria-hidden="true" className="text-white/30">/</span>
            <span className="text-white/60">Task {task.task_index}</span>
            {done && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-white">
                <CircleCheck className="h-3.5 w-3.5" /> Completed
              </span>
            )}
          </div>

          <h1 className="mt-3.5 font-display text-[1.55rem] font-extrabold leading-[1.15] tracking-[-0.015em] text-white sm:text-[1.9rem]">
            {task.title}
          </h1>

          {task.objective && (
            <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-white/70">
              {task.objective}
            </p>
          )}
        </div>
      </div>

      {/* ── The foot: the facts, and the way in ── */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-4 px-6 py-5 sm:px-8">
        <div className="flex flex-wrap items-center gap-2">
          {language && <Chip icon={Code2}>{language}</Chip>}
          {stepCount > 0 && <Chip icon={ListOrdered}>{stepCount} steps</Chip>}
          {task.xp_award > 0 && <Chip icon={Trophy}>{task.xp_award} XP</Chip>}
          {liveResult?.score != null && (
            <Chip icon={Target} tone="accent">Scored {liveResult.score}%</Chip>
          )}
        </div>

        {children && <div className="ml-auto">{children}</div>}
      </div>

      {/* ── Where this sits in the week ── */}
      {showProgress && (
        <div className="flex items-center gap-3 border-t border-border bg-surface-low/50 px-6 py-3 sm:px-8">
          <span className="text-[0.72rem] font-bold text-on-surface-variant">
            {section.label}
          </span>
          <div className="track h-1.5 flex-1" aria-hidden="true">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[0.72rem] font-bold tabular-nums text-on-surface-variant">
            {section.completedCount} of {section.total} done
          </span>
        </div>
      )}
    </header>
  )
}
