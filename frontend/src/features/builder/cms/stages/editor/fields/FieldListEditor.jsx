import { Plus, Trash2 } from 'lucide-react'
import { Input } from '../../../../../../components/ui/shadcn/input'

export const FIELD_TYPES = ['text', 'textarea', 'number', 'select', 'slider', 'checkbox']

// ── structured_form / text_rubric fields ─────────────────────────────────────
export default function FieldListEditor({ fields, onChange }) {
  function update(i, patch) {
    const next = [...fields]
    next[i] = { ...next[i], ...patch }
    onChange(next)
  }
  function add() { onChange([...fields, { key: `field_${fields.length + 1}`, label: 'New field', type: 'text', required: false }]) }
  function remove(i) { onChange(fields.filter((_, idx) => idx !== i)) }

  return (
    <div className="space-y-2">
      {fields.map((f, i) => (
        <div key={i} className="border border-border rounded-lg p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Input value={f.key} placeholder="key" onChange={(e) => update(i, { key: e.target.value })} />
            <Input value={f.label} placeholder="Label" onChange={(e) => update(i, { label: e.target.value })} />
          </div>
          <div className="flex items-center gap-2">
            <select value={f.type} onChange={(e) => update(i, { type: e.target.value })} className="text-sm border border-border rounded-md px-2 py-1.5">
              {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            {f.type === 'select' && (
              <Input
                value={(f.options || []).join(', ')}
                placeholder="options, comma separated"
                onChange={(e) => update(i, { options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                className="flex-1"
              />
            )}
            <label className="flex items-center gap-1.5 text-xs text-on-surface-variant shrink-0">
              <input type="checkbox" checked={!!f.required} onChange={(e) => update(i, { required: e.target.checked })} /> required
            </label>
            <button onClick={() => remove(i)} className="ml-auto"><Trash2 className="h-4 w-4 text-red-400" /></button>
          </div>
        </div>
      ))}
      <button type="button" onClick={add} className="text-xs text-primary font-semibold flex items-center gap-1"><Plus className="h-3 w-3" /> Add field</button>
    </div>
  )
}
