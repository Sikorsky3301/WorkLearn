import { MessageSquare, Hammer, CheckCheck, ClipboardCheck, GraduationCap, Award } from 'lucide-react'

// How a simulation actually works, end to end.
//
// The page told a prospective student WHAT the simulation covers — skills,
// technology, a curriculum — and never what doing one is like. That loop is
// the distinctive thing here and the question everyone actually has: does a
// person mark my work, can I retry, what happens if I get it wrong.
//
// Every step is derived from the real tasks, not written into the page. A sim
// with no code sandbox doesn't claim an editor; one with no assessments
// doesn't claim a quiz. Prose that describes a different product than the one
// you enrol in is worse than no prose.

function Step({ n, icon: Icon, title, children }) {
  return (
    <li className="relative flex gap-4 pb-6 last:pb-0">
      {/* Connector, stopping at the last step. */}
      <span
        aria-hidden="true"
        className="absolute left-[1.125rem] top-9 h-[calc(100%-1.5rem)] w-px bg-border last:hidden"
      />
      <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-4 ring-white">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 pt-1">
        <p className="text-sm font-bold text-on-surface">
          <span className="mr-1.5 font-mono text-xs text-on-surface-variant">{n}</span>
          {title}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">{children}</p>
      </div>
    </li>
  )
}

export default function HowItWorks({ simulation, tasks }) {
  const manager = simulation.manager?.name
  const hasCodeSandbox = tasks.some((t) => t.type === 'code_sandbox')
  const graded = tasks.filter((t) => t.type === 'code_sandbox').length

  // `assessment_summary` is the count-only projection of a task's assessment —
  // the answers never reach the client. See _assessment_summary in sim_view.py.
  const withAssessment = tasks.filter((t) => t.assessment_summary && !t.config?.is_final_assessment)
  const miniQuestions = withAssessment[0]?.assessment_summary?.question_count
  const passMark = withAssessment[0]?.assessment_summary?.pass_mark
  const final = tasks.find((t) => t.config?.is_final_assessment)

  const steps = []

  steps.push({
    icon: MessageSquare,
    title: manager ? `Get the brief from ${manager}` : 'Get the brief',
    body: 'Each task starts the way work does — a short message explaining what is needed and why, '
      + 'followed by the background, the concepts it relies on, and the exact names your code must use.',
  })

  steps.push({
    icon: Hammer,
    title: hasCodeSandbox ? 'Build it in the browser' : 'Do the work',
    body: hasCodeSandbox
      ? 'A full editor opens in its own tab — nothing to install, nothing to configure. Run your code '
        + 'as often as you like to see what passes; nothing is recorded until you submit.'
      : 'Everything happens in the browser, with the brief beside you the whole time.',
  })

  steps.push({
    icon: CheckCheck,
    title: 'Graded by running it, not reading it',
    body: hasCodeSandbox
      ? `Your submission runs against a hidden test suite in a sandboxed container${
        graded ? ` — the same one for every student, across all ${graded} tickets` : ''
      }. You get a score and a per-check breakdown in seconds, so you find out what failed and why, immediately.`
      : 'Work is scored against the task\'s own criteria, with a breakdown of what did and did not land.',
  })

  if (miniQuestions) {
    steps.push({
      icon: ClipboardCheck,
      title: 'Check what actually stuck',
      body: `Each ticket is followed by ${miniQuestions} questions on the decisions you just made — not `
        + 'trivia. Every answer comes back with an explanation'
        + (passMark ? `, and ${passMark}% unlocks the next task. Retake it as often as you need.` : '.'),
    })
  }

  if (final) {
    steps.push({
      icon: GraduationCap,
      title: `Sit the ${final.config?.question_count || ''}-question final`.replace('  ', ' '),
      body: 'A closing exam across everything the simulation covered, ramping from fundamentals to the '
        + 'kind of trade-off you would be asked about in an interview.',
    })
  }

  steps.push({
    icon: Award,
    title: 'Finish with proof',
    body: 'A completion certificate, the work itself, and an updated skill profile — evidence you did the '
      + 'job, not a record of attendance.',
  })

  return (
    <div className="rounded-xl border border-border p-6">
      <h2 className="mb-1.5 text-lg font-bold text-on-surface">How this works</h2>
      <p className="mb-6 text-sm leading-relaxed text-on-surface-variant">
        Every task follows the same loop. No lectures, no multiple-choice-only modules — you do the work
        and it gets marked.
      </p>
      <ol>
        {steps.map((s, i) => (
          <Step key={s.title} n={i + 1} icon={s.icon} title={s.title}>{s.body}</Step>
        ))}
      </ol>
    </div>
  )
}
