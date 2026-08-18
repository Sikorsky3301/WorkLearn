import { useCallback, useMemo, useState } from 'react'
import { useNavigate, useParams, Navigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowRight, ArrowLeft, Trophy, Target, Clock } from 'lucide-react'
import { useSimulationFull, useEnrollment } from '../../../../hooks'
import { resolveMediaUrl } from '../../../../lib/client'
import { SIM_BRANDING } from '../../../../lib/simBranding'
import { useSimChannel, SIM_EVENT } from '../../../../lib/simChannel'
import { buildRoadmap } from '../lib/roadmapModel'
import RoadmapSection from './RoadmapSection'
import ScoreBreakdownDrawer from './ScoreBreakdownDrawer'

// The programme, end to end.
//
// This is where "Continue" lands for an enrolled engineering student, instead
// of dropping them straight back into a single task with no sense of where
// they are. Everything on it is derived from the server (see roadmapModel) —
// the per-slug zustand store is NOT consulted, because `persist` doesn't sync
// across tabs and the sandbox grades in a tab of its own.

function ProgressRing({ pct }) {
  const r = 34
  const circumference = 2 * Math.PI * r
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" strokeWidth="7" className="stroke-white/15" />
        <circle
          cx="40" cy="40" r={r} fill="none" strokeWidth="7" strokeLinecap="round"
          className="stroke-emerald-400 transition-[stroke-dashoffset] duration-700"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (pct / 100) * circumference}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-display text-xl font-extrabold text-white tabular-nums">
        {pct}%
      </span>
    </div>
  )
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white/80">
        <Icon className="h-4 w-4" />
      </span>
      <span>
        <span className="block text-[0.65rem] font-bold uppercase tracking-wider text-white/50">{label}</span>
        <span className="block font-display text-sm font-bold text-white tabular-nums">{value}</span>
      </span>
    </div>
  )
}

export default function RoadmapPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [resultsFor, setResultsFor] = useState(null)

  const { data, isLoading } = useSimulationFull(slug)
  const {
    data: enrollment, isLoading: loadingEnrollment, isFetching: fetchingEnrollment, refetch,
  } = useEnrollment(slug)

  // The sandbox grades in its own tab, so nothing here would otherwise know a
  // score had changed. BroadcastChannel is best-effort — react-query's
  // refetch-on-focus covers the browsers and timing it misses.
  const onSimEvent = useCallback((evt) => {
    if (evt?.kind === SIM_EVENT.TASK_GRADED && evt.slug === slug) {
      qc.invalidateQueries({ queryKey: ['enrollment'] })
      qc.invalidateQueries({ queryKey: ['agent-messages'] })
      refetch()
    }
  }, [slug, qc, refetch])
  useSimChannel(onSimEvent)

  const simulation = data?.simulation
  const tasks = useMemo(() => data?.tasks ?? [], [data])

  const roadmap = useMemo(() => buildRoadmap({
    tasks,
    sectionLabels: simulation?.section_labels || {},
    completions: enrollment?.task_completions || [],
  }), [tasks, simulation, enrollment])

  // `isFetching` as well as `isLoading` on purpose. The shell enrols and then
  // sends the student here, and `useEnroll` invalidates this query — but an
  // invalidated query that previously 404'd reports isLoading:false while it
  // refetches. Redirecting on that would bounce straight back to the shell,
  // which would redirect here again: a ping-pong between two screens.
  if (isLoading || loadingEnrollment || fetchingEnrollment) {
    return <div className="mx-auto max-w-4xl px-6 py-20 text-sm text-on-surface-variant">Loading your roadmap…</div>
  }
  if (!simulation) {
    return <div className="mx-auto max-w-4xl px-6 py-20 text-sm text-on-surface-variant">Simulation not found.</div>
  }
  // Settled with no enrollment: auto-enrol and the offer letter haven't run.
  // That's the shell's job, so hand over rather than show an empty roadmap.
  if (!enrollment) return <Navigate to={`/simulations/${slug}`} replace />

  const branding = SIM_BRANDING[simulation.slug] || {}
  const { overall, currentTask, sections } = roadmap
  const openTask = (task) => navigate(`/simulations/${slug}/task/${task.task_index}`)

  return (
    <div className="min-h-screen bg-surface-low/40">
      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-[#151046] via-primary-dark to-[#0f0d2e] text-white">
        <div className="mx-auto max-w-4xl px-6 pb-10 pt-8">
          <button
            onClick={() => navigate(`/simulations/${slug}/overview`)}
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-white/60 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Simulation overview
          </button>

          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center gap-2.5">
                {branding.logo && <img src={branding.logo} alt="" className="h-5 w-auto max-w-[80px] object-contain brightness-0 invert" />}
                <span className="text-xs font-semibold uppercase tracking-wider text-white/50">{simulation.company}</span>
              </div>
              <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{simulation.title}</h1>
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-white/60">
                Your roadmap — every section, what you&apos;ve scored, and what&apos;s next.
              </p>

              <div className="mt-6 flex flex-wrap gap-6">
                <Stat icon={Target} label="Tasks done" value={`${overall.completed} of ${overall.total}`} />
                <Stat icon={Trophy} label="Code average" value={overall.avgScore != null ? overall.avgScore : '—'} />
                <Stat
                  icon={Clock}
                  label="Quiz average"
                  value={overall.avgQuiz != null ? `${overall.avgQuiz} (${overall.quizCount})` : '—'}
                />
              </div>
            </div>

            <ProgressRing pct={overall.pct} />
          </div>

          {/* Resume — the one thing most visitors came here to click. */}
          {currentTask ? (
            <button
              onClick={() => openTask(currentTask)}
              className="group mt-8 flex w-full items-center justify-between gap-4 rounded-2xl bg-white/10 p-4 text-left ring-1 ring-white/15 backdrop-blur transition-colors hover:bg-white/15"
            >
              <span className="min-w-0">
                <span className="block text-[0.65rem] font-bold uppercase tracking-wider text-emerald-300">
                  Pick up where you left off
                </span>
                <span className="mt-0.5 block truncate font-display text-lg font-bold">{currentTask.title}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-primary">
                Continue <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>
          ) : (
            <div className="mt-8 rounded-2xl bg-emerald-400/15 p-4 ring-1 ring-emerald-300/30">
              <p className="font-display text-lg font-bold text-emerald-200">Every task complete — nice work.</p>
              <p className="mt-0.5 text-sm text-white/60">Review any section below to revisit your results.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Sections ── */}
      <div className="mx-auto max-w-4xl px-6 py-10">
        {sections.map((section, i) => (
          <RoadmapSection
            key={section.key}
            section={section}
            isLast={i === sections.length - 1}
            onOpenTask={openTask}
            onViewResults={setResultsFor}
          />
        ))}
      </div>

      <ScoreBreakdownDrawer
        open={!!resultsFor}
        task={resultsFor}
        enrollmentId={enrollment.id}
        onClose={() => setResultsFor(null)}
      />
    </div>
  )
}
