// Aceternity UI — Sticky Scroll Reveal, ported to plain JSX and reduced to
// its essentials.
//
// Departures from the source:
//   1. The original scrolls an inner `overflow-y-auto` container, nesting a
//      second scrollbar inside the page. This drives the same active-index
//      tracking off the *page* scroll with a `sticky` panel, so the page
//      keeps one natural scroll.
//   2. The source is a two-column split (copy left, panel right). All the
//      copy, headings and step tabs are gone: the panel is centred, full
//      width, and the only thing on screen. The product shot has to carry
//      the section on its own.
//   3. The panel is scroll-animated in — tilted back in perspective, then
//      flattening as the section arrives (the idea comes from Aceternity's
//      Container Scroll Animation). Steps swap with a directional slide.
//   4. A synthetic cursor tracks a per-step target inside the panel, so the
//      screens read as being operated rather than merely swapped.
//
// Sources: https://ui.aceternity.com/components/sticky-scroll-reveal
//          https://ui.aceternity.com/components/container-scroll-animation
import { useRef, useState } from 'react'
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
  useMotionValueEvent,
  useReducedMotion,
} from 'motion/react'
import { cn } from '../../lib/cn'

// Directional slide for the step swap. `custom` carries +1 when scrolling
// forward through the steps and -1 when scrolling back, so the outgoing panel
// always leaves the way you came from.
const SCREEN_VARIANTS = {
  enter: (d) => ({ opacity: 0, x: d >= 0 ? 44 : -44, y: 14, scale: 0.972 }),
  center: { opacity: 1, x: 0, y: 0, scale: 1 },
  exit: (d) => ({ opacity: 0, x: d >= 0 ? -44 : 44, y: -14, scale: 0.972 }),
}

// Expo-out. The long tail is the point: the incoming panel covers most of its
// distance early and then coasts, so the swap reads as one continuous move
// rather than a cut.
const SWAP_EASE = [0.16, 1, 0.3, 1]

// Loose and slightly overdamped — a hand moving a mouse arrives with a small
// settle, it does not snap onto the target.
const CURSOR_SPRING = { type: 'spring', stiffness: 55, damping: 17, mass: 1.15 }

const DEFAULT_CURSOR = { x: 50, y: 50 }

function Pointer() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5 drop-shadow-[0_1px_3px_rgba(16,24,40,0.45)]" aria-hidden="true">
      <path
        d="M4 2.2 15.6 9.4a.6.6 0 0 1-.13 1.09l-4.4 1.32a.6.6 0 0 0-.38.35l-1.8 4.3a.6.6 0 0 1-1.12-.08L3.36 3.0A.6.6 0 0 1 4 2.2Z"
        fill="#1b1b21"
        stroke="#ffffff"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * @param {Array<{id: string, content: React.ReactNode, cursor?: {x: number, y: number}}>} content
 *        `cursor` is a position in percent of the panel; the synthetic cursor
 *        travels there when that step becomes active.
 * @param {number} stepVh viewport heights of scroll each step occupies
 */
export const StickyScroll = ({ content, className, stepVh = 90 }) => {
  const ref = useRef(null)
  const reduceMotion = useReducedMotion()
  const [activeCard, setActiveCard] = useState(0)
  const [direction, setDirection] = useState(1)

  // 'start start' → 'end end': progress runs from the moment the section's top
  // reaches the viewport top (when the sticky child pins) to the moment its
  // bottom does (when it unpins) — a 1:1 map onto the time the panel is
  // actually pinned, so each step gets an equal share.
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  // A second range covering the *approach*. `scrollYProgress` is still 0
  // throughout that window, so the entrance needs its own.
  const { scrollYProgress: approach } = useScroll({ target: ref, offset: ['start end', 'start start'] })

  // Spring-smoothed so the tilt settles rather than tracking the wheel
  // one-to-one, which reads as jittery on a trackpad.
  const eased = useSpring(approach, { stiffness: 120, damping: 26, restDelta: 0.001 })

  const rotateX = useTransform(eased, [0, 1], [17, 0])
  const entryY = useTransform(eased, [0, 1], [72, 0])
  // A slow, monotonic drift across the whole pinned section. Without it the
  // panel is completely static between swaps and each change reads as a cut in
  // an otherwise motionless frame. Monotonic matters — a per-step drift would
  // snap back at every boundary.
  const driftY = useTransform(scrollYProgress, [0, 1], [14, -14])
  const y = useTransform([entryY, driftY], ([a, b]) => a + b)
  const scaleIn = useTransform(eased, [0, 1], [0.86, 1])
  const scaleOut = useTransform(scrollYProgress, [0.92, 1], [1, 0.955])
  const scale = useTransform([scaleIn, scaleOut], ([a, b]) => a * b)

  const railWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    const next = Math.min(Math.floor(latest * content.length), content.length - 1)
    setActiveCard((prev) => {
      if (prev === next) return prev
      setDirection(next > prev ? 1 : -1)
      return next
    })
  })

  const active = content[activeCard]
  const cursor = active.cursor ?? DEFAULT_CURSOR

  return (
    <div ref={ref} className={cn('relative', className)} style={{ height: `${content.length * stepVh}vh` }}>
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center px-4 pt-20 pb-10">
        <div className="w-full max-w-6xl flex-1 min-h-0 max-h-[640px]" style={{ perspective: '1400px' }}>
          <motion.div
            className="relative h-full w-full"
            style={
              reduceMotion
                ? undefined
                : { rotateX, y, scale, transformStyle: 'preserve-3d', transformOrigin: '50% 0%' }
            }
          >
            {/* Default (sync) mode: both panels are `absolute inset-0`, so the
                outgoing and incoming screens overlap and cross-slide. */}
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={active.id}
                custom={direction}
                variants={reduceMotion ? undefined : SCREEN_VARIANTS}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.62, ease: SWAP_EASE }}
                className="absolute inset-0"
              >
                {active.content}
              </motion.div>
            </AnimatePresence>

            {/* Synthetic cursor. Decorative — it points at whatever the current
                screen is demonstrating. Absolutely positioned, so animating
                left/top costs one element's layout and nothing else's. */}
            {!reduceMotion && (
              <motion.div
                className="pointer-events-none absolute z-20"
                initial={false}
                animate={{ left: `${cursor.x}%`, top: `${cursor.y}%` }}
                transition={CURSOR_SPRING}
                aria-hidden="true"
              >
                <Pointer />
                {/* Click ring — keyed on the step so it replays on arrival. */}
                <motion.span
                  key={active.id}
                  className="absolute left-0.5 top-0.5 block h-4 w-4 rounded-full border border-on-surface/40"
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{ opacity: [0, 0.55, 0], scale: [0.4, 2.6, 3.2] }}
                  transition={{ duration: 0.9, delay: 0.55, ease: 'easeOut' }}
                />
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Hairline progress rail — the only chrome left. No labels: it exists
            so the section reads as having a length, not to be read. */}
        <div className="mt-8 h-px w-full max-w-6xl bg-border" aria-hidden="true">
          <motion.span className="block h-full bg-on-surface/50" style={{ width: railWidth }} />
        </div>
      </div>
    </div>
  )
}
