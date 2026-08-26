import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, AlertTriangle } from 'lucide-react'
import { useAnalytics, useAnalyticsPeriods } from '../../hooks'
import StatStrip from './components/StatStrip'
import ActivityChart from './components/ActivityChart'
import ContributionHeatmap from './components/ContributionHeatmap'
import StreakCard from './components/StreakCard'
import ScoreTrend from './components/ScoreTrend'
import SimulationProgress from './components/SimulationProgress'
import SkillGrowth from './components/SkillGrowth'
import XpBreakdown from './components/XpBreakdown'

// Progress analytics for one student.
//
// The page this replaced claimed more than it computed. Its period selector was
// decorative — week, month and "all time" returned byte-identical payloads, and
// the chart always drew the current Monday-to-Sunday week regardless. Its trend
// arrows were fabricated: the backend hardcoded `up: true` and never sent the
// delta the page rendered beside the arrow, so every card carried a green
// up-arrow followed by an empty string. Its heatmap legend advertised four
// intensity levels over data that only ever had two. Half the page was two
// copies of the same four numbers.
//
// Everything here is measured, the period genuinely drives all of it, and where
// a number cannot honestly be computed the UI says so instead of showing a zero.

export default function Analytics() {
  const navigate = useNavigate()
  const [period, setPeriod] = useState(null)

  const { data: options, isLoading: optionsLoading, isError: optionsError } = useAnalyticsPeriods()

  useEffect(() => {
    if (options?.default && period === null) setPeriod(options.default)
  }, [options, period])

  const { data, isLoading, isError, isPlaceholderData } = useAnalytics(period)

  if (optionsLoading || (period && isLoading)) return <PageSkeleton />
  if (optionsError || isError) return <LoadError />

  const periodLabel = data?.period?.label ?? ''
  const hasActivity = (data?.totals?.tasks ?? 0) > 0 || (data?.totals?.xp ?? 0) > 0

  return (
    <div className="mx-auto max-w-container px-6 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-6 border-b border-border pb-6">
        <div>
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-primary">
            <BarChart3 className="h-3 w-3" /> Analytics
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">Your progress</h1>
          <p className="mt-1 max-w-xl text-sm text-on-surface-variant">
            Effort, consistency and grades — counted from your graded tasks and XP ledger.
          </p>
        </div>

        {/* Options come from the server. A selector built from a literal in this
            file is how the old one ended up offering three periods the backend
            treated identically. */}
        <label className="block">
          <span className="mb-1.5 block text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant">
            Period
          </span>
          <div className="inline-flex rounded-lg border border-border bg-surface-low p-0.5">
            {(options?.periods ?? []).map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                aria-pressed={period === p.key}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  period === p.key
                    ? 'bg-white text-on-surface shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </label>
      </header>

      {!hasActivity ? (
        <EmptyState onStart={() => navigate('/learn/simulations')} />
      ) : (
        // Dim while the next period is in flight rather than tearing the page
        // down — the layout is identical between periods, only the numbers move.
        <div className={`space-y-5 transition-opacity ${isPlaceholderData ? 'opacity-60' : ''}`}>
          <StatStrip stats={data?.stats ?? []} />

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ActivityChart activity={data?.activity} periodLabel={periodLabel} />
            </div>
            <StreakCard streak={data?.streak} />
          </div>

          <ContributionHeatmap heatmap={data?.heatmap} />

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ScoreTrend trend={data?.score_trend} periodLabel={periodLabel} />
            </div>
            <XpBreakdown breakdown={data?.xp_breakdown} periodLabel={periodLabel} />
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <SimulationProgress
                simulations={data?.simulations}
                onOpen={(s) => navigate(`/simulations/${s.slug}/overview`)}
              />
            </div>
            <SkillGrowth skills={data?.skills} onOpenSkillGps={() => navigate('/skill-gps')} />
          </div>

          <p className="pb-2 text-center text-xs text-on-surface-variant">
            {data?.totals?.first_activity
              ? `Tracking since ${data.totals.first_activity} · ${data.totals.tasks} tasks · ${data.totals.xp} XP all time`
              : `${data?.totals?.tasks ?? 0} tasks · ${data?.totals?.xp ?? 0} XP all time`}
          </p>
        </div>
      )}
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="mx-auto max-w-container animate-pulse px-6 py-8">
      <div className="mb-6 space-y-3 border-b border-border pb-6">
        <div className="h-5 w-24 rounded bg-surface-high" />
        <div className="h-7 w-56 rounded bg-surface-high" />
      </div>
      <div className="mb-5 h-28 rounded-xl border border-border bg-surface-low" />
      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="h-72 rounded-xl border border-border bg-surface-low lg:col-span-2" />
        <div className="h-72 rounded-xl border border-border bg-surface-low" />
      </div>
      <div className="h-44 rounded-xl border border-border bg-surface-low" />
    </div>
  )
}

function LoadError() {
  return (
    <div className="mx-auto max-w-container px-6 py-8">
      <div className="rounded-xl border border-border bg-white px-6 py-16 text-center">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <AlertTriangle className="h-5 w-5" />
        </span>
        <h2 className="mb-2 text-lg font-bold text-on-surface">We couldn&apos;t load your analytics</h2>
        <p className="mx-auto mb-6 max-w-sm text-sm text-on-surface-variant">
          Your progress is safe — this page only reads it. Refresh to try again.
        </p>
        <button onClick={() => window.location.reload()} className="btn-primary text-sm">
          Refresh
        </button>
      </div>
    </div>
  )
}

function EmptyState({ onStart }) {
  return (
    <div className="rounded-xl border border-border bg-white px-6 py-16 text-center">
      <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <BarChart3 className="h-5 w-5" />
      </span>
      <h2 className="mb-2 text-lg font-bold text-on-surface">Nothing to chart yet</h2>
      <p className="mx-auto mb-6 max-w-sm text-sm text-on-surface-variant">
        This page fills in from graded tasks. Complete your first one and your activity,
        streak, scores and skill growth all start here.
      </p>
      <button onClick={onStart} className="btn-primary text-sm">
        Browse simulations
      </button>
    </div>
  )
}
