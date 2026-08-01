import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Editor from '@monaco-editor/react'
import { useSubmitSandbox, useSandboxFiles, useSandboxFileRows } from '../../../hooks'
import { downloadFile } from '../../../lib/client'

const FILE_ROWS_PAGE_SIZE = 50
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024 // 20MB — matches the backend's cap

// Uint8Array -> base64 without spreading the whole buffer into
// String.fromCharCode (which blows the call stack for anything past ~100k
// bytes) — chunk it instead.
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

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
function UploadIcon(props) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" />
    </svg>
  )
}
function XIcon(props) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}
function DownloadIcon(props) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" />
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
function PyFileIcon(props) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" />
    </svg>
  )
}
function CsvFileIcon(props) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" />
      <path d="M8 13h8M8 17h8" />
    </svg>
  )
}
function FolderIcon(props) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    </svg>
  )
}
function ChevronDownIcon(props) {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

// Registers a Monaco theme that matches the site's own light design tokens
// (primary indigo #312E81, surface white, on-surface text) instead of the
// stock VS Code dark theme.
function defineWorkLearnTheme(monaco) {
  monaco.editor.defineTheme('worklearn-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '8a8794', fontStyle: 'italic' },
      { token: 'keyword', foreground: '312E81', fontStyle: 'bold' },
      { token: 'string', foreground: '2f7d4f' },
      { token: 'number', foreground: 'b45309' },
      { token: 'identifier', foreground: '1b1b21' },
      { token: 'type', foreground: '4b41e1' },
    ],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#1b1b21',
      'editor.lineHighlightBackground': '#f6f2fa',
      'editor.lineHighlightBorder': '#00000000',
      'editorLineNumber.foreground': '#c8c5d3',
      'editorLineNumber.activeForeground': '#645efb',
      'editorCursor.foreground': '#312E81',
      'editor.selectionBackground': '#e5e1f5',
      'editorIndentGuide.background': '#eae7ef',
      'editorIndentGuide.activeBackground': '#c8c5d3',
      'editorGutter.background': '#fcfbff',
      'editorWidget.background': '#ffffff',
      'editorWidget.border': '#e5e7eb',
      'scrollbarSlider.background': '#e5e7eb80',
      'scrollbarSlider.hoverBackground': '#c8c5d380',
    },
  })
}

function fileIcon(kind) {
  if (kind === 'python') return <PyFileIcon className="text-blue-500 shrink-0" />
  if (kind === 'csv') return <CsvFileIcon className="text-green-600 shrink-0" />
  return <CsvFileIcon className="text-amber-600 shrink-0" />
}

