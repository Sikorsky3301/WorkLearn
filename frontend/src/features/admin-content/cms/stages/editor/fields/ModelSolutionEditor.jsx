import { Plus, Trash2 } from 'lucide-react'
import { Input } from '../../../../../../shared/ui/shadcn/input'
import { Textarea } from '../../../../../../shared/ui/shadcn/textarea'
import { Label } from '../../../../../../shared/ui/shadcn/label'

// ── Model solution (optional, any type) ──────────────────────────────────────
export default function ModelSolutionEditor({ modelSolution, onChange }) {
  const steps = modelSolution?.steps || []
  const keyPrinciple = modelSolution?.key_principle || ''
  const greatLooksLike = modelSolution?.great_looks_like || ''
  const exampleSolution = modelSolution?.example_solution || ''
  const hasContent = !!modelSolution

  function update(patch) {
    onChange({ steps, key_principle: keyPrinciple || null, great_looks_like: greatLooksLike || null, example_solution: exampleSolution || null, ...patch })
  }
  function updateStep(i, patch) {
    const next = [...steps]; next[i] = { ...next[i], ...patch }
    update({ steps: next })
  }
  function addStep() { update({ steps: [...steps, { title: '', detail: '', example: '' }] }) }
  function removeStep(i) { update({ steps: steps.filter((_, idx) => idx !== i) }) }
  function clear() { onChange(null) }

  if (!hasContent) return null

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button type="button" onClick={clear} className="text-xs text-red-500">Remove model solution</button>
      </div>

      <div className="space-y-2">
        <Label>Walkthrough steps</Label>
        {steps.map((s, i) => (
          <div key={i} className="border border-border rounded-lg p-3 space-y-2">
            <Input value={s.title || ''} placeholder="Step title" onChange={(e) => updateStep(i, { title: e.target.value })} />
            <Textarea rows={2} value={s.detail || ''} placeholder="Why this step matters" onChange={(e) => updateStep(i, { detail: e.target.value })} />
            <Textarea rows={2} className="font-mono text-xs" value={s.example || ''} placeholder="Optional code/example snippet for this step" onChange={(e) => updateStep(i, { example: e.target.value })} />
            <button onClick={() => removeStep(i)} className="text-xs text-red-500 flex items-center gap-1"><Trash2 className="h-3.5 w-3.5" /> Remove step</button>
          </div>
        ))}
        <button type="button" onClick={addStep} className="text-xs text-primary font-semibold flex items-center gap-1"><Plus className="h-3 w-3" /> Add step</button>
      </div>

      <div>
        <Label className="mb-1.5 block">Key principle (optional)</Label>
        <Textarea rows={2} value={keyPrinciple} onChange={(e) => update({ key_principle: e.target.value || null })} />
      </div>
      <div>
        <Label className="mb-1.5 block">What great looks like (optional)</Label>
        <Textarea rows={2} value={greatLooksLike} onChange={(e) => update({ great_looks_like: e.target.value || null })} />
      </div>
      <div>
        <Label className="mb-1.5 block">Full example solution (optional — code or a complete worked example)</Label>
        <Textarea rows={6} className="font-mono text-xs" value={exampleSolution} onChange={(e) => update({ example_solution: e.target.value || null })} />
      </div>
    </div>
  )
}
