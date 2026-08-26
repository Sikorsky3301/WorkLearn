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
      <section ref={ref} className="rounded-xl border border-border bg-white">
        {/* Same hairline-label treatment as the rest of the page. The green
            header bar and its icon tile were the loudest thing on screen for a
            five-question quiz. */}
        <header className="border-b border-border px-5 py-4 sm:px-6">
          <h2 className="flex items-center gap-2 font-display text-[0.95rem] font-extrabold text-on-surface">
            <ClipboardCheck className="h-4 w-4 text-primary" />
            Mini assessment
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
            Five questions on what you just built. Score {passMark}% to unlock the next task —
            retake it as often as you like, and you&apos;ll see the answers as soon as you submit.
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
      className="group flex w-full items-center gap-4 rounded-xl border border-border bg-white px-5 py-4 text-left transition-colors hover:border-primary/40 sm:px-6"
    >
      {/* Colour is carried by the small status dot, not by a filled panel.
          Passed, failed and not-yet-taken are three states this row has to
          show, and tinting the whole card for each made the page change
          character depending on your quiz score. */}
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
        passed ? 'bg-emerald-50 text-emerald-600'
          : taken ? 'bg-amber-50 text-amber-600'
            : 'bg-primary/10 text-primary'
      }`}>
        {passed ? <CheckCircle2 className="h-4 w-4" /> : taken ? <Lock className="h-4 w-4" /> : <ClipboardCheck className="h-4 w-4" />}
      </span>
      <span className="min-w-0">
        <span className="block font-display text-[0.95rem] font-extrabold text-on-surface">
          {taken ? `Mini assessment — you scored ${score}%` : 'Mini assessment'}
        </span>
        <span className="block text-sm leading-relaxed text-on-surface-variant">
          {passed
            ? 'Passed. Open it again to review the questions and explanations.'
            : taken
              ? `You need ${passMark}% to unlock the next task. Open it to try again.`
              : `Five questions on what you just built. Score ${passMark}% to unlock the next task.`}
        </span>
      </span>
      <ArrowRight className="ml-auto hidden h-5 w-5 shrink-0 text-on-surface-variant transition-transform group-hover:translate-x-0.5 group-hover:text-primary sm:block" />
    </button>
  )
}
