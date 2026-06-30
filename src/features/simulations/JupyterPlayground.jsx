import { useState, useEffect, useRef } from 'react'

const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js'
const PYODIDE_IDX = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/'

// Generates the synthetic lumen_orders dataset and sets matplotlib to Agg
const DATA_SETUP = `
import numpy as np, pandas as pd, datetime, warnings, matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
warnings.filterwarnings('ignore')
np.random.seed(42)

_end   = datetime.date.today()
_start = _end - datetime.timedelta(days=548)
_N     = 9600
_custs = [f'CUST-{i:05d}' for i in range(1, 3001)]
_cids  = [np.random.choice(_custs) if np.random.random() > 0.07 else None for _ in range(_N)]

_cats_raw = np.random.choice(
    ['Lighting', 'Décor', 'Furniture', 'Outdoor', 'Accessories'],
    _N, p=[0.35, 0.25, 0.20, 0.12, 0.08]
)
_cats = []
for _c in _cats_raw:
    _r = np.random.random()
    if   _c == 'Lighting'    and _r < 0.04: _cats.append('Lightng')
    elif _c == 'Lighting'    and _r < 0.08: _cats.append('lighting')
    elif _c == 'Accessories' and _r < 0.04: _cats.append('Accessoires')
    else:                                    _cats.append(_c)

_prices = np.round(np.clip(np.random.lognormal(3.8, 0.8, _N), 5, 800), 2).astype(float)
_prices[np.random.choice(_N, 80, replace=False)] = 0.0
_prices[np.random.randint(0, _N)] = 99999.0

_disc = np.random.choice(
    [0, 0.05, 0.10, 0.15, 0.20, 0.25], _N,
    p=[0.45, 0.20, 0.15, 0.10, 0.07, 0.03]
).astype(float)
_disc[np.random.random(_N) < 0.12] *= 100

_qty = np.random.choice(list(range(1, 8)), _N, p=[0.45, 0.28, 0.12, 0.07, 0.04, 0.02, 0.02])
_qty = np.where(np.random.random(_N) < 0.03, -_qty, _qty)

_dates = []
for _ in range(_N):
    _d = _start + datetime.timedelta(days=int(np.random.randint(0, 548)))
    _dates.append(_d.strftime('%Y-%m-%d'))
for _i in np.where(np.random.random(_N) < 0.15)[0]:
    _p = _dates[_i].split('-')
    _dates[_i] = f'{_p[2]}/{_p[1]}/{_p[0]}'
for _i in np.where(np.random.random(_N) < 0.01)[0]:
    _dates[_i] = ''

df = pd.DataFrame({
    'order_id':         [f'ORD-{i:06d}' for i in range(1, _N + 1)],
    'order_date':       _dates,
    'customer_id':      _cids,
    'customer_email':   [f'{(_c or "guest").lower()}@lumenmail.com' for _c in _cids],
    'product_category': _cats,
    'quantity':         _qty.tolist(),
    'unit_price':       _prices.tolist(),
    'discount_pct':     _disc.tolist(),
    'channel':          np.random.choice(
                            ['Paid Search','Email','Organic','Social',None],
                            _N, p=[0.33,0.28,0.22,0.13,0.04]).tolist(),
    'country':          np.random.choice(
                            ['US','CA','UK','AU','ZZ'],
                            _N, p=[0.65,0.15,0.12,0.05,0.03]).tolist(),
    'experiment_group': np.random.choice(
                            ['control','variant',None],
                            _N, p=[0.30,0.30,0.40]).tolist(),
})

_dupes = df.sample(250, random_state=42)
df = pd.concat([df, _dupes], ignore_index=True).sample(frac=1, random_state=42).reset_index(drop=True)

print(f"✅  lumen_orders loaded  |  {len(df):,} rows  ×  {df.shape[1]} columns")
print(f"    columns: {', '.join(df.columns)}")
`

// Wraps user code: captures stdout/stderr, captures matplotlib figures as base64
const RUN_WRAPPER = `
import sys as __sys, io as __io
__out = __io.StringIO()
__err = __io.StringIO()
__sys.stdout = __out
__sys.stderr = __err

try:
    exec(compile(__user_code, '<notebook>', 'exec'))
except Exception as __exc:
    import traceback as __tb
    print(__tb.format_exc(), file=__sys.stderr)
finally:
    __sys.stdout = __sys.__stdout__
    __sys.stderr = __sys.__stderr__

import matplotlib.pyplot as __mplt, base64 as __b64, io as __bio
__figs = []
for __fn in list(__mplt.get_fignums()):
    __f   = __mplt.figure(__fn)
    __tmp = __bio.BytesIO()
    __f.savefig(__tmp, format='png', bbox_inches='tight', dpi=150, facecolor='white')
    __mplt.close(__f)
    __tmp.seek(0)
    __figs.append(__b64.b64encode(__tmp.read()).decode('utf-8'))

[__out.getvalue(), __err.getvalue(), __figs]
`

