import { ChevronDown } from 'lucide-react'

// Two controls, not one list: the track, then the rung on it.
//
// A single flat row of every role on the platform was fine when there were
// four (all Data Analyst) and does not survive three tracks — and the flat row
// is also what let two roles the backend had never heard of sit in the UI
// unnoticed. Both controls are built from the server's catalog.
export default function RoleSelector({ tracks, activeTrack, targetRole, onSelect }) {
  return (
    <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
      <Field label="Career track">
        <div className="inline-flex rounded-lg border border-border bg-surface-low p-0.5">
          {tracks.map((t) => {
            const isActive = activeTrack?.key === t.key
            return (
              <button
                key={t.key}
                onClick={() => onSelect(t.roles[0].key)}
                aria-pressed={isActive}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-white text-on-surface shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </Field>

      <Field label="Benchmark">
        <div className="relative">
          <select
            value={targetRole ?? ''}
            onChange={(e) => onSelect(e.target.value)}
            className="w-full appearance-none rounded-lg border border-border bg-white py-2 pl-3 pr-9 text-sm font-semibold text-on-surface transition-colors hover:border-outline-variant focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
          >
            {(activeTrack?.roles ?? []).map((r) => (
              <option key={r.key} value={r.key}>
                {r.label} · {r.skill_count} skills
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
        </div>
      </Field>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant">
        {label}
      </span>
      {children}
    </label>
  )
}
