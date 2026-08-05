import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQueries } from '@tanstack/react-query'
import { Clock, ListChecks } from 'lucide-react'
import { useSimulations, useEnrollment } from '../../hooks'
import { api, resolveMediaUrl } from '../../lib/client'
import { resolveDomainIcon } from '../../lib/domainIcons'
import { cn } from '../../lib/cn'
import { SIM_BRANDING } from '../../lib/simBranding'
import DomainFilterBar from './DomainFilterBar'
import RatingStars from '../../components/ui/RatingStars'

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

// Enrollment.status is the backend's uppercase EnrollmentStatus enum value
// (ENROLLED/IN_PROGRESS/COMPLETED/DROPPED) — see app/models/__init__.py.
const isActiveStatus = (status) => status === 'ENROLLED' || status === 'IN_PROGRESS'
const isCompletedStatus = (status) => status === 'COMPLETED'

export default function SimulationWorkspace() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [statusTab, setStatusTab] = useState(() => (searchParams.get('filter') === 'enrolled' ? 'active' : 'all'))
  const [selectedDomain, setSelectedDomain] = useState(() => searchParams.get('domain') || 'All')

  // Coming from the Navbar's domain mega-menu (or "My Learning") re-navigates
  // to this same route with different params — since the component doesn't
  // remount, sync local state to match rather than leaving it stale.
  useEffect(() => {
    const domainParam = searchParams.get('domain')
    if (domainParam && domainParam !== selectedDomain) setSelectedDomain(domainParam)
    if (searchParams.get('filter') === 'enrolled' && statusTab !== 'active') setStatusTab('active')
  }, [searchParams])

  const { data, isLoading: simsLoading } = useSimulations()
  const simulations = data?.simulations || []

  // Check enrollment status across every simulation (not just the first) so
  // the Active/Completed tabs correctly reflect enrollment in any of them.
  const enrollmentQueries = useQueries({
    queries: simulations.map((sim) => ({
      queryKey: ['enrollment', sim.id],
      queryFn: () => api.get(`/api/enrollments/by-sim/${sim.id}`),
      retry: false,
      staleTime: 30_000,
    })),
  })
  const isLoading = simsLoading || enrollmentQueries.some((q) => q.isLoading)
  const statusOf = (sim) => enrollmentQueries[simulations.indexOf(sim)]?.data?.status

  const activeCount = simulations.filter((s) => isActiveStatus(statusOf(s))).length
  const completedCount = simulations.filter((s) => isCompletedStatus(statusOf(s))).length

  const TABS = [
    { key: 'all', label: 'All Simulations', count: simulations.length },
    { key: 'active', label: 'Active', count: activeCount },
    { key: 'completed', label: 'Completed', count: completedCount },
  ]

  const selectTab = (key) => {
    setStatusTab(key)
    const next = new URLSearchParams(searchParams)
    if (key === 'active') next.set('filter', 'enrolled')
    else next.delete('filter')
    setSearchParams(next, { replace: true })
  }

  const statusFiltered = simulations.filter((sim) => {
    if (statusTab === 'active') return isActiveStatus(statusOf(sim))
    if (statusTab === 'completed') return isCompletedStatus(statusOf(sim))
    return true
  })
  const visibleSims = selectedDomain === 'All' ? statusFiltered : statusFiltered.filter((s) => s.domain === selectedDomain)
  const showEmptyState = !isLoading && visibleSims.length === 0

  return (
    <div className="max-w-container mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-on-surface mb-1">Simulations</h1>
        <p className="text-sm text-on-surface-variant">
          Enroll in a job simulation to start earning XP and skill points.
        </p>
      </div>

      {/* Status tabs — All / Active / Completed, each with a live count */}
      <div className="flex items-center gap-6 border-b border-border mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => selectTab(t.key)}
            className={cn(
              'relative pb-3 text-sm font-semibold transition-colors cursor-pointer',
              statusTab === t.key ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
            )}
          >
            {t.label} <span className="tabular-nums">({String(t.count).padStart(2, '0')})</span>
            {statusTab === t.key && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-primary rounded-full" />}
          </button>
        ))}
      </div>

      <DomainFilterBar sims={simulations} selected={selectedDomain} onSelect={setSelectedDomain} />

      {showEmptyState ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <p className="text-sm text-on-surface-variant mb-4">
            {statusTab === 'active' && "You haven't enrolled in any simulations yet."}
            {statusTab === 'completed' && "You haven't completed any simulations yet."}
            {statusTab === 'all' && 'No simulations match this filter.'}
          </p>
          {statusTab !== 'all' && (
            <button onClick={() => selectTab('all')} className="btn-primary text-sm px-5 py-2.5">
              Browse all simulations
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleSims.map((sim) => (
            <SimCard key={sim.id} sim={sim} />
          ))}
          {statusTab === 'all' && selectedDomain === 'All' && COMING_SOON_SIMULATIONS.map((sim) => (
            <ComingSoonCard key={sim.id} sim={sim} />
          ))}
        </div>
      )}
    </div>
  )
}

