// Aceternity UI — Multi Step Loader, ported to plain JSX.
// Source: https://ui.aceternity.com/components/multi-step-loader
//
// Departures from the source:
//   1. `loop` defaults to false and there is an `onComplete` callback. The
//      upstream default cycles the steps forever, which is fine for a demo
//      but would strand a real user on a loading screen that never resolves.
//   2. Light theme, brand tokens, and the check marks use lucide (already the
//      app's icon set) rather than inlined Heroicons paths.
//   3. Announced to assistive tech: the overlay is a `role="status"` live
//      region, so the current step is read out. The upstream markup is
//      invisible to a screen reader.
//   4. `prefers-reduced-motion` drops the per-step slide but keeps the step
//      list and its progression.
import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { CircleCheck, Circle } from 'lucide-react'
import { cn } from '../../lib/cn'

const LoaderCore = ({ loadingStates, value = 0, reduceMotion }) => (
  <div className="relative mx-auto flex max-w-xl flex-col justify-start">
    {loadingStates.map((state, index) => {
      // Steps fade out the further they are from the current one, so the list
      // reads as a focused window rather than a checklist.
      const distance = Math.abs(index - value)
      const opacity = Math.max(1 - distance * 0.28, 0)
      const done = index < value
      const current = index === value

      return (
        <motion.div
          key={state.text}
          className="mb-5 flex items-center gap-3 text-left"
          initial={reduceMotion ? false : { opacity: 0, y: -(value * 40) }}
          animate={{ opacity: reduceMotion ? Math.max(opacity, 0.35) : opacity, y: reduceMotion ? 0 : -(value * 40) }}
          transition={{ duration: 0.5 }}
        >
          {done || current ? (
            <CircleCheck className={cn('h-5 w-5 shrink-0', current ? 'text-primary' : 'text-emerald-600')} />
          ) : (
            <Circle className="h-5 w-5 shrink-0 text-outline-variant" />
          )}
          <span
            className={cn(
              'text-sm',
              current ? 'font-semibold text-on-surface' : 'text-on-surface-variant'
            )}
          >
            {state.text}
          </span>
        </motion.div>
      )
    })}
  </div>
)

/**
 * @param {Array<{text: string}>} loadingStates
 * @param {boolean} loading
 * @param {number} duration ms per step
 * @param {boolean} loop cycle forever instead of stopping on the last step
 * @param {() => void} onComplete fired once the last step has had its turn.
 *        Ignored when `loop` is true.
 */
export const MultiStepLoader = ({
  loadingStates,
  loading,
  duration = 1500,
  loop = false,
  onComplete,
}) => {
  const [currentState, setCurrentState] = useState(0)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (!loading) {
      setCurrentState(0)
      return
    }

    const last = loadingStates.length - 1

    // Past the last step there is nothing left to advance to — fire
    // `onComplete` on one final tick so the last line is actually readable
    // rather than flashing past.
    if (!loop && currentState >= last) {
      const done = setTimeout(() => onComplete?.(), duration)
      return () => clearTimeout(done)
    }

    const timeout = setTimeout(() => {
      setCurrentState((prev) => (loop ? (prev === last ? 0 : prev + 1) : Math.min(prev + 1, last)))
    }, duration)
    return () => clearTimeout(timeout)
  }, [currentState, loading, loop, duration, loadingStates.length, onComplete])

  return (
    <AnimatePresence mode="wait">
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-[100] flex h-full w-full items-center justify-center bg-white/80 backdrop-blur-xl"
        >
          <div className="relative h-72">
            <LoaderCore value={currentState} loadingStates={loadingStates} reduceMotion={reduceMotion} />
          </div>
          {/* Radial vignette so the steps drifting past the edges dissolve
              instead of being cut off. */}
          <div
            className="pointer-events-none absolute inset-0 z-20 bg-white"
            style={{ maskImage: 'radial-gradient(900px at center, transparent 30%, white)', WebkitMaskImage: 'radial-gradient(900px at center, transparent 30%, white)' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
