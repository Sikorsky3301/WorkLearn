import { useState } from 'react'
import Editor from '@monaco-editor/react'
import { Play, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { usePreviewRunSandbox } from '../../../shared/api/hooks'

/** Preview-mode stand-in for CodeSandboxTask — deliberately does NOT reuse
 * JupyterPlayground/FrontendPlayground, since both are wired directly to
 * enrollment-scoped submit endpoints and there's no enrollment during admin
 * preview. Only supports the declarative_rules grading strategy (the only
 * one preview-run-sandbox exposes — registered_grader tasks require a real
 * enrollment, matching the builder's own existing warning about that path). */
export default function CodeSandboxPreviewTask({ simId, task }) {
  const config = task.config || {}
  const [code, setCode] = useState(config.starter_code || '')
  const runPreview = usePreviewRunSandbox(simId, task.id)
  const [result, setResult] = useState(null)

  const unsupported = config.grading_strategy !== 'declarative_rules'

  function handleRun() {
    if (!code.trim() || runPreview.isPending) return
    setResult(null)
    runPreview.mutate(code, {
      onSuccess: (res) => setResult(res),
      onError: (e) => setResult({ error: e?.message || 'Could not run this submission right now.' }),
    })
  }

  if (unsupported) {
    return (
      <div className="rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-sm px-4 py-3">
        Interactive preview only supports declarative-rules sandbox tasks — this task uses a
        registered developer grader, which requires a real enrollment to test.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border overflow-hidden">
        <Editor
          height="360px"
          language={config.language === 'python' ? 'python' : 'javascript'}
          value={code}
          onChange={(v) => setCode(v ?? '')}
          theme="light"
          options={{ minimap: { enabled: false }, fontSize: 13 }}
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleRun}
          disabled={!code.trim() || runPreview.isPending}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-primary hover:bg-primary-dark px-4 py-2 rounded-lg disabled:opacity-50 cursor-pointer"
        >
          {runPreview.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Run Preview
        </button>
      </div>

      {result && (
        <div className="rounded-lg border border-border p-4 space-y-3">
          {result.error ? (
            <p className="text-sm text-red-600">{result.error}</p>
          ) : (
            <>
              <p className="text-sm font-semibold text-on-surface">Score: {result.score}/100</p>
              <ul className="space-y-1.5">
                {(result.checks || []).map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    {c.pass ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                    )}
                    <span className="text-on-surface-variant">
                      <span className="font-medium text-on-surface">{c.label}</span>
                      {c.detail ? ` — ${c.detail}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
              {result.details?.stderr && (
                <pre className="text-[11px] bg-surface-low rounded p-2 overflow-x-auto text-red-600 whitespace-pre-wrap">{result.details.stderr}</pre>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
