import { Star, StarHalf } from 'lucide-react'

/** Read-only 5-star rating display — `rating` (0-5, one decimal shown) and
 * an optional `count` (learners rated). Reused by the simulation overview
 * page, the picker card, and the admin preview tab so all three read the
 * same visual language. */
export default function RatingStars({ rating, count, size = 'md', showCount = true }) {
  if (rating == null) return null
  const full = Math.floor(rating)
  const hasHalf = rating - full >= 0.25 && rating - full < 0.75
  const roundedUp = rating - full >= 0.75
  const totalFull = full + (roundedUp ? 1 : 0)
  const iconSize = { sm: 'h-3.5 w-3.5', md: 'h-4 w-4', lg: 'h-5 w-5' }[size]
  const textSize = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' }[size]

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5 text-amber-400">
        {Array.from({ length: 5 }).map((_, i) => {
          if (i < totalFull) return <Star key={i} className={iconSize} fill="currentColor" />
          if (i === totalFull && hasHalf) return <StarHalf key={i} className={iconSize} fill="currentColor" />
          return <Star key={i} className={`${iconSize} text-outline/30`} />
        })}
      </div>
      <span className={`font-bold text-on-surface ${textSize}`}>{rating.toFixed(1)}</span>
      {showCount && count > 0 && (
        <span className={`text-on-surface-variant ${textSize}`}>({count.toLocaleString()})</span>
      )}
    </div>
  )
}
