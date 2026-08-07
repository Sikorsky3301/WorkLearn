// Aceternity UI — Animated Tooltip, ported to plain JSX. The spring-driven
// rotate/translate tied to cursor position is unchanged from the source; the
// avatar falls back to initials when an item has no image (these are
// placeholder people with no photo asset — see marketing/data/), and the
// tooltip is keyboard-reachable via focus, not hover only.
// Source: https://ui.aceternity.com/components/animated-tooltip
import { useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'motion/react'

export const AnimatedTooltip = ({ items }) => {
  const [hovered, setHovered] = useState(null)
  const x = useMotionValue(0)
  const springConfig = { stiffness: 100, damping: 5 }
  const rotate = useSpring(useTransform(x, [-100, 100], [-45, 45]), springConfig)
  const translateX = useSpring(useTransform(x, [-100, 100], [-50, 50]), springConfig)

  const onMove = (event) => {
    const halfWidth = event.currentTarget.offsetWidth / 2
    x.set(event.nativeEvent.offsetX - halfWidth)
  }

  return (
    <div className="flex items-center">
      {items.map((item) => (
        <div
          key={item.name}
          className="relative -mr-3 last:mr-0"
          onMouseEnter={() => setHovered(item.name)}
          onMouseLeave={() => setHovered(null)}
          onFocus={() => setHovered(item.name)}
          onBlur={() => setHovered(null)}
        >
          <AnimatePresence>
            {hovered === item.name && (
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.6 }}
                animate={{
                  opacity: 1, y: 0, scale: 1,
                  transition: { type: 'spring', stiffness: 260, damping: 10 },
                }}
                exit={{ opacity: 0, y: 16, scale: 0.6 }}
                style={{ translateX, rotate, whiteSpace: 'nowrap' }}
                className="absolute -top-16 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center rounded-lg bg-on-surface px-4 py-2 shadow-xl"
              >
                <div className="absolute inset-x-2 -bottom-px z-30 h-px w-1/5 bg-gradient-to-r from-transparent via-primary-light to-transparent" />
                <div className="relative z-30 text-sm font-bold text-white">{item.name}</div>
                <div className="text-xs text-white/60">{item.designation}</div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="button"
            onMouseMove={onMove}
            aria-label={`${item.name} — ${item.designation}`}
            className="relative block h-12 w-12 rounded-full border-2 border-white bg-primary text-white shadow-md transition-transform duration-300 hover:z-30 hover:scale-105 focus:z-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 cursor-pointer"
          >
            {item.image ? (
              <img src={item.image} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-xs font-bold">
                {item.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
              </span>
            )}
          </button>
        </div>
      ))}
    </div>
  )
}
