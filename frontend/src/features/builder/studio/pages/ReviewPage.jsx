import { useState } from 'react'
import {
  CircleAlert, AlertTriangle, CheckCircle2, Loader2, LayoutTemplate, Rocket, Eye,
} from 'lucide-react'
import { cn } from '../../../../lib/cn'
import { Section, Note } from '../editors/Fields'
import { planScaffold, WEEK_THEMES } from '../lib/scaffold'
import { isFinalAssessment } from '../lib/simFormat'

// The page that answers "is this finished, and what happens if I publish it".
//
// Publishing used to be a button with one server-side gate (rule points must
// total 100) and no client-side account of anything else. Everything that was
// merely UNFINISHED — no explainer, no check, a week with no name, a task
// awarding no skills — published silently and was discovered by a student.
//
// Nothing here blocks a publish that the server would allow. It just refuses
// to let an author publish without having been told.

function IssueList({ issues, onJump }) {
  if (!issues.length) return null
  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-white">
      {issues.map((issue, i) => (
        <li key={`${issue.id}-${i}`}>
          <button
            onClick={() => issue.task && onJump?.(issue.task)}
            disabled={!issue.task}
            className={cn(
              'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors',
              issue.task ? 'hover:bg-surface-low cursor-pointer' : 'cursor-default'
            )}
          >
            {issue.level === 'blocker'
              ? <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />}
            <span className="min-w-0 flex-1">
              <span className="block text-[0.84rem] font-semibold text-on-surface">
                {issue.label}
              </span>
              {issue.detail && (
                <span className="mt-0.5 block text-[0.76rem] leading-relaxed text-on-surface-variant">
                  {issue.detail}
                </span>
              )}
              {issue.task && (
                <span className="mt-1 block text-[0.68rem] font-semibold uppercase tracking-wide text-outline">
                  {issue.task.title || 'Untitled task'}
                </span>
              )}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

export default function ReviewPage({
  sim, report, format, onJumpToTask, onScaffold, scaffolding, onPublish, publishing, onPreview,
}) {
  const [confirmScaffold, setConfirmScaffold] = useState(false)

  // Flatten the per-task issues, carrying the task along so a row is clickable
  // straight to the thing that is wrong. An issue you cannot navigate to is a
  // to-do list, not a fix.
  const taskIssues = report.perTask.flatMap(({ task, issues }) =>
    issues.map((issue) => ({ ...issue, task }))
  )
  const blockers = [...report.simIssues, ...taskIssues].filter((i) => i.level === 'blocker')
  const warnings = [...report.simIssues, ...taskIssues].filter((i) => i.level === 'warning')

  const tasks = sim.tasks ?? []
  const plan = planScaffold({ existing: tasks, format })
  const alreadyShaped =
    tasks.filter((t) => !isFinalAssessment(t)).length >= format.weeks * format.tasks_per_week

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border bg-white px-8 py-6">
        <h2 className="font-display text-[1.6rem] font-extrabold leading-tight tracking-tight text-on-surface">
          Review &amp; publish
        </h2>
        <p className="mt-1.5 max-w-2xl text-[0.85rem] leading-relaxed text-on-surface-variant">
          {report.publishable
            ? 'Nothing here would break for a student. Anything left below is a rough edge, not a fault.'
            : `${blockers.length} thing${blockers.length === 1 ? '' : 's'} would not work for a student. Each row jumps to it.`}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-8 py-7">
        <div className="max-w-3xl space-y-8">

          {/* ── The format ─────────────────────────────────────────────── */}
          {!alreadyShaped && (
            <Section
              title={<span className="inline-flex items-center gap-2"><LayoutTemplate className="h-4 w-4" /> Lay out the format</span>}
              hint={`Creates the ${format.weeks}-week shape the rest of the platform uses: ${format.weeks} weeks of ${format.tasks_per_week} tasks, each with an empty ${format.mini_assessment_questions}-question check, plus a final assessment in week ${format.weeks + 1}.`}
            >
              <Note>
                Structure only — every task lands with a real week, a title and an empty explainer and
                check ready to fill. Nothing here writes a briefing or a question: placeholder prose
                that reads like content is the kind that survives to publish.
              </Note>

              <div className="mt-4 rounded-xl border border-border bg-white p-4">
                <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-outline">
                  Would create {plan.tasks.length} task{plan.tasks.length === 1 ? '' : 's'}
                </p>
                <ul className="mt-2 space-y-1">
                  {WEEK_THEMES.slice(0, format.weeks).map((theme, i) => {
                    const count = plan.tasks.filter((t) => t.week === i + 1).length
                    return (
                      <li key={i} className="flex items-baseline justify-between gap-4 text-[0.8rem]">
                        <span className="min-w-0 truncate text-on-surface">{theme.label}</span>
                        <span className="shrink-0 tabular-nums text-outline">+{count}</span>
                      </li>
                    )
                  })}
                  <li className="flex items-baseline justify-between gap-4 border-t border-border pt-1.5 text-[0.8rem]">
                    <span className="text-on-surface">Final Assessment</span>
                    <span className="shrink-0 tabular-nums text-outline">
                      +{plan.tasks.filter((t) => t.week === plan.finalWeek).length}
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                {!confirmScaffold ? (
                  <button
                    onClick={() => setConfirmScaffold(true)}
                    disabled={scaffolding || plan.tasks.length === 0}
                    className="inline-flex items-center gap-2 rounded-lg bg-on-surface px-4 py-2 text-[0.82rem] font-bold text-white transition-colors hover:bg-primary disabled:opacity-40 cursor-pointer disabled:cursor-default"
                  >
                    <LayoutTemplate className="h-3.5 w-3.5" /> Scaffold the format
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => { setConfirmScaffold(false); onScaffold(plan) }}
                      disabled={scaffolding}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[0.82rem] font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-50 cursor-pointer"
                    >
                      {scaffolding && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Create {plan.tasks.length} tasks
                    </button>
                    <button
                      onClick={() => setConfirmScaffold(false)}
                      className="text-[0.8rem] font-semibold text-on-surface-variant hover:text-on-surface cursor-pointer"
                    >
                      Cancel
                    </button>
                  </>
                )}
                {tasks.length > 0 && (
                  <p className="text-[0.75rem] text-outline">
                    Existing tasks are kept — this only fills the gaps.
                  </p>
                )}
              </div>
            </Section>
          )}

          {/* ── Blockers ───────────────────────────────────────────────── */}
          <Section
            title="Would not work for a student"
            hint={blockers.length ? 'These fail at run time — a page that cannot render, or a submission that cannot be graded.' : undefined}
          >
            {blockers.length === 0 ? (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <p className="text-[0.84rem] font-semibold text-emerald-900">
                  Nothing is broken. This simulation runs end to end.
                </p>
              </div>
            ) : (
              <IssueList issues={blockers} onJump={onJumpToTask} />
            )}
          </Section>

          {/* ── Warnings ───────────────────────────────────────────────── */}
          <Section
            title="Would read as unfinished"
            hint={warnings.length ? 'These work. They just do not match what a student gets from the other simulations.' : undefined}
            collapsible
            defaultOpen={blockers.length === 0}
          >
            {warnings.length === 0 ? (
              <p className="text-[0.84rem] text-on-surface-variant">Nothing outstanding.</p>
            ) : (
              <IssueList issues={warnings} onJump={onJumpToTask} />
            )}
          </Section>

          {/* ── Publish ────────────────────────────────────────────────── */}
          <Section
            title={<span className="inline-flex items-center gap-2"><Rocket className="h-4 w-4" /> Publish</span>}
            hint="A published simulation is visible to students on every tenant it is scoped to, immediately."
          >
            {!report.publishable && (
              <Note tone="danger">
                {blockers.length} blocking problem{blockers.length === 1 ? '' : 's'} above. Publishing
                is still possible — the server only refuses on grading rules that do not total 100 —
                but a student will meet every one of them.
              </Note>
            )}
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={onPublish}
                disabled={publishing}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[0.82rem] font-bold transition-colors cursor-pointer',
                  report.publishable
                    ? 'bg-on-surface text-white hover:bg-primary'
                    : 'border border-red-300 bg-white text-red-700 hover:bg-red-50'
                )}
              >
                {publishing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {sim.status === 'PUBLISHED' ? 'Update publish scope' : 'Publish'}
              </button>
              <button
                onClick={onPreview}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-[0.82rem] font-bold text-on-surface transition-colors hover:border-primary hover:text-primary cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5" /> Preview as a student
              </button>
            </div>
          </Section>
        </div>
      </div>
    </div>
  )
}
