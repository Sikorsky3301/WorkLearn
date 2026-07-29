import { HelpCircle, Plus, Trash2 } from 'lucide-react'
import { Input } from '../../../../shared/ui/shadcn/input'
import { Label } from '../../../../shared/ui/shadcn/label'

export const meta = { label: 'Quiz', icon: HelpCircle }

export function Editor({ config, onChange }) {
  const options = config.options || ['', '']

  function updateOption(i, value) {
    const next = [...options]; next[i] = value
    onChange({ ...config, options: next })
  }
  function addOption() { onChange({ ...config, options: [...options, ''] }) }
  function removeOption(i) {
    const next = options.filter((_, idx) => idx !== i)
    const correct = config.correct >= next.length ? 0 : config.correct
    onChange({ ...config, options: next, correct })
  }

  return (
    <div className="space-y-3">
      <div>
        <Label className="mb-1.5 block">Question</Label>
        <Input value={config.question || ''} onChange={(e) => onChange({ ...config, question: e.target.value })} />
      </div>
      <div>
        <Label className="mb-1.5 block">Options (select the correct one)</Label>
        <div className="space-y-1.5">
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="radio" checked={config.correct === i} onChange={() => onChange({ ...config, correct: i })} />
              <Input value={opt} placeholder={`Option ${i + 1}`} onChange={(e) => updateOption(i, e.target.value)} className="flex-1" />
              <button type="button" onClick={() => removeOption(i)} className="cursor-pointer">
                <Trash2 className="h-4 w-4 text-red-400" />
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addOption} className="text-xs text-primary font-semibold flex items-center gap-1 mt-2 cursor-pointer">
          <Plus className="h-3 w-3" /> Add option
        </button>
      </div>
    </div>
  )
}

export function Preview({ config }) {
  const options = config.options || []
  return (
    <div className="rounded-lg border border-border p-4 space-y-2.5 bg-white">
      <p className="text-sm font-semibold text-on-surface">{config.question || 'Untitled question'}</p>
      <div className="space-y-1.5">
        {options.map((opt, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm ${config.correct === i ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-border text-on-surface-variant'}`}
          >
            <span className="h-4 w-4 rounded-full border border-current flex items-center justify-center text-[9px] shrink-0">
              {String.fromCharCode(65 + i)}
            </span>
            {opt || `Option ${i + 1}`}
          </div>
        ))}
      </div>
    </div>
  )
}
