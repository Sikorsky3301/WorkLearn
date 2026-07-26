import { Plus, Trash2 } from 'lucide-react'
import { Input } from '../../../../../../shared/ui/shadcn/input'
import { Textarea } from '../../../../../../shared/ui/shadcn/textarea'
import { linesToList } from '../../../shared/textListUtils'

// ── Reference data (optional, any type) ──────────────────────────────────────
export default function ReferenceDataEditor({ referenceData, onChange }) {
  const title = referenceData?.title || ''
  const fields = referenceData?.fields || []
  const hasContent = referenceData != null

  function update(patch) { onChange({ title, fields, ...patch }) }
  function updateField(i, patch) {
    const next = [...fields]; next[i] = { ...next[i], ...patch }
    update({ fields: next })
  }
  function addField() { update({ fields: [...fields, { label: '', value: '' }] }) }
  function removeField(i) { update({ fields: fields.filter((_, idx) => idx !== i) }) }
  function clear() { onChange(null) }

  if (!hasContent) {
    return (
      <button type="button" onClick={() => update({})} className="text-xs text-primary font-semibold flex items-center gap-1">
        <Plus className="h-3 w-3" /> Add reference panel
      </button>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Input value={title} placeholder="Panel title, e.g. Lead File — Acme Corp" onChange={(e) => update({ title: e.target.value })} className="flex-1" />
        <button type="button" onClick={clear} className="text-xs text-red-500 shrink-0">Remove panel</button>
      </div>
      {fields.map((f, i) => {
        const isTags = Array.isArray(f.value)
        return (
          <div key={i} className="border border-border rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Input value={f.label} placeholder="Field label, e.g. Industry" onChange={(e) => updateField(i, { label: e.target.value })} className="flex-1" />
              <label className="flex items-center gap-1.5 text-xs text-on-surface-variant shrink-0">
                <input type="checkbox" checked={isTags} onChange={(e) => updateField(i, { value: e.target.checked ? [] : '' })} /> list
              </label>
              <button onClick={() => removeField(i)}><Trash2 className="h-4 w-4 text-red-400" /></button>
            </div>
            {isTags ? (
              <Textarea rows={2} value={(f.value || []).join('\n')} placeholder="One item per line" onChange={(e) => updateField(i, { value: linesToList(e.target.value) })} />
            ) : (
              <Textarea rows={2} value={f.value || ''} placeholder="Paragraph text" onChange={(e) => updateField(i, { value: e.target.value })} />
            )}
          </div>
        )
      })}
      <button type="button" onClick={addField} className="text-xs text-primary font-semibold flex items-center gap-1"><Plus className="h-3 w-3" /> Add field</button>
    </div>
  )
}
