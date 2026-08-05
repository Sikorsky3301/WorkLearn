import { Check, Play, MousePointerClick, RefreshCw, MessageSquareCode } from 'lucide-react'

/** Static, non-interactive preview of the in-simulation code editor, shown
 * on the overview page before a student enrolls. Deliberately NOT the real
 * FrontendPlayground/JupyterPlayground: those mount Monaco (~1MB) and are
 * wired to enrollment-scoped submit endpoints that don't exist pre-enrollment.
 * Copy here is written for a student deciding whether to enrol — what they
 * can do, not what it runs on. */

// Sample lines shown in the fake editor. Purely illustrative of the shape of
// the work, not a real solution to any task.
const SAMPLE_LINES = [
  { t: [['kw', 'export default function'], ['fn', ' TaskManager'], ['p', '() {']] },
  { t: [['p', '  '], ['kw', 'const'], ['p', ' [tasks, setTasks] = '], ['fn', 'useState'], ['p', '(() => {']] },
  { t: [['p', '    '], ['kw', 'return'], ['p', ' JSON.'], ['fn', 'parse'], ['p', '(localStorage.'], ['fn', 'getItem'], ['p', '('], ['s', "'tasks'"], ['p', ') ?? '], ['s', "'[]'"], ['p', ')']] },
  { t: [['p', '  })']] },
  { t: [] },
  { t: [['p', '  '], ['fn', 'useEffect'], ['p', '(() => {']] },
  { t: [['p', '    localStorage.'], ['fn', 'setItem'], ['p', '('], ['s', "'tasks'"], ['p', ', JSON.'], ['fn', 'stringify'], ['p', '(tasks))']] },
  { t: [['p', '  }, [tasks])']] },
  { t: [] },
  { t: [['p', '  '], ['kw', 'return'], ['p', ' ('], ['c', ' // …render input, list, buttons']] },
]

const TOKEN_CLASS = {
  kw: 'text-violet-300',
  fn: 'text-sky-300',
  s: 'text-emerald-300',
  c: 'text-slate-500 italic',
  p: 'text-slate-300',
}

const FEATURES = [
  {
    icon: MousePointerClick,
    label: 'Start writing immediately',
    detail: 'The editor opens right inside the task — nothing to download or configure first.',
  },
  {
    icon: RefreshCw,
    label: 'Try as many times as you like',
    detail: 'Run your code and see what happens before you hand anything in.',
  },
  {
    icon: MessageSquareCode,
    label: 'Know exactly where you stand',
    detail: 'Every submission is checked against what the task actually asked for, and tells you what passed.',
  },
]

export default function CodingEnvironmentPreview() {
  return (
    <div className="mt-12">
      <h2 className="flex items-center gap-2 text-lg font-bold text-on-surface mb-1">
        <span className="h-4 w-1 rounded-full bg-primary shrink-0" />
        Write real code, right in your browser
      </h2>
      <p className="text-sm text-on-surface-variant mb-5 pl-3">
        Every task comes with a built-in editor — no setup required.
      </p>

      <div className="rounded-xl border border-border overflow-hidden shadow-sm">
        {/* File tab bar */}
        <div className="flex items-center bg-surface-low border-b border-border">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-r border-border border-t-2 border-t-primary">
            <span className="font-mono text-xs text-on-surface">submission.jsx</span>
          </div>
        </div>

        {/* Editor surface */}
        <div className="bg-[#111827] px-3 py-4 overflow-x-auto">
          <pre className="font-mono text-[12px] leading-[1.7]">
            {SAMPLE_LINES.map((line, i) => (
              <div key={i} className="flex">
                <span className="select-none text-slate-600 w-8 shrink-0 text-right pr-3">{i + 1}</span>
                <span className="whitespace-pre">
                  {line.t.map(([kind, text], j) => (
                    <span key={j} className={TOKEN_CLASS[kind]}>{text}</span>
                  ))}
                </span>
              </div>
            ))}
          </pre>
        </div>

        {/* Action bar + result */}
        <div className="flex items-center gap-2 px-3 py-2.5 bg-surface-low border-t border-border">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant border border-border bg-white rounded-lg px-2.5 py-1">
            <Play className="h-3 w-3" fill="currentColor" /> Run
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-primary rounded-lg px-2.5 py-1">
            Submit
          </span>
          <span className="flex-1" />
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
            <Check className="h-3.5 w-3.5" /> All checks passed
          </span>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mt-4">
        {FEATURES.map(({ icon: Icon, label, detail }) => (
          <div key={label} className="border border-border rounded-lg p-4">
            <Icon className="h-4 w-4 text-primary mb-2" />
            <p className="text-sm font-semibold text-on-surface leading-snug">{label}</p>
            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{detail}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
