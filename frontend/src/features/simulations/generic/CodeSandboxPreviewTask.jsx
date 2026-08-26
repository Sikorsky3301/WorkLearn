import { useEffect, useState } from 'react'
import Editor from '@monaco-editor/react'
import { Play, Loader2, CheckCircle2, XCircle, Info, RotateCcw } from 'lucide-react'
import { usePreviewRunSandbox } from '../../../hooks'

/** The builder's live preview of a code_sandbox task: a real editor, a real
 * container run, and the real grader.
 *
 * WHAT WAS BROKEN
 *
 * It refused every task that used a `registered_grader` — which is every task
 * in both shipped simulations — and showed an amber "requires a real
 * enrollment" panel instead. So the preview was unavailable on exactly the
 * tasks anyone wanted to preview, and an author had no way to check their
 * starter code, their filenames, or their grader wiring without enrolling as
 * a student and doing the task.
 *
 * The backend now runs all three grading paths (see preview_run_sandbox), so
 * this renders the result for whichever one the task uses. Preview-only
 * caveats come back as `details.preview_note` and are shown, rather than being
 * left for the author to misread as a broken task.
 *
 * Deliberately NOT the student workbench: that one is wired to
 * enrollment-scoped submit endpoints, and there is no enrollment here.
 */

const MONACO_LANGUAGE = {
  python: 'python',
  javascript: 'javascript',
  jsx: 'javascript',
  html: 'html',
  text: 'plaintext',
}

export default function CodeSandboxPreviewTask({ simId, task }) {
  const config = task.config || {}
  const textOnly = config.submission_mode === 'text'
  const [code, setCode] = useState(config.starter_code || '')
  const runPreview = usePreviewRunSandbox(simId, task.id)
  const [result, setResult] = useState(null)

  // The task's starter code is the natural thing to preview, so follow it when
  // the author edits it — but never overwrite what they have typed in here.
  const starter = config.starter_code || ''
  const [lastStarter, setLastStarter] = useState(starter)
  useEffect(() => {
    if (starter === lastStarter) return
    setLastStarter(starter)
    if (code === lastStarter) setCode(starter)
  }, [starter, lastStarter, code])

  function handleRun() {
    if (!code.trim() || runPreview.isPending) return
    setResult(null)
    runPreview.mutate(code, {
      onSuccess: (res) => setResult(res),
      onError: (e) => setResult({ error: e?.message || 'Could not run this submission right now.' }),
    })
  }

  const note = result?.details?.preview_note
  const stdout = result?.details?.stdout
  const stderr = result?.details?.stderr

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.72rem] text-outline">
          {textOnly
            ? 'Written answer — judged by the same grader a student’s goes to.'
            : `Runs in a real container. Your code is saved as ${config.input_filename || 'submission.py'}; the grader reads ${config.output_filename || 'output.json'}.`}
        </p>
        {code !== starter && starter && (
          <button
            onClick={() => setCode(starter)}
            title="Put the task's starter code back"
            className="inline-flex shrink-0 items-center gap-1 text-[0.72rem] font-semibold text-on-surface-variant hover:text-primary cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        {textOnly ? (
          <textarea
            rows={14}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Write the answer a student would submit, then run it past the judge."
            className="w-full resize-y bg-white p-3 text-sm leading-relaxed outline-none"
          />
        ) : (
          <Editor
            height="360px"
            language={MONACO_LANGUAGE[config.language] || 'plaintext'}
            value={code}
            onChange={(v) => setCode(v ?? '')}
            theme="light"
            options={{ minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false }}
          />
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleRun}
          disabled={!code.trim() || runPreview.isPending}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
        >
          {runPreview.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {runPreview.isPending ? 'Running…' : textOnly ? 'Grade this answer' : 'Run and grade'}
        </button>
      </div>

      {result && (
        <div className="space-y-3 rounded-lg border border-border p-4">
          {result.error ? (
            <p className="text-sm text-red-600">{result.error}</p>
          ) : (
            <>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-semibold text-on-surface">
                  Score: <span className="tabular-nums">{result.score}</span>/100
                </p>
                {result.details?.timed_out && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.68rem] font-bold text-amber-800">
                    Timed out
                  </span>
                )}
              </div>

              {note && (
                <p className="flex items-start gap-2 rounded-lg border border-border bg-surface-low px-3 py-2 text-[0.75rem] leading-relaxed text-on-surface-variant">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {note}
                </p>
              )}

              {(result.checks || []).length > 0 && (
                <ul className="space-y-1.5">
                  {result.checks.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      {c.pass ? (
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      ) : (
                        <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                      )}
                      <span className="text-on-surface-variant">
                        <span className="font-medium text-on-surface">{c.label}</span>
                        {c.detail ? ` — ${c.detail}` : ''}
                        {c.points != null && <span className="ml-1 tabular-nums text-outline">({c.points} pts)</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {/* stdout is shown for debugging and is never graded — same rule
                  as the student runtime: only the artifact is scored. */}
              {stdout?.trim() && (
                <details className="rounded border border-border bg-surface-low p-2">
                  <summary className="cursor-pointer text-[0.7rem] font-bold uppercase tracking-wide text-on-surface-variant">
                    Output
                  </summary>
                  <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-[11px] text-on-surface-variant">{stdout}</pre>
                </details>
              )}
              {stderr?.trim() && (
                <pre className="overflow-x-auto whitespace-pre-wrap rounded bg-surface-low p-2 text-[11px] text-red-600">{stderr}</pre>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
