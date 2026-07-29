import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQueries } from '@tanstack/react-query'
import { useSimulations, useEnrollment } from '../../shared/api/hooks'
import { api, resolveMediaUrl } from '../../shared/api/client'
import { resolveDomainIcon } from '../../shared/utils/domainIcons'
import DomainFilterBar from './DomainFilterBar'
import RatingStars from '../../shared/ui/RatingStars'

// Additional simulation types from the spec's landing page that aren't
// built yet — shown as non-interactive cards so the landing page reflects
// the intended catalog without overstating what's actually playable today.
const COMING_SOON_SIMULATIONS = [
  { id: 'inside-sales-exec', title: 'Inside Sales Executive', category: 'Sales', accent_color: 'bg-slate-400' },
  { id: 'account-exec', title: 'Account Executive', category: 'Sales', accent_color: 'bg-slate-400' },
  { id: 'bdr', title: 'Business Development Representative', category: 'Sales', accent_color: 'bg-slate-400' },
  { id: 'cs-associate', title: 'Customer Success Associate', category: 'Sales', accent_color: 'bg-slate-400' },
  { id: 'sales-ops', title: 'Sales Operations Specialist', category: 'Sales', accent_color: 'bg-slate-400' },
]

export default function SimulationWorkspace() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const enrolledOnly = searchParams.get('filter') === 'enrolled'
  const [selectedDomain, setSelectedDomain] = useState(() => searchParams.get('domain') || 'All')

  // Coming from the Navbar's domain mega-menu re-navigates to this same
  // route with a different `?domain=` — since the component doesn't
  // remount, sync the filter to match rather than leaving it stale.
  useEffect(() => {
    const domainParam = searchParams.get('domain')
    if (domainParam && domainParam !== selectedDomain) setSelectedDomain(domainParam)
  }, [searchParams])

  const { data, isLoading: simsLoading } = useSimulations()
  const simulations = data?.simulations || []

  // Check enrollment status across every simulation (not just the first) so
  // "My Enrolled Simulations" correctly reflects enrollment in any of them.
  const enrollmentQueries = useQueries({
    queries: simulations.map((sim) => ({
      queryKey: ['enrollment', sim.id],
      queryFn: () => api.get(`/api/enrollments/by-sim/${sim.id}`),
      retry: false,
      staleTime: 30_000,
    })),
  })
  const isLoading = simsLoading || enrollmentQueries.some((q) => q.isLoading)
  const isEnrolledAnywhere = enrollmentQueries.some((q) => !!q.data?.status)
  const showEmptyState = enrolledOnly && !isLoading && !isEnrolledAnywhere

  const domainFiltered = selectedDomain === 'All' ? simulations : simulations.filter((s) => s.domain === selectedDomain)
  const visibleSims = showEmptyState
    ? []
    : enrolledOnly
    ? domainFiltered.filter((sim) => {
        const i = simulations.indexOf(sim)
        return !!enrollmentQueries[i]?.data?.status
      })
    : domainFiltered

  return (
    <div className="max-w-container mx-auto px-6 py-8">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-on-surface mb-1">
          {enrolledOnly ? 'My Enrolled Simulations' : 'Simulations'}
        </h1>
        <p className="text-sm text-on-surface-variant">
          {enrolledOnly
            ? "Simulations you've started — pick up where you left off."
            : 'Enroll in a job simulation to start earning XP and skill points.'}
        </p>
      </div>

      {!enrolledOnly && <DomainFilterBar sims={simulations} selected={selectedDomain} onSelect={setSelectedDomain} />}

      {showEmptyState ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <p className="text-sm text-on-surface-variant mb-4">You haven't enrolled in any simulations yet.</p>
          <button onClick={() => navigate('/simulations')} className="btn-primary text-sm px-5 py-2.5">
            Browse all simulations
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          {visibleSims.map((sim) => (
            <SimCard key={sim.id} sim={sim} />
          ))}
          {!enrolledOnly && selectedDomain === 'All' && COMING_SOON_SIMULATIONS.map((sim) => (
            <ComingSoonCard key={sim.id} sim={sim} />
          ))}
        </div>
      )}
    </div>
  )
}

