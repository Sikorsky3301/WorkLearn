// Aceternity UI — Hero Parallax, ported to plain JSX.
// Source: https://ui.aceternity.com/components/hero-parallax
//
// Departures from the source:
//   1. `next/image` and `next/link` become a plain `<img>` and react-router's
//      `Link` — this is a Vite SPA, not Next.
//   2. The header is a `children` slot rather than a hardcoded `<Header/>`, so
//      the marketing copy stays in features/marketing and this file stays a
//      reusable primitive.
//   3. Restyled light: the upstream card is a bare photo that goes black on
//      hover with white text over it. Here a card is a bordered panel and the
//      caption sits in a light scrim, matching the rest of the site.
//   4. `thumbnail` is optional. With one missing, the card renders a designed
//      tile (icon + label) instead of a broken image, so the grid can be
//      filled with real content rather than padded with repeats.
//
//   5. The header slot is layered above the rows. The rows open at
//      `translateY(-700)`, which puts them straight over the header — and
//      since they come later in the DOM with no z-index, they used to paint
//      on top of it. A card's caption scrim is a `via-white/85` gradient, so
//      an overlapping card washed the header's buttons out and swallowed
//      their clicks. The rows are backdrop, so they go behind.
//
//   6. Height is content-driven, not `h-[300vh]`. The fixed height existed
//      only to buy scroll range, but the rows are ~2000px of content, so on
//      anything but a short viewport it left hundreds of pixels of empty
//      white between the last row and whatever section came next — and the
//      taller the display, the worse the gap. `useScroll` measures whatever
//      the element actually is, so the range survives the change; it just
//      tracks the content instead of the window.
//
//      `pb-[22rem]` is not decoration: `translateY` settles at +300px, so the
//      rows come to rest that far below their layout box. The padding absorbs
//      it (leaving ~96px of real breathing room) and keeps `overflow-hidden`
//      from clipping the bottom row. Shrink it and the last row gets cut off.
//
// NOTE on `overflow-hidden` at the root: it is required here to clip the rows
// as they slide, and it is safe *only* because nothing inside is
// `position: sticky` — an overflow other than `visible` on an ancestor
// silently disables sticky. It also computes the root's `transform-style`
// down to `flat` (overflow is a grouping property), which is why plain
// z-index sorts these layers at all — under a live `preserve-3d` it would be
// ignored in favour of 3D position. `preserve-3d` was therefore inert and has
// been dropped rather than left to imply otherwise; the rotations below still
// project, since `perspective` applies to direct children regardless.
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, useSpring, useReducedMotion } from 'motion/react'
import { cn } from '../../lib/cn'

const SPRING = { stiffness: 300, damping: 30, bounce: 100 }

/**
 * @param {Array<{title: string, subtitle?: string, link: string, thumbnail?: string, Icon?: Function}>} products
 *        Laid out as three rows of five. Extra items past 15 are ignored.
 */
export const HeroParallax = ({ products, children, className }) => {
  const ref = useRef(null)
  const reduceMotion = useReducedMotion()

  const firstRow = products.slice(0, 5)
  const secondRow = products.slice(5, 10)
  const thirdRow = products.slice(10, 15)

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })

  const translateX = useSpring(useTransform(scrollYProgress, [0, 1], [0, 1000]), SPRING)
  const translateXReverse = useSpring(useTransform(scrollYProgress, [0, 1], [0, -1000]), SPRING)
  const rotateX = useSpring(useTransform(scrollYProgress, [0, 0.2], [15, 0]), SPRING)
  const opacity = useSpring(useTransform(scrollYProgress, [0, 0.2], [0.2, 1]), SPRING)
  const rotateZ = useSpring(useTransform(scrollYProgress, [0, 0.2], [20, 0]), SPRING)
  const translateY = useSpring(useTransform(scrollYProgress, [0, 0.2], [-700, 300]), SPRING)

  // Reduced motion: keep the layout and the content, drop the scroll-driven
  // 3D. The section collapses to a normal-height header plus a static grid.
  if (reduceMotion) {
    return (
      <section className={cn('relative overflow-hidden bg-white', className)}>
        {children}
        <div className="max-w-container mx-auto px-6 pb-20 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.slice(0, 6).map((p) => (
            <ProductCard key={p.title} product={p} static />
          ))}
        </div>
      </section>
    )
  }

  return (
    <section
      ref={ref}
      className={cn(
        'relative flex flex-col self-auto overflow-hidden bg-white pb-[22rem] antialiased',
        '[perspective:1000px]',
        className
      )}
    >
      <div className="relative z-10">{children}</div>

      <motion.div className="relative z-0" style={{ rotateX, rotateZ, translateY, opacity }}>
        <motion.div className="mb-16 flex flex-row-reverse space-x-16 space-x-reverse">
          {firstRow.map((product) => (
            <ProductCard product={product} translate={translateX} key={product.title} />
          ))}
        </motion.div>
        <motion.div className="mb-16 flex flex-row space-x-16">
          {secondRow.map((product) => (
            <ProductCard product={product} translate={translateXReverse} key={product.title} />
          ))}
        </motion.div>
        <motion.div className="flex flex-row-reverse space-x-16 space-x-reverse">
          {thirdRow.map((product) => (
            <ProductCard product={product} translate={translateX} key={product.title} />
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}

export const ProductCard = ({ product, translate, static: isStatic = false }) => {
  const { title, subtitle, link, thumbnail, Icon } = product

  const body = (
    <>
      {thumbnail ? (
        <img
          src={thumbnail}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-left-top"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface-low">
          {Icon && <Icon className="h-9 w-9 text-on-surface-variant/40" />}
          <span className="px-6 text-center text-sm font-semibold text-on-surface-variant/70">{title}</span>
        </div>
      )}

      {/* Caption scrim — always legible, deepening on hover rather than
          appearing from nothing (the upstream card hides its title until
          hover, which leaves the row unreadable at rest). */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/85 to-transparent p-5 pt-12">
        <p className="text-base font-bold leading-tight text-on-surface">{title}</p>
        {subtitle && <p className="mt-0.5 text-xs text-on-surface-variant">{subtitle}</p>}
      </div>
    </>
  )

  const shell = cn(
    'relative block h-full w-full overflow-hidden rounded-2xl border border-border bg-white',
    'shadow-panel transition-shadow duration-200 hover:shadow-panel-raised'
  )

  if (isStatic) {
    return (
      <div className="relative h-72">
        <Link to={link} className={shell}>
          {body}
        </Link>
      </div>
    )
  }

  return (
    <motion.div
      style={{ x: translate }}
      whileHover={{ y: -14 }}
      className="group/product relative h-80 w-[26rem] shrink-0"
    >
      <Link to={link} className={shell}>
        {body}
      </Link>
    </motion.div>
  )
}
