import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Clock, ListChecks, BarChart3, Zap, CalendarClock,
  Globe, Award, Layers, Sparkles,
  // Aliased: the icon is exported as `Infinity`, which would shadow the
  // JavaScript global of that name for the whole module.
  Infinity as InfinityIcon,
} from 'lucide-react'
import { useSimulationFull, useEnrollment } from '../../../hooks'
import { resolveMediaUrl } from '../../../lib/client'
import { resolveDomainIcon, resolveDomainImage } from '../../../lib/domainIcons'
import { SIM_BRANDING } from '../../../lib/simBranding'
import { Badge } from '../../../components/ui/shadcn/badge'
import { Button } from '../../../components/ui/shadcn/button'
import RatingStars from '../../../components/ui/RatingStars'
import Avatar from '../../../components/ui/Avatar'
import WhatYoullLearn from './WhatYoullLearn'
import HowItWorks from './HowItWorks'
import TechYouWillUse from './TechYouWillUse'
import SimReviews from './SimReviews'
import SimPricing from './SimPricing'
import SimExplainerVideo from './SimExplainerVideo'
import CodingEnvironmentPreview from './CodingEnvironmentPreview'
import CurriculumSection from './CurriculumSection'
import StickyOverviewBar, {
  useScrolledPast, useNavbarHeight, STICKY_BAR_HEIGHT,
} from './StickyOverviewBar'
import { groupByWeek } from './sectionGrouping'

