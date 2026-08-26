import { useEffect, useRef } from 'react'
import { Trophy, Zap, X, ArrowRight, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react'

// What happens the moment a submission is graded.
//
// Before this, a graded submit opened the mini assessment immediately. Two
// things were wrong with that: the work you just finished was never
// acknowledged — the reward for a passing score was a quiz — and there was no
// way back to the editor to look at what you had actually submitted without
// answering five questions first.
//
// So the score lands here instead. The quiz is one click away and entirely
// optional at this moment; closing returns you to the editor with your code
// and the checks still on screen.
//
// Deliberately NOT a gate. `PostTaskAssessment` still is one when it opens as
// the gate before the next task — that rule has not moved. This is the
// celebration, and a celebration you cannot dismiss is a demand.

function ScoreRing({ score }) {
  const pct = Math.max(0, Math.min(100, score ?? 0))
  const r = 46
  const circumference = 2 * Math.PI * r
  const tone = pct >= 100 ? '#059669' : pct >= 80 ? '#312E81' : '#d97706'

  return (
    <div className="relative h-28 w-28">
      <svg viewBox="0 0 112 112" className="h-full w-full -rotate-90">
        <circle cx="56" cy="56" r={r} fill="none" stroke="#e5e1e9" strokeWidth="9" />
        <circle
          cx="56" cy="56" r={r} fill="none" stroke={tone} strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${(circumference * pct) / 100} ${circumference}`}
          // The ring draws itself on mount. Cheap, and it makes the number feel
          // like a result rather than a value that was always sitting there.
          style={{ transition: 'stroke-dasharray 900ms cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tabular-nums text-on-surface">{pct}</span>
        <span className="text-[0.65rem] font-semibold text-on-surface-variant">out of 100</span>
      </div>
    </div>
  )
}

export default function TaskCompleteDialog({
  open,
  score,
  xpAwarded,
  skillsAwarded,
  taskTitle,
  passMark = 80,
  quizTaken = false,
  onTakeQuiz,
  onClose,
}) {
  const closeRef = useRef(null)

  // Focus the dismiss control, not the quiz button. The quiz is the loud
  // option; Escape and Enter should not be able to launch it by accident when
  // somebody only wanted to get back to their code.
  useEffect(() => {
    if (open) closeRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const pct = score ?? 0
  const perfect = pct >= 100
  const passed = pct >= passMark
  const skills = Object.entries(skillsAwarded || {})

  const headline = perfect ? 'Perfect score' : passed ? 'Task complete' : 'Submitted'
  const sub = perfect
    ? 'Every check passed. Nothing left to fix on this one.'
    : passed
      ? 'That is a pass. You can refine it and submit again if you want a higher score.'
      : `You need ${passMark} to pass. Your code and the failed checks are still on screen — have another go.`

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0b0f14]/70 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-complete-heading"
        className="animate-fadeIn relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        {/* The close control is a real button in the corner, not a bare glyph.
            It is the way back to the editor and has to look like one. */}
        <button
          ref={closeRef}
          onClick={onClose}
          title="Back to your code (Esc)"
          aria-label="Close and go back to your code"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-low hover:text-on-surface"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center px-6 pb-6 pt-8 text-center">
          <span className={`mb-4 flex h-11 w-11 items-center justify-center rounded-full ${
            perfect ? 'bg-emerald-50 text-emerald-600'
              : passed ? 'bg-primary/10 text-primary'
                : 'bg-amber-50 text-amber-600'
          }`}>
            {perfect ? <Trophy className="h-5 w-5" />
              : passed ? <CheckCircle2 className="h-5 w-5" />
                : <AlertTriangle className="h-5 w-5" />}
          </span>

          <h2 id="task-complete-heading" className="font-display text-xl font-extrabold text-on-surface">
            {headline}
          </h2>
          {taskTitle && (
            <p className="mt-0.5 text-sm font-medium text-on-surface-variant">{taskTitle}</p>
          )}

          <div className="my-5">
            <ScoreRing score={pct} />
          </div>

          <p className="max-w-xs text-sm leading-relaxed text-on-surface-variant">{sub}</p>

          {/* XP only when there IS some. A re-submit pays nothing — awards are
              first-completion only — and a triumphant "+0 XP" would read as a
              bug rather than as the rule working. */}
          {xpAwarded > 0 && (
            <div className="mt-5 w-full rounded-xl border border-border bg-surface-low/60 p-4">
              <p className="flex items-center justify-center gap-1.5 font-display text-lg font-extrabold text-on-surface">
                <Zap className="h-4 w-4 text-amber-500" /> +{xpAwarded} XP
              </p>
              {skills.length > 0 && (
                <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
                  {skills.map(([key, points]) => (
                    <span
                      key={key}
                      className="rounded-full border border-border bg-white px-2 py-0.5 text-[0.7rem] font-semibold text-on-surface-variant"
                    >
                      {key.replace(/_/g, ' ')} +{points}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-border bg-surface-low/40 p-4">
          {passed && (
            <button
              onClick={onTakeQuiz}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-on-surface px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-on-surface/90"
            >
              <Sparkles className="h-4 w-4" />
              {quizTaken ? 'Retake the quiz' : 'Take the quiz'}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full rounded-lg px-4 py-2 text-sm font-semibold text-on-surface-variant transition-colors hover:text-on-surface"
          >
            {passed ? 'Back to my code' : 'Keep working'}
          </button>
          {passed && (
            <p className="pt-0.5 text-center text-[0.7rem] text-on-surface-variant">
              The quiz is what unlocks the next task — you can take it whenever you&apos;re ready.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
