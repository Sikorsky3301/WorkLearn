import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { SiCoursera, SiUdemy, SiEdx, SiKhanacademy } from 'react-icons/si'
import { HeroParallax } from '../../../components/ui/hero-parallax'
import { ThreeDGrid } from '../../../components/ui/three-d-grid'
import { Reveal, RevealGroup, RevealItem } from '../../../components/ui/reveal'
import { TextGenerateEffect } from '../../../components/ui/text-generate-effect'
import { useSimulations } from '../../../hooks'
import { SIM_BRANDING } from '../../../lib/simBranding'
import { CAREER_DOMAINS } from '../../../lib/careerDomains'
import { useMarketingLinks } from '../useMarketingLinks'
import { PARTNER_INSTITUTIONS } from '../data/trustPlaceholders'

const CREST_MARKS = [SiCoursera, SiUdemy, SiEdx, SiKhanacademy]

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

    const domainTiles = CAREER_DOMAINS.map(({ key, label, Icon }) => ({
      title: label,
      subtitle: 'Career area',
      link: '/simulations',
      Icon,
      key,
    }))

    return [...simTiles, ...domainTiles].slice(0, 15)
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

      {/* Trust strip. Names are placeholders; see data/trustPlaceholders.js. */}
      <section className="bg-white">
        <div className="max-w-container mx-auto px-6 pb-20 pt-10 border-t border-border">
          <Reveal as="p" className="eyebrow mb-6">Used by career teams at</Reveal>
          <RevealGroup className="flex flex-wrap items-center gap-x-12 gap-y-5" stagger={0.06}>
            {PARTNER_INSTITUTIONS.slice(0, 4).map((name, i) => {
              const Mark = CREST_MARKS[i % CREST_MARKS.length]
              return (
                <RevealItem key={name} className="flex items-center gap-2.5 text-on-surface-variant/60">
                  <Mark className="h-5 w-5 shrink-0" />
                  <span className="text-sm font-semibold">{name}</span>
                </RevealItem>
              )
            })}
          </RevealGroup>
          <Reveal as="p" className="text-[11px] text-on-surface-variant/50 mt-6">
            Illustrative institutions — partner names shown here are placeholders.
          </Reveal>
        </div>
      </section>
    </>
  )
}
