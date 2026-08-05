// Aceternity UI — Sticky Scroll Reveal, ported to plain JSX. The original
// scrolls an inner `overflow-y-auto` container, which nests a second
// scrollbar inside the page; this port drives the same active-card tracking
// off the *page* scroll with a `sticky` panel instead, so a marketing page
// keeps one natural scroll. Active-index maths (nearest breakpoint to the
// current progress) is unchanged from the source.
// Source: https://ui.aceternity.com/components/sticky-scroll-reveal
import { useRef, useState } from 'react'
import { motion, useScroll, useMotionValueEvent } from 'motion/react'
import { cn } from '../../lib/cn'

/**
 * @param {Array<{title: string, description: string, content?: React.ReactNode}>} content
 */
export const StickyScroll = ({ content, className, panelClassName }) => {
  const ref = useRef(null)
  const [activeCard, setActiveCard] = useState(0)

  const { scrollYProgress } = useScroll({
    target: ref,
    // Track from "top of the section reaches the viewport bottom" to
    // "bottom of the section reaches the viewport top" — the full time any
    // part of the section is on screen.
    offset: ['start end', 'end start'],
  })

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    // The section is only "reading" between ~25% and ~75% progress; map that
    // window onto the cards so the first card is active as the section
    // settles and the last is active before it leaves.
    const windowed = Math.min(Math.max((latest - 0.25) / 0.5, 0), 0.999)
    const next = Math.floor(windowed * content.length)
    setActiveCard((prev) => (prev === next ? prev : next))
  })

  return (
    <div ref={ref} className={cn('relative grid lg:grid-cols-2 gap-12 lg:gap-16', className)}>
      {/* Left: the scrolling copy */}
      <div>
        {content.map((item, i) => (
          <div key={item.title} className="min-h-[70vh] flex flex-col justify-center">
            <motion.div
              animate={{ opacity: activeCard === i ? 1 : 0.35 }}
              transition={{ duration: 0.3 }}
            >
              <span
                className={cn(
                  'inline-flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold mb-4 transition-colors',
                  activeCard === i ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'
                )}
              >
                {i + 1}
              </span>
              <h3 className="text-2xl font-extrabold text-on-surface tracking-tight mb-3">{item.title}</h3>
              <p className="text-base text-on-surface-variant leading-relaxed max-w-md">{item.description}</p>
            </motion.div>
          </div>
        ))}
      </div>

      {/* Right: the sticky "mini screen" that swaps as you scroll */}
      <div className="hidden lg:block">
        <div className={cn('sticky top-28 h-[420px]', panelClassName)}>
          {content.map((item, i) => (
            <motion.div
              key={item.title}
              initial={false}
              animate={{
                opacity: activeCard === i ? 1 : 0,
                scale: activeCard === i ? 1 : 0.96,
                pointerEvents: activeCard === i ? 'auto' : 'none',
              }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="absolute inset-0"
              aria-hidden={activeCard !== i}
            >
              {item.content}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
