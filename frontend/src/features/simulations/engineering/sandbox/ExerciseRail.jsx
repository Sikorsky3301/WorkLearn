import { useState } from 'react'
import {
  AlertTriangle, CheckCircle2, ClipboardCheck, Zap, Target, Lightbulb,
  BookOpen, ChevronDown, Gauge, Briefcase,
} from 'lucide-react'

// The brief, kept beside the code rather than behind a tab.
//
// What you're building, the numbered instructions with the XP they're worth,
// and whatever the last run had to say.
//
// Hints and the worked solution deliberately are NOT here any more. Both moved
// into HelpDrawer, behind toolbar buttons: the rail is the thing you read
// while working, and a permanently-visible "reveal the answer" card at the
// bottom of it was both a standing distraction and a claim on space every
// task paid for whether or not anyone opened it.
//
// WHAT CHANGED: the rail used to show only the title, the objective and a
// bullet list. Every task already carries a full `config.explainer` — the
// situation, the concepts, a worked walkthrough, the grading contract and the
// mistakes — and the task page renders all of it. Opening the sandbox threw it
// away, so a student went from a page that explained the work to a panel that
// only listed it, at exactly the moment they had to actually do it.
//
// Now the rail renders that same content, in collapsible sections so the
// walkthrough is one scroll away rather than a wall. `Steps` is open by
// default because it is what you read while typing; everything else starts
// closed.

