import { useState } from 'react'
import { X, ClipboardCheck, ArrowRight, Lock, RotateCcw } from 'lucide-react'
import AssessmentRunner from '../assessment/AssessmentRunner'

// The mini assessment, conducted the moment a task is graded.
//
// It runs here, in the sandbox tab, rather than waiting on the task page —
// "when the task is completed" is the point at which the work is fresh, and an
// assessment you have to navigate somewhere else to find is one most people
// never take.
//
// TWO MODES, and the difference matters:
//
//   isGate = false  The check that pops up automatically on grading. Closable,
//                   skippable, no consequence. It exists to consolidate.
//   isGate = true   Opened by pressing Next. Passing is what unlocks the next
//                   task, so the footer offers a retake instead of a way past.
//
// A gate that could be dismissed would not be a gate, but it is still closable
// — you can go back to the editor, and Next will simply bring it up again.
// Trapping someone in a modal they can't pass yet helps nobody.

export default function PostTaskAssessment({
  enrollmentId, taskIndex, taskTitle, score, passMark = 80, isGate = false,
  onScored, onClose, onNext, nextLabel,
}) {
  const [outcome, setOutcome] = useState(null)
  // Remounts AssessmentRunner, which resets its answers and result view. A
  // retake has to start genuinely blank or it's just the old attempt again.
  const [attempt, setAttempt] = useState(0)

  const passed = outcome != null && outcome >= passMark
  const failed = outcome != null && outcome < passMark

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4 sm:p-8">
      <div className="w-full max-w-3xl bg-surface-low shadow-2xl">
        <header className={`sticky top-0 z-10 flex items-start gap-4 border-b px-5 py-4 sm:px-6 ${
          failed ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'
        }`}>
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white ${
            failed ? 'bg-amber-500' : 'bg-emerald-600'
          }`}>
            {isGate && !passed ? <Lock className="h-5 w-5" /> : <ClipboardCheck className="h-5 w-5" />}
          </span>

          <div className="min-w-0 flex-1">
            <h2 className={`font-display text-base font-extrabold ${failed ? 'text-amber-900' : 'text-emerald-900'}`}>
              {taskTitle} — graded{score != null ? `, ${score}%` : ''}
            </h2>
            <p className={`mt-0.5 text-sm leading-relaxed ${failed ? 'text-amber-800/80' : 'text-emerald-800/80'}`}>
              {isGate
                ? `Score ${passMark}% or more on these five questions to unlock the next task. You can retake it as many times as you need.`
                : 'Five quick questions on what you just built. Answers and explanations appear as soon as you submit.'}
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close the assessment"
            title={isGate ? 'Back to the editor' : 'Skip for now'}
            className={`shrink-0 rounded-full p-1.5 transition-colors ${
              failed
                ? 'text-amber-700 hover:bg-amber-100 hover:text-amber-900'
                : 'text-emerald-700 hover:bg-emerald-100 hover:text-emerald-900'
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="p-5 sm:p-6">
          <AssessmentRunner
            key={attempt}
            enrollmentId={enrollmentId}
            taskIndex={taskIndex}
            // One question at a time. Five stacked on one scroll meant the
            // whole quiz was visible at once, which reads as a form to get
            // through rather than questions to think about — and on a short
            // window the submit button sat below the fold from the start.
            perPage={1}
            passMark={passMark}
            compact
            onDone={(res) => { setOutcome(res.score); onScored?.(res.score) }}
          />
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-white px-5 py-4 sm:px-6">
          <button
            onClick={onClose}
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
          >
            {outcome != null ? 'Back to the editor' : isGate ? 'Not now' : 'Skip for now'}
          </button>

          {/* The score and the bar are in the runner's own result banner — this
              is only the way forward, not a second readout of the same number. */}
          {failed && (
            <button
              onClick={() => { setOutcome(null); setAttempt((n) => n + 1) }}
              className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-amber-600"
            >
              <RotateCcw className="h-4 w-4" /> Try again
            </button>
          )}

          {passed && onNext && (
            <button
              onClick={onNext}
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
            >
              {nextLabel}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          )}
        </footer>
      </div>
    </div>
  )
}
