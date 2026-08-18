import { Check, Lock, Play, ArrowRight, BarChart3, Code2, GraduationCap, ClipboardCheck } from 'lucide-react'
import { TASK_STATUS } from '../lib/roadmapModel'
import ScoreChips from './ScoreChips'

// One task on the roadmap.
//
// Three states, each with its own affordance rather than a shared button whose
// label changes: complete offers "Review results", current is the single loud
// call to action on the page, locked is inert and says why.

const PIN = {
  [TASK_STATUS.COMPLETE]: {
    icon: Check,
    ring: 'ring-emerald-200',
    dot: 'bg-emerald-500 text-white',
  },
  [TASK_STATUS.CURRENT]: {
    icon: Play,
    ring: 'ring-primary/30',
    dot: 'bg-primary text-white',
  },
  [TASK_STATUS.LOCKED]: {
    icon: Lock,
    ring: 'ring-border',
    dot: 'bg-surface-high text-on-surface-variant/60',
  },
}

export default function RoadmapTaskCard({ task, onOpen, onViewResults }) {
  const { status } = task
  const pin = PIN[status]
  const PinIcon = pin.icon
  const isCurrent = status === TASK_STATUS.CURRENT
  const isLocked = status === TASK_STATUS.LOCKED
  const isFinal = Boolean(task.config?.is_final_assessment)
  // Only flag a missing assessment on a task that actually HAS one. This used
  // to assume every code_sandbox task did, which is true of this template and
  // not of a sim an admin builds without assessments — those would have shown
  // a permanent "not taken yet" for a quiz that doesn't exist.
  // `assessment_summary` is the count-only projection from the server.
  const assessmentPending = !isFinal
    && status === TASK_STATUS.COMPLETE
    && Boolean(task.assessment_summary)
    && task.quizScore == null

  return (
    <div className="relative pl-12">
      {/* Status pin, sitting on the spine. */}
      <span
        className={`absolute left-0 top-4 flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-white ${pin.dot}`}
        aria-hidden="true"
      >
        <PinIcon className="h-4 w-4" />
      </span>

      <div
        className={`rounded-2xl bg-white p-5 ring-1 transition-shadow ${pin.ring} ${
          isCurrent ? 'shadow-lg shadow-primary/10' : 'shadow-sm'
        } ${isLocked ? 'opacity-70' : ''}`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-[0.65rem] font-bold uppercase tracking-wider text-on-surface-variant">
                {isFinal ? 'Final exam' : `Task ${task.task_index}`}
              </span>
              {isCurrent && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-white">
                  Up next
                </span>
              )}
              {isFinal ? (
                <span className="inline-flex items-center gap-1 text-[0.65rem] font-semibold text-on-surface-variant/70">
                  <GraduationCap className="h-3 w-3" /> {task.config?.question_count || 50} questions
                </span>
              ) : task.type === 'code_sandbox' && (
                <span className="inline-flex items-center gap-1 text-[0.65rem] font-semibold text-on-surface-variant/70">
                  <Code2 className="h-3 w-3" /> Sandbox
                </span>
              )}
            </div>

            <h4 className="font-display text-base font-bold leading-snug text-on-surface">{task.title}</h4>
            {task.objective && (
              <p className="mt-1 text-sm leading-relaxed text-on-surface-variant line-clamp-2">{task.objective}</p>
            )}
          </div>

          {task.xp_award > 0 && (
            <span className="shrink-0 rounded-lg bg-surface-low px-2.5 py-1 font-mono text-xs font-bold text-primary">
              {task.xp_award} XP
            </span>
          )}
        </div>

        {(task.score != null || task.quizScore != null) && (
          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            <ScoreChips score={task.score} quizScore={task.quizScore} />
            <button
              onClick={() => onViewResults(task)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary-dark"
            >
              <BarChart3 className="h-3.5 w-3.5" /> View breakdown
            </button>
          </div>
        )}

        {assessmentPending && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
            <ClipboardCheck className="h-3.5 w-3.5" /> Mini assessment not taken yet
          </p>
        )}

        <div className="mt-4">
          {isLocked ? (
            <p className="text-xs text-on-surface-variant/70">
              {isFinal
                ? 'Finish all nine tasks to unlock the final assessment.'
                : 'Finish the previous task to unlock this one.'}
            </p>
          ) : (
            <button
              onClick={() => onOpen(task)}
              className={`group inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                isCurrent
                  ? 'bg-primary text-white hover:bg-primary-dark'
                  : 'border border-border bg-white text-on-surface hover:bg-surface-low'
              }`}
            >
              {isFinal
                ? (isCurrent ? 'Start the final assessment' : 'Review the final assessment')
                : (isCurrent ? 'Start task' : 'Review task')}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
