// Aceternity UI — Sticky Scroll Reveal, ported to plain JSX and re-laid-out.
//
// Three departures from the source:
//   1. The original scrolls an inner `overflow-y-auto` container, which nests
//      a second scrollbar inside the page. This port drives the same
//      active-index tracking off the *page* scroll with a `sticky` panel, so
//      the page keeps one natural scroll.
//   2. The source is a two-column split (copy left, panel right), which caps
//      the panel at half the container. This lays the panel out centred and
//      full-width with the copy above it, so the product shot can be large
//      enough to actually read.
//   3. The panel is scroll-animated on the way in — it starts tilted back in
//      perspective and flattens as the section arrives, borrowing the idea
//      from Aceternity's Container Scroll Animation. Steps then swap with a
//      directional slide rather than a straight cross-fade.
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
  enter: (d) => ({ opacity: 0, x: d >= 0 ? 64 : -64, scale: 0.965 }),
  center: { opacity: 1, x: 0, scale: 1 },
  exit: (d) => ({ opacity: 0, x: d >= 0 ? -64 : 64, scale: 0.965 }),
}

const COPY_VARIANTS = {
  enter: { opacity: 0, y: 10 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
}

/**
 * @param {Array<{id: string, title: string, description: string, content: React.ReactNode}>} content
 * @param {number} stepVh viewport heights of scroll each step occupies
 */
export const StickyScroll = ({ content, className, stepVh = 90 }) => {
  const ref = useRef(null)
  const reduceMotion = useReducedMotion()
  const [activeCard, setActiveCard] = useState(0)
  const [direction, setDirection] = useState(1)

  // 'start start' → 'end end': progress runs from the moment the section's top
  // reaches the viewport top (which is when the sticky child pins) to the
  // moment its bottom does (when the child unpins). That maps 1:1 onto the
  // time the panel is actually pinned, so each step gets an equal share.
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  // A second range covering the *approach* — from the section's top entering
  // the viewport bottom to it reaching the viewport top. `scrollYProgress`
  // above is still 0 throughout this window, so the entrance needs its own.
  const { scrollYProgress: approach } = useScroll({ target: ref, offset: ['start end', 'start start'] })

  // Spring-smoothed so the tilt settles rather than tracking the wheel
  // one-to-one, which reads as jittery on a trackpad.
  const eased = useSpring(approach, { stiffness: 120, damping: 26, restDelta: 0.001 })

  const rotateX = useTransform(eased, [0, 1], [17, 0])
  const y = useTransform(eased, [0, 1], [72, 0])
  // Scale combines the entrance (0.86 → 1) with a slight settle-back over the
  // last 8% of the pinned scroll, so the panel recedes as the section hands
  // off to whatever follows instead of cutting.
  const scaleIn = useTransform(eased, [0, 1], [0.86, 1])
  const scaleOut = useTransform(scrollYProgress, [0.92, 1], [1, 0.955])
  const scale = useTransform([scaleIn, scaleOut], ([a, b]) => a * b)

  // Continuous scroll position within the section, for the progress rail.
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

  const scrollToStep = (i) => {
    if (!ref.current) return
    const { top, height } = ref.current.getBoundingClientRect()
    const start = window.scrollY + top
    // Land mid-slice so the step reads as settled, not mid-transition.
    window.scrollTo({
      top: start + (height * (i + 0.5)) / content.length - window.innerHeight / 2,
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
  }

  return (
    <div ref={ref} className={cn('relative', className)} style={{ height: `${content.length * stepVh}vh` }}>
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center pt-20 pb-8">

        {/* Step tabs, with a rail underneath tracking continuous progress */}
        <div className="w-full max-w-2xl px-4 mb-6">
          <div className="flex flex-wrap justify-center gap-1.5 mb-3">
            {content.map((item, i) => (
              <button
                key={item.id}
                onClick={() => scrollToStep(i)}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors duration-200 cursor-pointer',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                  activeCard === i
                    ? 'bg-on-surface text-white'
                    : 'bg-white text-on-surface-variant border border-border hover:border-on-surface/30'
                )}
                aria-current={activeCard === i ? 'step' : undefined}
              >
                {item.title}
              </button>
            ))}
          </div>
          <div className="h-0.5 w-full rounded-full bg-surface-highest overflow-hidden" aria-hidden="true">
            <motion.span className="block h-full rounded-full bg-on-surface" style={{ width: railWidth }} />
          </div>
        </div>

        {/* Copy — swaps with the panel. Fixed min-height so the panel doesn't
            jump when a description wraps to a different number of lines. */}
        <div className="relative min-h-[4.5rem] w-full max-w-2xl px-6 mb-6 text-center">
          <AnimatePresence initial={false} mode="wait">
            <motion.p
              key={active.id}
              variants={reduceMotion ? undefined : COPY_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="text-base sm:text-lg text-on-surface-variant leading-relaxed"
            >
              {active.description}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* The panel. The outer div owns the perspective; the inner motion.div
            is what tilts, so the transform has something to project against. */}
        <div
          className="w-full max-w-6xl px-4 flex-1 min-h-0 max-h-[620px]"
          style={{ perspective: '1400px' }}
        >
          <motion.div
            className="relative h-full w-full rounded-2xl"
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
                transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                {active.content}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
