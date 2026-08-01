import { ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { SIM_BRANDING } from '../../../shared/simBranding'
import { resolveMediaUrl } from '../../../lib/client'

/** One completed job simulation, styled like a "case study" card — real
 * data only (title/company/accent color/logo all come from the backend's
 * simulation record, see useSimulations), no fabricated screenshot or
 * project description standing in for a project that doesn't exist yet. */
export default function CaseStudyCard({ sim }) {
  const navigate = useNavigate()
  const branding = SIM_BRANDING[sim.id]
  const logoSrc = sim.logo_url ? resolveMediaUrl(sim.logo_url) : branding?.logo

  return (
    <button
      onClick={() => navigate(`/simulations/${sim.id}/overview`)}
      className="group text-left rounded-xl overflow-hidden border border-border bg-white hover:-translate-y-1 hover:shadow-xl transition-all duration-200 cursor-pointer"
    >
      <div className={`h-32 p-4 flex flex-col justify-between relative overflow-hidden ${sim.accent_color || branding?.accentColor || 'bg-primary'}`}>
        <div
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 85% 15%, white 0, transparent 45%)' }}
        />
        <span className="relative w-fit text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-white/25 text-white backdrop-blur">
          Completed
        </span>
        <p className="relative text-white font-bold text-base leading-snug line-clamp-2">{sim.title}</p>
      </div>
      <div className="p-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          {logoSrc ? (
            <img src={logoSrc} alt={sim.company} className="h-4 w-auto max-w-[90px] object-contain" />
          ) : (
            <span className="text-xs font-bold text-on-surface truncate">{sim.company}</span>
          )}
        </div>
        <ExternalLink className="h-3.5 w-3.5 text-on-surface-variant group-hover:text-primary transition-colors shrink-0" />
      </div>
    </button>
  )
}
