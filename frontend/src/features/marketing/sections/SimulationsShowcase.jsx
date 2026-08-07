import { useNavigate } from 'react-router-dom'
import { ArrowRight, Clock, ListChecks } from 'lucide-react'
import { useSimulations } from '../../../hooks'
import { SIM_BRANDING } from '../../../lib/simBranding'
import { resolveDomainIcon } from '../../../lib/domainIcons'
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
    <section id="simulations" className="bg-surface-low py-20">
      <div className="max-w-container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">The catalogue</p>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight mb-4">
            Start with a role that fits
          </h2>
          <p className="text-base text-on-surface-variant leading-relaxed">
            Every simulation is authored around work people are actually hired to do.
          </p>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-72 rounded-xl border border-border bg-surface-low animate-pulse" />
            ))}
          </div>
        ) : sims.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-5">
            {sims.slice(0, 6).map((sim) => {
              const DomainIcon = resolveDomainIcon(sim.domain)
              const banner = SIM_BRANDING[sim.slug]?.banner
              return (
                <button
                  key={sim.id}
                  onClick={() => navigate(`/simulations/${sim.slug}/overview`)}
                  className="group text-left rounded-xl border border-border overflow-hidden bg-white hover:shadow-lg hover:border-primary/40 transition-all cursor-pointer"
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
                </button>
              )
            })}
          </div>
        ) : (
          <p className="text-center text-sm text-on-surface-variant">
            New simulations are on the way — check back soon.
          </p>
        )}

        {/* Domains we build toward, from the shared catalogue. */}
        <div className="mt-14 pt-10 border-t border-border">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-6">
            Career areas you can build toward
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {CAREER_DOMAINS.map(({ key, label, Icon }) => (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-low px-3 py-1.5 text-xs font-semibold text-on-surface-variant"
              >
                <Icon className="h-3.5 w-3.5 text-primary" /> {label}
              </span>
            ))}
          </div>
        </div>

        <div className="text-center mt-10">
          <button
            onClick={() => navigate(signedIn ? '/simulations' : '/login')}
            className="btn-primary text-sm px-6 py-2.5 cursor-pointer"
          >
            Browse all simulations <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  )
}
