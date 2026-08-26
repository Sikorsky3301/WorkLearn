import { Check, Plus, Trash2, ShieldCheck } from 'lucide-react'
import { cn } from '../../../../lib/cn'
import { Field, TextInput, TextArea, Repeater, Section, Note } from './Fields'
import { checkQuestions } from '../lib/simFormat'

// The `assessment` block — the check that gates the next task, and the final
// exam that closes the simulation.
//
// The builder's old QuizEditor authored `config.questions`, which is a
// DIFFERENT thing: an in-browser quiz whose answers ship to the client. An
// `assessment` is stripped from the public payload entirely and graded
// server-side, which is why it can carry `correct` and `explanation` at all.
// Authoring one was Python-only until now.
//
// ── THE TWO FAILURE MODES THIS FORM IS SHAPED AROUND ──────────────────────
//
// 1. An answer key that points at nothing. `correct` is an INDEX, and an
//    index into a list an author has since reordered or shortened is an
//    unanswerable question that only a student discovers. So the correct
//    answer is picked by clicking the option itself — there is no index to
//    type, and deleting an option moves the marker with it.
//
// 2. Questions that measure reading stamina instead of understanding. The
//    Data Analyst banks were rewritten once for exactly this: forty-word
//    questions with four long options separated by a subtle qualifier. The
//    guidance under each field states the house rules, because a form that
//    only says "Question" invites the first version again.

const BLANK_QUESTION = () => ({ question: '', options: ['', '', '', ''], correct: 0, explanation: '' })

function OptionRow({ text, index, correct, onText, onPick, onRemove, canRemove }) {
  const isCorrect = index === correct
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onPick}
        title={isCorrect ? 'This is the correct answer' : 'Mark as the correct answer'}
        aria-pressed={isCorrect}
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors cursor-pointer',
          isCorrect
            ? 'border-emerald-600 bg-emerald-600 text-white'
            : 'border-border text-transparent hover:border-emerald-500 hover:text-emerald-500'
        )}
      >
        <Check className="h-3.5 w-3.5" />
      </button>
      <TextInput
        value={text}
        onChange={(e) => onText(e.target.value)}
        placeholder={`Option ${String.fromCharCode(65 + index)}`}
        className={cn(isCorrect && 'border-emerald-300 bg-emerald-50/40')}
      />
      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove}
        title={canRemove ? 'Remove this option' : 'A question needs at least two options'}
        className="shrink-0 rounded p-1.5 text-outline transition-colors hover:text-red-500 disabled:opacity-25 cursor-pointer disabled:cursor-default"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

function QuestionBody({ q, update }) {
  const options = q.options ?? []

  function setOption(i, text) {
    update({ options: options.map((o, idx) => (idx === i ? text : o)) })
  }
  function addOption() {
    update({ options: [...options, ''] })
  }
  function removeOption(i) {
    const next = options.filter((_, idx) => idx !== i)
    // Keep the marker on the SAME option, not the same index. Deleting the
    // option above the answer must not silently move the answer.
    let correct = q.correct ?? 0
    if (i === correct) correct = 0
    else if (i < correct) correct -= 1
    update({ options: next, correct })
  }

  return (
    <>
      <Field
        label="Question"
        help="One short sentence. If it needs a comma and a qualifier, it is testing reading, not understanding."
      >
        <TextArea
          rows={2}
          value={q.question || ''}
          onChange={(e) => update({ question: e.target.value })}
          placeholder="Your file has 9,850 rows but only 9,600 different order IDs. What does that mean?"
        />
      </Field>

      <Field
        label="Options"
        help="Under a dozen words each. Exactly one is right, and the wrong ones are wrong for a reason the student can see — not because the right one is merely more right."
      >
        <div className="space-y-2">
          {options.map((opt, i) => (
            <OptionRow
              key={i}
              text={opt}
              index={i}
              correct={q.correct ?? 0}
              onText={(t) => setOption(i, t)}
              onPick={() => update({ correct: i })}
              onRemove={() => removeOption(i)}
              canRemove={options.length > 2}
            />
          ))}
          <button
            type="button"
            onClick={addOption}
            className="flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-[0.75rem] font-semibold text-on-surface-variant transition-colors hover:border-primary hover:text-primary cursor-pointer"
          >
            <Plus className="h-3 w-3" /> Add an option
          </button>
        </div>
      </Field>

      <Field
        label="Explanation"
        help="Shown only after the attempt is graded. This is the part that teaches — say why the right answer is right, not just that it is."
      >
        <TextArea
          rows={2}
          value={q.explanation || ''}
          onChange={(e) => update({ explanation: e.target.value })}
          placeholder="Rows minus distinct IDs gives the number of extra copies: 9,850 − 9,600 = 250 duplicate rows."
        />
      </Field>
    </>
  )
}