export default function JupyterPlayground({ starterCode, onEvaluate }) {
  const [sandboxOpen, setSandboxOpen] = useState(false)
  const [pyodide,   setPyodide]   = useState(null)
  const [phase,     setPhase]     = useState('idle')   // idle | loading | ready | error
  const [loadMsg,   setLoadMsg]   = useState('')
  const [code,      setCode]      = useState(starterCode)
  const [outputs,   setOutputs]   = useState([])
  const [running,   setRunning]   = useState(false)
  const outputRef   = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    if (!sandboxOpen) return

    // Singleton: reuse Pyodide across tab switches
    if (window.__worklearn_pyodide) {
      setPyodide(window.__worklearn_pyodide)
      setPhase('ready')
      return
    }
    if (window.__worklearn_py_loading) {
      const timer = setInterval(() => {
        if (window.__worklearn_pyodide) {
          setPyodide(window.__worklearn_pyodide)
          setPhase('ready')
          clearInterval(timer)
        }
      }, 400)
      return () => clearInterval(timer)
    }

    window.__worklearn_py_loading = true
    setPhase('loading')

    const boot = async () => {
      try {
        setLoadMsg('Downloading Python runtime (~8 MB)…')
        if (!window.loadPyodide) {
          await new Promise((resolve, reject) => {
            const s   = document.createElement('script')
            s.src     = PYODIDE_URL
            s.onload  = resolve
            s.onerror = () => reject(new Error('Could not load Pyodide — check your connection'))
            document.head.appendChild(s)
          })
        }

        setLoadMsg('Starting Python 3.12…')
        const py = await window.loadPyodide({ indexURL: PYODIDE_IDX })

        setLoadMsg('Installing pandas, numpy, matplotlib…')
        await py.loadPackage(['pandas', 'numpy', 'matplotlib'])

        setLoadMsg('Generating lumen_orders dataset…')
        await py.runPythonAsync(DATA_SETUP)

        window.__worklearn_pyodide  = py
        window.__worklearn_py_loading = false
        setPyodide(py)
        setPhase('ready')
      } catch (err) {
        window.__worklearn_py_loading = false
        setPhase('error')
        setLoadMsg(err.message)
      }
    }
    boot()
  }, [sandboxOpen])

  const runCode = async () => {
    if (!pyodide || running) return
    setRunning(true)
    setOutputs([{ type: 'running' }])
    try {
      pyodide.globals.set('__user_code', code)
      const result = await pyodide.runPythonAsync(RUN_WRAPPER)
      const [stdout, stderr, figs] = result.toJs()
      const figList = figs || []
      const out = []
      if (stdout) out.push({ type: 'text',  content: stdout })
      if (stderr) out.push({ type: 'error', content: stderr })
      figList.forEach(b64 => out.push({ type: 'image', content: b64 }))
      if (!out.length) out.push({ type: 'text', content: '(no output)' })
      setOutputs(out)
      if (onEvaluate) onEvaluate({ stdout: stdout || '', stderr: stderr || '', figCount: figList.length })
    } catch (err) {
      setOutputs([{ type: 'error', content: String(err) }])
    } finally {
      setRunning(false)
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const el    = e.target
      const start = el.selectionStart
      const end   = el.selectionEnd
      const next  = code.slice(0, start) + '    ' + code.slice(end)
      setCode(next)
      requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = start + 4 })
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      runCode()
    }
  }

  // ── Closed state — shown until user clicks "Open Sandbox" ──
  if (!sandboxOpen) {
    return (
      <div className="rounded-xl border border-primary/20 overflow-hidden shadow-sm">
        {/* Faux toolbar */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-950">
          <div className="flex gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/40" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
          </div>
          <span className="font-mono text-xs text-gray-600 flex-1 truncate">lumen_sales_report.py</span>
          <span className="text-[11px] text-gray-600">Python 3.12 · pandas · matplotlib</span>
        </div>

        {/* CTA */}
        <div className="bg-gray-950 px-6 py-10 text-center">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center mx-auto mb-4 text-xl">🐍</div>
          <p className="text-sm font-semibold text-gray-200 mb-1">Python Sandbox</p>
          <p className="text-xs text-gray-500 mb-1">pandas · numpy · matplotlib — runs entirely in your browser</p>
          <p className="text-xs text-gray-600 mb-6">
            <span className="font-mono text-primary/70">lumen_orders</span> (~9,850 rows) pre-loaded · first launch ~15 s
          </p>
          <button
            onClick={() => setSandboxOpen(true)}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 active:scale-95 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-all"
          >
            <span>▶</span> Open Sandbox
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-primary/20 overflow-hidden shadow-sm">

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-950">
        {/* Traffic lights */}
        <div className="flex gap-1.5 shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
        </div>

        {/* File label */}
        <span className="font-mono text-xs text-gray-500 flex-1 truncate">
          lumen_sales_report.py
        </span>

        {/* Status pill */}
        {phase === 'ready' && (
          <span className="flex items-center gap-1.5 text-[11px] text-green-400 shrink-0">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
            Python 3.12 · pandas · matplotlib
          </span>
        )}
        {phase === 'loading' && (
          <span className="flex items-center gap-1.5 text-[11px] text-amber-400 shrink-0">
            <span className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            {loadMsg}
          </span>
        )}

        {/* Actions */}
        <button
          onClick={() => { setCode(starterCode); setOutputs([]) }}
          className="text-[11px] text-gray-500 hover:text-gray-200 transition-colors px-2 py-1 rounded hover:bg-white/10 shrink-0"
        >
          Reset
        </button>
        <button
          onClick={() => setOutputs([])}
          disabled={!outputs.length}
          className="text-[11px] text-gray-500 hover:text-gray-200 disabled:opacity-30 transition-colors px-2 py-1 rounded hover:bg-white/10 shrink-0"
        >
          Clear
        </button>
        <button
          onClick={runCode}
          disabled={phase !== 'ready' || running}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded transition-all shrink-0 ${
            phase === 'ready' && !running
              ? 'bg-primary text-white hover:bg-primary/90 active:scale-95'
              : 'bg-white/10 text-white/30 cursor-not-allowed'
          }`}
        >
          {running ? (
            <><span className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" />Running…</>
          ) : (
            <>▶ Run <kbd className="ml-1 text-[9px] opacity-50 font-mono">⌘↵</kbd></>
          )}
        </button>
      </div>

      {/* ── Loading / error banner ── */}
      {phase === 'loading' && (
        <div className="px-4 py-2.5 bg-amber-950/50 flex items-center gap-2.5 text-[11px] text-amber-300 border-b border-amber-500/20">
          <span className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin shrink-0" />
          Setting up your in-browser Python environment — this only happens once per session.
        </div>
      )}
      {phase === 'error' && (
        <div className="px-4 py-2.5 bg-red-950/50 text-[11px] text-red-300 border-b border-red-500/20">
          ⚠ {loadMsg}
        </div>
      )}

      {/* ── Code editor ── */}
      <textarea
        ref={textareaRef}
        value={code}
        onChange={e => setCode(e.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        rows={22}
        className="w-full font-mono text-[13px] bg-gray-950 text-gray-100 px-5 py-4 resize-y focus:outline-none leading-[1.7] tracking-tight caret-primary"
        style={{ tabSize: 4, minHeight: '340px' }}
        placeholder="# Write Python here and press ▶ Run (or ⌘↵)"
      />

      {/* ── Output panel ── */}
      {outputs.length > 0 && (
        <div ref={outputRef} className="border-t border-white/10">
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 border-b border-white/5">
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Output</span>
          </div>
          <div className="bg-gray-900 px-4 py-4 space-y-4 max-h-[560px] overflow-y-auto">
            {outputs.map((out, i) => {
              if (out.type === 'running') {
                return (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                    <span className="w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                    Executing…
                  </div>
                )
              }
              if (out.type === 'image') {
                return (
                  <div key={i} className="rounded overflow-hidden border border-white/10">
                    <img
                      src={`data:image/png;base64,${out.content}`}
                      alt="Plot output"
                      className="max-w-full bg-white block"
                    />
                  </div>
                )
              }
              return (
                <pre
                  key={i}
                  className={`text-[12px] font-mono whitespace-pre-wrap leading-relaxed ${
                    out.type === 'error' ? 'text-red-400' : 'text-gray-200'
                  }`}
                >
                  {out.content}
                </pre>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
