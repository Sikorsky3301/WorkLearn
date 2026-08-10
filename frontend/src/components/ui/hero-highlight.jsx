// Aceternity UI — Hero Highlight, ported to plain JSX.
// Source: https://ui.aceternity.com/components/hero-highlight
//
// Only `Highlight` is ported. The demo's other half is `HeroHighlight`, a
// full-bleed dot grid that lights up indigo under the cursor — that belongs
// to a hero, and this site's headings sit inside ordinary sections, so
// dropping a 40rem interactive backdrop behind each one would fight the
// layout rather than decorate it.
//
// Two changes from the source:
//   1. It sweeps when the heading scrolls into view rather than on mount.
//      The original fires 0.5s after mount with a 2s duration, so every
//      instance below the fold has finished before you ever reach it.
//   2. Restrained colour and timing: one soft brand-indigo wash over ~0.8s,
//      not a 2s indigo→purple gradient.
import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion } from 'motion/react'
import { cn } from '../../lib/cn'

/** Marker-pen sweep behind a phrase. Wrap the words to emphasise:
 *  `<h2>More than a <Highlight>course platform</Highlight></h2>` */
export const Highlight = ({ children, className }) => {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const reduceMotion = useReducedMotion()
  const [start, setStart] = useState(false)

  useEffect(() => {
    if (inView) setStart(true)
  }, [inView])

  return (
    <motion.span
      ref={ref}
      initial={reduceMotion ? false : { backgroundSize: '0% 100%' }}
      animate={start || reduceMotion ? { backgroundSize: '100% 100%' } : undefined}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      style={{
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'left center',
        display: 'inline',
      }}
      className={cn(
        'relative inline-block rounded-md bg-gradient-to-r from-primary/15 to-primary/5 px-1.5 pb-1',
        className
      )}
    >
      {children}
    </motion.span>
  )
}
