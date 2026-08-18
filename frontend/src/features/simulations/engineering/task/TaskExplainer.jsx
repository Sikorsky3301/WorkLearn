import { useState } from 'react'
import {
  Lightbulb, ListOrdered, Target, AlertTriangle, Rocket, Braces, ChevronDown, BookOpen,
} from 'lucide-react'

// The task content, written twice.
//
// Every step carries a `plain` explanation — written for someone who has never
// done this, using no vocabulary that hasn't been defined — and a `deeper` note
// holding the trade-off, the failure mode, or the reason it's done this way.
// Neither summarises the other. A beginner can read only the plain text and
// finish the task; an experienced developer can read only the deeper notes and
// still find something they didn't know.
//
// That's the whole design. The alternative — one middle-pitched explanation —
// bores one reader and loses the other, which is what a bare bullet list of
// requirements does today.

/** A titled box. Square corners; the title lives in its own green header. */
export function Card({ icon: Icon, title, hint, children, bodyClassName = 'p-5 sm:p-6' }) {
  return (
    <section className="border border-border bg-white">
      {title && (
        <header className="border-b border-emerald-200 bg-emerald-50 px-5 py-3.5 sm:px-6">
          <h2 className="flex items-center gap-2.5 font-display text-base font-extrabold text-emerald-900">
            {Icon && (
              <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-emerald-600 text-white">
                <Icon className="h-4 w-4" />
              </span>
            )}
            {title}
          </h2>
          {hint && <p className="mt-1.5 text-sm leading-relaxed text-emerald-800/80">{hint}</p>}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  )
}

function Code({ children }) {
  return (
    <pre className="mt-3 overflow-x-auto border border-[#1e2a44] bg-[#0d1b2a] p-4 font-mono text-[0.8rem] leading-relaxed text-[#dbe3f4]">
      <code>{children}</code>
    </pre>
  )
}

/** The advanced layer. Collapsed by default so the beginner path stays short,
 *  but labelled loudly enough that someone looking for depth finds it. */
function Deeper({ children }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-3 border border-indigo-200 bg-indigo-50/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left"
      >
        <BookOpen className="h-3.5 w-3.5 shrink-0 text-indigo-700" />
        <span className="text-[0.7rem] font-bold uppercase tracking-wider text-indigo-800">
          Going deeper
        </span>
        <ChevronDown
          className={`ml-auto h-4 w-4 shrink-0 text-indigo-700 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <p className="border-t border-indigo-200 px-4 py-3 text-[0.9rem] leading-relaxed text-indigo-950">
          {children}
        </p>
      )}
    </div>
  )
}

export default function TaskExplainer({ explainer }) {
  if (!explainer) return null
  const { situation, outcome, preview, concepts, steps, contract, mistakes, further } = explainer

  return (
    <>
      {(situation || outcome || preview) && (
        <Card icon={Target} title="Description">
          {situation && (
            <p className="text-[0.95rem] leading-relaxed text-on-surface">{situation}</p>
          )}
          {outcome && (
            <div className="mt-4 border-l-4 border-emerald-500 bg-emerald-50/60 py-3 pl-4">
              <p className="mb-1 text-[0.7rem] font-bold uppercase tracking-wider text-emerald-800">
                What finished looks like
              </p>
              <p className="text-[0.95rem] leading-relaxed text-on-surface">{outcome}</p>
            </div>
          )}
          {preview && (
            <pre className="mt-4 overflow-x-auto border border-border bg-surface-low/70 p-4 font-mono text-[0.72rem] leading-relaxed text-on-surface-variant sm:text-[0.78rem]">
              {preview}
            </pre>
          )}
        </Card>
      )}

      {concepts?.length > 0 && (
        <Card
          icon={Lightbulb}
          title="New ideas in this task"
          hint="Defined before they're used. Skip anything you already know."
        >
          <dl className="space-y-4">
            {concepts.map((c) => (
              <div key={c.term} className="border-l-2 border-primary/40 pl-4">
                <dt className="font-display text-[0.95rem] font-extrabold text-on-surface">{c.term}</dt>
                <dd className="mt-1 text-[0.92rem] leading-relaxed text-on-surface">{c.plain}</dd>
                {c.why && (
                  <dd className="mt-1.5 text-[0.88rem] leading-relaxed text-on-surface-variant">
                    <span className="font-semibold text-on-surface">Why it matters: </span>
                    {c.why}
                  </dd>
                )}
              </div>
            ))}
          </dl>
        </Card>
      )}

      {steps?.length > 0 && (
        <Card
          icon={ListOrdered}
          title="Build it, step by step"
          hint="Work through these in order. The code samples show the shape — they're not the answer."
        >
          <ol className="space-y-7">
            {steps.map((step, i) => (
              <li key={i}>
                <div className="flex gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-[1rem] font-extrabold leading-snug text-on-surface">
                      {step.title}
                    </h3>
                    {step.plain && (
                      <p className="mt-1.5 text-[0.95rem] leading-relaxed text-on-surface">{step.plain}</p>
                    )}
                    {step.code && <Code>{step.code}</Code>}
                    {step.deeper && <Deeper>{step.deeper}</Deeper>}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {contract?.length > 0 && (
        <Card
          icon={Braces}
          title="Exact names your code must use"
          hint="The automated checks look for these literally. A different name is a failed check, however good the code is."
        >
          <ul className="divide-y divide-border">
            {contract.map((item) => (
              <li key={item.name} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:gap-4">
                <code className="shrink-0 self-start bg-surface-low px-2 py-1 font-mono text-[0.8rem] font-bold text-primary sm:w-64">
                  {item.name}
                </code>
                <span className="text-[0.92rem] leading-relaxed text-on-surface-variant">{item.must}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {mistakes?.length > 0 && (
        <Card
          icon={AlertTriangle}
          title="Where this usually goes wrong"
          hint="Every one of these is a real mistake people make on this task."
        >
          <ul className="space-y-3">
            {mistakes.map((m, i) => (
              <li key={i} className="flex gap-3 text-[0.93rem] leading-relaxed text-on-surface">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                {m}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {further?.length > 0 && (
        <Card
          icon={Rocket}
          title="If you want to go further"
          hint="None of this is graded. It's what you'd reach for next if this task was easy."
        >
          <ul className="space-y-3">
            {further.map((f, i) => (
              <li key={i} className="flex gap-3 text-[0.93rem] leading-relaxed text-on-surface">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                {f}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  )
}
