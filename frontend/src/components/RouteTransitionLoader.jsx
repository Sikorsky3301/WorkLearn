import { useEffect, useState } from 'react'
import { useIsFetching } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'

// Wherever the Manager Briefing scene can be showing (see
// EngineeringTaskPage.jsx / ManagerBriefingScene.jsx) — it has its own
// presentation, and this spinner popping in on top of it reads as a bug,
// not a loading state, so it's suppressed on that route entirely.
const BRIEFING_ROUTE_PATTERN = /^\/simulations\/[^/]+\/task\/\d+$/

/** Loader shown only when a real fetch is actually taking a noticeable
 * amount of time — NOT on every navigation click regardless of whether
 * anything is loading. Most in-app navigation (Dashboard → Simulations,
 * etc.) is a synchronous route swap with nothing to wait on; forcing this to
 * show on every click regardless was pure theater with nothing real behind
 * it, and looked broken more than polished.
 *
 * Driven by React Query's global in-flight request count (useIsFetching),
 * gated behind a short delay before it's allowed to appear at all — a fetch
 * that resolves in under 300ms never shows anything; only a genuinely slow
 * one does. */
export default function RouteTransitionLoader() {
  // Boolean, not the raw count: useIsFetching() steps down 2→1→0 as parallel
  // queries resolve at different times, and depending on the count itself
  // would restart the debounce timer on every step — a page with several
  // queries could take well over 300ms end to end yet never accumulate an
  // uninterrupted 300ms window, so the loader would never show for a load
  // that was genuinely slow enough to warrant it. Depending on the boolean
  // instead means the effect only re-runs on the true idle↔fetching edge.
  const fetching = useIsFetching() > 0
  const { pathname } = useLocation()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!fetching) {
      setVisible(false)
      return undefined
    }
    const show = setTimeout(() => setVisible(true), 300)
    return () => clearTimeout(show)
  }, [fetching])

  if (!visible || BRIEFING_ROUTE_PATTERN.test(pathname)) return null

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none"
    >
      <span className="route-loader" />
    </div>
  )
}
