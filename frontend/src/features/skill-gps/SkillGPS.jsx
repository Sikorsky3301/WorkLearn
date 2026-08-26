import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navigation, AlertTriangle } from 'lucide-react'
import { useSkillGpsRoles, useSkillGPS } from '../../hooks'
import RoleSelector from './components/RoleSelector'
import MetricStrip from './components/MetricStrip'
import ReadinessChart from './components/ReadinessChart'
import SkillMatrix from './components/SkillMatrix'
import CategoryBreakdown from './components/CategoryBreakdown'
import CareerLadder from './components/CareerLadder'
import NextActions from './components/NextActions'

// Skill GPS — how close this student is to a real role, and the specific work
// that closes the distance.
//
// Everything role-shaped comes from the server. It used to be hardcoded here as
// four Data Analyst tiers, two of which the backend had never heard of: asking
// for "Mid-level DA" or "Lead DA" returned Junior DA's numbers under the wrong
// name, so two of the four buttons rendered identical data. There was also no
// way to benchmark against the Engineering or Sales simulations at all.
//
// The layout is deliberately one page of connected facts rather than a grid of
// widgets: the strip states where you stand, the chart states how you got here,
// the matrix states what is left and — expanded — exactly which tasks pay it.

export default function SkillGPS() {
  const navigate = useNavigate()
  const [targetRole, setTargetRole] = useState(null)
  const [filter, setFilter] = useState('all')

  const { data: catalog, isLoading: rolesLoading, isError: rolesError } = useSkillGpsRoles()

  // Open on the role the server recommends — derived from the simulation this
  // student is actually enrolled in — instead of always Junior DA. Seeds once;
  // after that the choice is theirs.
  useEffect(() => {
    if (catalog?.recommended && targetRole === null) setTargetRole(catalog.recommended)
  }, [catalog, targetRole])

  const tracks = catalog?.tracks ?? []
  const activeTrack = useMemo(
    () => tracks.find((t) => t.roles.some((r) => r.key === targetRole)) ?? tracks[0] ?? null,
    [tracks, targetRole],
  )

  const { data, isLoading, isError } = useSkillGPS(targetRole)

  const gapData   = data?.gap_data ?? []
  const roleLabel = data?.role?.label ?? ''
  const gaps      = useMemo(() => gapData.filter((s) => s.status === 'gap'), [gapData])
  const met       = useMemo(() => gapData.filter((s) => s.status === 'met'), [gapData])

  // Gaps first and biggest-first inside them: the top of this list should be
  // the thing worth doing next, not whatever order the config happens to be in.
  const visible = useMemo(() => {
    const rows = filter === 'gap' ? gaps : filter === 'met' ? met : gapData
    return [...rows].sort((a, b) => {
      if (a.status !== b.status) return a.status === 'gap' ? -1 : 1
      return (b.required - b.current) - (a.required - a.current)
    })
  }, [filter, gaps, met, gapData])

  const openTask = (t) => navigate(`/simulations/${t.simulation_slug}/task/${t.task_index}`)

  if (rolesLoading || (targetRole && isLoading)) return <PageSkeleton />
  if (rolesError || isError) return <LoadError />

  return (
    <div className="mx-auto max-w-container px-6 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-6 border-b border-border pb-6">
        <div>
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-primary">
            <Navigation className="h-3 w-3" /> Skill GPS
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">Career readiness</h1>
          <p className="mt-1 max-w-xl text-sm text-on-surface-variant">
            Built from the skill points your graded simulation tasks have awarded — not from
            anything you told us about yourself.
          </p>
        </div>
        <RoleSelector
          tracks={tracks}
          activeTrack={activeTrack}
          targetRole={targetRole}
          onSelect={setTargetRole}
        />
      </header>

      {gapData.length === 0 ? (
        <EmptyState onStart={() => navigate('/learn/simulations')} />
      ) : (
        <div className="space-y-5">
          <MetricStrip
            readiness={data?.overall_readiness ?? 0}
            met={met.length}
            total={gapData.length}
            totals={data?.totals}
          />

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="space-y-5 lg:col-span-2">
              <ReadinessChart
                history={data?.readiness_history}
                currentReadiness={data?.overall_readiness}
                roleLabel={roleLabel}
              />
              <SkillMatrix
                skills={visible}
                filter={filter}
                onFilter={setFilter}
                counts={{ all: gapData.length, gap: gaps.length, met: met.length }}
                roleLabel={roleLabel}
                onOpenTask={openTask}
              />
            </div>

            <aside className="space-y-5">
              <CategoryBreakdown summary={data?.category_summary} />
              <CareerLadder
                trackLabel={activeTrack?.label}
                rungs={data?.track_progress}
                onSelect={setTargetRole}
              />
              <NextActions targetRole={targetRole} onStart={() => navigate('/learn/simulations')} />
            </aside>
          </div>
        </div>
      )}
    </div>
  )
}

// A skeleton in the real layout rather than a centred spinner — the page keeps
// its shape while it loads, so nothing jumps when the data lands.
function PageSkeleton() {
  return (
    <div className="mx-auto max-w-container animate-pulse px-6 py-8">
      <div className="mb-6 space-y-3 border-b border-border pb-6">
        <div className="h-5 w-28 rounded bg-surface-high" />
        <div className="h-7 w-64 rounded bg-surface-high" />
      </div>
      <div className="mb-5 h-32 rounded-xl border border-border bg-surface-low" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="h-64 rounded-xl border border-border bg-surface-low" />
          <div className="h-96 rounded-xl border border-border bg-surface-low" />
        </div>
        <div className="space-y-5">
          <div className="h-52 rounded-xl border border-border bg-surface-low" />
          <div className="h-44 rounded-xl border border-border bg-surface-low" />
        </div>
      </div>
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
        <h2 className="mb-2 text-lg font-bold text-on-surface">We couldn&apos;t load your Skill GPS</h2>
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
        <Navigation className="h-5 w-5" />
      </span>
      <h2 className="mb-2 text-lg font-bold text-on-surface">No skill data yet</h2>
      <p className="mx-auto mb-6 max-w-sm text-sm text-on-surface-variant">
        Skill points are awarded by graded simulation tasks. Finish one and your readiness
        score, gap analysis and progress curve all appear here.
      </p>
      <button onClick={onStart} className="btn-primary text-sm">
        Browse simulations
      </button>
    </div>
  )
}
