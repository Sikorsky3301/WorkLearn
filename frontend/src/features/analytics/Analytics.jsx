import { useState } from 'react'
import { useAnalytics } from '../../hooks'

const intensityColors = ['bg-surface-high', 'bg-primary/30', 'bg-primary/60', 'bg-primary']

const SKILL_LABELS = {
  sql:        'SQL Queries',
  python:     'Python & EDA',
  analytics:  'Data Analytics',
  statistics: 'Statistics',
  communication: 'Communication',
}

export default function Analytics() {
  const [period, setPeriod] = useState('week')
  const { data, isLoading } = useAnalytics(period)

  const topStats   = data?.top_stats    ?? []
  const weekAct    = data?.week_activity ?? []
  const streakGrid = data?.streak_grid   ?? []
  const skills     = data?.skills        ?? {}

  const maxXp = weekAct.length ? Math.max(...weekAct.map(d => d.xp), 1) : 1

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Progress & Analytics</h1>
          <p className="text-sm text-on-surface-variant mt-1">Track your learning velocity, streaks, and skill growth over time.</p>
        </div>
        <div className="flex border border-border rounded-lg overflow-hidden">
          {['week', 'month', 'all time'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 text-xs font-semibold capitalize transition-colors ${period === p ? 'bg-primary text-white' : 'bg-white text-on-surface-variant hover:bg-surface-low'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {topStats.length === 0 ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="card">
              <p className="text-xs text-on-surface-variant mb-1">—</p>
              <p className="text-2xl font-bold text-primary mb-1">0</p>
              <p className="text-xs font-semibold text-on-surface-variant">No data yet</p>
            </div>
          ))
        ) : topStats.map(s => (
          <div key={s.label} className="card">
            <p className="text-xs text-on-surface-variant mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-primary mb-1">{s.value}</p>
            <p className={`text-xs font-semibold flex items-center gap-1 ${s.up ? 'text-green-600' : 'text-red-500'}`}>
              {s.up ? '↑' : '↓'} {s.delta ?? ''}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5">

        {/* Weekly Activity Bar Chart */}
        <div className="col-span-2 card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <span className="section-label">Daily Activity</span>
              <p className="text-sm font-bold text-on-surface mt-0.5">XP earned per day</p>
            </div>
            <span className="text-xs text-on-surface-variant">Tasks · XP</span>
          </div>
          {weekAct.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-sm text-on-surface-variant">
              No activity yet for this period.
            </div>
          ) : (
            <div className="flex items-end gap-3 h-40">
              {weekAct.map(d => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-xs font-semibold text-primary">{d.xp > 0 ? `${d.xp}xp` : ''}</span>
                  <div className="w-full bg-primary/80 rounded-t" style={{ height: `${Math.max((d.xp / maxXp) * 120, d.xp > 0 ? 4 : 0)}px` }} />
                  <span className="text-xs text-on-surface-variant">{d.day}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Skills Breakdown */}
        <div className="card">
          <span className="section-label mb-4 block">Skills Breakdown</span>
          {Object.keys(skills).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-on-surface-variant">
              <p className="text-xs text-center">Complete simulation tasks to earn skill points.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(skills).map(([key, score]) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-on-surface">{SKILL_LABELS[key] ?? key}</span>
                    <span className="text-xs font-bold text-on-surface">{score}</span>
                  </div>
                  <div className="h-1.5 bg-surface-high rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(score, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Streak Calendar */}
        <div className="col-span-3 card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="section-label">Activity Streak</span>
              <p className="text-sm font-bold text-on-surface mt-0.5">Last 12 weeks</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-on-surface-variant">
              <span>Less</span>
              {intensityColors.map((c, i) => (
                <div key={i} className={`w-3 h-3 rounded-sm ${c} border border-white`} />
              ))}
              <span>More</span>
            </div>
          </div>
          {streakGrid.length === 0 ? (
            <div className="h-20 flex items-center justify-center text-sm text-on-surface-variant">
              No streak data yet.
            </div>
          ) : (
            <div className="flex gap-1">
              {streakGrid.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-1">
                  {week.map((level, di) => (
                    <div
                      key={di}
                      className={`w-4 h-4 rounded-sm ${intensityColors[Math.min(level, intensityColors.length - 1)]} border border-white`}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 pt-3 border-t border-border">
            <div className="grid grid-cols-4 gap-3">
              {topStats.slice(0, 4).map(s => (
                <div key={s.label} className="bg-surface-low rounded-lg p-2 text-center">
                  <p className="text-sm font-bold text-primary">{s.value}</p>
                  <p className="text-xs text-on-surface-variant">{s.label}</p>
                </div>
              ))}
              {topStats.length === 0 && [
                { label: 'Total XP', val: '0' },
                { label: 'Tasks Done', val: '0' },
                { label: 'Active Days', val: '0' },
                { label: 'Streak', val: '0 days' },
              ].map(s => (
                <div key={s.label} className="bg-surface-low rounded-lg p-2 text-center">
                  <p className="text-sm font-bold text-primary">{s.val}</p>
                  <p className="text-xs text-on-surface-variant">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
