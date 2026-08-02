import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Clock, ListChecks, BarChart3 } from 'lucide-react'
import { useSimulationFull, useEnrollment } from '../../../hooks'
import { resolveMediaUrl } from '../../../lib/client'
import { resolveDomainIcon } from '../../../lib/domainIcons'
import { Badge } from '../../../shared/ui/shadcn/badge'
import { Button } from '../../../shared/ui/shadcn/button'
import RatingStars from '../../../shared/ui/RatingStars'

function SectionHeading({ children }) {
  return (
    <h2 className="flex items-center gap-2 text-base font-bold text-on-surface mb-4">
      <span className="h-4 w-1 rounded-full bg-primary shrink-0" />
      {children}
    </h2>
  )
}

// Tasks arrive from the API already ordered by task_index; a simulation's
// tasks are authored in sequential week blocks (see backend migration data —
// week 1's tasks, then week 2's, etc.), so grouping consecutive same-week
// tasks together (rather than a bucket-by-key + re-sort) is both correct and
// preserves that authored order. `week` is nullable — sims that don't use
// week grouping at all fall out as a single group with `week: null`.
function groupByWeek(tasks) {
  const groups = []
  for (const t of tasks) {
    const week = t.week ?? null
    const last = groups[groups.length - 1]
    if (last && last.week === week) last.tasks.push(t)
    else groups.push({ week, tasks: [t] })
  }
  return groups
}

/** Generic pre-enrollment overview/detail page for any CMS-authored (or
 * migrated) simulation — replaces the 3 bespoke per-sim Overview pages.
 * Styled as a real course-landing page: a big editorial title with the
 * details underneath on the left, a logo/enrollment card on the right, and
 * the curriculum broken out week by week below — rather than a generic
 * hero band + stat-card grid. Stays entirely sim-agnostic — every value
 * rendered here comes from the CMS record. */
