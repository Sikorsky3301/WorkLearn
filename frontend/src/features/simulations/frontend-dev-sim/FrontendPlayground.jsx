import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Editor from '@monaco-editor/react'
import { useSubmitSandbox } from '../../../hooks'
import { defineWorkLearnTheme } from '../shared/monacoThemes'

const MIN_HEIGHT = 280
const MAX_HEIGHT = 900
const DEFAULT_HEIGHT = 480
const STARTUP_DELAY_MS = 900

function ExpandIcon(props) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M3 16v3a2 2 0 0 0 2 2h3" />
    </svg>
  )
}
function CollapseIcon(props) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M8 3v3a2 2 0 0 1-2 2H3M16 3v3a2 2 0 0 0 2 2h3M21 16h-3a2 2 0 0 0-2 2v3M3 16h3a2 2 0 0 1 2 2v3" />
    </svg>
  )
}
function PlayIcon(props) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}
function ContainerBadgeIcon(props) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}
function EyeIcon(props) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" /><circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export default function FrontendPlayground({
  starterCode, enrollmentId, taskId, submissionFilename, language, showPreview = false, onGraded,
}) {
  const [started, setStarted] = useState(false)
  const [starting, setStarting] = useState(false)
  const [code, setCode] = useState(starterCode)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [editorHeight, setEditorHeight] = useState(DEFAULT_HEIGHT)
  const [lastRanDry, setLastRanDry] = useState(false)
  const [previewOn, setPreviewOn] = useState(showPreview)
  const resizingRef = useRef(false)

  const submitSandbox = useSubmitSandbox(enrollmentId, taskId)

  // Reset the editor's local state whenever the active task changes (the
  // component is re-keyed by taskId from the parent, but state persists
  // across a starterCode prop change unless we watch it explicitly).
  useEffect(() => { setCode(starterCode) }, [starterCode])
  useEffect(() => { setPreviewOn(showPreview) }, [showPreview])

  const execute = useCallback(async (dryRun) => {
    if (!enrollmentId || submitSandbox.isPending) return
    try {
      setLastRanDry(dryRun)
      const result = await submitSandbox.mutateAsync({ code, dry_run: dryRun })
      onGraded?.(result, { isSubmit: !dryRun })
    } catch { /* surfaced via submitSandbox.isError below */ }
  }, [code, enrollmentId, submitSandbox, onGraded])

  const handleRun = useCallback(() => execute(true), [execute])
  const handleSubmit = useCallback(() => execute(false), [execute])

  const handleSubmitRef = useRef(handleSubmit)
  useEffect(() => { handleSubmitRef.current = handleSubmit }, [handleSubmit])

  function handleEditorMount(editor, monaco) {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => handleSubmitRef.current())
  }

  const handleStart = () => {
    setStarting(true)
    setTimeout(() => {
      setStarting(false)
      setStarted(true)
    }, STARTUP_DELAY_MS)
  }

  useEffect(() => {
    if (!isFullscreen) return
    const onKey = (e) => { if (e.key === 'Escape') setIsFullscreen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isFullscreen])

  const startResize = (e) => {
    e.preventDefault()
    resizingRef.current = true
    const startY = e.clientY
    const startHeight = editorHeight
    const onMove = (moveEvent) => {
      if (!resizingRef.current) return
      const delta = moveEvent.clientY - startY
      setEditorHeight(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, startHeight + delta)))
    }
    const onUp = () => {
      resizingRef.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  if (!started) {
    return (
      <div className="rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3 bg-surface-low border-b border-border">
          <div className="flex gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
          </div>
          <span className="font-mono text-sm text-on-surface-variant">{submissionFilename}</span>
        </div>
        <div className="bg-white px-8 py-16 text-center">
          <div className={`w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-5 transition-transform duration-500 ${starting ? 'scale-90 animate-pulse' : 'scale-100'}`}>
            <ContainerBadgeIcon />
          </div>
          <p className="text-base font-semibold text-on-surface mb-1.5">
            {starting ? 'Spinning up your sandbox…' : 'Ready when you are'}
          </p>
          <p className="text-sm text-on-surface-variant mb-7 max-w-[300px] mx-auto leading-relaxed">
            {starting
              ? 'Provisioning an isolated container with Node.js and Jest pre-installed.'
              : 'Runs in an isolated Docker container — Node.js, Jest, and React Testing Library pre-installed, network disabled.'}
          </p>
          <button
            onClick={handleStart}
            disabled={starting}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 active:scale-95 disabled:opacity-70 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-all cursor-pointer shadow-sm"
          >
            {starting ? (
              <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />Starting…</>
            ) : (
              <><PlayIcon /> Start Sandbox</>
            )}
          </button>
        </div>
      </div>
    )
  }

  const content = (
    <div className={
      isFullscreen
        ? 'fixed inset-0 z-[100] flex flex-col bg-white'
        : 'rounded-xl border border-border overflow-hidden shadow-sm flex flex-col h-full animate-[fadeIn_0.35s_ease]'
    }>
      {/* File tab bar */}
      <div className="flex items-center bg-surface-low border-b border-border shrink-0">
        <div className="flex items-center gap-2 px-4 py-3 bg-white border-r border-border border-t-2 border-t-primary">
          <span className="font-mono text-sm text-on-surface">{submissionFilename}</span>
        </div>
        <span className="flex-1" />
        <span className="hidden md:flex items-center gap-1.5 text-xs text-on-surface-variant px-3 shrink-0">
          Node.js · Jest
        </span>
        {showPreview && (
          <button
            onClick={() => setPreviewOn(p => !p)}
            title="Toggle live preview"
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 mr-1 rounded-lg transition-colors shrink-0 cursor-pointer ${previewOn ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface-high'}`}
          >
            <EyeIcon /> Preview
          </button>
        )}
        <button
          onClick={() => setCode(starterCode)}
          className="text-xs font-medium text-on-surface-variant hover:text-on-surface transition-colors px-2.5 py-1 mr-1 rounded hover:bg-surface-high shrink-0 cursor-pointer"
        >
          Reset
        </button>
        <button
          onClick={() => setIsFullscreen(f => !f)}
          title={isFullscreen ? 'Exit full screen (Esc)' : 'Full screen'}
          className="text-on-surface-variant hover:text-on-surface transition-colors p-1.5 mr-2 rounded hover:bg-surface-high shrink-0 cursor-pointer"
        >
          {isFullscreen ? <CollapseIcon /> : <ExpandIcon />}
        </button>
      </div>

      {/* Status banners */}
      {submitSandbox.isPending && (
        <div className="px-4 py-2.5 bg-blue-50 flex items-center gap-2.5 text-sm text-blue-700 border-b border-blue-100 shrink-0">
          <span className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
          {lastRanDry ? 'Running your code against the hidden tests…' : 'Submitting for grading…'}
        </div>
      )}
      {submitSandbox.isError && (
        <div className="px-4 py-2.5 bg-red-50 text-sm text-red-700 border-b border-red-100 shrink-0 animate-[fadeIn_0.2s_ease]">
          ⚠ {submitSandbox.error?.message || 'Could not run this submission. Please try again.'}
        </div>
      )}

      {/* Editor (+ optional live preview) */}
      <div style={isFullscreen ? undefined : { height: editorHeight }} className={isFullscreen ? 'flex-1 min-h-0 flex' : 'flex'}>
        <div className={previewOn ? 'w-1/2 border-r border-border' : 'w-full'}>
          <Editor
            height="100%"
            language={language}
            theme="worklearn-light"
            value={code}
            onChange={(v) => setCode(v ?? '')}
            beforeMount={defineWorkLearnTheme}
            onMount={handleEditorMount}
            loading={<div className="w-full h-full bg-white flex items-center justify-center text-sm text-on-surface-variant">Loading editor…</div>}
            options={{
              fontSize: 14.5,
              fontFamily: "'SF Mono', Monaco, Consolas, 'Courier New', monospace",
              fontLigatures: true,
              lineHeight: 24,
              minimap: { enabled: isFullscreen },
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              renderLineHighlight: 'gutter',
              tabSize: 2,
              wordWrap: 'on',
              padding: { top: 18, bottom: 18 },
              automaticLayout: true,
              bracketPairColorization: { enabled: true },
            }}
          />
        </div>
        {previewOn && (
          <div className="w-1/2 flex flex-col bg-white">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-low border-b border-border shrink-0">
              <span className="w-2 h-2 rounded-full bg-red-400/60" />
              <span className="w-2 h-2 rounded-full bg-yellow-400/60" />
              <span className="w-2 h-2 rounded-full bg-green-400/60" />
              <span className="text-[11px] text-on-surface-variant ml-1.5">Live preview</span>
            </div>
            <iframe
              title="Live preview"
              sandbox="allow-scripts"
              srcDoc={code}
              className="flex-1 min-h-0 w-full"
            />
          </div>
        )}
      </div>

      {/* Drag-to-resize handle (normal mode only) */}
      {!isFullscreen && (
        <div
          onMouseDown={startResize}
          title="Drag to resize"
          className="h-2.5 bg-surface-low hover:bg-primary/10 active:bg-primary/20 cursor-ns-resize flex items-center justify-center border-t border-border transition-colors group shrink-0"
        >
          <div className="w-8 h-0.5 bg-outline-variant group-hover:bg-primary/60 rounded-full transition-colors" />
        </div>
      )}

      {/* Run + Submit — bottom action bar */}
      <div className="flex items-center gap-2.5 px-4 py-3.5 bg-white border-t border-border shrink-0">
        <button
          onClick={handleRun}
          disabled={!enrollmentId || submitSandbox.isPending}
          className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold px-3 py-2.5 rounded-lg transition-all bg-surface-low text-on-surface border border-border hover:bg-surface-high active:scale-[0.98] disabled:opacity-50 cursor-pointer"
        >
          {submitSandbox.isPending && lastRanDry ? (
            <><span className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />Running…</>
          ) : (
            <><PlayIcon width={13} height={13} /> Run</>
          )}
        </button>
        <button
          onClick={handleSubmit}
          disabled={!enrollmentId || submitSandbox.isPending}
          className="flex-[2] flex items-center justify-center gap-1.5 text-sm font-semibold px-3 py-2.5 rounded-lg transition-all bg-green-600 text-white hover:bg-green-500 active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-sm"
        >
          {submitSandbox.isPending && !lastRanDry ? (
            <><span className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />Grading…</>
          ) : (
            <>Submit for Grading <kbd className="ml-1 text-[10px] opacity-60 font-mono">⌘↵</kbd></>
          )}
        </button>
      </div>
    </div>
  )

  return isFullscreen ? createPortal(content, document.body) : content
}