function SimBanner({ sim }) {
  const DomainIcon = resolveDomainIcon(sim.domain || sim.category)
  const initials = (sim.company || sim.title).split(' ').map((w) => w[0]).slice(0, 2).join('')
  const banner = SIM_BRANDING[sim.slug]?.banner

  return (
    <div className={`relative h-36 overflow-hidden ${sim.accent_color || 'bg-primary'}`}>
      {banner ? (
        <>
          {/* Real stock photo (Unsplash, free license) picked to match this
              simulation's actual work — not a fabricated/AI image. Falls
              back to the accent-color treatment below for any simulation
              without a curated banner (e.g. a future CMS-authored one). */}
          <img src={banner} alt="" className="absolute inset-0 h-full w-full object-cover" />
          {/* Bottom scrim so the floating badges stay legible over any photo. */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/10" aria-hidden="true" />
        </>
      ) : (
        <>
          {/* No curated photo for this simulation — designed banner instead
              of a flat color block: faint dot-grid texture + oversized
              domain icon watermark. */}
          <div
            className="absolute inset-0 opacity-[0.08] pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1.5px, transparent 1.5px)', backgroundSize: '16px 16px' }}
            aria-hidden="true"
          />
          <DomainIcon className="absolute -right-3 -bottom-4 h-24 w-24 text-white/10 pointer-events-none" aria-hidden="true" />
          <div className="absolute inset-0 flex items-center justify-center p-6">
            {sim.logo_url ? (
              <img src={resolveMediaUrl(sim.logo_url)} alt={sim.company} className="max-h-14 max-w-[70%] object-contain drop-shadow-sm" />
            ) : (
              <span className="h-14 w-14 rounded-xl bg-white/95 shadow-md flex items-center justify-center text-lg font-bold text-on-surface">
                {initials}
              </span>
            )}
          </div>
        </>
      )}

      {/* Company logo badge, top-left — kept small over a photo banner
          rather than centered/huge, so it reads as a label, not a blocker. */}
      {banner && (
        <div className="absolute left-3 top-3 h-9 w-9 rounded-lg bg-white/95 shadow-md flex items-center justify-center p-1.5">
          {sim.logo_url ? (
            <img src={resolveMediaUrl(sim.logo_url)} alt={sim.company} className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="text-xs font-bold text-on-surface">{initials}</span>
          )}
        </div>
      )}

      {/* Floating difficulty badge — same visual slot a price tag would
          occupy on a course marketplace card. */}
      {sim.difficulty && (
        <span className="absolute right-3 bottom-3 text-xs font-bold text-on-surface bg-white rounded-lg px-2.5 py-1 shadow-md">
          {sim.difficulty}
        </span>
      )}
    </div>
  )
}

function SimCard({ sim }) {
  const navigate = useNavigate()
  const { data: enrollment, isLoading } = useEnrollment(sim.id)
  const status = enrollment?.status
  const tasksDone = enrollment?.task_completions?.length ?? 0
  const progress = status ? Math.round((tasksDone / sim.tasks) * 100) : 0
  const manager = sim.manager
  // Slug, not id — the overview page keys its per-sim branding (banner,
  // explainer video) off the slug, so a numeric URL silently drops them.
  const overviewPath = `/simulations/${sim.slug}/overview`
  const goToOverview = () => navigate(overviewPath)

  return (
    <div
      onClick={isLoading ? undefined : goToOverview}
      className={`card p-0 overflow-hidden flex flex-col group transition-all duration-200 ease-out hover:-translate-y-1.5 hover:shadow-xl hover:border-primary/50 ${isLoading ? '' : 'cursor-pointer'}`}
    >
      <div className="relative">
        <SimBanner sim={sim} />
        {/* top-right — top-left is the logo badge when there's a banner photo */}
        {isCompletedStatus(status) && (
          <span className="absolute right-3 top-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white shadow-sm">Completed</span>
        )}
        {isActiveStatus(status) && (
          <span className="absolute right-3 top-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-primary shadow-sm">Enrolled</span>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        {sim.domain && (
          <span className="inline-flex items-center gap-1 self-start text-[11px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary mb-2">
            {sim.domain}
          </span>
        )}
        <h2 className="text-base font-bold text-on-surface mb-1 group-hover:text-primary transition-colors">
          {sim.title}
        </h2>
        {sim.rating != null && <RatingStars rating={sim.rating} count={sim.rating_count} size="sm" />}
        <p className="text-sm text-on-surface-variant leading-relaxed mb-4 mt-1.5 line-clamp-2">
          {sim.description}
        </p>

        {status && (
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-1.5 bg-surface-high rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs text-on-surface-variant shrink-0">{tasksDone} / {sim.tasks} tasks</span>
          </div>
        )}

        {/* Meta row — rating/duration/tasks, divider-framed like a real
            course card's stat strip. */}
        <div className="flex items-center gap-3 text-xs text-on-surface-variant border-t border-border pt-3 mb-3">
          {sim.rating != null && (
            <span className="flex items-center gap-1">
              <span className="text-amber-500">★</span> {sim.rating.toFixed(1)}
            </span>
          )}
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {sim.estimated_hours}</span>
          <span className="flex items-center gap-1"><ListChecks className="h-3 w-3" /> {sim.tasks} Tasks</span>
        </div>

        {/* Instructor row — the simulation's own manager persona, not a
            fabricated stat. */}
        {manager?.name && (
          <div className="flex items-center justify-between gap-2 border-t border-border pt-3 mb-4">
            <div className="flex items-center gap-2 min-w-0">
              {manager.photo_url ? (
                <img src={resolveMediaUrl(manager.photo_url)} alt={manager.name} className="h-6 w-6 rounded-full object-cover shrink-0" />
              ) : (
                <span className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                  {manager.avatar || 'M'}
                </span>
              )}
              <span className="text-xs font-semibold text-on-surface truncate">{manager.name}</span>
            </div>
            {manager.role && <span className="text-[11px] text-on-surface-variant shrink-0 truncate max-w-[45%]">{manager.role}</span>}
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
              {isCompletedStatus(status) ? 'Review' : status ? 'Continue →' : 'View Overview →'}
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
