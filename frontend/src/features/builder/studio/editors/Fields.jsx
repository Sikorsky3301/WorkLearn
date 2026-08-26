import { ChevronDown, GripVertical, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../../../../lib/cn'

// The field kit the studio's editors are built from.
//
// Every editor here needs the same four things: a labelled control with a line
// of guidance under the label, a repeatable list of sub-objects, a section
// that can be folded away, and a way to say what a field is FOR. Written once
// so the six editors read the same, and so guidance is a first-class part of a
// field rather than something an author has to already know.
//
// `help` is not decoration. Most of what went wrong in authored simulations
// was not a typo — it was an author who could not tell from the form what a
// field would do to a student. Every control below has room for that sentence
// and the editors fill it in.

export function Field({ label, help, children, className, required }) {
  return (
    <div className={className}>
      <label className="block">
        <span className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-on-surface-variant">
          {label}
          {required && <span className="ml-1 text-red-500" title="Required">*</span>}
        </span>
        {help && <span className="mt-0.5 block text-[0.72rem] leading-snug text-outline">{help}</span>}
        <span className="mt-1.5 block">{children}</span>
      </label>
    </div>
  )
}

const CONTROL = 'w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-on-surface ' +
  'outline-none transition-colors placeholder:text-outline/70 focus:border-primary focus:ring-2 focus:ring-primary/15'

export function TextInput({ className, ...props }) {
  return <input {...props} className={cn(CONTROL, className)} />
}

export function TextArea({ className, rows = 4, ...props }) {
  return <textarea rows={rows} {...props} className={cn(CONTROL, 'leading-relaxed', className)} />
}

export function CodeArea({ className, rows = 10, ...props }) {
  return (
    <textarea
      rows={rows}
      spellCheck={false}
      {...props}
      className={cn(CONTROL, 'font-mono text-[0.76rem] leading-relaxed', className)}
    />
  )
}

export function Select({ options, className, ...props }) {
  return (
    <select {...props} className={cn(CONTROL, 'cursor-pointer', className)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

/** One-per-line text, which is how every list field on a task is authored. */
export function LineList({ value = [], onChange, rows = 4, placeholder }) {
  return (
    <TextArea
      rows={rows}
      placeholder={placeholder}
      value={value.join('\n')}
      onChange={(e) => onChange(e.target.value.split('\n').map((l) => l.trim()).filter(Boolean))}
    />
  )
}

export function Toggle({ checked, onChange, label, help }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!!checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-start gap-3 rounded-lg border border-border bg-white px-3 py-2.5 text-left transition-colors hover:border-on-surface/25 cursor-pointer"
    >
      <span
        className={cn(
          'mt-0.5 flex h-4 w-7 shrink-0 items-center rounded-full p-0.5 transition-colors',
          checked ? 'bg-primary' : 'bg-surface-high'
        )}
      >
        <span className={cn('h-3 w-3 rounded-full bg-white transition-transform', checked && 'translate-x-3')} />
      </span>
      <span className="min-w-0">
        <span className="block text-[0.82rem] font-semibold text-on-surface">{label}</span>
        {help && <span className="mt-0.5 block text-[0.72rem] leading-snug text-outline">{help}</span>}
      </span>
    </button>
  )
}

/** A titled band of the page. Sections are the unit an author thinks in
 *  ("the brief", "the check"), so they get a rule and a name, not a card. */
export function Section({ title, hint, action, children, defaultOpen = true, collapsible = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="border-t border-border pt-6 first:border-t-0 first:pt-0">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          {collapsible ? (
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-1.5 cursor-pointer"
            >
              <h3 className="font-display text-[0.95rem] font-extrabold text-on-surface">{title}</h3>
              <ChevronDown className={cn('h-3.5 w-3.5 text-outline transition-transform', open && 'rotate-180')} />
            </button>
          ) : (
            <h3 className="font-display text-[0.95rem] font-extrabold text-on-surface">{title}</h3>
          )}
          {hint && <p className="mt-1 max-w-2xl text-[0.78rem] leading-relaxed text-on-surface-variant">{hint}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {(!collapsible || open) && children}
    </section>
  )
}

/** A repeatable list of sub-objects — steps, concepts, questions, rules.
 *  Handles add / remove / move, so an editor only describes ONE item. */
export function Repeater({
  items = [], onChange, renderItem, blank, addLabel = 'Add', empty,
  itemLabel = (_, i) => `Item ${i + 1}`,
}) {
  function update(index, patch) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }
  function remove(index) { onChange(items.filter((_, i) => i !== index)) }
  function move(index, delta) {
    const to = index + delta
    if (to < 0 || to >= items.length) return
    const next = [...items]
    const [row] = next.splice(index, 1)
    next.splice(to, 0, row)
    onChange(next)
  }

  return (
    <div className="space-y-3">
      {items.length === 0 && empty && (
        <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-[0.78rem] leading-relaxed text-outline">
          {empty}
        </p>
      )}

      {items.map((item, i) => (
        <div key={i} className="rounded-xl border border-border bg-white">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <GripVertical className="h-3.5 w-3.5 shrink-0 text-outline" />
            <p className="min-w-0 flex-1 truncate text-[0.72rem] font-bold uppercase tracking-wide text-on-surface-variant">
              {itemLabel(item, i)}
            </p>
            <button
              onClick={() => move(i, -1)} disabled={i === 0} title="Move up"
              className="rounded px-1 text-[0.7rem] font-bold text-outline transition-colors hover:text-on-surface disabled:opacity-25 cursor-pointer disabled:cursor-default"
            >
              ↑
            </button>
            <button
              onClick={() => move(i, 1)} disabled={i === items.length - 1} title="Move down"
              className="rounded px-1 text-[0.7rem] font-bold text-outline transition-colors hover:text-on-surface disabled:opacity-25 cursor-pointer disabled:cursor-default"
            >
              ↓
            </button>
            <button
              onClick={() => remove(i)} title="Remove"
              className="rounded p-1 text-outline transition-colors hover:text-red-500 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="space-y-3 p-3">
            {renderItem(item, i, (patch) => update(i, patch))}
          </div>
        </div>
      ))}

      <button
        onClick={() => onChange([...items, typeof blank === 'function' ? blank() : { ...blank }])}
        className="flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-[0.78rem] font-semibold text-on-surface-variant transition-colors hover:border-primary hover:text-primary cursor-pointer"
      >
        <Plus className="h-3.5 w-3.5" /> {addLabel}
      </button>
    </div>
  )
}

/** A short factual note attached to a control — used where a field has a
 *  consequence an author cannot see from the form. */
export function Note({ tone = 'info', children }) {
  const tones = {
    info: 'border-border bg-surface-low text-on-surface-variant',
    warn: 'border-amber-200 bg-amber-50 text-amber-900',
    danger: 'border-red-200 bg-red-50 text-red-900',
  }
  return (
    <p className={cn('rounded-lg border px-3 py-2 text-[0.75rem] leading-relaxed', tones[tone])}>
      {children}
    </p>
  )
}
