import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Clock, ListChecks, BarChart3 } from 'lucide-react'
import { useSimulationFull, useEnrollment } from '../../../hooks'
import { resolveMediaUrl } from '../../../lib/client'
import { resolveDomainIcon } from '../../../lib/domainIcons'
import { SIM_BRANDING } from '../../../lib/simBranding'
import { Badge } from '../../../components/ui/shadcn/badge'
import { Button } from '../../../components/ui/shadcn/button'
import RatingStars from '../../../components/ui/RatingStars'
import Avatar from '../../../components/ui/Avatar'
import WhatYoullLearn from './WhatYoullLearn'
import SimReviews from './SimReviews'
import SimPricing from './SimPricing'
import SimExplainerVideo from './SimExplainerVideo'
import CodingEnvironmentPreview from './CodingEnvironmentPreview'

function SectionHeading({ children }) {
  return (
    <h2 className="flex items-center gap-2 text-lg font-bold text-on-surface mb-4">
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
 * Laid out like a real course-detail page: a dark editorial hero band, a
 * stat strip straddling its lower edge, then each content area (what you'll
 * learn / skills / curriculum / reviews) as its own visually separated
 * block, with a sticky enrollment card overlapping up into the hero.
 * Stays entirely sim-agnostic — every value rendered comes from the CMS
 * record. */
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
  // Cosmetic per-sim banner (client-side only, see lib/simBranding.js) —
  // heads the enrollment card the way a course page leads with its preview
  // image. `accent_color` is the fallback wash when a sim has no banner.
  // Key branding off the record's own slug, never the URL param — the URL
  // may carry the numeric id instead (several nav links build it from
  // sim.id, and the backend resolves either), which would silently miss
  // every SIM_BRANDING entry and drop the banner/video with no error.
  const branding = SIM_BRANDING[simulation.slug] || {}
  const banner = branding.banner
  const explainerVideo = branding.explainerVideo
  const accent = simulation.accent_color || 'bg-primary'
  // Only advertise the code sandbox on simulations that actually use it —
  // a sales/CRM sim has no code_sandbox tasks and shouldn't show an editor.
  const hasCodeSandbox = tasks.some((t) => t.type === 'code_sandbox')
  const sectionLabels = simulation.section_labels || {}
  const weekGroups = groupByWeek(tasks)

  // Enrollment.status is the backend's uppercase EnrollmentStatus enum
  // value ("COMPLETED", not "completed") — see app/models/__init__.py.
  const ctaLabel = enrollment?.status === 'COMPLETED' ? 'Review' : enrollment?.status ? 'Continue' : 'Start Simulation'

  return (
    <div className="bg-white min-h-screen">
      {/* ── Hero band — dark and editorial. The enrollment card overlaps up
          into it from the body below, so the hero text reserves room on the
          right at lg+ rather than running underneath the card. ── */}
      <div className="bg-gradient-to-br from-[#151046] via-primary-dark to-[#0f0d2e] text-white">
        <div className="max-w-container mx-auto px-6 pt-6 pb-16">
          <button
            onClick={() => navigate('/simulations')}
            className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors mb-7 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" /> Simulations
          </button>

          <div className="lg:pr-[400px]">
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <Badge className="gap-1 bg-white/10 text-white border-transparent hover:bg-white/20">
                <DomainIcon className="h-3 w-3" /> {simulation.domain}
              </Badge>
              <Badge variant="outline" className="border-white/25 text-white/80">
                {simulation.difficulty}
              </Badge>
            </div>

            <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-2.5">
              {simulation.company}
            </p>

            {/* Title — size, weight and tracking deliberately unchanged. */}
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-[1.05] tracking-tight mb-4">
              {simulation.title}
            </h1>

            <p className="text-base text-white/75 leading-relaxed max-w-2xl mb-6">
              {simulation.description}
            </p>

            {manager?.name && (
              <div className="flex items-center gap-2 text-sm text-white/70 mb-6">
                <Avatar
                  src={manager.photo_url ? resolveMediaUrl(manager.photo_url) : null}
                  alt={manager.name}
                  initials={manager.avatar || 'M'}
                  size="xs"
                  className="bg-white/20"
                />
                Led by <span className="font-semibold text-white">{manager.name}</span>
                {manager.role && <span className="text-white/40">· {manager.role}</span>}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/70">
              <span className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 shrink-0" />
                <span className="font-semibold text-white">{tasks.length}</span> tasks
              </span>
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0" />
                <span className="font-semibold text-white">{simulation.estimated_hours}</span>
              </span>
              <span className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 shrink-0" />
                <span className="font-semibold text-white">{simulation.difficulty}</span> difficulty
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-container mx-auto px-6 pb-16">
        <div className="grid lg:grid-cols-[1fr_360px] gap-10 items-start">
          <div className="min-w-0">
            {/* Stat strip — straddles the hero's lower edge. */}
            {simulation.rating != null && (
              <div className="-mt-8 mb-10 rounded-xl border border-border bg-white shadow-lg px-6 py-5 flex flex-wrap items-center gap-x-10 gap-y-5">
                <div>
                  <p className="text-2xl font-extrabold text-on-surface leading-none mb-1.5">
                    {simulation.rating.toFixed(1)}
                  </p>
                  <RatingStars rating={simulation.rating} showCount={false} size="sm" />
                  {simulation.rating_count > 0 && (
                    <p className="text-xs text-on-surface-variant mt-1.5">
                      {simulation.rating_count.toLocaleString()} ratings
                    </p>
                  )}
                </div>
                <div className="lg:border-l lg:border-border lg:pl-10">
                  <p className="text-2xl font-extrabold text-on-surface leading-none mb-1.5">{tasks.length}</p>
                  <p className="text-xs text-on-surface-variant">graded tasks</p>
                </div>
                <div className="lg:border-l lg:border-border lg:pl-10">
                  <p className="text-2xl font-extrabold text-on-surface leading-none mb-1.5">
                    {simulation.estimated_hours}
                  </p>
                  <p className="text-xs text-on-surface-variant">to complete</p>
                </div>
              </div>
            )}

            <WhatYoullLearn skills={simulation.skills} />

            <SimExplainerVideo
              src={explainerVideo}
              poster={banner}
              title={simulation.title}
              company={simulation.company}
            />

            {hasCodeSandbox && <CodingEnvironmentPreview />}

            {/* ── Skills — its own block, separated from the checklist above. ── */}
            {simulation.skills?.length > 0 && (
              <div className="mt-12">
                <SectionHeading>Skills you'll build</SectionHeading>
                <div className="flex flex-wrap gap-1.5">
                  {simulation.skills.map((s) => (
                    <span key={s} className="chip bg-surface-container text-on-surface normal-case tracking-normal font-semibold">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ── Curriculum — grouped by week, each task's objective spelled
                out so it's clear what gets learned before enrolling. ── */}
            <div className="mt-12">
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

            <SimReviews rating={simulation.rating} ratingCount={simulation.rating_count} />
          </div>

          {/* ── Right: enrollment card, pulled up over the hero band. Leads
              with the simulation's banner image (a course page's preview
              slot), not the company logo — the company is named in the hero
              and again just below the CTA. ── */}
          <div className="lg:-mt-[340px] lg:sticky lg:top-6 h-fit">
            <div className="rounded-2xl border border-border shadow-xl overflow-hidden bg-white">
              {banner ? (
                <img src={banner} alt="" className="w-full h-44 object-cover" />
              ) : (
                <div className={`w-full h-44 ${accent} flex items-center justify-center`}>
                  <DomainIcon className="h-10 w-10 text-white/40" />
                </div>
              )}

              <div className="p-6">
                <SimPricing slug={slug} />

                <Button size="lg" className="w-full mb-3" onClick={() => navigate(`/simulations/${simulation.slug}`)}>
                  {ctaLabel} <ArrowRight className="h-4 w-4" />
                </Button>
                <p className="text-xs text-on-surface-variant text-center mb-5">
                  Real tasks reviewed by your manager at {simulation.company}
                </p>

                <ul className="space-y-2.5 text-sm text-on-surface border-t border-border pt-4">
                  <li className="flex items-center justify-between"><span className="text-on-surface-variant">Tasks</span><span className="font-semibold">{tasks.length}</span></li>
                  <li className="flex items-center justify-between"><span className="text-on-surface-variant">Duration</span><span className="font-semibold">{simulation.estimated_hours}</span></li>
                  <li className="flex items-center justify-between"><span className="text-on-surface-variant">Difficulty</span><span className="font-semibold">{simulation.difficulty}</span></li>
                  <li className="flex items-center justify-between"><span className="text-on-surface-variant">Domain</span><span className="font-semibold">{simulation.domain}</span></li>
                </ul>

                {manager?.name && (
                  <div className="flex items-center gap-3 border-t border-border pt-4 mt-4">
                    <Avatar
                      src={manager.photo_url ? resolveMediaUrl(manager.photo_url) : null}
                      alt={manager.name}
                      initials={manager.avatar || 'M'}
                      size="md"
                      className="bg-gradient-to-br from-primary to-indigo-500"
                    />
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
      </div>
    </div>
  )
}
