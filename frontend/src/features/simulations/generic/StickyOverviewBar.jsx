import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { Star, ArrowRight, ListChecks, Clock } from 'lucide-react'

// The condensed header that appears once the hero has scrolled away.
//
// The overview page is long — outcomes, how it works, technology, curriculum,
// reviews — and by the time someone reaches the curriculum, the title and the
// enrol button are both far off-screen. This keeps the two things they need to
// act on within reach without following them down the page the whole time.
//
// Driven by an IntersectionObserver on a sentinel rather than a scroll
// listener: a scroll handler fires on every frame of every scroll and has to
// be throttled to stay cheap, while the observer fires exactly twice — once
// when the hero leaves, once when it comes back.

/** This bar's own height, for anything that has to sit clear of it.
 *
 * A constant rather than a measurement because the bar is UNMOUNTED while
 * hidden — there is nothing to measure at the moment other elements need to
 * reserve room for it, and a value that only becomes correct after the bar
 * appears would make everything below it jump on first scroll. Keep in step
 * with the padding and type sizes below. */
export const STICKY_BAR_HEIGHT = 64

/** Height of the app's sticky <header>, so this bar stacks beneath it.
 *
 * Measured rather than hardcoded: the Navbar's height changes with the XP
 * strip and with viewport width, and a fixed guess leaves either a visible gap
 * or an overlap that hides half of one bar. Falls back to a sane value when
 * there is no navbar at all (the workbench route renders without one). */
export function useNavbarHeight(fallback = 66) {
  const [height, setHeight] = useState(fallback)

  useEffect(() => {
    const nav = document.querySelector('header.sticky')
    if (!nav || typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(([entry]) => {
      setHeight(entry.target.getBoundingClientRect().height)
    })
    observer.observe(nav)
    setHeight(nav.getBoundingClientRect().height)
    return () => observer.disconnect()
  }, [])

  return height
}

/** True once `ref`'s element has scrolled out of view above the viewport. */
export function useScrolledPast(node) {
  const [past, setPast] = useState(false)

  useEffect(() => {
    if (!node || typeof IntersectionObserver === 'undefined') return undefined
    const observer = new IntersectionObserver(
      ([entry]) => setPast(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [node])

  return past
}

export default function StickyOverviewBar({
  visible, title, company, rating, ratingCount, taskCount, hours, ctaLabel, onCta,
}) {
  const reduceMotion = useReducedMotion()
  const top = useNavbarHeight()

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={reduceMotion ? { opacity: 1 } : { y: -64, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { y: -64, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          // z-40, under the navbar's z-50 — it slides out from behind it
          // rather than across it.
          className="fixed inset-x-0 z-40 border-b border-white/10 bg-[#0f1720] text-white shadow-lg"
          style={{ top }}
        >
          <div className="max-w-container mx-auto flex items-center gap-4 px-6 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-sm font-extrabold sm:text-base">{title}</p>

              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-white/55">
                {rating != null && (
                  <span className="flex items-center gap-1">
                    <span className="font-bold text-amber-300">{rating.toFixed(1)}</span>
                    <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
                    {ratingCount > 0 && (
                      <span className="ml-0.5">({ratingCount.toLocaleString()} ratings)</span>
                    )}
                  </span>
                )}
                {/* Hidden on the narrowest screens — the title and the button
                    are what this bar exists for; these are context, and a bar
                    that wraps to two lines defeats the point of condensing. */}
                <span className="hidden items-center gap-1 sm:flex">
                  <ListChecks className="h-3 w-3" /> {taskCount} tasks
                </span>
                {hours && (
                  <span className="hidden items-center gap-1 md:flex">
                    <Clock className="h-3 w-3" /> {hours}
                  </span>
                )}
                {company && <span className="hidden lg:inline">{company}</span>}
              </div>
            </div>

            <button
              onClick={onCta}
              className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-bold text-[#0f1720] transition-colors hover:bg-emerald-400"
            >
              {ctaLabel}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
