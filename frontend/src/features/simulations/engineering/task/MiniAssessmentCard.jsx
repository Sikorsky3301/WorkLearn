import { useEffect, useRef, useState } from 'react'
import { ClipboardCheck, ArrowRight, CheckCircle2, Lock } from 'lucide-react'
import AssessmentRunner from '../assessment/AssessmentRunner'

// The five-question check that follows every completed task.
//
// It appears only once the task itself is graded, because the questions ask
// about decisions the student made while building it — "why did you check
// loading before data?" only means something to someone who just did.
//
// Not a modal. A modal over a task page implies the assessment interrupts the
// work; it doesn't, it follows it, and being able to scroll back up to the
// steps while answering is a feature rather than cheating — the questions ask
// why, and the page only says how.
//
// `open` is controlled by the page so pressing "Next" can bring it up and
// scroll to it: passing at `passMark` is what unlocks the following task, so
// Next has to lead here rather than dead-end.

export default function MiniAssessmentCard({
  enrollmentId, taskIndex, quizScore, passMark = 80, open, onOpen, onScored,
}) {
  const [justScored, setJustScored] = useState(null)
  const ref = useRef(null)

  const score = justScored ?? quizScore
  const taken = score != null
  const passed = taken && score >= passMark

  // Opened from the footer button, which is off-screen below — bring it into
  // view or the click looks like it did nothing.
  useEffect(() => {
    if (open) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [open])

  if (open) {
    return (
      <section ref={ref} className="border border-border bg-white">
        <header className="border-b border-emerald-200 bg-emerald-50 px-5 py-3.5 sm:px-6">
          <h2 className="flex items-center gap-2.5 font-display text-base font-extrabold text-emerald-900">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-emerald-600 text-white">
              <ClipboardCheck className="h-4 w-4" />
            </span>
            Mini assessment
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-emerald-800/80">
            Five questions on what you just built. Score {passMark}% or more to unlock the next task —
            you can retake it as often as you like, and you&apos;ll see the answers and why
            they&apos;re right as soon as you submit.
          </p>
        </header>
        <div className="p-5 sm:p-6">
          <AssessmentRunner
            enrollmentId={enrollmentId}
            taskIndex={taskIndex}
            // One question per page — matches the sandbox's copy of this quiz,
            // which is the same five questions and should not feel different
            // depending on where it was opened from.
            perPage={1}
            passMark={passMark}
            compact
            onDone={(res) => { setJustScored(res.score); onScored?.(res.score) }}
          />
        </div>
      </section>
    )
  }

  return (
    <button
      ref={ref}
      onClick={() => onOpen?.(true)}
      className="group flex w-full items-center gap-4 border border-emerald-200 bg-emerald-50 px-5 py-4 text-left transition-colors hover:bg-emerald-100 sm:px-6"
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white ${
        passed ? 'bg-emerald-600' : taken ? 'bg-amber-500' : 'bg-emerald-600'
      }`}>
        {passed ? <CheckCircle2 className="h-5 w-5" /> : taken ? <Lock className="h-5 w-5" /> : <ClipboardCheck className="h-5 w-5" />}
      </span>
      <span className="min-w-0">
        <span className="block font-display text-base font-extrabold text-emerald-900">
          {taken ? `Mini assessment — you scored ${score}%` : 'Mini assessment'}
        </span>
        <span className="block text-sm leading-relaxed text-emerald-800/80">
          {passed
            ? 'Passed. Open it again to review the questions and explanations.'
            : taken
              ? `You need ${passMark}% to unlock the next task. Open it to try again.`
              : `Five questions on what you just built. Score ${passMark}% to unlock the next task.`}
        </span>
      </span>
      <ArrowRight className="ml-auto hidden h-5 w-5 shrink-0 text-emerald-700 transition-transform group-hover:translate-x-0.5 sm:block" />
    </button>
  )
}
