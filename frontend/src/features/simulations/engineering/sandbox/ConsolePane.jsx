import { useState } from 'react'
import { Check, X, Eye, TerminalSquare, AlertTriangle, FlaskConical } from 'lucide-react'
import { extractErrors } from './sandboxOutput'

// The bottom half of the right column: what the grader saw.
//
// Tabs rather than one scrolling dump, because the three things a student wants
// after a run are different questions — "which checks failed", "what did my
// code print", "what broke". The Preview tab only exists for HTML tasks, where
// seeing the rendered page is the whole point.

function TabButton({ active, onClick, children, count, tone }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold transition-colors ${
        active ? 'text-white' : 'text-slate-400 hover:text-slate-200'
      }`}
    >
      {children}
      {count != null && (
        <span className={`rounded-full px-1.5 py-0.5 text-[0.65rem] tabular-nums ${
          tone === 'danger' ? 'bg-rose-500/20 text-rose-300'
            : tone === 'ok' ? 'bg-emerald-500/20 text-emerald-300'
              : 'bg-slate-700 text-slate-300'
        }`}>
          {count}
        </span>
      )}
      {active && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-indigo-400" />}
    </button>
  )
}

function Empty({ icon: Icon, title, hint }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      <Icon className="h-6 w-6 text-slate-600" />
      <p className="mt-2.5 text-sm font-bold text-slate-300">{title}</p>
      {hint && <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-500">{hint}</p>}
    </div>
  )
}

/** The results header — score, pass count, and a bar of one segment per check.
 *  A student's first question after a run is "how did I do", and reading that
 *  off a list of ticks means counting. */
function ResultsSummary({ checks, score }) {
  const passed = checks.filter((c) => c.pass).length
  const allPassed = passed === checks.length
  const pct = checks.length ? Math.round((passed / checks.length) * 100) : 0

  return (
    <div className="sticky top-0 z-10 border-b border-slate-700 bg-slate-900/95 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold tabular-nums ${
          allPassed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
        }`}>
          {score != null ? score : pct}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-100">
            {passed} of {checks.length} checks passed
          </p>
          <div className="mt-1.5 flex gap-1">
            {checks.map((c, i) => (
              <span
                key={c.id ?? i}
                title={c.label}
                className={`h-1.5 flex-1 rounded-full ${c.pass ? 'bg-emerald-400' : 'bg-rose-400/70'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ConsolePane({ result, previewHtml, canPreview }) {
  const checks = result?.checks || []
  const details = result?.details || {}
  const [tab, setTab] = useState(canPreview ? 'preview' : 'tests')

  // Jest's reporter output goes to stderr even when everything passes, so the
  // raw value is never a useful answer to "what broke". See sandboxOutput.js.
  const errors = extractErrors(details.stderr)
  const failed = checks.filter((c) => !c.pass).length

  return (
    <div className="flex h-full flex-col bg-slate-900">
      <div className="flex shrink-0 items-center gap-0.5 border-b border-slate-700 px-2">
        <TabButton
          active={tab === 'tests'}
          onClick={() => setTab('tests')}
          count={checks.length || null}
          tone={checks.length ? (failed ? 'danger' : 'ok') : undefined}
        >
          Tests
        </TabButton>
        <TabButton active={tab === 'output'} onClick={() => setTab('output')}>Output</TabButton>
        <TabButton
          active={tab === 'errors'}
          onClick={() => setTab('errors')}
          count={errors ? 1 : null}
          tone="danger"
        >
          Errors
        </TabButton>
        {canPreview && (
          <TabButton active={tab === 'preview'} onClick={() => setTab('preview')}>
            <span className="inline-flex items-center gap-1.5"><Eye className="h-3 w-3" /> Preview</span>
          </TabButton>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {tab === 'tests' && (
          checks.length === 0
            ? (
              <Empty
                icon={FlaskConical}
                title="No results yet"
                hint="Press Run code to see which checks pass. Nothing is recorded until you submit."
              />
            )
            : (
              <>
                <ResultsSummary checks={checks} score={result?.score} />
                <ul className="divide-y divide-slate-800/70">
                  {checks.map((c, i) => (
                    <li
                      key={c.id ?? i}
                      className={`flex items-start gap-3 border-l-2 px-4 py-3 ${
                        c.pass
                          ? 'border-l-emerald-500/60 bg-emerald-500/[0.03]'
                          : 'border-l-rose-500/70 bg-rose-500/[0.04]'
                      }`}
                    >
                      <span className={`mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${
                        c.pass ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {c.pass ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className={`block text-[0.8rem] font-semibold leading-relaxed ${
                          c.pass ? 'text-slate-300' : 'text-slate-100'
                        }`}>
                          {c.label}
                        </span>
                        {!c.pass && (
                          <span className="mt-0.5 block text-[0.7rem] text-rose-300/70">
                            Not passing yet
                          </span>
                        )}
                      </span>

                      {typeof c.points === 'number' && (
                        <span className={`shrink-0 rounded-md px-2 py-1 font-mono text-[0.7rem] font-bold tabular-nums ${
                          c.pass ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-800 text-slate-500'
                        }`}>
                          {c.pass ? `+${c.points}` : `0/${c.points}`}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )
        )}

        {tab === 'output' && (
          details.stdout?.trim()
            ? <pre className="whitespace-pre-wrap px-4 py-3 font-mono text-xs leading-relaxed text-slate-200">{details.stdout}</pre>
            : (
              <Empty
                icon={TerminalSquare}
                title="Nothing printed"
                hint="Anything your code logs with console.log shows up here."
              />
            )
        )}

        {tab === 'errors' && (
          errors
            ? <pre className="whitespace-pre-wrap px-4 py-3 font-mono text-xs leading-relaxed text-rose-300">{errors}</pre>
            : (
              <Empty
                icon={AlertTriangle}
                title="No errors"
                hint={checks.length && failed
                  ? 'Your code ran without crashing — the failing checks are in the Tests tab.'
                  : 'Your code ran without crashing.'}
              />
            )
        )}

        {tab === 'preview' && canPreview && (
          <iframe
            title="Live preview"
            // `allow-scripts` only — no `allow-same-origin`, so student code
            // cannot reach this origin's cookies, storage or DOM. The two
            // together would defeat the sandbox entirely.
            sandbox="allow-scripts"
            srcDoc={previewHtml}
            className="h-full min-h-[12rem] w-full border-0 bg-white"
          />
        )}
      </div>
    </div>
  )
}
