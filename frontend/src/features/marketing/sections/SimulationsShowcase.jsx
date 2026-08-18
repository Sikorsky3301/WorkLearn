import { useNavigate } from 'react-router-dom'
import { ArrowRight, Clock, ListChecks } from 'lucide-react'
import { Highlight } from '../../../components/ui/hero-highlight'
import { Reveal, RevealGroup, RevealItem } from '../../../components/ui/reveal'
import { useSimulations } from '../../../hooks'
import { SIM_BRANDING } from '../../../lib/simBranding'
import { resolveDomainIcon, resolveDomainImage } from '../../../lib/domainIcons'
import RatingStars from '../../../components/ui/RatingStars'
import { CAREER_DOMAINS } from '../../../lib/careerDomains'
import { useMarketingLinks } from '../useMarketingLinks'

/** Real published simulations, straight from the same public endpoint the
 * app itself uses (`GET /api/simulations` needs no auth). Renders nothing
 * rather than a fake catalogue if none are published. */
export default function SimulationsShowcase() {
  const navigate = useNavigate()
  const { signedIn } = useMarketingLinks()
  const { data, isLoading } = useSimulations()
  const sims = data?.simulations ?? []

  return (
    <section id="simulations" className="bg-white py-20">
      <div className="max-w-container mx-auto px-6">
        <Reveal className="text-center max-w-2xl mx-auto mb-12">
          <p className="eyebrow mb-3">The catalogue</p>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight mb-4">
            Start with a <Highlight>role that fits</Highlight>
          </h2>
          <p className="text-base text-on-surface-variant leading-relaxed">
            Every simulation is authored around work people are actually hired to do.
          </p>
        </Reveal>

        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-72 rounded-2xl border border-border bg-surface-low animate-pulse" />
            ))}
          </div>
        ) : sims.length > 0 ? (
          /* Mounts only once the fetch resolves, so the cascade runs when the
             cards actually appear rather than against an empty grid. */
          <RevealGroup className="grid md:grid-cols-3 gap-5">
            {sims.slice(0, 6).map((sim) => {
              const DomainIcon = resolveDomainIcon(sim.domain)
              const banner = SIM_BRANDING[sim.slug]?.banner ?? resolveDomainImage(sim.domain)
              return (
                <RevealItem
                  as="button"
                  key={sim.id}
                  onClick={() => navigate(`/simulations/${sim.slug}/overview`)}
                  className="group panel panel-interactive text-left overflow-hidden"
                >
                  <div className="relative h-36 bg-surface-low overflow-hidden">
                    {banner ? (
                      <img src={banner} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className={`w-full h-full ${sim.accent_color || 'bg-primary'} flex items-center justify-center`}>
                        <DomainIcon className="h-8 w-8 text-white/40" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-semibold text-primary mb-1.5">{sim.company}</p>
                    <h3 className="text-base font-bold text-on-surface leading-snug mb-2">{sim.title}</h3>
                    {sim.rating != null && <RatingStars rating={sim.rating} count={sim.rating_count} size="sm" />}
                    <div className="flex items-center gap-4 text-xs text-on-surface-variant mt-3 pt-3 border-t border-border">
                      <span className="flex items-center gap-1.5"><ListChecks className="h-3.5 w-3.5" /> {sim.tasks} tasks</span>
                      <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {sim.estimated_hours}</span>
                    </div>
                  </div>
                </RevealItem>
              )
            })}
          </RevealGroup>
        ) : (
          <p className="text-center text-sm text-on-surface-variant">
            New simulations are on the way — check back soon.
          </p>
        )}

        {/* Domains we build toward, from the shared catalogue. */}
        <div className="mt-14 pt-10 border-t border-border">
          <Reveal as="p" className="text-center text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-6">
            Career areas you can build toward
          </Reveal>
          <RevealGroup className="flex flex-wrap items-center justify-center gap-2" stagger={0.04}>
            {CAREER_DOMAINS.map(({ key, label, Icon }) => (
              <RevealItem
                as="span"
                key={key}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-on-surface-variant"
              >
                <Icon className="h-3.5 w-3.5 text-on-surface-variant/60" /> {label}
              </RevealItem>
            ))}
          </RevealGroup>
        </div>

        <Reveal className="text-center mt-10">
          <button
            onClick={() => navigate(signedIn ? '/simulations' : '/login')}
            className="pill-btn-primary"
          >
            Browse all simulations <ArrowRight className="h-4 w-4" />
          </button>
        </Reveal>
      </div>
    </section>
  )
}
