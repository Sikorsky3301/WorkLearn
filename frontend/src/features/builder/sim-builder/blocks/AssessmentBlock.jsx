import { ClipboardCheck, Plus, Trash2 } from 'lucide-react'
import { Input } from '../../../../components/ui/shadcn/input'
import { Label } from '../../../../components/ui/shadcn/label'

export const meta = { label: 'Assessment', icon: ClipboardCheck }

export function Editor({ config, onChange }) {
  const criteria = config.criteria || []

  function update(i, patch) {
    const next = [...criteria]; next[i] = { ...next[i], ...patch }
    onChange({ ...config, criteria: next })
  }
  function add() { onChange({ ...config, criteria: [...criteria, { label: '', weight: 0 }] }) }
  function remove(i) { onChange({ ...config, criteria: criteria.filter((_, idx) => idx !== i) }) }

  return (
    <div className="space-y-2">
      <Label>Criteria (weights, e.g. 0.5 = 50%)</Label>
      {criteria.map((c, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input value={c.label} placeholder="Criterion" onChange={(e) => update(i, { label: e.target.value })} className="flex-1" />
          <Input type="number" step="0.1" value={c.weight} onChange={(e) => update(i, { weight: Number(e.target.value) })} className="w-20" />
          <button type="button" onClick={() => remove(i)} className="cursor-pointer">
            <Trash2 className="h-4 w-4 text-red-400" />
          </button>
        </div>
      ))}
      <button type="button" onClick={add} className="text-xs text-primary font-semibold flex items-center gap-1 cursor-pointer">
        <Plus className="h-3 w-3" /> Add criterion
      </button>
    </div>
  )
}

export function Preview({ config }) {
  const criteria = config.criteria || []
  return (
    <div className="rounded-lg border border-border bg-white p-4 space-y-2">
      <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant flex items-center gap-1.5">
        <ClipboardCheck className="h-3.5 w-3.5" /> Assessment
      </p>
      <div className="flex flex-wrap gap-1.5">
        {criteria.map((c, i) => (
          <span key={i} className="chip text-[10px] bg-primary/10 text-primary border-transparent">
            {c.label || 'Criterion'} {Math.round((c.weight || 0) * 100)}%
          </span>
        ))}
      </div>
    </div>
  )
}
