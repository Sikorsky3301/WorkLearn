// Aceternity UI — Infinite Moving Cards, ported to plain JSX. The scroll
// engine (duplicate-content marquee, direction/speed via CSS custom
// properties, pause-on-hover) is unchanged from the source; the card content
// is adapted to render a logo image instead of a testimonial quote.
// Source: https://ui.aceternity.com/components/infinite-moving-cards
import React, { useEffect, useState, useRef } from 'react'
import { cn } from '../../lib/cn'

export const InfiniteMovingCards = ({
  items,
  direction = 'left',
  speed = 'slow',
  pauseOnHover = true,
  className,
}) => {
  const containerRef = useRef(null)
  const scrollerRef = useRef(null)
  const [start, setStart] = useState(false)

  useEffect(() => {
    if (containerRef.current && scrollerRef.current) {
      const scrollerContent = Array.from(scrollerRef.current.children)
      // Guard against React StrictMode's double-invoked mount effect re-running
      // this imperative DOM mutation and duplicating the track twice.
      if (scrollerContent.length === items.length) {
        scrollerContent.forEach((item) => {
          const duplicatedItem = item.cloneNode(true)
          scrollerRef.current.appendChild(duplicatedItem)
        })
      }

      containerRef.current.style.setProperty(
        '--animation-direction',
        direction === 'left' ? 'forwards' : 'reverse'
      )
      containerRef.current.style.setProperty(
        '--animation-duration',
        speed === 'fast' ? '20s' : speed === 'normal' ? '40s' : '80s'
      )
      setStart(true)
    }
  }, [direction, speed, items])

  return (
    <div
      ref={containerRef}
      className={cn(
        'scroller relative z-20 w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_10%,white_90%,transparent)]',
        className
      )}
    >
      <ul
        ref={scrollerRef}
        className={cn(
          'flex w-max min-w-full shrink-0 flex-nowrap items-center gap-4 py-4',
          start && 'animate-scroll',
          pauseOnHover && 'hover:[animation-play-state:paused]'
        )}
      >
        {items.map((item) => (
          <li
            key={item.name}
            className="mira-logo-card relative flex w-[160px] shrink-0 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-white px-6 py-6 shadow-sm"
          >
            {/* alt="" — decorative; the visible caption below already gives
                this card its accessible name, so a non-empty alt would have
                assistive tech announce (and text-extraction tools read) each
                tool's name twice in a row. */}
            <img src={item.image} alt="" className="h-12 w-12 object-contain grayscale opacity-60 transition-all duration-300" />
            <span className="text-xs font-semibold text-on-surface-variant">{item.name}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
