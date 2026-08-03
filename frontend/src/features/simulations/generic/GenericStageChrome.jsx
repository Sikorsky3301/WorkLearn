import { useState } from 'react'
import { CheckCircle2, Circle, ArrowRight, Brain, Lightbulb } from 'lucide-react'
import { Button } from '../../../components/ui/shadcn/button'
import { cn } from '../../../lib/cn'
import StageQuiz from '../sales-crm-sim/stages/StageQuiz'

/** Generic per-task header — title/objective/briefing/what-to-do/what-to-
 * submit, no hardcoded stage count (unlike sales-crm-sim's StageChrome,
 * which hardcodes "of 8"). Renders the FULL brief (not just the short
 * `objective` one-liner) — a real content gap in an earlier version of this
 * component silently dropped `briefing`/`what_to_do`/`what_to_submit`
 * entirely, which is why some migrated tasks looked thin. */
export function GenericTaskHeader({ task, taskCount }) {
  return (
    <div className="mb-6">
      <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-1">
        Task {task.task_index} of {taskCount}
      </p>
      <h1 className="text-xl font-bold text-on-surface mb-1.5">{task.title}</h1>
      {task.objective && <p className="text-sm font-medium text-on-surface-variant mb-2">{task.objective}</p>}
      {task.briefing && (
        <p className="text-sm text-on-surface leading-relaxed max-w-2xl whitespace-pre-line mb-4">{task.briefing}</p>
      )}

      {task.what_to_do?.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wide text-on-surface-variant mb-2">What to do</h3>
          <ol className="space-y-2.5">
            {task.what_to_do.map((step, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-on-surface-variant">
                <span className="h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}

      {task.what_to_submit?.length > 0 && (
        <div className="bg-surface-low rounded-lg p-3.5 mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wide text-on-surface-variant mb-2">What to submit</h3>
          <ul className="space-y-1.5">
            {task.what_to_submit.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-on-surface">
                <span className="text-primary font-bold mt-0.5 shrink-0">→</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {task.hints?.length > 0 && <HintsPanel hints={task.hints} />}
    </div>
  )
}

/** Collapsed by default (a hint you have to open feels earned, not shoved in
 * your face) — expands into the same amber-callout style the old per-sim
 * hardcoded workspaces used for hints. */
function HintsPanel({ hints }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-800 transition-colors"
      >
        <Lightbulb className="h-3.5 w-3.5" />
        {open ? 'Hide hints' : `Show hints (${hints.length})`}
      </button>
      {open && (
        <ul className="mt-2 space-y-1.5 bg-amber-50 border border-amber-200 rounded-lg p-3">
          {hints.map((h, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-amber-900">
              <Lightbulb className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-600" />
              {h}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Success-criteria checklist + Continue button + optional post_task_quiz
 * gate (config.post_task_quiz.questions) — reuses StageQuiz.jsx as-is, since
 * it's already fully generic (questions/stageTitle/onFinish props only). */
export function GenericTaskFooterNav({ task, criteriaMet, isLast, alreadyCompleted, onContinue }) {
  const allMet = criteriaMet.length > 0 && criteriaMet.every(Boolean)
  const quiz = task.config?.post_task_quiz?.questions
  const hasQuiz = !alreadyCompleted && quiz?.length > 0
  const [quizOpen, setQuizOpen] = useState(false)

  function handleClick() {
    if (hasQuiz) setQuizOpen(true)
    else onContinue()
  }

  function handleQuizFinish(scorePct) {
    setQuizOpen(false)
    onContinue(scorePct)
  }

  return (
    <>
      <div className="mt-8 border-t border-border pt-5 flex items-center justify-between gap-4 flex-wrap">
        <ul className="flex flex-wrap gap-2">
          {(task.success_criteria || []).map((c, i) => (
            <li
              key={i}
              className={cn(
                'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors',
                criteriaMet[i] ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-on-surface-variant bg-surface-low border-border'
              )}
            >
              {criteriaMet[i] ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <Circle className="h-3.5 w-3.5 shrink-0" />}
              {c}
            </li>
          ))}
        </ul>
        <Button onClick={handleClick} disabled={!allMet} className="shrink-0">
          {hasQuiz && <Brain className="h-4 w-4" />}
          {hasQuiz ? 'Quick Check →' : isLast ? 'Finish Simulation' : 'Continue'}
          {!hasQuiz && <ArrowRight className="h-4 w-4" />}
        </Button>
      </div>

      {quiz?.length > 0 && (
        <StageQuiz
          open={quizOpen}
          onOpenChange={setQuizOpen}
          questions={quiz}
          stageTitle={task.title}
          onFinish={handleQuizFinish}
        />
      )}
    </>
  )
}
