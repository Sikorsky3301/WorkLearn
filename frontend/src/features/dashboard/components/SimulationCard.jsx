import { useNavigate } from 'react-router-dom'
import { ArrowRight, ListChecks } from 'lucide-react'
import { SIM_BRANDING } from '../../../shared/simBranding'

/** One job-simulation row in JobSimulationsSection's domain groups.
 * `highlighted` gets a subtle ring — used for the student's preferred
 * domain, set during onboarding. */
export default function SimulationCard({ sim, highlighted }) {
  const navigate = useNavigate()
  const branding = SIM_BRANDING[sim.id]

  return (
    <div
      className={`group relative rounded-xl border bg-white shadow-sm overflow-hidden cursor-pointer transition-all hover:shadow-md hover:border-primary/40 ${
        highlighted ? 'border-primary/30' : 'border-border'
      }`}
      onClick={() => navigate(`/simulations/${sim.id}`)}
    >
      {/* Left accent rail rather than a full-width top bar — reads as a
          quieter category marker next to the content, not a banner. */}
      <span className={`absolute inset-y-0 left-0 w-1 ${branding?.accentColor ?? 'bg-primary'}`} aria-hidden="true" />

      <div className="p-5 pl-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-2">
              {branding?.logo && (
                <img src={branding.logo} alt="" className="h-5 w-auto max-w-[80px] object-contain shrink-0" />
              )}
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-on-surface-variant">
                <ListChecks className="h-3 w-3" /> {sim.tasks} tasks
              </span>
              {sim.estimated_hours && (
                <>
                  <span className="h-0.5 w-0.5 rounded-full bg-outline-variant" />
                  <span className="text-[11px] text-on-surface-variant">{sim.estimated_hours}</span>
                </>
              )}
            </div>

            <h3 className="font-bold text-on-surface text-base mb-1.5 group-hover:text-primary transition-colors">
              {sim.title}
            </h3>
            <p className="text-sm text-on-surface-variant leading-relaxed mb-3 line-clamp-2">
              {sim.description}
            </p>

            <div className="flex items-center gap-1.5 flex-wrap">
              {(sim.skills ?? []).slice(0, 4).map((s) => (
                <span key={s} className="text-[11px] font-medium bg-surface-low text-on-surface-variant px-2 py-0.5 rounded">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <button
            className="btn-primary text-sm px-4 py-2 shrink-0 self-center inline-flex items-center gap-1.5"
            onClick={(e) => { e.stopPropagation(); navigate(`/simulations/${sim.id}`) }}
          >
            Start <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
