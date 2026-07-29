import { useState } from 'react'
import { ChevronRight, Sparkles, Copy, Check } from 'lucide-react'

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1 text-[11px] font-semibold text-on-surface-variant hover:text-primary transition-colors"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

/** Reveal-gated model-solution panel — collapsed behind a "your own attempt
 * first" button, matching the UX the original da-job-sim/frontend-dev-sim
 * hardcoded workspaces used (`modelSolution` → a click-to-reveal walkthrough)
 * but generalized to any task type: `example` per-step and the overall
 * `example_solution` are plain text, not necessarily code (a full sample
 * email or CRM entry works the same way as a code block). */
export default function ModelSolutionPanel({ modelSolution }) {
  const [revealed, setRevealed] = useState(false)
  if (!modelSolution || (!modelSolution.steps?.length && !modelSolution.example_solution)) return null

  if (!revealed) {
    return (
      <button
        type="button"
        onClick={() => setRevealed(true)}
        className="mt-2 w-full flex items-center justify-between gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/[0.03] px-4 py-3 text-left hover:bg-primary/[0.06] transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Sparkles className="h-4 w-4" /> Reveal model solution
        </span>
        <span className="flex items-center gap-1 text-xs text-on-surface-variant">
          Open only after your own attempt <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </button>
    )
  }

  return (
    <div className="mt-2 rounded-lg border border-border bg-surface-low p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold text-on-surface">Model solution</h3>
      </div>

      {modelSolution.steps?.length > 0 && (
        <ol className="space-y-3">
          {modelSolution.steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-on-surface">{step.title}</p>
                {step.detail && <p className="text-sm text-on-surface-variant leading-relaxed mt-0.5">{step.detail}</p>}
                {step.example && (
                  <pre className="mt-1.5 text-xs bg-surface-container text-on-surface rounded-md p-2.5 overflow-x-auto whitespace-pre-wrap font-mono">
                    {step.example}
                  </pre>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}

      {modelSolution.key_principle && (
        <div className="bg-primary/[0.06] border border-primary/20 rounded-lg p-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-primary mb-1">Key principle</p>
          <p className="text-sm text-on-surface leading-relaxed">{modelSolution.key_principle}</p>
        </div>
      )}

      {modelSolution.great_looks_like && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-700 mb-1">What great looks like</p>
          <p className="text-sm text-emerald-900 leading-relaxed">{modelSolution.great_looks_like}</p>
        </div>
      )}

      {modelSolution.example_solution && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">Full example</p>
            <CopyButton text={modelSolution.example_solution} />
          </div>
          <pre className="text-xs bg-surface-container text-on-surface rounded-md p-3 overflow-x-auto whitespace-pre-wrap font-mono max-h-96 overflow-y-auto">
            {modelSolution.example_solution}
          </pre>
        </div>
      )}
    </div>
  )
}
