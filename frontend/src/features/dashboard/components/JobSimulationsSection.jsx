import { resolveDomainIcon } from '../../../lib/domainIcons'
import SimulationCard from './SimulationCard'

/** Job simulations grouped by domain (Simulation.domain — the same filter
 * taxonomy SimulationWorkspace's DomainFilterBar uses), each group tagged
 * with a domain icon/header. If the student picked a preferred domain
 * during onboarding (see features/onboarding/), that group renders first
 * with a "Recommended for you" badge — everything else follows
 * alphabetically. Purely a display grouping; every simulation still shows
 * regardless of domain. */
export default function JobSimulationsSection({ simulations, loading, preferredDomain }) {
  if (loading) {
    return <div className="card card-shadow p-0 h-32 animate-pulse bg-surface-high" />
  }

  if (simulations.length === 0) {
    return (
      <div className="card card-shadow flex flex-col items-center justify-center py-10 text-center text-on-surface-variant">
        <p className="text-sm font-medium">No job simulations published yet — check back soon.</p>
      </div>
    )
  }

  const groups = new Map()
  for (const sim of simulations) {
    const key = sim.domain || 'Other'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(sim)
  }
  const domainNames = [...groups.keys()].sort((a, b) => {
    if (a === preferredDomain) return -1
    if (b === preferredDomain) return 1
    return a.localeCompare(b)
  })

  return (
    <div className="space-y-6">
      {domainNames.map((domain) => {
        const Icon = resolveDomainIcon(domain)
        const isPreferred = domain === preferredDomain
        return (
          <div key={domain}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${isPreferred ? 'bg-primary text-white' : 'bg-surface-low text-primary'}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <span className="text-sm font-bold text-on-surface">{domain}</span>
              {isPreferred && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  Recommended for you
                </span>
              )}
            </div>
            <div className="space-y-3">
              {groups.get(domain).map((sim) => (
                <SimulationCard key={sim.id} sim={sim} highlighted={isPreferred} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
