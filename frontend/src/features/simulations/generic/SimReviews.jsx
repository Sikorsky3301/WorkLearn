import RatingStars from '../../../components/ui/RatingStars'
import Avatar from '../../../components/ui/Avatar'
import { PLACEHOLDER_REVIEWS } from './placeholderReviews'

function initialsFor(name) {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

/** Student Reviews — aggregate rating (the simulation's own real
 * `rating`/`rating_count`) as a section header, followed by individual
 * review cards. See placeholderReviews.js for why the review content
 * itself is fictional placeholder copy rather than backend-sourced. */
export default function SimReviews({ rating, ratingCount }) {
  if (rating == null) return null

  return (
    <div className="mt-12">
      <h2 className="flex items-center gap-2 text-lg font-bold text-on-surface mb-1">
        <span className="h-4 w-1 rounded-full bg-primary shrink-0" />
        Student reviews
      </h2>
      <div className="flex items-center gap-2 mb-5 pl-3">
        <RatingStars rating={rating} count={ratingCount} size="sm" />
        <span className="text-sm text-on-surface-variant">
          {ratingCount > 0 ? `${ratingCount.toLocaleString()} ratings` : 'New simulation'}
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {PLACEHOLDER_REVIEWS.map((review) => (
          <div key={review.name} className="rounded-xl border border-border p-5 bg-white">
            <div className="flex items-center gap-3 mb-3">
              <Avatar initials={initialsFor(review.name)} size="lg" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-on-surface truncate">{review.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <RatingStars rating={review.rating} showCount={false} size="sm" />
                  <span className="text-xs text-on-surface-variant">{review.relativeTime}</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed">{review.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
