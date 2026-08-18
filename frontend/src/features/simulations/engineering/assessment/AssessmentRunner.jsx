import { useMemo, useState } from 'react'
import {
  Check, X, ArrowLeft, ArrowRight, Loader2, CircleCheck, CircleAlert, MinusCircle,
} from 'lucide-react'
import { useAssessment, useSubmitAssessment } from '../../../../hooks'

// One assessment, whether it's the five questions after a task or the fifty at
// the end.
//
// Paged rather than one long scroll: a 50-question wall is demoralising to
// open, and paging gives an honest sense of progress. `perPage` is the only
// difference between the two uses.
//
// NOTHING IS SCORED HERE. The correct answers are not in the payload; they
// arrive with the result of the POST. That's deliberate — a client-side score
// on something called an assessment is a score the student can edit.
//
// The pass mark comes from the server (`data.pass_mark`), with `passMark` as an
// override for callers that already know it. It used to be read off
// `outcome.passed`, which the API returns as null whenever a bank has no pass
// mark — so a failed attempt rendered the green "well done" banner while the
// footer beside it said "you need 80%". One authority now.

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

function Choice({ label, letter, selected, onSelect, verdict }) {
  // verdict: undefined while answering, then 'correct' | 'chosen-wrong' | 'missed'
  const tone = verdict === 'correct'
    ? 'border-emerald-500 bg-emerald-50/70'
    : verdict === 'chosen-wrong'
      ? 'border-rose-400 bg-rose-50/70'
      : verdict === 'missed'
        ? 'border-emerald-300 border-dashed bg-white'
        : selected
          ? 'border-primary bg-primary/[0.06] ring-1 ring-primary/20'
          : 'border-border bg-white hover:border-primary/50 hover:bg-primary/[0.03]'

  const badge = verdict === 'correct' || verdict === 'missed'
    ? 'bg-emerald-600 text-white'
    : verdict === 'chosen-wrong'
      ? 'bg-rose-500 text-white'
      : selected
        ? 'bg-primary text-white'
        : 'bg-surface-low text-on-surface-variant'

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!onSelect}
      aria-pressed={onSelect ? Boolean(selected) : undefined}
      className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${tone} ${
        onSelect ? '' : 'cursor-default'
      }`}
    >
      <span className={`mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[0.7rem] font-extrabold ${badge}`}>
        {verdict === 'correct' || verdict === 'missed'
          ? <Check className="h-3.5 w-3.5" />
          : verdict === 'chosen-wrong'
            ? <X className="h-3.5 w-3.5" />
            : letter}
      </span>
      <span className="text-sm leading-relaxed text-on-surface">{label}</span>
    </button>
  )
}

function verdictFor(optionIndex, result) {
  if (!result) return undefined
  if (optionIndex === result.correct_option) {
    return result.was_correct ? 'correct' : 'missed'
  }
  if (optionIndex === result.answered) return 'chosen-wrong'
  return undefined
}

/** Answered / unanswered at a glance — one pip per question.
 *
 * Clickable when `onJump` is given, which is what makes one-question-at-a-time
 * bearable: without a way back to question 2, a paged quiz is a corridor with
 * no doors, and people answer defensively because they can't revise. */
function Pips({ questions, answers, results, current, onJump }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {questions.map((q, i) => {
        const r = results?.[q.index]
        const tone = r
          ? (r.was_correct ? 'bg-emerald-500' : r.skipped ? 'bg-border' : 'bg-rose-400')
          : (answers[q.index] != null ? 'bg-primary' : 'bg-border')
        const isCurrent = current === i

        if (!onJump) {
          return <span key={q.index} className={`h-1.5 w-6 rounded-full ${tone}`} />
        }
        return (
          <button
            key={q.index}
            type="button"
            onClick={() => onJump(i)}
            aria-label={`Question ${i + 1}${answers[q.index] != null ? ', answered' : ', not answered'}`}
            aria-current={isCurrent ? 'step' : undefined}
            className={`h-1.5 rounded-full transition-all ${tone} ${
              isCurrent ? 'w-10 ring-2 ring-primary/30 ring-offset-2' : 'w-6 hover:opacity-70'
            }`}
          />
        )
      })}
    </div>
  )
}

export default function AssessmentRunner({
  enrollmentId,
  taskIndex,
  perPage = 5,
  passMark,
  onDone,
  compact = false,
}) {
  const { data, isLoading, error } = useAssessment(enrollmentId, taskIndex)
  const submit = useSubmitAssessment(enrollmentId)

  const [answers, setAnswers] = useState({})
  const [page, setPage] = useState(0)
  const [outcome, setOutcome] = useState(null)

  const questions = useMemo(() => data?.questions ?? [], [data])
  const pageCount = Math.max(1, Math.ceil(questions.length / perPage))
  const start = page * perPage
  const visible = questions.slice(start, start + perPage)
  const answeredCount = Object.values(answers).filter((v) => v != null).length
  const effectivePassMark = passMark ?? data?.pass_mark ?? 0
  // One question per page gets its own chrome: a step counter instead of a
  // running total, and a jump bar so answers stay revisable.
  const oneAtATime = perPage === 1

  if (isLoading) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-border bg-white p-6 text-sm text-on-surface-variant">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading the assessment…
      </div>
    )
  }
  if (error || !questions.length) {
    return (
      <div className="rounded-xl border border-border bg-white p-6 text-sm text-on-surface-variant">
        This task doesn&apos;t have an assessment.
      </div>
    )
  }

  const resultByIndex = outcome
    ? Object.fromEntries(outcome.results.map((r) => [r.index, r]))
    : null

  async function handleSubmit() {
    const ordered = questions.map((q) => (answers[q.index] ?? null))
    const res = await submit.mutateAsync({ taskIndex, answers: ordered })
    setOutcome(res)
    setPage(0)
    onDone?.(res)
  }

  // ── Result ──
  if (outcome) {
    const passed = outcome.score >= effectivePassMark
    return (
      <div className="space-y-4">
        <div className={`overflow-hidden rounded-2xl border ${
          passed ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'
        }`}>
          <div className="flex flex-wrap items-center gap-5 p-5 sm:p-6">
            {/* Score ring — a number in a circle reads faster than a sentence. */}
            <div className="relative h-20 w-20 shrink-0">
              <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
                <circle cx="40" cy="40" r="34" fill="none" strokeWidth="7" className="stroke-black/[0.07]" />
                <circle
                  cx="40" cy="40" r="34" fill="none" strokeWidth="7" strokeLinecap="round"
                  className={passed ? 'stroke-emerald-500' : 'stroke-amber-500'}
                  strokeDasharray={2 * Math.PI * 34}
                  strokeDashoffset={2 * Math.PI * 34 * (1 - outcome.score / 100)}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-display text-xl font-extrabold tabular-nums text-on-surface">
                {outcome.score}%
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <p className={`flex items-center gap-2 font-display text-lg font-extrabold ${
                passed ? 'text-emerald-900' : 'text-amber-900'
              }`}>
                {passed ? <CircleCheck className="h-5 w-5" /> : <CircleAlert className="h-5 w-5" />}
                {passed ? 'Passed' : 'Not there yet'}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
                {outcome.correct} of {outcome.total} correct
                {effectivePassMark > 0 && ` · ${effectivePassMark}% needed to move on`}
                {passed && outcome.bonus_xp > 0 && ` · +${outcome.bonus_xp} XP bonus`}
              </p>
              <div className="mt-3">
                <Pips questions={questions} answers={answers} results={resultByIndex} />
              </div>
            </div>
          </div>
        </div>

        {/* Every question, with what was picked and why the answer is what it
            is. Reviewing only the wrong ones would skip the lucky guesses. */}
        <ol className="space-y-3">
          {questions.map((q) => {
            const r = resultByIndex[q.index]
            // Defensive: a short results array would otherwise throw here and
            // take down the whole result view after a successful submission.
            if (!r) return null
            return (
              <li key={q.index} className="overflow-hidden rounded-2xl border border-border bg-white">
                <div className="flex items-start gap-3 border-b border-border/70 bg-surface-low/40 px-5 py-3.5">
                  <span className={`mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[0.7rem] font-extrabold text-white ${
                    r.was_correct ? 'bg-emerald-600' : r.skipped ? 'bg-on-surface-variant' : 'bg-rose-500'
                  }`}>
                    {r.was_correct ? <Check className="h-3.5 w-3.5" />
                      : r.skipped ? <MinusCircle className="h-3.5 w-3.5" />
                        : <X className="h-3.5 w-3.5" />}
                  </span>
                  <p className="text-sm font-bold leading-relaxed text-on-surface">
                    {q.index + 1}. {q.question}
                  </p>
                </div>

                <div className="space-y-2 p-4 sm:p-5">
                  {q.options.map((opt, i) => (
                    <Choice key={i} label={opt} letter={LETTERS[i]} verdict={verdictFor(i, r)} />
                  ))}
                  {r.explanation && (
                    <p className="mt-3 rounded-xl border-l-[3px] border-primary bg-primary/[0.04] px-4 py-3 text-sm leading-relaxed text-on-surface">
                      {r.explanation}
                    </p>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    )
  }

  // ── Answering ──
  return (
    <div className="space-y-4">
      {!compact && (data.title || data.description) && (
        <div className="rounded-2xl border border-border bg-white p-5">
          {data.title && <h2 className="font-display text-lg font-extrabold text-on-surface">{data.title}</h2>}
          {data.description && (
            <p className="mt-1.5 text-sm leading-relaxed text-on-surface-variant">{data.description}</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="font-display text-sm font-extrabold text-on-surface">
            {oneAtATime
              ? `Question ${page + 1} of ${questions.length}`
              : `${answeredCount} of ${questions.length} answered`}
          </span>
          {oneAtATime && (
            <span className="text-xs font-semibold text-on-surface-variant">
              {answeredCount}/{questions.length} answered
            </span>
          )}
          {data.previous_score != null && (
            <span className="rounded-full bg-surface-low px-2.5 py-1 text-[0.7rem] font-bold text-on-surface-variant">
              Last: {data.previous_score}%
            </span>
          )}
        </div>
        <Pips
          questions={questions}
          answers={answers}
          current={oneAtATime ? page : undefined}
          onJump={oneAtATime ? setPage : undefined}
        />
      </div>

      <ol className="space-y-3">
        {visible.map((q) => (
          <li key={q.index} className="overflow-hidden rounded-2xl border border-border bg-white">
            <div className="flex items-start gap-3 border-b border-border/70 bg-surface-low/40 px-5 py-4">
              <span className="mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-on-surface text-[0.7rem] font-extrabold text-white">
                {q.index + 1}
              </span>
              <p className={`font-bold leading-relaxed text-on-surface ${
                oneAtATime ? 'text-base sm:text-[1.05rem]' : 'text-sm'
              }`}>
                {q.question}
              </p>
            </div>
            <div className={`space-y-2 ${oneAtATime ? 'p-5 sm:p-6' : 'p-4 sm:p-5'}`}>
              {q.options.map((opt, i) => (
                <Choice
                  key={i}
                  label={opt}
                  letter={LETTERS[i]}
                  selected={answers[q.index] === i}
                  onSelect={() => setAnswers((a) => ({ ...a, [q.index]: i }))}
                />
              ))}
            </div>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white p-4">
        {/* Hidden rather than disabled when there is nowhere to go back to —
            a dead Back button is just clutter. */}
        {pageCount > 1 ? (
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold text-on-surface-variant transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        ) : <span />}

        {pageCount > 1 && !oneAtATime && (
          <span className="font-mono text-xs font-bold text-on-surface-variant">
            Page {page + 1} of {pageCount}
          </span>
        )}

        {page < pageCount - 1 ? (
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            className="group inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
          >
            {/* Named rather than a bare "Next" so it can't be mistaken for the
                button that moves on to the next TASK. */}
            {oneAtATime ? 'Next question' : 'Next'}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submit.isPending || answeredCount === 0}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-40"
          >
            {submit.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {answeredCount < questions.length
              ? `Submit — ${questions.length - answeredCount} unanswered`
              : 'Submit answers'}
          </button>
        )}
      </div>

      {/* On the last question with gaps behind them, say which ones — the pip
          bar shows that something is missing but not what, and hunting for it
          one question at a time is the cost of paging. */}
      {oneAtATime && page === pageCount - 1 && answeredCount < questions.length && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Unanswered:{' '}
          {questions
            .map((q, i) => (answers[q.index] == null ? i : null))
            .filter((i) => i != null)
            .map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPage(i)}
                className="mx-0.5 font-bold underline underline-offset-2 hover:text-amber-950"
              >
                {i + 1}
              </button>
            ))}
          {' '}— they&apos;ll be marked wrong if you submit now.
        </p>
      )}

      {submit.isError && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          Couldn&apos;t submit that. Your answers are still here — try again in a moment.
        </p>
      )}
    </div>
  )
}
