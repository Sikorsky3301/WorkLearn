import { useState } from 'react'
import {
  ChevronDown, AlertTriangle, BookOpen, ListChecks, ExternalLink, Flag,
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
// ── THE ORDER THE PAGE STATES ──────────────────────────────────────────────
//
//   1. THE BRIEF      what this is and what finished looks like. Always open.
//   2. THE STEPS      the spine of the page. Always open, numbered, the only
//                     section with code in it.
//   3. REFERENCE      concepts, the grading contract, mistakes, further
//                     reading — collapsed, labelled, one line each. These are
//                     things you consult, not things you read start to finish,
//                     and the count on each header says whether it's worth
//                     opening.
//
// ── WHY THE CHROME CHANGED ─────────────────────────────────────────────────
//
// The order above is unchanged and none of the content moved. What changed is
// that the sections used to be separated by nothing but a hairline rule and a
// small-caps label, on a white page, in near-black text. Correct, and cold:
// with seven steps it read as one undifferentiated column and you lost your
// place in it constantly.
//
// So each step is now a row you can see the edges of, the numeral sits in a
// tinted disc rather than floating grey in the margin, and "what finished
// looks like" is a card instead of a left rule. Same information, same order,
// but the page has a rhythm you can scroll against.

/** A section heading: a numeral, a name, and the count. */
function SectionLabel({ step, children, hint }) {
  return (
    <div className="mb-5">
      <h2 className="flex items-center gap-2.5 font-display text-[1.05rem] font-extrabold text-on-surface">
        {step && (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[0.7rem] font-extrabold tabular-nums text-primary">
            {step}
          </span>
        )}
        {children}
      </h2>
      {hint && (
        <p className="mt-1.5 text-[0.82rem] leading-relaxed text-on-surface-variant/80">{hint}</p>
      )}
    </div>
  )
}

function Code({ children }) {
  return (
    <pre className="mt-3 overflow-x-auto rounded-xl bg-[#0d1b2a] p-4 font-mono text-[0.76rem] leading-relaxed text-[#dbe3f4]">
      <code>{children}</code>
    </pre>
  )
}

/** The advanced layer. Collapsed so the beginner path stays short, but
 *  labelled clearly enough that somebody looking for depth finds it. */
function Deeper({ children }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-md text-[0.75rem] font-bold text-primary transition-colors hover:text-primary-dark"
      >
        {open ? 'Hide' : 'Why it works this way'}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <p className="mt-2.5 rounded-lg bg-surface-low px-4 py-3 text-[0.88rem] leading-relaxed text-on-surface-variant">
          {children}
        </p>
      )}
    </div>
  )
}

/** A collapsed reference block. The count in the header is the whole point:
 *  it lets somebody decide whether to open it without opening it. */
