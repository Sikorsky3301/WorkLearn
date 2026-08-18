import { X, Check, Minus, Terminal, ListChecks, AlertTriangle } from 'lucide-react'
import { useTaskResult } from '../../../../hooks'
import { breakdownRows } from '../lib/roadmapModel'
import ScoreChips from './ScoreChips'

// Why a task scored what it scored.
//
// Fetched on open, not with the roadmap: `rubric_rating` holds every grader
// check plus captured stdout/stderr, which is far too much to ship with a
// query that fires on three other screens.
//
// The grader result shape is `{score, checks: [...], details: {stdout, stderr}}`
// for the registered graders, but declarative-rules sandboxes and the
// LLM-graded task types put other things there — so `breakdownRows` returns []
// for anything unrecognised and we show the raw score rather than an error.

function CheckRow({ label, points, passed }) {
  return (
    <li className="flex items-start gap-3 py-2.5">
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
          passed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
        }`}
      >
        {passed ? <Check className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
      </span>
      <span className="min-w-0 flex-1 text-sm text-on-surface">{label}</span>
      {points != null && (
        <span
          className={`shrink-0 font-mono text-xs font-bold tabular-nums ${
            passed ? 'text-emerald-700' : 'text-on-surface-variant/50'
          }`}
        >
          {passed ? `+${points}` : `0/${points}`}
        </span>
      )}
    </li>
  )
}

function Stream({ label, text }) {
  if (!text?.trim()) return null
  return (
    <div>
      <p className="mb-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-on-surface-variant">{label}</p>
      <pre className="max-h-48 overflow-auto rounded-lg bg-slate-900 p-3 font-mono text-[0.7rem] leading-relaxed text-slate-200">
        {text}
      </pre>
    </div>
  )
}

export default function ScoreBreakdownDrawer({ open, onClose, enrollmentId, task }) {
  const { data, isLoading, isError } = useTaskResult(enrollmentId, task?.task_index, { enabled: open })

  if (!open || !task) return null

  const rows = breakdownRows(data?.rubric_rating)
  const details = data?.rubric_rating?.details

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={`Results for ${task.title}`}>
      <button className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} aria-label="Close results" />

      <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <header className="flex items-start gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="text-[0.65rem] font-bold uppercase tracking-wider text-primary">Task {task.task_index} results</p>
            <h2 className="mt-0.5 truncate font-display text-lg font-extrabold text-on-surface">{task.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-surface-low hover:text-on-surface"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          {isLoading && <p className="text-sm text-on-surface-variant">Loading results…</p>}

          {isError && (
            <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 p-3.5 text-sm text-amber-900 ring-1 ring-amber-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>Couldn&apos;t load the detailed results for this task. Your score is still recorded.</p>
            </div>
          )}

          {data && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-surface-low p-4">
                  <p className="flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-on-surface-variant">
                    <Terminal className="h-3 w-3" /> Code
                  </p>
                  <p className="mt-1 font-display text-3xl font-extrabold tabular-nums text-on-surface">
                    {data.score ?? '—'}
                  </p>
                </div>
                <div className="rounded-xl bg-surface-low p-4">
                  <p className="flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-on-surface-variant">
                    <ListChecks className="h-3 w-3" /> Quiz
                  </p>
                  <p className="mt-1 font-display text-3xl font-extrabold tabular-nums text-on-surface">
                    {data.quiz_score ?? '—'}
                  </p>
                </div>
              </div>

              {rows.length > 0 ? (
                <div>
                  <p className="mb-1 text-[0.65rem] font-bold uppercase tracking-wider text-on-surface-variant">
                    What the grader checked
                  </p>
                  <ul className="divide-y divide-border">
                    {rows.map((r) => <CheckRow key={r.id} {...r} />)}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-on-surface-variant">
                  This task was graded as a whole rather than against individual checks.
                </p>
              )}

              <Stream label="Output" text={details?.stdout} />
              <Stream label="Errors" text={details?.stderr} />
            </>
          )}
        </div>

        <footer className="border-t border-border px-5 py-3">
          <ScoreChips score={data?.score} quizScore={data?.quiz_score} />
        </footer>
      </div>
    </div>
  )
}
