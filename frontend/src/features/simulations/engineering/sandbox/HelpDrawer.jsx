import { useState } from 'react'
import { X, Lightbulb, BookOpen, Copy, Check } from 'lucide-react'

// Hints and the worked solution, on request.
//
// These used to sit at the bottom of the exercise rail — the solution behind a
// "Reveal model solution / open only after your own attempt" card that was
// permanently in view. Two problems with that: it took up rail space on every
// task whether or not anyone wanted it, and a reveal button parked under the
// brief is an advertisement for the answer at exactly the moment someone is
// deciding whether to keep trying.
//
// Behind a toolbar button it costs nothing until asked for, and asking is a
// deliberate act rather than a scroll away. Hints still come one at a time, so
// the first nudge doesn't hand over the last one.

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      className="inline-flex items-center gap-1.5 rounded-full border border-slate-600 px-2.5 py-1 text-[0.7rem] font-semibold text-slate-300 transition-colors hover:bg-slate-800"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function Code({ children }) {
  return (
    <pre className="mt-2 overflow-x-auto rounded-lg border border-slate-700 bg-slate-950 p-3 font-mono text-[0.75rem] leading-relaxed text-slate-200">
      <code>{children}</code>
    </pre>
  )
}

export default function HelpDrawer({ open, tab, onTab, onClose, task }) {
  // One hint at a time, and the count persists while the drawer is closed so
  // reopening doesn't re-hide what you already read.
  const [hintsShown, setHintsShown] = useState(0)
  const [solutionRevealed, setSolutionRevealed] = useState(false)

  if (!open) return null

  const hints = task.hints || []
  const solution = task.model_solution
  const hasSolution = Boolean(solution?.steps?.length || solution?.example_solution)

  return (
    <aside className="absolute inset-y-0 right-0 z-20 flex w-full max-w-md flex-col border-l border-slate-700 bg-slate-900 shadow-2xl">
      <header className="flex shrink-0 items-center gap-1 border-b border-slate-700 px-2 py-2">
        <button
          onClick={() => onTab('hints')}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
            tab === 'hints' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Lightbulb className="h-3.5 w-3.5" /> Hints
          {hints.length > 0 && <span className="tabular-nums opacity-60">{hints.length}</span>}
        </button>
        <button
          onClick={() => onTab('solution')}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
            tab === 'solution' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <BookOpen className="h-3.5 w-3.5" /> Solution
        </button>
        <button
          onClick={onClose}
          aria-label="Close"
          className="ml-auto rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {tab === 'hints' && (
          hints.length === 0 ? (
            <p className="text-sm text-slate-400">There are no hints for this task.</p>
          ) : (
            <>
              <ul className="space-y-2.5">
                {hints.slice(0, hintsShown).map((h, i) => (
                  <li key={i} className="flex gap-2.5 rounded-lg bg-amber-500/10 p-3 text-sm leading-relaxed text-amber-100 ring-1 ring-amber-500/20">
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                    {h}
                  </li>
                ))}
              </ul>
              {hintsShown < hints.length ? (
                <button
                  onClick={() => setHintsShown((n) => n + 1)}
                  className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-500/40 px-4 py-2 text-sm font-semibold text-amber-300 transition-colors hover:bg-amber-500/10"
                >
                  <Lightbulb className="h-4 w-4" />
                  {hintsShown === 0 ? 'Take a hint' : `Next hint (${hintsShown + 1} of ${hints.length})`}
                </button>
              ) : (
                <p className="mt-3 text-xs text-slate-500">That&apos;s every hint for this task.</p>
              )}
            </>
          )
        )}

        {tab === 'solution' && (
          !hasSolution ? (
            <p className="text-sm text-slate-400">There is no worked solution for this task.</p>
          ) : !solutionRevealed ? (
            <div className="rounded-xl border border-dashed border-emerald-500/40 bg-emerald-500/[0.06] p-5 text-center">
              <BookOpen className="mx-auto h-6 w-6 text-emerald-400" />
              <p className="mt-3 text-sm font-bold text-slate-100">Have a real attempt first</p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                Reading the answer before you&apos;ve been stuck on it is the fastest way to feel like
                you understood something you can&apos;t yet do. Run your code, see what fails, then
                come back.
              </p>
              <button
                onClick={() => setSolutionRevealed(true)}
                className="mt-4 rounded-full bg-emerald-500 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-emerald-600"
              >
                Show me the solution
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {solution.key_principle && (
                <p className="border-l-2 border-emerald-500 pl-3 text-sm leading-relaxed text-slate-300">
                  {solution.key_principle}
                </p>
              )}

              {solution.steps?.map((step, i) => (
                <div key={i}>
                  <h3 className="font-display text-sm font-extrabold text-slate-100">
                    {i + 1}. {step.title}
                  </h3>
                  {step.detail && (
                    <p className="mt-1 text-sm leading-relaxed text-slate-400">{step.detail}</p>
                  )}
                  {step.example && <Code>{step.example}</Code>}
                </div>
              ))}

              {solution.example_solution && (
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-display text-sm font-extrabold text-slate-100">
                      The whole thing
                    </h3>
                    <CopyButton text={solution.example_solution} />
                  </div>
                  <Code>{solution.example_solution}</Code>
                </div>
              )}

              {solution.great_looks_like && (
                <p className="rounded-lg bg-slate-800 p-3 text-sm leading-relaxed text-slate-300">
                  <span className="font-bold text-slate-100">What great looks like: </span>
                  {solution.great_looks_like}
                </p>
              )}
            </div>
          )
        )}
      </div>
    </aside>
  )
}