function Reference({ icon: Icon, title, count, children }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center gap-3 py-3.5 text-left transition-colors hover:text-primary"
      >
        <Icon className="h-4 w-4 shrink-0 text-on-surface-variant" />
        <span className="flex-1 text-[0.9rem] font-semibold text-on-surface">{title}</span>
        {count != null && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-surface-low px-1.5 text-[0.7rem] font-bold tabular-nums text-on-surface-variant">
            {count}
          </span>
        )}
        <ChevronDown className={`h-4 w-4 shrink-0 text-on-surface-variant transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="pb-5">{children}</div>}
    </div>
  )
}

/** The reading path: the brief, then the steps. */
export default function TaskExplainer({ explainer }) {
  if (!explainer) return null
  const { situation, outcome, preview, steps } = explainer

  return (
    <div className="space-y-10">

      {/* ── 1 · The brief ───────────────────────────────────────────────── */}
      {(situation || outcome || preview) && (
        <section>
          <SectionLabel step="1">The brief</SectionLabel>

          {situation && (
            // Slightly larger than body text. This is the paragraph that makes
            // the rest make sense, so it reads first.
            <p className="text-[1.02rem] leading-[1.7] text-on-surface">{situation}</p>
          )}

          {outcome && (
            <div className="mt-5 rounded-xl border border-primary/15 bg-primary/[0.04] p-5">
              <p className="mb-2 flex items-center gap-2 text-[0.66rem] font-bold uppercase tracking-[0.16em] text-primary">
                <Flag className="h-3.5 w-3.5" /> What finished looks like
              </p>
              <p className="text-[1rem] leading-[1.6] text-on-surface">{outcome}</p>
            </div>
          )}

          {preview && (
            <pre className="mt-4 overflow-x-auto rounded-xl border border-border bg-surface-low/60 p-4 font-mono text-[0.72rem] leading-relaxed text-on-surface-variant sm:text-[0.76rem]">
              {preview}
            </pre>
          )}
        </section>
      )}

      {/* ── 2 · The steps ───────────────────────────────────────────────── */}
      {steps?.length > 0 && (
        <section>
          <SectionLabel step="2" hint="In order. The code shows the shape, not the answer.">
            How to build it · {steps.length} steps
          </SectionLabel>

          <ol className="space-y-3">
            {steps.map((step, i) => (
              <li
                key={i}
                className="rounded-xl border border-border bg-white p-5 transition-colors hover:border-outline-variant"
              >
                <div className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-display text-[0.78rem] font-extrabold tabular-nums text-primary">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 pt-1">
                    <h3 className="font-display text-[1.02rem] font-extrabold leading-snug text-on-surface">
                      {step.title}
                    </h3>
                    {step.plain && (
                      <p className="mt-1.5 text-[0.95rem] leading-relaxed text-on-surface-variant">
                        {step.plain}
                      </p>
                    )}
                    {step.code && <Code>{step.code}</Code>}
                    {step.deeper && <Deeper>{step.deeper}</Deeper>}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

    </div>
  )
}


/** Everything you CONSULT rather than read: the concepts, the grading
 *  contract, the mistakes, the further reading.
 *
 *  A separate export from the reading path above so the page can place it
 *  wherever it has room — today that is directly under the steps, as the third
 *  and last section, closed.
 */
export function TaskReference({ explainer, className = '' }) {
  if (!explainer) return null
  const { concepts, contract, mistakes, further } = explainer

  const hasAny =
    concepts?.length > 0 || contract?.length > 0 || mistakes?.length > 0 || further?.length > 0
  if (!hasAny) return null

  return (
    <section className={className}>
      <SectionLabel step="3" hint="Open what you need. Nothing here is required reading.">
        Reference
      </SectionLabel>

      <div className="rounded-xl border border-border bg-white px-5">
        {concepts?.length > 0 && (
          <Reference icon={BookOpen} title="New ideas in this task" count={concepts.length}>
            <dl className="space-y-4">
              {concepts.map((c) => (
                <div key={c.term}>
                  <dt className="font-display text-[0.92rem] font-extrabold text-on-surface">{c.term}</dt>
                  {c.plain && (
                    <dd className="mt-1 text-[0.9rem] leading-relaxed text-on-surface-variant">{c.plain}</dd>
                  )}
                  {c.why && (
                    <dd className="mt-1.5 border-l-2 border-primary/20 pl-3 text-[0.86rem] leading-relaxed text-on-surface-variant/85">
                      {c.why}
                    </dd>
                  )}
                </div>
              ))}
            </dl>
          </Reference>
        )}

        {contract?.length > 0 && (
          <Reference icon={ListChecks} title="Exact names your code must use" count={contract.length}>
            <ul className="space-y-2">
              {contract.map((item) => (
                <li key={item.name} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <code className="rounded bg-surface-low px-1.5 py-0.5 font-mono text-[0.78rem] font-semibold text-on-surface">
                    {item.name}
                  </code>
                  {item.must && (
                    <span className="text-[0.86rem] leading-relaxed text-on-surface-variant">{item.must}</span>
                  )}
                </li>
              ))}
            </ul>
          </Reference>
        )}

        {mistakes?.length > 0 && (
          <Reference icon={AlertTriangle} title="Where this usually goes wrong" count={mistakes.length}>
            <ul className="space-y-2.5">
              {mistakes.map((m, i) => (
                <li key={i} className="flex gap-2.5 text-[0.9rem] leading-relaxed text-on-surface-variant">
                  <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  {m}
                </li>
              ))}
            </ul>
          </Reference>
        )}

        {further?.length > 0 && (
          <Reference icon={ExternalLink} title="If you want to go further" count={further.length}>
            <ul className="space-y-2">
              {further.map((f, i) => (
                <li key={i} className="flex gap-2.5 text-[0.88rem] leading-relaxed text-on-surface-variant">
                  <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-on-surface-variant/40" />
                  {f}
                </li>
              ))}
            </ul>
          </Reference>
        )}
      </div>
    </section>
  )
}
