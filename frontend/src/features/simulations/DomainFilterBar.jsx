import { cn } from '../../shared/utils/cn'

/** Domain filter chips for the simulation picker — computed from whatever
 * distinct `domain` values are actually in use across published simulations
 * (IT, Business Development, Sales, Data Analytics, Engineering, ...),
 * rather than a hardcoded list, so a new CMS-authored domain shows up here
 * automatically. "All" is always first and selected by default. */
export default function DomainFilterBar({ sims, selected, onSelect }) {
  const domains = ['All', ...new Set(sims.map((s) => s.domain).filter(Boolean))].sort((a, b) =>
    a === 'All' ? -1 : b === 'All' ? 1 : a.localeCompare(b)
  )

  if (domains.length <= 2) return null // nothing meaningful to filter by yet

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {domains.map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => onSelect(d)}
          className={cn(
            'text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors',
            selected === d
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-on-surface-variant border-border hover:border-primary/50'
          )}
        >
          {d}
        </button>
      ))}
    </div>
  )
}
