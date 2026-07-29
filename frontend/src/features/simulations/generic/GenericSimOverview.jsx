import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Clock, ListChecks, BarChart3, Briefcase } from 'lucide-react'
import { useSimulationFull } from '../../../shared/api/hooks'
import { resolveMediaUrl } from '../../../shared/api/client'
import { Badge } from '../../../shared/ui/shadcn/badge'
import { Button } from '../../../shared/ui/shadcn/button'
import { Card, CardContent } from '../../../shared/ui/shadcn/card'
import RatingStars from '../../../shared/ui/RatingStars'

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-white shadow-sm px-4 py-3.5">
      <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-on-surface leading-tight truncate">{value}</p>
        <p className="text-[11px] text-on-surface-variant leading-tight">{label}</p>
      </div>
    </div>
  )
}

function SectionHeading({ children }) {
  return (
    <h2 className="flex items-center gap-2 text-base font-bold text-on-surface mb-3">
      <span className="h-4 w-1 rounded-full bg-primary shrink-0" />
      {children}
    </h2>
  )
}

/** Generic pre-enrollment overview/detail page for any CMS-authored (or
 * migrated) simulation — replaces the 3 bespoke per-sim Overview pages.
 * Styled as a proper "course landing page" (hero band, stat cards, manager
 * preview, rating) rather than a bare metadata dump, while staying entirely
 * sim-agnostic — every value rendered here comes from the CMS record. */
export default function GenericSimOverview() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { data: full, isLoading } = useSimulationFull(slug)

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

  return (
    <div className="bg-surface-low min-h-screen">
      {/* Hero band — accent-tinted backdrop behind the header, like a real course page */}
      <div className={`relative overflow-hidden ${simulation.accent_color || 'bg-primary'}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-black/0 via-black/0 to-black/25" />
        <div className="relative max-w-container mx-auto px-6 pt-8 pb-16">
          <button
            onClick={() => navigate('/simulations')}
            className="flex items-center gap-1.5 text-sm text-white/80 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> Simulations
          </button>

          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex items-center gap-5">
              <div className="h-20 w-20 rounded-2xl bg-white shadow-lg flex items-center justify-center shrink-0 p-3">
                {simulation.logo_url ? (
                  <img src={resolveMediaUrl(simulation.logo_url)} alt={simulation.company} className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-2xl font-bold text-on-surface">
                    {(simulation.company || simulation.title).split(' ').map((w) => w[0]).slice(0, 2).join('')}
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge className="bg-white/15 text-white border-white/20 hover:bg-white/15">{simulation.domain}</Badge>
                  <Badge className="bg-white/15 text-white border-white/20 hover:bg-white/15">{simulation.difficulty}</Badge>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-1.5">{simulation.title}</h1>
                <p className="text-sm font-medium text-white/85 mb-2">{simulation.company}</p>
                <RatingStars rating={simulation.rating} count={simulation.rating_count} />
              </div>
            </div>
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 shrink-0" onClick={() => navigate(`/simulations/${slug}`)}>
              Start Simulation <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-container mx-auto px-6 -mt-10 pb-14">
        {/* Stat row — floats up over the hero band's bottom edge */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard icon={ListChecks} label="Tasks" value={`${tasks.length} tasks`} />
          <StatCard icon={Clock} label="Estimated time" value={simulation.estimated_hours} />
          <StatCard icon={BarChart3} label="Difficulty" value={simulation.difficulty} />
          <StatCard icon={Briefcase} label="Company" value={simulation.company} />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <SectionHeading>About this simulation</SectionHeading>
              <p className="text-sm text-on-surface leading-relaxed">{simulation.description}</p>
            </div>

            {simulation.skills?.length > 0 && (
              <div>
                <SectionHeading>Skills you'll build</SectionHeading>
                <div className="flex flex-wrap gap-1.5">
                  {simulation.skills.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}
                </div>
              </div>
            )}

            <div>
              <SectionHeading>What you'll do</SectionHeading>
              <div className="space-y-2">
                {tasks.map((t) => (
                  <Card key={t.id} className="hover:border-primary/40 hover:shadow-md transition-all">
                    <CardContent className="p-4 flex items-start gap-3">
                      <span className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                        {t.task_index}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-on-surface">{t.title}</p>
                        {t.objective && <p className="text-xs text-on-surface-variant mt-0.5">{t.objective}</p>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Right rail — manager preview, kept sim-agnostic (reads only simulation.manager) */}
          <div className="space-y-4">
            {manager?.name && (
              <Card className="overflow-hidden">
                <div className={`h-1 w-full ${simulation.accent_color || 'bg-primary'}`} />
                <CardContent className="p-5 pt-4">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant mb-3">Your manager</p>
                  <div className="flex items-center gap-3">
                    {manager.photo_url ? (
                      <img src={resolveMediaUrl(manager.photo_url)} alt={manager.name} className="h-12 w-12 rounded-full object-cover shrink-0" />
                    ) : (
                      <span className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0">
                        {manager.avatar || 'M'}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-on-surface truncate">{manager.name}</p>
                      <p className="text-xs text-on-surface-variant truncate">{manager.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-5">
                <p className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant mb-3">At a glance</p>
                <ul className="space-y-2.5 text-sm text-on-surface">
                  <li className="flex items-center justify-between"><span className="text-on-surface-variant">Domain</span><span className="font-semibold">{simulation.domain}</span></li>
                  <li className="flex items-center justify-between"><span className="text-on-surface-variant">Difficulty</span><span className="font-semibold">{simulation.difficulty}</span></li>
                  <li className="flex items-center justify-between"><span className="text-on-surface-variant">Duration</span><span className="font-semibold">{simulation.estimated_hours}</span></li>
                  <li className="flex items-center justify-between"><span className="text-on-surface-variant">Tasks</span><span className="font-semibold">{tasks.length}</span></li>
                  {simulation.rating != null && (
                    <li className="flex items-center justify-between"><span className="text-on-surface-variant">Rating</span><RatingStars rating={simulation.rating} count={simulation.rating_count} size="sm" showCount={false} /></li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
