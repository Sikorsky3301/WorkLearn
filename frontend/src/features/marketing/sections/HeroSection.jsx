import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { HeroParallax } from '../../../components/ui/hero-parallax'
import { ThreeDGrid } from '../../../components/ui/three-d-grid'
import { Reveal, RevealGroup, RevealItem } from '../../../components/ui/reveal'
import { TextGenerateEffect } from '../../../components/ui/text-generate-effect'
import { useSimulations } from '../../../hooks'
import { SIM_BRANDING } from '../../../lib/simBranding'
import { CAREER_DOMAINS } from '../../../lib/careerDomains'
import { InfiniteMovingCards } from '../../../components/ui/infinite-moving-cards'
import { useMarketingLinks } from '../useMarketingLinks'
import { INSTITUTIONS } from '../data/institutions'
import { TECHNOLOGIES } from '../data/technologies'

/** The parallax wants 15 tiles; only three simulations are published and only
 * those three have banner photographs. Rather than repeat those three five
 * times over — which reads as padding the moment you notice it — the real
 * simulations lead and the remaining tiles are career areas from the shared
 * catalogue, rendered as designed tiles. Every tile is real, every tile links
 * somewhere. As more simulations are published with banners they take the
 * front slots automatically and push the domain tiles back. */
function useParallaxProducts() {
  const { data } = useSimulations()
  const sims = data?.simulations ?? []

  return useMemo(() => {
    const simTiles = sims.map((sim) => ({
      title: sim.title,
      subtitle: sim.company,
      link: `/simulations/${sim.slug}/overview`,
      thumbnail: SIM_BRANDING[sim.slug]?.banner,
    }))

    // `thumbnail` is undefined for the domains with no photograph yet — the
    // card falls back to its designed icon tile, which is exactly what that
    // fallback exists for.
    const domainTiles = CAREER_DOMAINS.map(({ key, label, Icon, image }) => ({
      title: label,
      subtitle: 'Career area',
      link: '/simulations',
      thumbnail: image,
      Icon,
      key,
    }))

    // Photographed domains first. The list is longer than the 15 slots, so
    // whatever sits past the cut is never seen — and without this the order in
    // the catalogue decides which tiles get photographs, meaning a newly shot
    // domain low in the list would be added and still not appear. Sorting by
    // "has an image" puts every photograph on screen and lets the remaining
    // icon tiles fall off the end. Stable sort, so catalogue order is
    // preserved within each group.
    const photographedFirst = [...domainTiles].sort(
      (a, b) => Number(Boolean(b.thumbnail)) - Number(Boolean(a.thumbnail)),
    )

    return [...simTiles, ...photographedFirst].slice(0, 15)
  }, [sims])
}

export default function HeroSection() {
  const navigate = useNavigate()
  const { startPath, startLabel } = useMarketingLinks()
  const products = useParallaxProducts()

  return (
    <>
      <HeroParallax products={products}>
        {/* The grid is full-bleed and the copy is not, so the backdrop sits on
            this wrapper rather than on the container below it. Content comes
            after it in the DOM, which is what paints it on top — no z-index
            needed, and none wanted inside HeroParallax's 3D context. */}
        <div className="relative">
          {/* The backdrop fades up on its own — slower than the copy and with
              no rise, so it settles behind the words instead of racing them. */}
          <Reveal className="absolute inset-0" y={0} delay={0.1}>
            <ThreeDGrid />
          </Reveal>

          {/* pt clears the fixed pill nav (see MarketingNav). */}
          <RevealGroup className="relative max-w-container mx-auto w-full px-6 pt-36 pb-24" stagger={0.1}>
            <RevealItem as="p" className="eyebrow mb-5">
              Job simulations for real careers
            </RevealItem>

            <RevealItem
              as="h1"
              className="font-display text-4xl sm:text-5xl lg:text-[4rem] font-extrabold text-on-surface leading-[1.05] tracking-tight mb-6 max-w-3xl"
            >
              Do the job before
              <br />
              you get the job
            </RevealItem>

            {/* The words type themselves in; this only carries the block up
                into place underneath that. */}
            <RevealItem>
              <TextGenerateEffect
                words="Step into a real role at a real company. Take briefs from your manager, do the actual work, and get it graded — so you finish with proof, not just a certificate of attendance."
                className="text-base sm:text-lg text-on-surface-variant leading-relaxed max-w-2xl mb-9"
              />
            </RevealItem>

            <RevealItem className="flex flex-wrap items-center gap-3">
              <button onClick={() => navigate(startPath)} className="pill-btn-primary group">
                {startLabel ?? 'Start free'}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <a href="#the-app" className="pill-btn group">
                See how it works
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
            </RevealItem>
          </RevealGroup>
        </div>
      </HeroParallax>

      {/* Technology strip.
          Sits directly under the hero and above the institution crests: the
          headline claims you do the real job, and this is the first concrete
          answer to "with what?" — before the page asks anyone to take the
          claim on trust from a list of universities.
          Marks are monochrome so seventeen of them read as one texture rather
          than seventeen competing brands; each comes up to full strength on
          hover, so the strip is scenery until you actually look at it. */}
      <section className="border-t border-border bg-white">
        <div className="max-w-container mx-auto px-6 pb-14 pt-12">
          <Reveal as="h2" className="mb-8 text-center font-display text-lg font-extrabold tracking-tight text-on-surface sm:text-xl">
            Provides Job Simulations on Latest Technologies and Frameworks
          </Reveal>
        </div>
        {/* Full-bleed, outside the container — the marquee's fade mask needs
            the whole viewport width or the logos visibly appear and vanish at
            the container's edges instead of dissolving past them. */}
        <div className="pb-14">
          <InfiniteMovingCards
            items={TECHNOLOGIES.map(({ key, name, logo }) => ({ key, name, image: logo }))}
            variant="bare"
            direction="left"
            speed="slow"
          />
        </div>
      </section>

      {/* Recognition strip. These are REAL institutions and their real marks —
          see data/institutions.js before adding to the list. */}
      <section className="bg-white">
        <div className="max-w-container mx-auto px-6 pb-20 pt-10 border-t border-border">
          {/* Centred, unlike the left-aligned hero above it — the heading is
              centred with the row so it doesn't sit orphaned off to one side. */}
          <Reveal as="p" className="eyebrow mb-7 text-center">Recognized by top institutions</Reveal>
          {/* Crests are line-art seals, so they sit dimmed and desaturated at
              rest and come up to full strength on hover — the strip reads as
              texture while you're on the headline, and as specific names once
              you actually look at it. */}
          <RevealGroup className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8" stagger={0.06}>
            {INSTITUTIONS.map(({ key, name, logo }) => (
              <RevealItem key={key} className="group flex items-center gap-3">
                <img
                  src={logo}
                  alt={name}
                  loading="lazy"
                  className="h-12 w-auto max-w-[7rem] object-contain opacity-50 grayscale transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0"
                />
                <span className="text-sm font-semibold text-on-surface-variant/70 transition-colors group-hover:text-on-surface">
                  {name}
                </span>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>
    </>
  )
}
