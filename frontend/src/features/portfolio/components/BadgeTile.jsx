import { Calendar } from 'lucide-react'

// Deterministic gradient theme per badge_key (not a fabricated rarity
// system — every badge of the same type always renders identically, but
// different badge types get visually distinct "achievement" treatments
// instead of one flat chip color).
const THEMES = [
  { grad: 'from-amber-300 via-yellow-400 to-amber-600', ring: 'ring-amber-200/70', glow: 'shadow-[0_10px_28px_-10px_rgba(217,119,6,0.55)]' },
  { grad: 'from-violet-400 via-purple-500 to-fuchsia-600', ring: 'ring-violet-200/70', glow: 'shadow-[0_10px_28px_-10px_rgba(147,51,234,0.5)]' },
  { grad: 'from-sky-400 via-blue-500 to-indigo-600', ring: 'ring-sky-200/70', glow: 'shadow-[0_10px_28px_-10px_rgba(37,99,235,0.5)]' },
  { grad: 'from-emerald-400 via-teal-500 to-green-600', ring: 'ring-emerald-200/70', glow: 'shadow-[0_10px_28px_-10px_rgba(5,150,105,0.5)]' },
]

function themeFor(key) {
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  return THEMES[hash % THEMES.length]
}

export default function BadgeTile({ badge }) {
  const theme = themeFor(badge.badge_key || badge.label || 'badge')

  return (
    <div
      className={`group relative flex flex-col items-center text-center p-4 rounded-2xl border border-border bg-white hover:-translate-y-1 transition-transform duration-200 ${theme.glow}`}
    >
      <div className={`relative w-16 h-16 rounded-full bg-gradient-to-br ${theme.grad} ring-4 ${theme.ring} flex items-center justify-center text-2xl shrink-0 mb-3 overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/25 to-white/0 opacity-0 group-hover:opacity-100 -translate-x-full group-hover:translate-x-full transition-all duration-700 ease-out" />
        <span className="relative drop-shadow-sm" aria-hidden="true">{badge.icon || '🏅'}</span>
      </div>
      <p className="text-xs font-bold text-on-surface leading-tight">{badge.label}</p>
      <p className="text-[10px] text-on-surface-variant mt-1 flex items-center gap-1">
        <Calendar className="h-2.5 w-2.5" />
        {new Date(badge.granted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
      </p>
    </div>
  )
}
