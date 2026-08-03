import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Input } from '../../../components/ui/shadcn/input'
import { Textarea } from '../../../components/ui/shadcn/textarea'
import { Label } from '../../../components/ui/shadcn/label'
import { Button } from '../../../components/ui/shadcn/button'
import { cn } from '../../../lib/cn'

/** Admin-defined field list (text/textarea/number/select/slider/checkbox) —
 * a generic version of sales-crm-sim's Stage1/2/7/8 pattern. Manual/rubric
 * grading only in v1 (no per-field auto-grading DSL — see the CMS plan). */
export default function StructuredFormTask({ task, onComplete }) {
  const fields = task.config?.fields || []
  const [values, setValues] = useState(() =>
    Object.fromEntries(fields.map((f) => [f.key, f.type === 'checkbox' ? false : f.type === 'slider' ? (f.min ?? 0) : '']))
  )

  function setValue(key, value) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  const requiredFilled = fields.every((f) => {
    if (!f.required) return true
    const v = values[f.key]
    if (f.type === 'checkbox') return true // booleans have no "unset" state worth blocking on
    if (f.min_length) return String(v || '').trim().length >= f.min_length
    return v !== '' && v != null
  })

  function handleSubmit() {
    if (!requiredFilled) return
    onComplete({ score: null, rubric_rating: values })
  }

  return (
    <div className="space-y-4">
      {fields.map((f) => (
        <div key={f.key}>
          <Label className="mb-1.5 block">
            {f.label}
            {f.min_length ? <span className="text-on-surface-variant font-normal"> ({(values[f.key] || '').length}/{f.min_length}+ chars)</span> : null}
          </Label>
          {f.type === 'textarea' && (
            <Textarea rows={4} value={values[f.key] || ''} onChange={(e) => setValue(f.key, e.target.value)} />
          )}
          {f.type === 'text' && (
            <Input value={values[f.key] || ''} onChange={(e) => setValue(f.key, e.target.value)} />
          )}
          {f.type === 'number' && (
            <Input type="number" value={values[f.key] ?? ''} onChange={(e) => setValue(f.key, e.target.valueAsNumber)} />
          )}
          {f.type === 'select' && (
            <div className="flex gap-2">
              {(f.options || []).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setValue(f.key, opt)}
                  className={cn(
                    'flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors',
                    values[f.key] === opt ? 'border-primary bg-primary/10 text-primary' : 'border-border text-on-surface-variant hover:border-primary/50'
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
          {f.type === 'slider' && (
            <div>
              <input
                type="range"
                min={f.min ?? 0} max={f.max ?? 100}
                value={values[f.key] ?? f.min ?? 0}
                onChange={(e) => setValue(f.key, Number(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-on-surface-variant text-right">{values[f.key]} / {f.max ?? 100}</p>
            </div>
          )}
          {f.type === 'checkbox' && (
            <label className="flex items-center gap-2 text-sm text-on-surface cursor-pointer">
              <input type="checkbox" checked={!!values[f.key]} onChange={(e) => setValue(f.key, e.target.checked)} />
              Done
            </label>
          )}
        </div>
      ))}

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={!requiredFilled}>
          <CheckCircle2 className="h-4 w-4" /> Submit
        </Button>
      </div>
    </div>
  )
}
