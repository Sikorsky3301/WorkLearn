import { Plus, Trash2 } from 'lucide-react'
import { Input } from '../../../../../../shared/ui/shadcn/input'
import { Label } from '../../../../../../shared/ui/shadcn/label'
import { cn } from '../../../../../../shared/utils/cn'

// ── Rubric (shared by any type) ──────────────────────────────────────────────
export default function RubricEditor({ rubric, onChange }) {
  const rows = Object.entries(rubric || {})
  const sum = rows.reduce((s, [, w]) => s + w, 0)

  function updateRow(i, key, value) {
    const next = [...rows]
    next[i] = [key, value]
    onChange(Object.fromEntries(next))
  }
  function addRow() { onChange({ ...(rubric || {}), '': 0 }) }
  function removeRow(i) {
    const next = rows.filter((_, idx) => idx !== i)
    onChange(Object.fromEntries(next))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <Label>Rubric (optional — shown as "scored on" badges)</Label>
        <button type="button" onClick={addRow} className="text-xs text-primary font-semibold flex items-center gap-1"><Plus className="h-3 w-3" /> Add category</button>
      </div>
      {rows.map(([key, weight], i) => (
        <div key={i} className="flex items-center gap-2 mb-1.5">
          <Input value={key} placeholder="category" onChange={(e) => updateRow(i, e.target.value, weight)} className="flex-1" />
          <Input type="number" step="0.1" value={weight} onChange={(e) => updateRow(i, key, Number(e.target.value))} className="w-24" />
          <button onClick={() => removeRow(i)}><Trash2 className="h-4 w-4 text-red-400" /></button>
        </div>
      ))}
      {rows.length > 0 && (
        <p className={cn('text-xs', Math.abs(sum - 1) < 1e-6 ? 'text-emerald-600' : 'text-amber-600')}>
          Weights sum to {sum.toFixed(2)} {Math.abs(sum - 1) >= 1e-6 && '(must equal 1.0 to publish)'}
        </p>
      )}
    </div>
  )
}
