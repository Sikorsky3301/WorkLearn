// Aceternity UI — Infinite Moving Cards, ported to plain JSX. The scroll
// engine (duplicate-content marquee, direction/speed via CSS custom
// properties, pause-on-hover) is unchanged from the source; the card content
// is adapted to render a logo image instead of a testimonial quote.
// Source: https://ui.aceternity.com/components/infinite-moving-cards
import React, { useEffect, useState, useRef } from 'react'
import { useReducedMotion } from 'motion/react'
import { cn } from '../../lib/cn'

export const InfiniteMovingCards = ({
  items,
  direction = 'left',
  speed = 'slow',
  pauseOnHover = true,
  className,
  // 'card' keeps the original bordered tile; 'bare' is a logo and a caption on
  // the page's own background, for strips that shouldn't read as a row of
  // objects. Added rather than forking the component: there is one marquee
  // engine here and it should stay that way.
  variant = 'card',
}) => {
  const containerRef = useRef(null)
  const scrollerRef = useRef(null)
  const [start, setStart] = useState(false)
  // An infinite marquee is exactly the kind of continuous motion that triggers
  // nausea for people with vestibular disorders, and it never stops on its own.
  // Honouring the OS setting means the logos render as a static row instead.
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    // No animation means no need for the duplicated track that makes the loop
    // seamless — and duplicating it anyway would show every logo twice in a
    // static row.
    if (reduceMotion) return
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
  }, [direction, speed, items, reduceMotion])

  const isBare = variant === 'bare'

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
          'flex w-max min-w-full shrink-0 items-center py-4',
          isBare ? 'gap-10' : 'gap-4',
          // Reduced motion turns the marquee into an ordinary row, so it has
          // to be allowed to wrap — otherwise the tail runs off the page with
          // no animation left to bring it back.
          reduceMotion ? 'w-full flex-wrap justify-center gap-y-6' : 'flex-nowrap',
          start && 'animate-scroll',
          pauseOnHover && !reduceMotion && 'hover:[animation-play-state:paused]'
        )}
      >
        {items.map((item) => (
          <li
            key={item.name}
            className={cn(
              'group relative flex shrink-0 items-center',
              isBare
                ? 'gap-2.5'
                : 'mira-logo-card w-[160px] flex-col justify-center gap-3 rounded-2xl border border-border bg-white px-6 py-6 shadow-sm'
            )}
          >
            {/* alt="" — decorative; the visible caption already gives this item
                its accessible name, so a non-empty alt would have assistive
                tech announce (and text-extraction tools read) each tool's name
                twice in a row. */}
            <img
              src={item.image}
              alt=""
              loading="lazy"
              className={cn(
                'object-contain transition-all duration-300',
                isBare
                  ? 'h-7 w-7 opacity-50 group-hover:opacity-100'
                  : 'h-12 w-12 grayscale opacity-60'
              )}
            />
            <span
              className={cn(
                'font-semibold transition-colors',
                isBare
                  ? 'whitespace-nowrap text-sm text-on-surface-variant group-hover:text-on-surface'
                  : 'text-xs text-on-surface-variant'
              )}
            >
              {item.name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
