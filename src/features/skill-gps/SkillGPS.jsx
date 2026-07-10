import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSkillGPS } from '../../shared/api/hooks'

const ROLE_KEYS   = ['junior_da', 'mid_da', 'senior_da', 'lead_da']
const ROLE_LABELS = { junior_da: 'Junior DA', mid_da: 'Mid-level DA', senior_da: 'Senior DA', lead_da: 'Lead DA' }

export default function SkillGPS() {
  const navigate     = useNavigate()
  const [targetRole, setTargetRole] = useState('junior_da')
  const [filterStatus, setFilterStatus] = useState('all')

  const { data, isLoading } = useSkillGPS(targetRole)

  const overallReadiness = data?.overall_readiness ?? 0
  const gapData          = data?.gap_data ?? []
  const nextActions      = data?.next_actions ?? []

  const gaps    = gapData.filter(s => s.status === 'gap')
  const met     = gapData.filter(s => s.status === 'met')
  const filtered = filterStatus === 'all' ? gapData : filterStatus === 'gap' ? gaps : met

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
      <div className="flex items-start justify-between mb-7">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <GPSIcon />
            </div>
            <span className="section-label">Skill GPS</span>
          </div>
          <h1 className="text-2xl font-bold text-on-surface">Career Readiness Roadmap</h1>
          <p className="text-sm text-on-surface-variant mt-1">Your AI-powered gap analysis based on your completed simulation tasks.</p>
        </div>

        {/* Target role selector */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm text-on-surface-variant font-medium">Target Role:</span>
          <div className="flex border border-border rounded-lg overflow-hidden">
            {ROLE_KEYS.map(r => (
              <button
                key={r}
                onClick={() => setTargetRole(r)}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                  targetRole === r ? 'bg-primary text-white' : 'bg-white text-on-surface-variant hover:bg-surface-low'
                }`}
              >
                {ROLE_LABELS[r]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {gapData.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-14 h-14 bg-surface-high rounded-full flex items-center justify-center mx-auto mb-4">
            <GPSIcon />
          </div>
          <h2 className="text-lg font-bold text-on-surface mb-2">No skill data yet</h2>
          <p className="text-sm text-on-surface-variant mb-6 max-w-sm mx-auto">
            Complete simulation tasks to earn skill points. Your readiness score and gap analysis will appear here.
          </p>
          <button onClick={() => navigate('/simulations')} className="btn-primary text-sm px-6 py-2.5">
            Start a Simulation →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-5">

          {/* ── LEFT: Readiness Score ── */}
          <div className="col-span-1 space-y-4">
            <div className="card text-center">
              <span className="section-label mb-3 block">Readiness Score</span>
              <div className="relative w-36 h-36 mx-auto mb-4">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#e5e1e9" strokeWidth="10" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#312E81" strokeWidth="10"
                    strokeDasharray={`${2 * Math.PI * 50 * overallReadiness / 100} ${2 * Math.PI * 50}`}
                    strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-primary">{overallReadiness}%</span>
                  <span className="text-xs text-on-surface-variant font-medium">of {ROLE_LABELS[targetRole]}</span>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Skills Met',      val: met.length,   color: 'text-green-600' },
                  { label: 'Gaps Remaining',  val: gaps.length,  color: 'text-red-500' },
                  { label: 'Total Skills',    val: gapData.length, color: 'text-primary' },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between text-sm">
                    <span className="text-on-surface-variant">{s.label}</span>
                    <span className={`font-bold ${s.color}`}>{s.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Career path */}
            <div className="card">
              <span className="section-label mb-3 block">Career Path</span>
              <div className="relative pl-5">
                <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-border" />
                {ROLE_KEYS.map((r, i) => {
                  const isTarget = r === targetRole
                  const isCurrent = i === 0
                  return (
                    <div key={r} className="relative mb-5 last:mb-0 flex items-center gap-2">
                      <div className={`absolute -left-5 w-3 h-3 rounded-full border-2 ${
                        isTarget ? 'bg-primary border-primary' :
                        isCurrent ? 'bg-green-500 border-green-500' :
                        'bg-white border-border'
                      }`} />
                      <div>
                        <p className={`text-xs font-semibold ${isTarget ? 'text-primary' : isCurrent ? 'text-green-700' : 'text-on-surface-variant'}`}>
                          {ROLE_LABELS[r]}
                          {isCurrent && !isTarget && <span className="ml-1 text-green-600">(You)</span>}
                          {isTarget && <span className="ml-1 text-primary">← Target</span>}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── CENTER: Gap Analysis ── */}
          <div className="col-span-2 space-y-4">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="section-label">Skill Gap Analysis</span>
                  <p className="text-sm font-bold text-on-surface mt-0.5">vs. {ROLE_LABELS[targetRole]} Benchmark</p>
                </div>
                <div className="flex gap-1.5">
                  {['all', 'gap', 'met'].map(f => (
                    <button key={f} onClick={() => setFilterStatus(f)}
                      className={`text-xs font-semibold px-3 py-1 rounded-full border transition-colors ${
                        filterStatus === f ? 'bg-primary text-white border-primary' : 'bg-white text-on-surface-variant border-border hover:border-primary'
                      }`}>
                      {f === 'all' ? 'All' : f === 'gap' ? `Gaps (${gaps.length})` : `Met (${met.length})`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {filtered.map(skill => {
                  const delta = (skill.required ?? 0) - (skill.current ?? 0)
                  const isGap = skill.status === 'gap'
                  return (
                    <div key={skill.skill} className={`p-3 rounded-lg border ${isGap ? 'border-red-200 bg-red-50/40' : 'border-green-200 bg-green-50/40'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-on-surface capitalize">{skill.skill.replace(/_/g, ' ')}</p>
                        <div className="flex items-center gap-3 shrink-0">
                          {isGap ? (
                            <span className="text-xs font-bold text-red-500">-{delta} pts gap</span>
                          ) : (
                            <span className="text-xs font-bold text-green-600">+{Math.abs(delta)} pts above</span>
                          )}
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center ${isGap ? 'bg-red-100' : 'bg-green-100'}`}>
                            {isGap
                              ? <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"><line x1="2" y1="6" x2="10" y2="6"/></svg>
                              : <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round"><polyline points="2,6 5,9 10,3"/></svg>
                            }
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-white border border-border rounded-full overflow-hidden relative">
                          <div className={`h-full rounded-full ${isGap ? 'bg-primary' : 'bg-green-500'}`} style={{ width: `${skill.current ?? 0}%` }} />
                          <div className="absolute top-0 bottom-0 w-0.5 bg-on-surface/30" style={{ left: `${skill.required ?? 0}%` }} />
                        </div>
                        <span className="text-xs text-on-surface-variant shrink-0 w-16 text-right">
                          {skill.current ?? 0}% / {skill.required ?? 0}%
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Next Actions ── */}
          <div className="col-span-1 space-y-4">
            <div className="card">
              <span className="section-label mb-3 block">Next Best Actions</span>
              {nextActions.length === 0 ? (
                <p className="text-xs text-on-surface-variant">Complete more tasks to get AI-powered recommendations.</p>
              ) : (
                <div className="space-y-3">
                  {nextActions.map((action, i) => (
                    <div key={i} className="border border-border rounded-lg p-3">
                      <div className="flex items-start gap-2 mb-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                        <p className="text-xs text-on-surface leading-snug">{action}</p>
                      </div>
                      <button onClick={() => navigate('/simulations')} className="btn-primary text-xs px-2.5 py-1 w-full">
                        Start →
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {gaps.length > 0 && (
              <div className="card bg-rose-50 border-rose-200">
                <span className="section-label mb-2 block text-rose-700">Top Gaps to Close</span>
                <div className="space-y-2">
                  {gaps.slice(0, 3).map(g => (
                    <div key={g.skill} className="text-xs">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium text-rose-900 capitalize">{g.skill.replace(/_/g, ' ')}</span>
                        <span className="text-rose-600">-{(g.required ?? 0) - (g.current ?? 0)} pts</span>
                      </div>
                      <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-400 rounded-full" style={{ width: `${g.current ?? 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <footer className="mt-10 border-t border-border pt-4 flex items-center justify-between text-xs text-on-surface-variant">
        <span>WorkLearn AI</span>
        <div className="flex gap-4">
          <a href="#" className="hover:text-primary">Terms</a>
          <a href="#" className="hover:text-primary">Privacy</a>
          <a href="#" className="hover:text-primary">Help Center</a>
        </div>
        <span>© 2024 WorkLearn AI. All rights reserved.</span>
      </footer>
    </div>
  )
}

function GPSIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
}
