import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import {
  ArrowLeft, Play, Loader2, RotateCcw, Terminal, AlertTriangle, Clock,
} from 'lucide-react'
import { useSandbox, useRunSandbox } from '../../hooks'
import { defineWorkLearnThemes } from '../simulations/shared/monacoThemes'

// A scratch editor over one practice container.
//
// Deliberately much smaller than SandboxWorkbenchPage: there is no task, no
// grader, no checks panel, no AI assistant, no assessment gate and nothing is
// persisted. Reusing the graded workbench here would have meant threading
// "there is no task" through every one of those, and the result would be a
// worse version of both.
//
// What it does share is the container — the same image, the same
// --network=none, the same caps. See playground.py.

const BOOT_MS = 1400

const MONACO_LANGUAGE = {
  python: 'python',
  javascript: 'javascript',
  jsx: 'javascript',
  sql: 'sql',
}

export default function SandboxPlayground() {
  const { key } = useParams()
  const navigate = useNavigate()
  const { data: sandbox, isLoading, isError } = useSandbox(key)
  const run = useRunSandbox()

  const [code, setCode] = useState('')
  const [dirty, setDirty] = useState(false)
  // A short deliberate beat on open.
  //
  // The catalogue query is cached for 30 minutes, so arriving here from the
  // card is usually instant and the bare spinner flashed for one frame or not
  // at all — the page simply appeared, which reads as a glitch rather than a
  // transition. Monaco genuinely does take a moment to mount, so this covers
  // real work; the timer only guarantees the screen is readable rather than
  // subliminal.
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setBooting(false), BOOT_MS)
    return () => clearTimeout(t)
  }, [key])

  // Seed the editor once the starter arrives, but never clobber something the
  // student has already typed — a refetch mid-edit would otherwise wipe it.
  useEffect(() => {
    if (sandbox?.starter && !dirty) setCode(sandbox.starter)
  }, [sandbox, dirty])

  if (isLoading || booting) {
    return <BootScreen sandbox={sandbox} />
  }
  if (isError || !sandbox) {
    return (
      <Centered>
        <div className="text-center">
          <p className="mb-4 text-sm text-on-surface-variant">That sandbox doesn&apos;t exist.</p>
          <button onClick={() => navigate('/sandboxes')} className="btn-primary text-sm">
            Back to sandboxes
          </button>
        </div>
      </Centered>
    )
  }

  const result = run.data
  const failed = run.isError
  const errorText = failed ? (run.error?.message || 'The sandbox could not run that.') : ''

  return (
    <div className="mx-auto max-w-container px-6 py-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <button
            onClick={() => navigate('/sandboxes')}
            className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant transition-colors hover:text-on-surface"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All sandboxes
          </button>
          <h1 className="truncate text-xl font-bold text-on-surface">{sandbox.name}</h1>
          <p className="text-xs text-on-surface-variant">
            {sandbox.runtime} · runs as <code className="font-mono">{sandbox.filename}</code> · nothing is saved or graded
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => { setCode(sandbox.starter); setDirty(false); run.reset() }}
            title="Reset to the starter"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold text-on-surface-variant transition-colors hover:text-on-surface"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
          <button
            onClick={() => run.mutate({ sandbox: sandbox.key, code })}
            disabled={run.isPending || !code.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-on-surface px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-on-surface/90 disabled:opacity-40"
          >
            {run.isPending
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Running…</>
              : <><Play className="h-4 w-4" /> Run</>}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* `min-w-0` — without it the flex/grid child refuses to shrink and the
            editor pushes the output pane off screen. Same trap the graded
            workbench hit. */}
        <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-white">
          <div className="border-b border-border px-4 py-2 text-xs font-semibold text-on-surface-variant">
            {sandbox.filename}
          </div>
          <Editor
            height="60vh"
            language={MONACO_LANGUAGE[sandbox.language] ?? 'plaintext'}
            theme="worklearn-light"
            beforeMount={defineWorkLearnThemes}
            value={code}
            onChange={(v) => { setCode(v ?? ''); setDirty(true) }}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              scrollBeyondLastLine: false,
              padding: { top: 12 },
              tabSize: 2,
            }}
          />
        </div>

        <div className="min-w-0 flex flex-col overflow-hidden rounded-xl border border-border bg-white">
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant">
              <Terminal className="h-3.5 w-3.5" /> Output
            </span>
            {result?.timed_out && (
              <span className="flex items-center gap-1 text-xs font-semibold text-amber-600">
                <Clock className="h-3.5 w-3.5" /> Timed out at {result.timeout_seconds}s
              </span>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-auto p-4" style={{ height: '60vh' }}>
            {run.isPending && (
              <p className="flex items-center gap-2 text-sm text-on-surface-variant">
                <Loader2 className="h-4 w-4 animate-spin" /> Starting the container…
              </p>
            )}

            {failed && (
              <div className="flex gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                <p className="text-sm leading-relaxed text-rose-800">{errorText}</p>
              </div>
            )}

            {!run.isPending && !failed && !result && (
              <p className="text-sm text-on-surface-variant">
                Press Run. Whatever your code prints appears here.
              </p>
            )}

            {result && (
              <>
                {result.stdout && (
                  <pre className="whitespace-pre-wrap break-words font-mono text-[0.8rem] leading-relaxed text-on-surface">
                    {result.stdout}
                  </pre>
                )}
                {/* stderr is not automatically a failure — Jest reports PASS
                    there, and Python warnings land there too. It is shown
                    plainly rather than dressed as an error. */}
                {result.stderr && (
                  <pre className="mt-3 whitespace-pre-wrap break-words border-t border-border pt-3 font-mono text-[0.8rem] leading-relaxed text-on-surface-variant">
                    {result.stderr}
                  </pre>
                )}
                {!result.stdout && !result.stderr && (
                  <p className="text-sm text-on-surface-variant">
                    Ran without printing anything.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-on-surface-variant">
        No network access · {result?.timeout_seconds ?? 20}s limit · nothing here is saved or counts towards a score
      </p>
    </div>
  )
}

function Centered({ children }) {
  return <div className="flex min-h-[60vh] items-center justify-center">{children}</div>
}

/** Opening screen. Shows the sandbox being opened rather than a bare spinner,
 *  so the wait names what is happening instead of just occupying it. */
function BootScreen({ sandbox }) {
  return (
    <Centered>
      <div className="flex flex-col items-center text-center">
        {sandbox?.logo && (
          <img src={sandbox.logo} alt="" className="mb-5 h-14 w-auto max-w-[6rem] object-contain animate-pulse" />
        )}
        <p className="text-sm font-bold text-on-surface">
          {sandbox ? `Opening the ${sandbox.name} sandbox` : 'Opening sandbox'}
        </p>
        <p className="mt-1 text-xs text-on-surface-variant">
          {sandbox?.runtime ? `Starting ${sandbox.runtime}` : 'Preparing your environment'}
        </p>
        <span className="mt-5 h-0.5 w-40 overflow-hidden rounded-full bg-surface-high">
          <span className="block h-full w-1/3 animate-[boot_1.4s_ease-in-out_infinite] rounded-full bg-primary" />
        </span>
      </div>
    </Centered>
  )
}