// Read-only viewer for dataset.csv / output.csv / output.json entries from the
// Explorer — real file contents, not a mock. CSVs page through the FULL
// dataset (dataset.csv can be ~9,600 rows) via useSandboxFileRows; the file's
// own `rows`/`columns` (a 10-row teaser from the files list) are only a
// placeholder until the first page of real data arrives.
function FileViewer({ file, enrollmentId, taskId }) {
  const [page, setPage] = useState(1)
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState('')
  const isCsv = file?.kind === 'csv'

  useEffect(() => { setPage(1) }, [file?.name])

  const { data: pageData, isFetching } = useSandboxFileRows(
    enrollmentId, taskId, isCsv ? file.name : null, page, FILE_ROWS_PAGE_SIZE
  )

  if (!file) return null

  if (file.kind === 'csv') {
    const columns    = pageData?.columns ?? file.columns
    const rows       = pageData?.rows ?? file.rows
    const totalRows  = pageData?.row_count ?? file.row_count
    const totalPages = pageData?.total_pages ?? 1
    const rangeStart = (page - 1) * FILE_ROWS_PAGE_SIZE + 1
    const rangeEnd   = Math.min(page * FILE_ROWS_PAGE_SIZE, totalRows)

    const handleDownload = async () => {
      setDownloading(true)
      setDownloadError('')
      try {
        await downloadFile(`/api/sandbox/${enrollmentId}/tasks/${taskId}/files/${file.name}/download`, file.name)
      } catch (err) {
        setDownloadError(err.message || 'Could not download this file.')
      } finally {
        setDownloading(false)
      }
    }

    return (
      <div className="h-full flex flex-col bg-white">
        <div className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0 gap-3">
          <p className="text-xs text-on-surface-variant shrink-0">
            {isFetching
              ? 'Loading…'
              : `Showing rows ${rangeStart.toLocaleString()}–${rangeEnd.toLocaleString()} of ${totalRows.toLocaleString()}`}
          </p>
          <div className="flex items-center gap-2">
            {downloadError && <span className="text-xs text-red-600">{downloadError}</span>}
            <button
              onClick={handleDownload}
              disabled={downloading}
              title={`Download ${file.name} to your computer`}
              className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border border-border text-on-surface-variant hover:text-on-surface hover:border-primary/40 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              {downloading ? (
                <span className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              ) : (
                <DownloadIcon />
              )}
              Download
            </button>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1 || isFetching}
                  className="text-xs font-medium px-2.5 py-1 rounded-lg border border-border text-on-surface-variant hover:text-on-surface hover:border-primary/40 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  ← Prev
                </button>
                <span className="text-xs text-on-surface-variant font-mono tabular-nums">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || isFetching}
                  className="text-xs font-medium px-2.5 py-1 rounded-lg border border-border text-on-surface-variant hover:text-on-surface hover:border-primary/40 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-auto px-5 pb-5">
          <table className="text-[13px] border-collapse">
            <thead>
              <tr className="border-b border-border">
                {columns.map(c => (
                  <th key={c} className="text-left px-2.5 py-1.5 font-semibold text-on-surface whitespace-nowrap sticky top-0 bg-white">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? '' : 'bg-surface-low/60'}>
                  {columns.map(c => (
                    <td key={c} className="px-2.5 py-1.5 whitespace-nowrap text-on-surface-variant">{String(row[c] ?? '')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (file.kind === 'json') {
    return (
      <div className="h-full overflow-auto p-5 bg-white">
        <pre className="text-[13px] font-mono text-on-surface leading-relaxed whitespace-pre-wrap">
          {JSON.stringify(file.content, null, 2)}
        </pre>
      </div>
    )
  }

  return null
}

export default function JupyterPlayground({ starterCode, enrollmentId, taskId, outputFilename, onGraded }) {
  const [started, setStarted] = useState(false)
  const [starting, setStarting] = useState(false)
  const [code, setCode] = useState(starterCode)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [editorHeight, setEditorHeight] = useState(DEFAULT_HEIGHT)
  const [lastRanDry, setLastRanDry] = useState(false)
  const [activeFile, setActiveFile] = useState('submission.py')
  const [uploadedOutput, setUploadedOutput] = useState(null) // { base64, filename } | null — an uploaded file, alternative to running code
  const [uploadError, setUploadError] = useState('')
  const resizingRef = useRef(false)
  const fileInputRef = useRef(null)

  const submitSandbox = useSubmitSandbox(enrollmentId, taskId)
  const { data: filesData } = useSandboxFiles(enrollmentId, taskId)
  const files = filesData?.files ?? [{ name: 'submission.py', kind: 'python', editable: true }]
  const activeFileEntry = files.find(f => f.name === activeFile)
  // Only CSV outputs (Task 1) support uploading a finished file directly —
  // tasks 2-4 produce output.json, which isn't something a student hand-crafts.
  const supportsUpload = outputFilename?.endsWith('.csv')

  const execute = useCallback(async (dryRun) => {
    if (!enrollmentId || submitSandbox.isPending) return
    try {
      setLastRanDry(dryRun)
      const body = uploadedOutput
        ? { output_csv: uploadedOutput.base64, dry_run: dryRun }
        : { code, dry_run: dryRun }
      const result = await submitSandbox.mutateAsync(body)
      onGraded?.(result, { isSubmit: !dryRun })
    } catch { /* surfaced via submitSandbox.isError below */ }
  }, [code, uploadedOutput, enrollmentId, submitSandbox, onGraded])

  const handleRun    = useCallback(() => execute(true), [execute])
  const handleSubmit = useCallback(() => execute(false), [execute])

  const handleUploadClick = () => fileInputRef.current?.click()
  const clearUpload = () => { setUploadedOutput(null); setUploadError('') }

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file
    if (!file) return
    setUploadError('')
    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadError(`File is too large (max ${Math.floor(MAX_UPLOAD_BYTES / 1024 / 1024)}MB).`)
      return
    }
    const buf = await file.arrayBuffer()
    const base64 = arrayBufferToBase64(buf)
    setUploadedOutput({ base64, filename: file.name })
    // Uploading immediately previews/verifies it, same as clicking Run.
    if (!enrollmentId || submitSandbox.isPending) return
    try {
      setLastRanDry(true)
      const result = await submitSandbox.mutateAsync({ output_csv: base64, dry_run: true })
      onGraded?.(result, { isSubmit: false })
    } catch { /* surfaced via submitSandbox.isError below */ }
  }

  // Monaco's addCommand captures whatever handler was current at mount time —
  // keep a ref so the keyboard shortcut always calls the latest version.
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

  // Esc exits full screen
  useEffect(() => {
    if (!isFullscreen) return
    const onKey = (e) => { if (e.key === 'Escape') setIsFullscreen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isFullscreen])

  // Drag-to-resize handle (normal mode only)
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

  // ── Start gate — shown until the student explicitly boots the sandbox ──────
  if (!started) {
    return (
      <div className="rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3 bg-surface-low border-b border-border">
          <div className="flex gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
          </div>
          <span className="font-mono text-sm text-on-surface-variant">submission.py</span>
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
              ? 'Provisioning an isolated container with pandas, numpy, and scipy pre-installed.'
              : 'Runs in an isolated Docker container — pandas, numpy, and scipy pre-installed, network disabled.'}
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
        ? 'fixed inset-0 z-[100] flex bg-white'
        : 'rounded-xl border border-border overflow-hidden shadow-sm flex h-full animate-[fadeIn_0.35s_ease]'
    }>

      {/* ── Explorer sidebar (VS Code-style) ── */}
      <div className="w-[168px] shrink-0 bg-surface-low border-r border-border flex flex-col">
        <div className="px-3 pt-3 pb-2 text-[11px] font-bold text-on-surface-variant tracking-wider uppercase">
          Explorer
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-on-surface">
          <ChevronDownIcon className="text-on-surface-variant" />
          <FolderIcon className="text-primary/70" />
          <span>workspace</span>
        </div>
        <div className="mt-0.5 flex-1 overflow-y-auto">
          {files.map(f => (
            <button
              key={f.name}
              onClick={() => setActiveFile(f.name)}
              className={`w-full flex items-center gap-2 pl-7 pr-3 py-1.5 text-[13px] text-left transition-colors cursor-pointer ${
                activeFile === f.name ? 'bg-primary/10 text-primary font-medium' : 'text-on-surface-variant hover:bg-surface-high hover:text-on-surface'
              }`}
            >
              {fileIcon(f.kind)}
              <span className="truncate">{f.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Main column: tabs, banners, editor/viewer, actions ── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* File tab bar */}
        <div className="flex items-center bg-surface-low border-b border-border shrink-0">
          <div className="flex items-center gap-2 px-4 py-3 bg-white border-r border-border border-t-2 border-t-primary">
            {fileIcon(activeFileEntry?.kind)}
            <span className="font-mono text-sm text-on-surface">{activeFile}</span>
          </div>
          <span className="flex-1" />
          <span className="hidden md:flex items-center gap-1.5 text-xs text-on-surface-variant px-3 shrink-0">
            pandas · numpy · scipy
          </span>
          {activeFile === 'submission.py' && (
            <button
              onClick={() => setCode(starterCode)}
              className="text-xs font-medium text-on-surface-variant hover:text-on-surface transition-colors px-2.5 py-1 mr-1 rounded hover:bg-surface-high shrink-0 cursor-pointer"
            >
              Reset
            </button>
          )}
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
            {lastRanDry ? 'Running your code in an isolated container…' : 'Submitting for grading…'}
          </div>
        )}
        {submitSandbox.isError && (
          <div className="px-4 py-2.5 bg-red-50 text-sm text-red-700 border-b border-red-100 shrink-0 animate-[fadeIn_0.2s_ease]">
            ⚠ {submitSandbox.error?.message || 'Could not run this submission. Please try again.'}
          </div>
        )}
        {uploadError && (
          <div className="px-4 py-2.5 bg-red-50 text-sm text-red-700 border-b border-red-100 shrink-0 animate-[fadeIn_0.2s_ease]">
            ⚠ {uploadError}
          </div>
        )}
        {uploadedOutput && !submitSandbox.isPending && (
          <div className="px-4 py-2.5 bg-violet-50 flex items-center gap-2.5 text-sm text-violet-800 border-b border-violet-100 shrink-0 animate-[fadeIn_0.2s_ease]">
            <UploadIcon className="shrink-0" />
            <span className="flex-1 min-w-0 truncate">
              Using uploaded file <strong className="font-semibold">{uploadedOutput.filename}</strong> — Run/Submit will grade this file, not the code below.
            </span>
            <button
              onClick={clearUpload}
              title="Discard upload and use the code editor instead"
              className="shrink-0 flex items-center gap-1 text-xs font-semibold text-violet-700 hover:text-violet-900 px-2 py-1 rounded hover:bg-violet-100 transition-colors cursor-pointer"
            >
              <XIcon /> Clear
            </button>
          </div>
        )}

        {/* Editor (submission.py) or read-only file viewer */}
        <div style={isFullscreen ? undefined : { height: editorHeight }} className={isFullscreen ? 'flex-1 min-h-0' : ''}>
          {activeFile === 'submission.py' ? (
            <Editor
              height="100%"
              defaultLanguage="python"
              theme="worklearn-light"
              value={code}
              onChange={(v) => { setCode(v ?? ''); if (uploadedOutput) clearUpload() }}
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
                tabSize: 4,
                wordWrap: 'on',
                padding: { top: 18, bottom: 18 },
                automaticLayout: true,
                bracketPairColorization: { enabled: true },
              }}
            />
          ) : (
            <FileViewer file={activeFileEntry} enrollmentId={enrollmentId} taskId={taskId} />
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

        {/* Upload + Run + Submit — bottom action bar */}
        <div className="flex items-center gap-2.5 px-4 py-3.5 bg-white border-t border-border shrink-0">
          {supportsUpload && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileSelected}
                className="hidden"
              />
              <button
                onClick={handleUploadClick}
                disabled={!enrollmentId || submitSandbox.isPending}
                title={`Upload a ready-made ${outputFilename} from your computer instead of writing code`}
                className="shrink-0 flex items-center justify-center gap-1.5 text-sm font-semibold px-3 py-2.5 rounded-lg transition-all bg-surface-low text-on-surface border border-border hover:bg-surface-high active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                <UploadIcon width={13} height={13} /> Upload
              </button>
            </>
          )}
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
    </div>
  )

  // Portal to <body> in full screen so no ancestor's stacking context
  // (position/transform/filter) can trap it beneath the navbar or other UI.
  return isFullscreen ? createPortal(content, document.body) : content
}
