// Aceternity UI — Container Scroll Animation, ported to plain JSX.
// Source: https://ui.aceternity.com/components/container-scroll-animation
//
// Departures from the source:
//   1. The upstream bezel is a dark `#222` slab with a `#6C6C6C` border. This
//      site is white and minimal, so the frame is a light bezel on the
//      existing border token instead.
//   2. `useScroll({ target })` with no `offset` in the source means the
//      rotation only completes once the container's *bottom* passes the
//      viewport bottom — on a tall container the card is still tilted when
//      it's centred. An explicit offset lands it flat while it's on screen.
//   3. The isMobile check is a `matchMedia` listener rather than a `resize`
//      handler, so it doesn't run on every resize frame.
//   4. `prefers-reduced-motion` renders the card flat and static.
import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react'
import { cn } from '../../lib/cn'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return isMobile
}

export const ContainerScroll = ({ titleComponent, children, className }) => {
  const containerRef = useRef(null)
  const isMobile = useIsMobile()
  const reduceMotion = useReducedMotion()

  // 'start end' → 'end start' spans the whole time any part of the container
  // is on screen; the transforms below finish by 60% so the card is flat and
  // readable while it sits mid-viewport rather than at the very end.
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start end', 'end start'] })

  const rotate = useTransform(scrollYProgress, [0, 0.55], [22, 0])
  const scale = useTransform(scrollYProgress, [0, 0.55], isMobile ? [0.8, 0.95] : [0.88, 1])
  const translate = useTransform(scrollYProgress, [0, 0.55], [0, -80])

  return (
    <div ref={containerRef} className={cn('relative flex items-center justify-center py-16', className)}>
      <div className="relative w-full" style={{ perspective: '1000px' }}>
        <motion.div
          style={reduceMotion ? undefined : { translateY: translate }}
          className="mx-auto max-w-3xl text-center"
        >
          {titleComponent}
        </motion.div>

        <motion.div
          style={reduceMotion ? undefined : { rotateX: rotate, scale }}
          className={cn(
            'mx-auto mt-10 w-full max-w-6xl rounded-3xl border border-border bg-surface-low p-2 sm:p-3',
            'shadow-panel-raised'
          )}
        >
          <div className="h-[26rem] w-full overflow-hidden rounded-2xl bg-white sm:h-[36rem]">
            {children}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
