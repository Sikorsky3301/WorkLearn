// Scroll reveal — the marketing page's one entrance animation, in three
// pieces so every section can use the same motion instead of each inventing
// its own timing.
//
//   <Reveal>            one element, fades and rises as it scrolls in
//   <RevealGroup>       a grid/list wrapper that cascades its children
//   <RevealItem>        a child of RevealGroup; inherits the cascade
//
// There is deliberately no separate "on load" variant. `whileInView` fires
// immediately for anything already on screen, so the hero animates itself the
// moment it mounts and the sections below animate as they arrive — one
// mechanism, and the hero can never end up out of step with the rest.
//
// `once: true` throughout: this is an entrance, not an effect. Replaying it
// every time a section scrolls back past is the thing that makes a page feel
// like a demo reel.
//
// RevealItem carries `variants` but no trigger of its own — the cascade comes
// from the parent RevealGroup through motion's context. That also gives it a
// safe failure mode: a RevealItem rendered outside a group simply renders
// visible and static rather than staying stuck at opacity 0.
import { motion, useReducedMotion } from 'motion/react'

// Matches the crossfade in AppShowcaseSection, so the showcase's own motion
// and the reveals around it read as the same hand.
const EASE = [0.22, 1, 0.36, 1]
const DURATION = 0.55
const DISTANCE = 18

// A touch of bottom margin so an element starts moving just after its top
// edge clears the fold, rather than animating half-off-screen.
const VIEWPORT = { once: true, amount: 0.15, margin: '0px 0px -40px 0px' }

const ITEM = {
  hidden: { opacity: 0, y: DISTANCE },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION, ease: EASE } },
}

/**
 * @param {string} [as]    Tag to render — 'div', 'li', 'figure', 'button'…
 * @param {number} [delay] Seconds to hold before starting.
 * @param {number} [y]     Rise distance in px. Pass 0 for a straight fade.
 */
export const Reveal = ({ as = 'div', className, delay = 0, y = DISTANCE, children, ...rest }) => {
  const reduceMotion = useReducedMotion()
  const Tag = motion[as]

  if (reduceMotion) {
    return <Tag className={className} {...rest}>{children}</Tag>
  }

  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION, ease: EASE, delay }}
      viewport={VIEWPORT}
      {...rest}
    >
      {children}
    </Tag>
  )
}

/**
 * Cascades any `RevealItem` beneath it — including through intermediate
 * components, since propagation rides motion's context rather than the DOM.
 *
 * @param {number} [stagger] Seconds between each child starting.
 * @param {number} [delay]   Seconds before the first child starts.
 */
export const RevealGroup = ({ as = 'div', className, stagger = 0.08, delay = 0, children, ...rest }) => {
  const reduceMotion = useReducedMotion()
  const Tag = motion[as]

  if (reduceMotion) {
    return <Tag className={className} {...rest}>{children}</Tag>
  }

  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
      {...rest}
    >
      {children}
    </Tag>
  )
}

export const RevealItem = ({ as = 'div', className, children, ...rest }) => {
  const reduceMotion = useReducedMotion()
  const Tag = motion[as]

  if (reduceMotion) {
    return <Tag className={className} {...rest}>{children}</Tag>
  }

  return (
    <Tag className={className} variants={ITEM} {...rest}>
      {children}
    </Tag>
  )
}