export default function AssessmentEditor({
  assessment, onChange, isFinal = false, targetCount, defaultPassMark,
}) {
  const value = assessment || {}
  const questions = value.questions ?? []
  const set = (key, v) => onChange({ ...value, [key]: v })
  const problems = checkQuestions(questions).filter((i) => i.level === 'blocker')

  return (
    <div className="space-y-8">
      <Section
        title={isFinal ? 'The final assessment' : 'The check after this task'}
        hint={
          isFinal
            ? 'Sat once, after every task. Mixes recall with the judgement the tasks demanded.'
            : 'Taken immediately after this task is graded, and passing it is what unlocks the next task. The right answer should follow from having DONE the task, not from having read about it.'
        }
      >
        <Note tone="info">
          <ShieldCheck className="mr-1.5 inline h-3.5 w-3.5 -translate-y-px" />
          Answers and explanations never reach the browser. The whole block is stripped from the
          public payload and graded on the server, so a student cannot read the key out of the page.
        </Note>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Title" help="Shown at the top of the check.">
            <TextInput
              value={value.title || ''}
              onChange={(e) => set('title', e.target.value)}
              placeholder={isFinal ? 'Final Assessment' : 'Cleaning the data'}
            />
          </Field>
          <Field
            label="Pass mark (%)"
            help={
              defaultPassMark
                ? `The rest of the platform gates on ${defaultPassMark}%. Changing it here changes it only for this one.`
                : 'The score needed to pass.'
            }
          >
            <TextInput
              type="number" min={0} max={100}
              value={value.pass_mark ?? ''}
              onChange={(e) => set('pass_mark', e.target.value === '' ? 0 : Number(e.target.value))}
              placeholder={String(defaultPassMark ?? 80)}
            />
          </Field>
        </div>
      </Section>

      <Section
        title="Questions"
        hint={
          targetCount
            ? `${questions.length} of ${targetCount}. Click the circle beside an option to mark it correct.`
            : 'Click the circle beside an option to mark it correct.'
        }
        action={
          problems.length > 0 ? (
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-[0.7rem] font-bold text-red-700">
              {problems.length} unanswerable
            </span>
          ) : questions.length > 0 ? (
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[0.7rem] font-bold text-emerald-700">
              All answerable
            </span>
          ) : null
        }
      >
        <Repeater
          items={questions}
          onChange={(v) => set('questions', v)}
          blank={BLANK_QUESTION}
          addLabel="Add a question"
          itemLabel={(q, i) => `Q${i + 1}${q.question ? ` · ${q.question.slice(0, 46)}${q.question.length > 46 ? '…' : ''}` : ''}`}
          empty={
            isFinal
              ? 'No questions yet. The final exam is what a certificate is issued against.'
              : 'No questions yet. Without a check, this task does not gate the next one — a student can move on having understood none of it.'
          }
          renderItem={(q, i, update) => <QuestionBody q={q} update={update} />}
        />
      </Section>
    </div>
  )
}