function FeedbackCallout({ result, isSubmit }) {
  if (!result) return null

  const score = result.score ?? 0
  const details = result.details || {}
  const failed = (result.checks || []).filter((c) => !c.pass)
  const errored = Boolean(details.stderr?.trim()) || details.error

  if (errored && score === 0) {
    return (
      <div className="rounded-xl bg-rose-50 p-4 ring-1 ring-rose-200">
        <p className="flex items-center gap-2 font-display text-sm font-extrabold text-rose-900">
          <AlertTriangle className="h-4 w-4" /> Your code didn&apos;t run
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-rose-800">
          Check the Errors tab for the full message — it usually points at the exact line.
        </p>
      </div>
    )
  }

  const passed = score >= 80
  return (
    <div className={`rounded-xl p-4 ring-1 ${passed ? 'bg-emerald-50 ring-emerald-200' : 'bg-amber-50 ring-amber-200'}`}>
      <p className={`flex items-center gap-2 font-display text-sm font-extrabold ${passed ? 'text-emerald-900' : 'text-amber-900'}`}>
        {passed ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
        {passed ? 'Looking good' : 'Not quite there'} — {score}/100
      </p>
      {!isSubmit && (
        <p className={`mt-1 text-xs font-semibold ${passed ? 'text-emerald-700' : 'text-amber-700'}`}>
          Trial run — nothing recorded yet.
        </p>
      )}
      {failed.length > 0 && (
        <ul className="mt-2.5 space-y-1.5">
          {failed.slice(0, 4).map((c, i) => (
            <li key={c.id ?? i} className={`flex gap-2 text-sm ${passed ? 'text-emerald-800' : 'text-amber-800'}`}>
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-50" />
              {c.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** A collapsible block. Closed by default — the rail shares the screen with
 *  the editor, so anything that is not being read should not be taking space. */
function Section({ icon: Icon, title, count, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-slate-200">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-6 py-4 text-left transition-colors hover:bg-slate-50"
      >
        <Icon className="h-4 w-4 shrink-0 text-primary" />
        <h2 className="flex-1 font-display text-sm font-extrabold uppercase tracking-wide text-on-surface">
          {title}
        </h2>
        {count != null && (
          <span className="text-[0.7rem] font-bold tabular-nums text-on-surface-variant">{count}</span>
        )}
        <ChevronDown className={`h-4 w-4 shrink-0 text-on-surface-variant transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-6 pb-5">{children}</div>}
    </div>
  )
}

function Code({ children }) {
  return (
    <pre className="mt-2 overflow-x-auto rounded-lg bg-[#0d1b2a] p-3 font-mono text-[0.72rem] leading-relaxed text-[#dbe3f4]">
      <code>{children}</code>
    </pre>
  )
}

/** The walkthrough. `plain` is always shown; `deeper` — the trade-off a senior
 *  analyst would name — sits behind a toggle so the beginner path stays short
 *  without the depth being deleted. */
function Step({ step, index }) {
  const [deep, setDeep] = useState(false)
  return (
    <li className="border-l-2 border-slate-200 pl-4">
      <p className="flex gap-2 text-sm font-bold text-on-surface">
        <span className="text-primary">{index + 1}.</span> {step.title}
      </p>
      {step.plain && (
        <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">{step.plain}</p>
      )}
      {step.code && <Code>{step.code}</Code>}
      {step.deeper && (
        <>
          <button
            onClick={() => setDeep((v) => !v)}
            aria-expanded={deep}
            className="mt-2 inline-flex items-center gap-1 text-[0.72rem] font-bold uppercase tracking-wide text-indigo-700 transition-colors hover:text-indigo-900"
          >
            {deep ? 'Hide' : 'Why it works this way'}
            <ChevronDown className={`h-3 w-3 transition-transform ${deep ? 'rotate-180' : ''}`} />
          </button>
          {deep && (
            <p className="mt-1.5 rounded-lg bg-indigo-50 p-3 text-[0.8rem] leading-relaxed text-indigo-950">
              {step.deeper}
            </p>
          )}
        </>
      )}
    </li>
  )
}


export default function ExerciseRail({ task, sectionLabel, result, isSubmit }) {
  const explainer = task.config?.explainer
  return (
    <div className="flex h-full flex-col overflow-y-auto bg-white">
      <div className="border-b border-slate-200 px-6 py-5">
        <p className="text-[0.65rem] font-bold uppercase tracking-wider text-primary">
          {sectionLabel ? `${sectionLabel} · ` : ''}Exercise
        </p>
        <h1 className="mt-1 font-display text-xl font-extrabold leading-snug text-on-surface">{task.title}</h1>
        {task.objective && (
          <p className="mt-2.5 text-sm leading-relaxed text-on-surface-variant">{task.objective}</p>
        )}
        {/* What you are actually producing. The single most useful sentence to
            have visible while writing the code, so it sits in the header
            rather than behind a toggle. */}
        {explainer?.outcome && (
          <div className="mt-3 rounded-lg border border-primary/15 bg-primary/[0.04] p-3">
            <p className="mb-1 flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-primary">
              <Target className="h-3 w-3" /> What you&apos;re producing
            </p>
            <p className="text-[0.8rem] leading-relaxed text-on-surface">{explainer.outcome}</p>
          </div>
        )}
      </div>

      {explainer?.situation && (
        <Section icon={Briefcase} title="The situation">
          <p className="text-sm leading-relaxed text-on-surface-variant">{explainer.situation}</p>
          {task.briefing && (
            <p className="mt-3 border-l-2 border-primary/30 pl-3 text-sm italic leading-relaxed text-on-surface-variant">
              {task.briefing}
            </p>
          )}
        </Section>
      )}

      {explainer?.concepts?.length > 0 && (
        <Section icon={BookOpen} title="Key ideas" count={explainer.concepts.length}>
          <dl className="space-y-3">
            {explainer.concepts.map((c) => (
              <div key={c.term}>
                <dt className="text-sm font-bold text-on-surface">{c.term}</dt>
                {c.plain && <dd className="mt-0.5 text-sm leading-relaxed text-on-surface-variant">{c.plain}</dd>}
                {/* `why` is the half that makes the definition stick, so it is
                    shown, not hidden — it is one line. */}
                {c.why && <dd className="mt-1 text-[0.78rem] leading-relaxed text-on-surface-variant/80">{c.why}</dd>}
              </div>
            ))}
          </dl>
        </Section>
      )}

      {explainer?.steps?.length > 0 && (
        <Section icon={ClipboardCheck} title="How to do it" count={explainer.steps.length} defaultOpen>
          <ol className="space-y-5">
            {explainer.steps.map((step, i) => <Step key={i} step={step} index={i} />)}
          </ol>
        </Section>
      )}

      {explainer?.contract?.length > 0 && (
        <Section icon={Gauge} title="What the grader checks" count={explainer.contract.length}>
          <ul className="space-y-2">
            {explainer.contract.map((item) => (
              <li key={item.name} className="rounded-lg border border-slate-200 p-2.5">
                <p className="text-[0.8rem] font-bold text-on-surface">{item.name}</p>
                {item.must && (
                  <p className="mt-0.5 text-[0.78rem] leading-relaxed text-on-surface-variant">{item.must}</p>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {explainer?.mistakes?.length > 0 && (
        <Section icon={Lightbulb} title="Common mistakes" count={explainer.mistakes.length}>
          <ul className="space-y-2">
            {explainer.mistakes.map((m, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed text-on-surface-variant">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                {m}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {task.what_to_do?.length > 0 && (
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-display text-sm font-extrabold uppercase tracking-wide text-on-surface">
              Instructions
            </h2>
            {task.xp_award > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-[0.65rem] font-bold text-amber-800">
                <Zap className="h-3 w-3" /> {task.xp_award} XP
              </span>
            )}
          </div>
          <ol className="space-y-3">
            {task.what_to_do.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed text-on-surface">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-low font-mono text-[0.65rem] font-bold text-primary">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}

      {result && (
        <div className="border-b border-slate-200 px-6 py-5">
          <FeedbackCallout result={result} isSubmit={isSubmit} />
        </div>
      )}

      {task.what_to_submit?.length > 0 && (
        <div className="px-6 py-5">
          <h2 className="mb-2.5 flex items-center gap-2 font-display text-sm font-extrabold uppercase tracking-wide text-on-surface">
            <ClipboardCheck className="h-4 w-4 text-primary" /> What to submit
          </h2>
          <ul className="space-y-1.5">
            {task.what_to_submit.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed text-on-surface-variant">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
