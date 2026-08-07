// Aceternity UI — Text Generate Effect, ported to plain JSX. Words fade (and
// optionally un-blur) in on a stagger, as if being written out.
// Two changes from the source: it only animates once the element is actually
// in view (the original fires on mount, so a mid-page instance has finished
// before you ever scroll to it), and it respects prefers-reduced-motion by
// rendering the finished text immediately.
// Source: https://ui.aceternity.com/components/text-generate-effect
import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion } from 'motion/react'
import { cn } from '../../lib/cn'

export const TextGenerateEffect = ({ words, className, filter = true, duration = 0.5, as: Tag = 'p' }) => {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const reduceMotion = useReducedMotion()
  const [start, setStart] = useState(false)

  useEffect(() => {
    if (inView) setStart(true)
  }, [inView])

  const wordsArray = words.split(' ')
  const animate = start && !reduceMotion

  return (
    <Tag ref={ref} className={cn(className)}>
      {wordsArray.map((word, idx) => (
        <motion.span
          key={`${word}-${idx}`}
          initial={reduceMotion ? false : { opacity: 0, filter: filter ? 'blur(8px)' : 'none' }}
          animate={animate ? { opacity: 1, filter: 'blur(0px)' } : undefined}
          transition={{ duration, delay: idx * 0.06 }}
          className="inline-block"
        >
          {word}
          {idx < wordsArray.length - 1 ? ' ' : ''}
        </motion.span>
      ))}
    </Tag>
  )
}
