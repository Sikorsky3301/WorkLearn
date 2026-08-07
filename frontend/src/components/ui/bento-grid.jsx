// Aceternity UI — Bento Grid, ported to plain JSX and restyled onto the
// brand's surface/border tokens (the source ships a neutral zinc palette and
// a dark-mode variant this app doesn't use outside the admin portals).
// Extended with a per-card `accent` and a `stats` footer, so a grid of cards
// can carry real figures instead of an icon and two lines of copy.
// Source: https://ui.aceternity.com/components/bento-grid
import { cn } from '../../lib/cn'

// Written out in full because Tailwind's JIT scans source text — it cannot
// see a class name assembled at runtime from `${accent}-200`.
const ACCENTS = {
  rose: {
    card: 'border-rose-200/80 hover:border-rose-400 hover:shadow-rose-100',
    chip: 'bg-rose-50 text-rose-600 ring-rose-200',
    rule: 'bg-rose-500',
  },
  emerald: {
    card: 'border-emerald-200/80 hover:border-emerald-400 hover:shadow-emerald-100',
    chip: 'bg-emerald-50 text-emerald-600 ring-emerald-200',
    rule: 'bg-emerald-500',
  },
  amber: {
    card: 'border-amber-200/80 hover:border-amber-400 hover:shadow-amber-100',
    chip: 'bg-amber-50 text-amber-600 ring-amber-200',
    rule: 'bg-amber-500',
  },
  violet: {
    card: 'border-violet-200/80 hover:border-violet-400 hover:shadow-violet-100',
    chip: 'bg-violet-50 text-violet-600 ring-violet-200',
    rule: 'bg-violet-500',
  },
  orange: {
    card: 'border-orange-200/80 hover:border-orange-400 hover:shadow-orange-100',
    chip: 'bg-orange-50 text-orange-600 ring-orange-200',
    rule: 'bg-orange-500',
  },
  teal: {
    card: 'border-teal-200/80 hover:border-teal-400 hover:shadow-teal-100',
    chip: 'bg-teal-50 text-teal-600 ring-teal-200',
    rule: 'bg-teal-500',
  },
}

export const BentoGrid = ({ className, children }) => (
  <div className={cn('grid grid-cols-1 md:grid-cols-3 gap-4', className)}>{children}</div>
)

/**
 * @param {'rose'|'emerald'|'amber'|'violet'|'orange'|'teal'} accent
 * @param {Array<{value: string, label: string}>} stats rendered as a footer strip
 */
export const BentoGridItem = ({ className, title, description, header, icon, accent = 'rose', stats }) => {
  const a = ACCENTS[accent] ?? ACCENTS.rose

  return (
    <div
      className={cn(
        'group/bento relative row-span-1 rounded-xl border bg-white overflow-hidden flex flex-col',
        'transition-all duration-200 hover:shadow-lg',
        a.card,
        className
      )}
    >
      {/* Accent rule along the top edge — the card's colour identity even
          when the header visual is mostly neutral. */}
      <span className={cn('h-1 w-full shrink-0', a.rule)} aria-hidden="true" />

      <div className="flex flex-col gap-3 p-4 flex-1">
        {header}

        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1', a.chip)}>
              {icon}
            </span>
            <p className="text-[15px] font-bold text-on-surface leading-tight">{title}</p>
          </div>
          <p className="text-sm text-on-surface-variant leading-relaxed">{description}</p>
        </div>

        {stats && (
          <div className="mt-auto flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-3">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="font-mono text-sm font-extrabold text-on-surface leading-none">{s.value}</p>
                <p className="text-[10px] text-on-surface-variant mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
