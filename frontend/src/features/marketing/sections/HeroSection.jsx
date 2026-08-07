import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { SiCoursera, SiUdemy, SiEdx, SiKhanacademy } from 'react-icons/si'
import { TextGenerateEffect } from '../../../components/ui/text-generate-effect'
import HeroIllustration from '../components/HeroIllustration'
import { useMarketingLinks } from '../useMarketingLinks'
import { PARTNER_INSTITUTIONS } from '../data/trustPlaceholders'

const CREST_MARKS = [SiCoursera, SiUdemy, SiEdx, SiKhanacademy]

export default function HeroSection() {
  const navigate = useNavigate()
  const { startPath, startLabel } = useMarketingLinks()

  return (
    <section className="relative overflow-hidden bg-white">
      {/* Very light grid, faded out at the edges — texture without weight. */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #eceaf2 1px, transparent 1px), linear-gradient(to bottom, #eceaf2 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 25%, #000 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 25%, #000 40%, transparent 100%)',
        }}
        aria-hidden="true"
      />

      {/* pt clears the fixed pill nav (see MarketingNav). */}
      <div className="relative max-w-container mx-auto px-6 pt-36 pb-16">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-16 items-center">
          <div>
            <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-primary mb-5">
              Job simulations for real careers
            </p>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-on-surface leading-[1.08] tracking-tight mb-6">
              Do the job before
              <br />
              you get the job
            </h1>

            <TextGenerateEffect
              words="Step into a real role at a real company. Take briefs from your manager, do the actual work, and get it graded — so you finish with proof, not just a certificate of attendance."
              className="text-base text-on-surface-variant leading-relaxed max-w-lg mb-9"
            />

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigate(startPath)}
                className="group inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold text-sm px-6 py-3.5 rounded-full shadow-lg shadow-primary/25 transition-all active:scale-[0.98] cursor-pointer"
              >
                {startLabel ?? 'Start free'}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <a
                href="#product-tour"
                className="group inline-flex items-center gap-2 border border-border hover:border-on-surface/30 bg-white text-on-surface font-bold text-sm px-6 py-3.5 rounded-full transition-colors"
              >
                See how it works
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>
          </div>

          <div className="hidden lg:block">
            <HeroIllustration />
          </div>
        </div>

        {/* Trust strip — mirrors the reference's "featured on" row. Names are
            placeholders; see data/trustPlaceholders.js. */}
        <div className="mt-20 pt-10 border-t border-border">
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/70 mb-6">
            Used by career teams at
          </p>
          <div className="flex flex-wrap items-center gap-x-10 gap-y-5">
            {PARTNER_INSTITUTIONS.slice(0, 4).map((name, i) => {
              const Mark = CREST_MARKS[i % CREST_MARKS.length]
              return (
                <div key={name} className="flex items-center gap-2.5 text-on-surface-variant/60">
                  <Mark className="h-5 w-5 shrink-0" />
                  <span className="text-sm font-bold">{name}</span>
                </div>
              )
            })}
          </div>
          <p className="text-[11px] text-on-surface-variant/50 mt-6">
            Illustrative institutions — partner names shown here are placeholders.
          </p>
        </div>
      </div>
    </section>
  )
}