function SectionHeading({ children, className = 'mb-4' }) {
  return (
    <h2 className={`flex items-center gap-2 text-lg font-bold text-on-surface ${className}`}>
      <span className="h-4 w-1 rounded-full bg-primary shrink-0" />
      {children}
    </h2>
  )
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
  // Declared above the early returns — hooks can't live after a conditional
  // return, and this component has several.
  const [allSectionsOpen, setAllSectionsOpen] = useState(false)
  // Callback ref, not useRef: the sentinel is rendered past those early
  // returns, so an effect keyed on a ref object would run once against null
  // and never re-run.
  const [heroEndRef, setHeroEndRef] = useState(null)
  const scrolledPastHero = useScrolledPast(heroEndRef)

  // Everything stacked above the sticky enrollment card: the app Navbar
  // (measured) plus the condensed overview bar (a constant, because it is
  // unmounted while hidden and so cannot be measured when the space is
  // needed), plus a 24px breathing gap.
  const navbarHeight = useNavbarHeight()
  const cardStickyTop = navbarHeight + STICKY_BAR_HEIGHT + 24

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
  // Curated art first; failing that, the simulation's career-domain
  // photograph, so a CMS-authored sim gets a real image rather than a flat
  // accent block. Still undefined for domains with no photo — the accent
  // treatment below remains the last resort.
  const banner = branding.banner ?? resolveDomainImage(simulation.domain)
  const explainerVideo = branding.explainerVideo
  const accent = simulation.accent_color || 'bg-primary'
  // Only advertise the code sandbox on simulations that actually use it —
  // a sales/CRM sim has no code_sandbox tasks and shouldn't show an editor.
  const hasCodeSandbox = tasks.some((t) => t.type === 'code_sandbox')
  const sectionLabels = simulation.section_labels || {}
  const weekGroups = groupByWeek(tasks)
  const totalXp = tasks.reduce((sum, t) => sum + (t.xp_award || 0), 0)

  // "1/2026". Derived from the record rather than written into the page —
  // a hardcoded date starts lying the day after it ships, and this one is
  // exactly the signal a student uses to judge whether the content predates
  // the framework version they're on.
  const lastUpdated = simulation.updated_at
    ? new Date(simulation.updated_at).toLocaleDateString(undefined, { month: 'numeric', year: 'numeric' })
    : null

  // Enrollment.status is the backend's uppercase EnrollmentStatus enum
  // value ("COMPLETED", not "completed") — see app/models/__init__.py.
  const ctaLabel = enrollment?.status === 'COMPLETED' ? 'Review' : enrollment?.status ? 'Continue' : 'Start Simulation'

  // Always the shell, for every simulation and every enrolment state. The
  // shell owns auto-enrolment and the offer-letter gate, and hands engineering
  // sims on to their roadmap once both have passed — so the decision lives in
  // exactly one place instead of being duplicated (and drifting) here.
  const ctaPath = `/simulations/${simulation.slug}`

  return (
    <div className="bg-white min-h-screen">
      <StickyOverviewBar
        visible={scrolledPastHero}
        title={simulation.title}
        company={simulation.company}
        rating={simulation.rating}
        ratingCount={simulation.rating_count}
        taskCount={tasks.length}
        hours={simulation.estimated_hours}
        ctaLabel={ctaLabel}
        onCta={() => navigate(ctaPath)}
      />

      {/* ── Hero band — dark and editorial. The enrollment card overlaps up
          into it from the body below, so the hero text reserves room on the
          right at lg+ rather than running underneath the card. ── */}
      {/* Near-black, not the old indigo gradient. The page's own accents are
          indigo (`primary`), so an indigo hero gave them nothing to sit
          against — everything blended into one violet wash. A neutral dark
          ground lets the accent colour actually read as an accent.
          A faint grid sits on top, permanently, so the band doesn't read as
          a flat void — and two fixed light pools sit on top of that (bottom
          left, top right), each brightening the grid underneath it, same as
          the cursor spotlight used to but always on rather than hover-only. */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#0b0f14] via-[#0f1720] to-[#0b0f14] text-white">
        {/* Base grid — always faintly visible. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), ' +
              'linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '42px 42px',
          }}
        />
        {/* Bright grid — same pattern, revealed only inside the two fixed
            light-pool circles below (bottom-left, top-right) via a
            two-circle radial mask, so the grid itself visibly brightens in
            those spots instead of just showing a glow on top of it. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(165,180,252,0.55) 1px, transparent 1px), ' +
              'linear-gradient(to bottom, rgba(165,180,252,0.55) 1px, transparent 1px)',
            backgroundSize: '42px 42px',
            WebkitMaskImage:
              'radial-gradient(320px circle at 0% 100%, black, transparent 75%), ' +
              'radial-gradient(320px circle at 100% 0%, black, transparent 75%)',
            maskImage:
              'radial-gradient(320px circle at 0% 100%, black, transparent 75%), ' +
              'radial-gradient(320px circle at 100% 0%, black, transparent 75%)',
            WebkitMaskComposite: 'source-over',
            maskComposite: 'add',
          }}
        />
        {/* The light pools themselves — bottom-left and top-right — give
            the brightened grid patches an actual light source rather than
            just being a brighter texture. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(640px circle at 0% 100%, rgba(99,102,241,0.20), transparent 45%), ' +
              'radial-gradient(640px circle at 100% 0%, rgba(99,102,241,0.20), transparent 45%)',
          }}
        />

        <div className="relative z-10 max-w-container mx-auto px-6 pt-6 pb-16">
          <button
            onClick={() => navigate('/learn/simulations')}
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
              {/* Was empty visual space in this row before — every other stat
                  here is a plain fact about the sim (task count, duration,
                  difficulty, XP); this is the one that's actually a selling
                  point, so it gets the accent treatment instead of blending
                  in as a fifth identical icon+label pair. */}
              <Badge className="gap-1 border-transparent bg-primary/25 text-white">
                <Sparkles className="h-3 w-3" /> AI-Assisted
              </Badge>
              <span className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 shrink-0" />
                <span className="font-semibold text-white">{simulation.difficulty}</span> difficulty
              </span>
              {totalXp > 0 && (
                <span className="flex items-center gap-2">
                  <Zap className="h-4 w-4 shrink-0" />
                  <span className="font-semibold text-white">{totalXp}</span> XP
                </span>
              )}
            </div>

            {/* The small print a course page owes you before you commit —
                deliberately quieter than the row above, because none of it is
                a selling point, it's just what you'd want to know. */}
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 pt-5 text-xs text-white/50">
              {lastUpdated && (
                <span className="flex items-center gap-1.5">
                  <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                  Last updated <span className="font-semibold text-white/75">{lastUpdated}</span>
                </span>
              )}
              {/* Static: the platform ships in English only. When that stops
                  being true this needs a real field on Simulation, not a
                  second hardcoded string somewhere else. */}
              <span className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 shrink-0" />
                <span className="font-semibold text-white/75">English</span>
              </span>
              <span className="flex items-center gap-1.5">
                <InfinityIcon className="h-3.5 w-3.5 shrink-0" />
                Self-paced
              </span>
              <span className="flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 shrink-0" />
                Certificate on completion
              </span>
              {weekGroups.length > 1 && (
                <span className="flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-semibold text-white/75">{weekGroups.length}</span> sections
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sentinel marking the end of the hero. The sticky bar appears exactly
          when this scrolls out of view above the viewport — an
          IntersectionObserver on one element rather than a scroll handler
          firing on every frame. */}
      <div ref={setHeroEndRef} aria-hidden="true" className="h-px w-full" />

      {/* Reserves room for StickyOverviewBar the instant it goes `position:
          fixed` — without this, the bar drops in over whatever's sitting
          right here (the rating/tasks/hours stat strip, pulled up into the
          hero via -mt-8) and visually slices the top off its numbers, since
          the bar has no footprint in normal flow to push that content down
          on its own. Zero height until then, so nothing shifts before the
          bar actually appears. */}
      <div aria-hidden="true" style={{ height: scrolledPastHero ? STICKY_BAR_HEIGHT : 0 }} />

      {/* ── Body ── */}
      <div className="max-w-container mx-auto px-6 pb-16">
        <div className="grid lg:grid-cols-[1fr_360px] gap-10 items-start">
          <div className="min-w-0">
            {/* Stat strip. Used to be pulled up (-mt-8) to straddle the
                hero's lower edge — looked like a nice overlap in theory, but
                in practice the card's top row (the numbers themselves) ended
                up sitting right across the hero/body colour seam, and on
                some widths the hero's own small-print row, both reading as
                the stats being visually "cut" by the background change.
                Plain positive margin instead: the whole card lives entirely
                on the white body, no seam running through it. */}
            {simulation.rating != null && (
              <div className="mt-6 mb-10 rounded-xl border border-border bg-white shadow-lg px-6 py-5 flex flex-wrap items-center gap-x-10 gap-y-5">
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
                {/* The one qualitative claim in a row of numbers — a pill
                    instead of a number+label pair so it reads as a badge,
                    not a fourth stat. Fills what was empty trailing space in
                    this row on wider screens. */}
                <div className="lg:border-l lg:border-border lg:pl-10 flex items-center">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1.5 text-xs font-bold">
                    <Sparkles className="h-3.5 w-3.5" />
                    AI-Assisted
                  </span>
                </div>
              </div>
            )}

            <WhatYoullLearn skills={simulation.skills} />

            {/* Directly under the outcomes: the page says WHAT you'll learn,
                and this is the answer to "yes, but what is doing one actually
                like" — the question the description can't answer in a
                sentence. */}
            <div className="mt-10">
              <HowItWorks simulation={simulation} tasks={tasks} />
            </div>

            <SimExplainerVideo
              src={explainerVideo}
              poster={banner}
              title={simulation.title}
              company={simulation.company}
            />

            {hasCodeSandbox && <CodingEnvironmentPreview />}

            {/* ── Technology — replaces the old flat "Skills you'll build"
                chip row, which rendered this exact array as unlabelled pills.
                Same data, but a named technology now carries its mark, so the
                stack is legible at a glance instead of being read word by
                word. ── */}
            <div className="mt-12">
              <TechYouWillUse skills={simulation.skills} hasCodeSandbox={hasCodeSandbox} />
            </div>

            {/* ── Curriculum — grouped by week and collapsible, so the shape
                of the programme reads in one screen and the detail is one
                click away. ── */}
            <div className="mt-12">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <SectionHeading className="mb-0">Curriculum</SectionHeading>
                <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                  <span>
                    {weekGroups.length} section{weekGroups.length !== 1 ? 's' : ''} · {tasks.length} tasks
                  </span>
                  {weekGroups.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setAllSectionsOpen((v) => !v)}
                      className="font-semibold text-primary transition-colors hover:text-primary-dark"
                    >
                      {allSectionsOpen ? 'Collapse all' : 'Expand all'}
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {weekGroups.map((group, gi) => (
                  <CurriculumSection
                    // Keyed on the toggle as well as the group, so Expand all
                    // remounts every section with the new default. Without it
                    // each section keeps whatever the student set by hand and
                    // the button appears to do nothing.
                    key={`${gi}-${allSectionsOpen}`}
                    label={
                      group.week != null
                        ? (sectionLabels[String(group.week)] || `Week ${group.week}`)
                        : 'Tasks'
                    }
                    tasks={group.tasks}
                    defaultOpen={allSectionsOpen || gi === 0}
                  />
                ))}
              </div>
            </div>

            <SimReviews rating={simulation.rating} ratingCount={simulation.rating_count} />
          </div>

          {/* ── Right: enrollment card, pulled up over the hero band. Leads
              with the simulation's banner image (a course page's preview
              slot), not the company logo — the company is named in the hero
              and again just below the CTA. ── */}
          {/* `lg:top-6` put the card 24px from the VIEWPORT top, which is
              underneath two things that were already there: the app's sticky
              Navbar, and now the condensed overview bar. Once you scrolled,
              both sat on top of the card and sliced off its banner image and
              the price beneath it.

              The offset is measured for the Navbar (its height moves with the
              XP strip and the viewport) plus the bar's own fixed height, which
              is reserved even before it appears — a value that only became
              correct after the first scroll would make the card jump.

              max-height with its own scroll so a tall card can never put its
              CTA somewhere unreachable on a short window.

              The underscores in the calc() are Tailwind's escape for a space:
              calc() is invalid without whitespace around its operators, and
              `100vh-var(...)` would parse as one malformed token and drop the
              whole rule. */}
          <div
            className="lg:-mt-[340px] lg:sticky h-fit lg:max-h-[calc(100vh_-_var(--sticky-top)_-_1.5rem)] lg:overflow-y-auto"
            style={{ '--sticky-top': `${cardStickyTop}px`, top: 'var(--sticky-top)' }}
          >
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

                <Button size="lg" className="w-full mb-3" onClick={() => navigate(ctaPath)}>
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
