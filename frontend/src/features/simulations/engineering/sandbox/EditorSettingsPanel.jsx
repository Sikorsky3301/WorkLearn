import { useEffect, useRef } from 'react'
import { X, RotateCcw, Minus, Plus } from 'lucide-react'
import {
  FONT_STACKS, THEMES, FONT_SIZE_MIN, FONT_SIZE_MAX, DEFAULT_SETTINGS,
} from './useEditorSettings'

// Editor preferences.
//
// A panel floating over the top-right of the editor rather than a modal:
// changing the font size while you can still see the code is the entire point,
// and a dialog that covers the editor makes you close it to find out whether
// 16px was right. Every control applies immediately for the same reason —
// there is no Save, because there is nothing to commit.
//
// It is rendered against the editor surface, NOT anchored inside the toolbar
// next to its button, even though that's where a dropdown would normally sit.
// The toolbar scrolls horizontally, and an overflow container clips absolutely
// positioned descendants — anchored there, this panel rendered correctly and
// was then cut away to nothing, so the button appeared broken.

function Row({ label, hint, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <div className="min-w-0">
        <p className="text-xs font-bold text-slate-200">{label}</p>
        {hint && <p className="mt-0.5 text-[0.7rem] leading-snug text-slate-500">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-slate-600 bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-100 focus:border-primary focus:outline-none"
    >
      {options.map(([key, label]) => (
        <option key={key} value={key}>{label}</option>
      ))}
    </select>
  )
}

/** A switch.
 *
 * `p-0` and an explicit `left-0.5` are both load-bearing. A <button> carries
 * default user-agent padding, and the knob was positioned with `absolute` but
 * no `left` — so its origin fell back to its static position, which sits
 * INSIDE that padding. The knob started a few pixels in and its 16px of travel
 * then pushed it past the end of the track, which is what made the switch look
 * broken rather than toggled.
 *
 * Travel is the track minus the knob minus both insets: 36 - 16 - 4 = 16px,
 * which is translate-x-4 exactly. */
function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 shrink-0 rounded-full p-0 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
        checked ? 'bg-emerald-500' : 'bg-slate-600'
      }`}
    >
      <span
        aria-hidden="true"
        className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-150 ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

function Stepper({ value, min, max, step = 1, suffix = '', onChange }) {
  // Rounded HERE rather than in every caller: 1.2 + 0.1 is
  // 1.3000000000000003 in binary floating point, which would be stored as-is
  // and rendered in full. Snapping to the step's own precision keeps the
  // displayed value honest and the stored one clean.
  const decimals = String(step).split('.')[1]?.length ?? 0
  const snap = (n) => Number(Math.min(max, Math.max(min, n)).toFixed(decimals))

  return (
    <div className="flex items-center gap-1 rounded-lg border border-slate-600 bg-slate-800 p-0.5">
      <button
        type="button"
        onClick={() => onChange(snap(value - step))}
        disabled={value <= min}
        aria-label="Decrease"
        className="rounded-md p-1 text-slate-300 transition-colors hover:bg-slate-700 disabled:opacity-30"
      >
        <Minus className="h-3 w-3" />
      </button>
      <span className="min-w-[2.75rem] text-center font-mono text-xs font-bold tabular-nums text-slate-100">
        {value}{suffix}
      </span>
      <button
        type="button"
        onClick={() => onChange(snap(value + step))}
        disabled={value >= max}
        aria-label="Increase"
        className="rounded-md p-1 text-slate-300 transition-colors hover:bg-slate-700 disabled:opacity-30"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  )
}

export default function EditorSettingsPanel({ open, settings, update, reset, onClose }) {
  const ref = useRef(null)

  // Click-outside and Escape. A popover you can only close with its own X
  // button is a popover people leave open by accident.
  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => {
      if (ref.current?.contains(e.target)) return
      // The trigger is deliberately excluded. mousedown fires before click, so
      // without this a second press on the settings button would close the
      // panel here and its own onClick would immediately toggle it back open —
      // the button would look like it did nothing at all.
      if (e.target.closest?.('[data-settings-trigger]')) return
      onClose()
    }
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  const isDefault = JSON.stringify(settings) === JSON.stringify(DEFAULT_SETTINGS)

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Editor settings"
      className="absolute right-3 top-3 z-30 w-80 max-w-[calc(100%-1.5rem)] rounded-xl border border-slate-700 bg-slate-900 shadow-2xl"
    >
      <header className="flex items-center justify-between gap-3 border-b border-slate-700 px-4 py-3">
        <h2 className="font-display text-sm font-extrabold text-slate-100">Editor settings</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={reset}
            disabled={isDefault}
            title="Reset to defaults"
            className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200 disabled:opacity-30"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="max-h-[60vh] divide-y divide-slate-800 overflow-y-auto px-4 py-1">
        <Row label="Theme">
          <Select
            value={settings.theme}
            onChange={(theme) => update({ theme })}
            options={Object.entries(THEMES).map(([k, v]) => [k, v.label])}
          />
        </Row>

        <Row label="Font">
          <Select
            value={settings.fontFamily}
            onChange={(fontFamily) => update({ fontFamily })}
            options={Object.entries(FONT_STACKS).map(([k, v]) => [k, v.label])}
          />
        </Row>

        <Row label="Font size">
          <Stepper
            value={settings.fontSize}
            min={FONT_SIZE_MIN}
            max={FONT_SIZE_MAX}
            suffix="px"
            onChange={(fontSize) => update({ fontSize })}
          />
        </Row>

        <Row label="Line spacing">
          <Stepper
            value={settings.lineHeight}
            min={1.2}
            max={2.4}
            step={0.1}
            onChange={(lineHeight) => update({ lineHeight })}
          />
        </Row>

        <Row label="Tab size" hint="Spaces inserted per indent">
          <Stepper value={settings.tabSize} min={2} max={8} step={2} onChange={(tabSize) => update({ tabSize })} />
        </Row>

        <Row label="Word wrap" hint="Wrap long lines instead of scrolling sideways">
          <Toggle label="Word wrap" checked={settings.wordWrap} onChange={(wordWrap) => update({ wordWrap })} />
        </Row>

        <Row label="Line numbers">
          <Toggle label="Line numbers" checked={settings.lineNumbers} onChange={(lineNumbers) => update({ lineNumbers })} />
        </Row>

        <Row label="Minimap" hint="The code overview down the right edge">
          <Toggle label="Minimap" checked={settings.minimap} onChange={(minimap) => update({ minimap })} />
        </Row>

        <Row label="Bracket colours" hint="Tints matching brackets so pairs are easy to spot">
          <Toggle
            label="Bracket pair colourization"
            checked={settings.bracketPairColorization}
            onChange={(v) => update({ bracketPairColorization: v })}
          />
        </Row>

        <Row label="AI autocomplete" hint="Ghost-text suggestions; press Tab to accept">
          <Toggle
            label="AI autocomplete"
            checked={settings.autocomplete}
            onChange={(autocomplete) => update({ autocomplete })}
          />
        </Row>
      </div>

      <p className="border-t border-slate-800 px-4 py-2.5 text-[0.7rem] text-slate-500">
        Saved in this browser and used for every task.
      </p>
    </div>
  )
}
