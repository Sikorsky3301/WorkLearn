// Aceternity UI — Bento Grid, ported to plain JSX and restyled onto the
// brand's surface/border tokens (the source ships a neutral zinc palette and
// a dark-mode variant this app doesn't use outside the admin portals).
// Extended with a per-card `accent` and a `stats` footer, so a grid of cards
// can carry real figures instead of an icon and two lines of copy.
// Source: https://ui.aceternity.com/components/bento-grid
//
// The grid is also the scroll-reveal boundary: the cascade lives here rather
// than in the calling section because each card carries its own column/row
// span classes, so wrapping the cards from outside would put a plain div
// between the grid and its items and collapse the layout.
import { cn } from '../../lib/cn'
import { RevealGroup, RevealItem } from './reveal'

// Written out in full because Tailwind's JIT scans source text — it cannot
// see a class name assembled at runtime from `${accent}-200`.
//
// Cards are white and bordered like everything else; the accent appears only
// on the small icon tile. That is the whole colour budget per card — enough
// to tell them apart at a glance, not enough to make the grid loud.
const ACCENTS = {
  rose: 'bg-rose-50 text-rose-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  violet: 'bg-violet-50 text-violet-600',
  orange: 'bg-orange-50 text-orange-600',
  teal: 'bg-teal-50 text-teal-600',
}

export const BentoGrid = ({ className, children }) => (
  <RevealGroup className={cn('grid grid-cols-1 md:grid-cols-3 gap-4', className)}>{children}</RevealGroup>
)

/**
 * @param {'rose'|'emerald'|'amber'|'violet'|'orange'|'teal'} accent
 * @param {Array<{value: string, label: string}>} stats rendered as a footer strip
 */
export const BentoGridItem = ({ className, title, description, header, icon, accent = 'rose', stats }) => {
  const tile = ACCENTS[accent] ?? ACCENTS.rose

  return (
    <RevealItem className={cn('group/bento panel panel-interactive row-span-1 flex flex-col gap-4 p-5', className)}>
      {header}

      <div>
        <div className="flex items-center gap-2.5 mb-1.5">
          <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', tile)}>{icon}</span>
          <p className="text-[15px] font-bold leading-tight text-on-surface">{title}</p>
        </div>
        <p className="text-sm text-on-surface-variant leading-relaxed">{description}</p>
      </div>

      {stats && (
        <div className="mt-auto flex flex-wrap gap-x-7 gap-y-2 border-t border-border pt-3.5">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="font-mono text-sm font-bold leading-none text-on-surface">{s.value}</p>
              <p className="text-[10px] text-on-surface-variant mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}
    </RevealItem>
  )
}