export default function GenericSimOverview() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { data: full, isLoading } = useSimulationFull(slug)
  const { data: enrollment } = useEnrollment(slug)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-low">
        <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!full) {
    return (
      <div className="max-w-container mx-auto px-6 py-16 text-center text-on-surface-variant">
        Simulation not found.
      </div>
    )
  }

  const { simulation, tasks } = full
  const manager = simulation.manager
  const DomainIcon = resolveDomainIcon(simulation.domain)
  const accent = simulation.accent_color || 'bg-primary'
  const sectionLabels = simulation.section_labels || {}
  const weekGroups = groupByWeek(tasks)

  // Enrollment.status is the backend's uppercase EnrollmentStatus enum
  // value ("COMPLETED", not "completed") — see app/models/__init__.py.
  const ctaLabel = enrollment?.status === 'COMPLETED' ? 'Review' : enrollment?.status ? 'Continue' : 'Start Simulation'

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-container mx-auto px-6 pt-6 pb-14">
        <button
          onClick={() => navigate('/simulations')}
          className="flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Simulations
        </button>

        {/* ── Header: big title + details on the left, logo/enrollment
            card on the right — a real course-landing layout, not a
            colored hero band. ── */}
        <div className="grid lg:grid-cols-[1fr_340px] gap-10 mb-14">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <Badge className="gap-1">
                <DomainIcon className="h-3 w-3" /> {simulation.domain}
              </Badge>
              <Badge variant="outline">{simulation.difficulty}</Badge>
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-on-surface leading-[1.05] tracking-tight mb-3">
              {simulation.title}
            </h1>
            <p className="text-base font-medium text-on-surface-variant mb-3">{simulation.company}</p>
            <RatingStars rating={simulation.rating} count={simulation.rating_count} />

            <p className="text-sm text-on-surface leading-relaxed mt-6 max-w-2xl">{simulation.description}</p>

            {/* Course details row — the "details below the title" */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-6 pt-6 border-t border-border">
              <span className="flex items-center gap-2 text-sm text-on-surface">
                <ListChecks className="h-4 w-4 text-primary shrink-0" />
                <span className="font-semibold">{tasks.length}</span> tasks
              </span>
              <span className="flex items-center gap-2 text-sm text-on-surface">
                <Clock className="h-4 w-4 text-primary shrink-0" />
                <span className="font-semibold">{simulation.estimated_hours}</span>
              </span>
              <span className="flex items-center gap-2 text-sm text-on-surface">
                <BarChart3 className="h-4 w-4 text-primary shrink-0" />
                <span className="font-semibold">{simulation.difficulty}</span> difficulty
              </span>
              {manager?.name && (
                <span className="flex items-center gap-2 text-sm text-on-surface-variant">
                  {manager.photo_url ? (
                    <img src={resolveMediaUrl(manager.photo_url)} alt={manager.name} className="h-5 w-5 rounded-full object-cover shrink-0" />
                  ) : (
                    <span className="h-5 w-5 rounded-full bg-primary text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                      {manager.avatar || 'M'}
                    </span>
                  )}
                  Led by <span className="font-semibold text-on-surface">{manager.name}</span>
                </span>
              )}
            </div>

            {simulation.skills?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-5">
                {simulation.skills.map((s) => (
                  <span key={s} className="chip bg-surface-container text-on-surface normal-case tracking-normal font-semibold">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: logo/enrollment card ── */}
          <div className="lg:sticky lg:top-6 h-fit">
            <div className="rounded-2xl border border-border shadow-lg overflow-hidden bg-white">
              <div className="p-6 pb-5">
                {simulation.logo_url ? (
                  <img
                    src={resolveMediaUrl(simulation.logo_url)}
                    alt={simulation.company}
                    className="h-14 max-w-full w-auto object-contain mx-auto mb-4"
                  />
                ) : (
                  <p className="text-2xl font-bold text-on-surface text-center mb-4">
                    {(simulation.company || simulation.title).split(' ').map((w) => w[0]).slice(0, 2).join('')}
                  </p>
                )}
                <p className="text-sm font-bold text-on-surface text-center mb-0.5">{simulation.company}</p>
                <p className="text-xs text-on-surface-variant text-center mb-4">{simulation.title}</p>

                <Button size="lg" className="w-full mb-4" onClick={() => navigate(`/simulations/${slug}`)}>
                  {ctaLabel} <ArrowRight className="h-4 w-4" />
                </Button>

                <ul className="space-y-2.5 text-sm text-on-surface border-t border-border pt-4">
                  <li className="flex items-center justify-between"><span className="text-on-surface-variant">Tasks</span><span className="font-semibold">{tasks.length}</span></li>
                  <li className="flex items-center justify-between"><span className="text-on-surface-variant">Duration</span><span className="font-semibold">{simulation.estimated_hours}</span></li>
                  <li className="flex items-center justify-between"><span className="text-on-surface-variant">Difficulty</span><span className="font-semibold">{simulation.difficulty}</span></li>
                  <li className="flex items-center justify-between"><span className="text-on-surface-variant">Domain</span><span className="font-semibold">{simulation.domain}</span></li>
                </ul>

                {manager?.name && (
                  <div className="flex items-center gap-3 border-t border-border pt-4 mt-4">
                    {manager.photo_url ? (
                      <img src={resolveMediaUrl(manager.photo_url)} alt={manager.name} className="h-10 w-10 rounded-full object-cover shrink-0" />
                    ) : (
                      <span className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-indigo-500 text-white flex items-center justify-center text-sm font-bold shrink-0">
                        {manager.avatar || 'M'}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs text-on-surface-variant leading-tight">Your manager</p>
                      <p className="text-sm font-bold text-on-surface truncate leading-tight mt-0.5">{manager.name}</p>
                      <p className="text-xs text-on-surface-variant truncate">{manager.role}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Curriculum — grouped by week, each task's objective spelled
            out so it's clear what gets learned before enrolling. ── */}
        <div>
          <SectionHeading>Curriculum</SectionHeading>
          <div className="space-y-8">
            {weekGroups.map((group, gi) => (
              <div key={gi}>
                {group.week != null && (
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-on-surface">
                      {sectionLabels[String(group.week)] || `Week ${group.week}`}
                    </h3>
                    <span className="text-xs text-on-surface-variant">
                      {group.tasks.length} task{group.tasks.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                <div className="rounded-xl border border-border divide-y divide-border overflow-hidden bg-white">
                  {group.tasks.map((t) => (
                    <div key={t.id} className="flex items-start gap-4 p-4 hover:bg-surface-low/60 transition-colors">
                      <span className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {t.task_index}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-on-surface">{t.title}</p>
                        {t.objective && <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{t.objective}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