function SimCard({ sim }) {
  const navigate = useNavigate()
  const { data: enrollment, isLoading } = useEnrollment(sim.id)
  const DomainIcon = resolveDomainIcon(sim.domain || sim.category)

  const status = enrollment?.status
  const tasksDone = enrollment?.task_completions?.length ?? 0
  const progress = status ? Math.round((tasksDone / sim.tasks) * 100) : 0
  const overviewPath = `/simulations/${sim.id}/overview`

  const goToOverview = () => navigate(overviewPath)

  return (
    <div
      onClick={isLoading ? undefined : goToOverview}
      className={`card p-0 overflow-hidden flex flex-col group transition-all duration-200 ease-out hover:-translate-y-1.5 hover:shadow-xl hover:border-primary/50 ${isLoading ? '' : 'cursor-pointer'}`}
    >
      <div className={`h-1.5 w-full ${sim.accent_color || 'bg-primary'}`} />
      <div className="p-5 flex flex-col flex-1">

        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5 min-w-0">
            {sim.logo_url ? (
              <img src={resolveMediaUrl(sim.logo_url)} alt={sim.company} className="h-8 w-auto max-w-[100px] object-contain shrink-0" />
            ) : (
              <div className={`h-10 w-10 shrink-0 rounded-lg flex items-center justify-center text-white text-xs font-bold ${sim.accent_color || 'bg-primary'}`}>
                {(sim.company || sim.title).split(' ').map((w) => w[0]).slice(0, 2).join('')}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-bold text-on-surface truncate">{sim.company}</p>
              {sim.domain && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                  <DomainIcon className="h-2.5 w-2.5" /> {sim.domain}
                </span>
              )}
            </div>
          </div>
          {status && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded shrink-0 ${
              status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-primary/10 text-primary'
            }`}>
              {status === 'completed' ? 'Completed' : 'Enrolled'}
            </span>
          )}
        </div>

        <h2 className="text-base font-bold text-on-surface mb-1 group-hover:text-primary transition-colors">
          {sim.title}
        </h2>
        {sim.rating != null && <RatingStars rating={sim.rating} count={sim.rating_count} size="sm" />}
        <p className="text-sm text-on-surface-variant leading-relaxed mb-4 mt-1.5">
          {sim.description}
        </p>

        <div className="flex items-center gap-1.5 mb-4">
          <span className="chip">{sim.tasks} Tasks</span>
          <span className="chip">{sim.estimated_hours}</span>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {(sim.skills || []).map((s) => (
            <span key={s} className="text-xs bg-surface-high text-on-surface-variant px-2 py-0.5 rounded">{s}</span>
          ))}
        </div>

        {status && (
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-1.5 bg-surface-high rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs text-on-surface-variant shrink-0">{tasksDone} / {sim.tasks} tasks</span>
          </div>
        )}

        <div className="mt-auto pt-1">
          {isLoading ? (
            <div className="h-9 bg-surface-high rounded-lg animate-pulse" />
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); goToOverview() }}
              className="w-full btn-primary px-5 py-2.5 text-sm flex items-center justify-center gap-2"
            >
              {status === 'completed' ? 'Review' : status ? 'Continue →' : 'View Overview →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function ComingSoonCard({ sim }) {
  return (
    <div className="card p-0 overflow-hidden flex flex-col opacity-70">
      <div className={`h-1.5 w-full ${sim.accent_color}`} />
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`h-10 w-10 shrink-0 rounded-lg flex items-center justify-center text-white text-xs font-bold ${sim.accent_color}`}>
              {sim.title.split(' ').map((w) => w[0]).slice(0, 2).join('')}
            </div>
            <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-surface-high text-on-surface-variant">
              {sim.category}
            </span>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded shrink-0 bg-surface-high text-on-surface-variant">
            Coming Soon
          </span>
        </div>
        <h2 className="text-base font-bold text-on-surface mb-1">{sim.title}</h2>
        <p className="text-sm text-on-surface-variant leading-relaxed mb-4 flex-1">
          This job simulation is on our roadmap — check back soon.
        </p>
        <button disabled className="btn-secondary px-5 py-2.5 text-sm cursor-not-allowed">
          Not yet available
        </button>
      </div>
    </div>
  )
}
