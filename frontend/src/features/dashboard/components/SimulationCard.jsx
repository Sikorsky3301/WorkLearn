import { useNavigate } from 'react-router-dom'
import { SIM_BRANDING } from './simBranding'
import { resolveDomainIcon } from '../../../shared/utils/domainIcons'

/** One job-simulation card in JobSimulationsSection's domain groups. Tagged
 * with its domain (not just the old bare category chip) so it's obvious
 * which domain group it belongs to even out of context (e.g. shared
 * elsewhere). `highlighted` gets a subtle ring — used for the student's
 * preferred domain, set during onboarding. */
export default function SimulationCard({ sim, highlighted }) {
  const navigate = useNavigate()
  const branding = SIM_BRANDING[sim.id]
  const DomainIcon = resolveDomainIcon(sim.domain || sim.category)

  return (
    <div
      className={`card card-shadow p-0 overflow-hidden hover:border-primary hover:shadow-md transition-all cursor-pointer group ${highlighted ? 'ring-2 ring-primary/15' : ''}`}
      onClick={() => navigate(`/simulations/${sim.id}`)}
    >
      <div className={`h-1.5 w-full ${branding?.accentColor ?? 'bg-primary'}`} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-2.5 flex-wrap">
              {branding?.logo && (
                <div className="h-8 w-8 shrink-0 rounded-lg border border-border bg-white flex items-center justify-center p-1">
                  <img src={branding.logo} alt={sim.title} className="max-h-full max-w-full object-contain" />
                </div>
              )}
              {sim.domain && (
                <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                  <DomainIcon className="h-3 w-3" /> {sim.domain}
                </span>
              )}
              <span className="chip">{sim.tasks} Tasks</span>
            </div>
            <h3 className="font-bold text-on-surface text-base mb-1 group-hover:text-primary transition-colors">
              {sim.title}
            </h3>
            <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
              {sim.description}
            </p>
            <div className="flex items-center gap-2 text-xs text-on-surface-variant flex-wrap">
              {(sim.skills ?? []).slice(0, 4).map((s) => (
                <span key={s} className="bg-surface-high px-2 py-0.5 rounded">{s}</span>
              ))}
            </div>
          </div>
          <button
            className="btn-primary text-sm px-5 py-2.5 shrink-0 self-center"
            onClick={(e) => { e.stopPropagation(); navigate(`/simulations/${sim.id}`) }}
          >
            Start →
          </button>
        </div>
      </div>
    </div>
  )
}
