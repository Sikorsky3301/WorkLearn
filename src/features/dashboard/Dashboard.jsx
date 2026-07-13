import { useNavigate } from 'react-router-dom'
import { useAuth, ROLES } from '../auth/AuthContext'
import { useMyAssignment, useSimulations } from '../../shared/api/hooks'
import lumenLogoImg from '../../assets/lumen-logo.png'
import enigmaLogoImg from '../../assets/enigma-logo.png'

// Purely cosmetic per-simulation branding (logo + accent) — the backend has
// no notion of a "logo," so this is a client-side lookup keyed by the
// simulation id the backend already sends. Any simulation not listed here
// (e.g. a future one) still renders — just without a logo/custom accent —
// so the Dashboard never silently drops a simulation it doesn't recognize.
const SIM_BRANDING = {
  'da-job-sim':       { logo: lumenLogoImg, accentColor: 'bg-orange-500' },
  'frontend-dev-sim': { logo: enigmaLogoImg, accentColor: 'bg-orange-500' },
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, hasFeature } = useAuth()
  const { data: assignment, isLoading: assignmentLoading } = useMyAssignment()
  const { data: simulationsData, isLoading: simulationsLoading } = useSimulations()
  const simulations = simulationsData?.simulations ?? []

  const isUniStudent = user?.role === ROLES.UNIVERSITY_STUDENT
  const firstName    = user?.name?.split(' ')[0] || 'there'
  const xp           = user?.xp ?? 0
  const assignmentPath = assignment?.simulation_id ? `/simulations/${assignment.simulation_id}` : '/simulations'

  return (
    <div className="max-w-container mx-auto px-6 py-8">

      {/* Welcome header */}
      <div className="mb-7">
        <h1 className="text-3xl font-bold text-on-surface mb-1">Welcome, {firstName}!</h1>
        <p className="text-on-surface-variant text-sm">
          {isUniStudent
            ? `${user.institution} · ${user.department} · Section ${user.section}`
            : 'Your AI-managed career learning platform.'}
        </p>
      </div>

      {/* University student feature access */}
      {isUniStudent && (
        <div className="mb-6 p-4 bg-surface-low rounded-xl border border-border">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">Feature Access</p>
          <div className="flex flex-wrap gap-2 items-center">
            {[
              { key: 'python_sandbox', label: 'Python Sandbox', icon: '🐍' },
              { key: 'model_solution', label: 'Model Solution', icon: '💡' },
              { key: 'certificate',    label: 'Certificate',    icon: '🏆' },
            ].map(f => {
              const on = hasFeature(f.key)
              return (
                <span key={f.key} className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium ${on ? 'bg-green-50 border-green-200 text-green-700' : 'bg-surface-high border-border text-on-surface-variant'}`}>
                  {on ? '✓' : '🔒'} {f.icon} {f.label}
                </span>
              )
            })}
            <span className="text-xs text-on-surface-variant">Contact your mentor to unlock features.</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">

        {/* ── Left: Manager + XP ── */}
        <div className="col-span-1 space-y-4">

          {/* Manager-assigned task */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="section-label">Your Manager</span>
                <h3 className="font-bold text-on-surface mt-0.5">Assigned Task</h3>
              </div>
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                {assignment?.manager?.avatar || 'AI'}
              </div>
            </div>

            {assignmentLoading ? (
              <div className="flex items-center justify-center py-10">
                <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : assignment?.has_assignment ? (
              <div>
                {/* Which job simulation this manager belongs to */}
                <div className="inline-flex items-center gap-1.5 mb-3 px-2 py-1 rounded-md bg-primary/5 border border-primary/15">
                  <span className="text-[10px]">💼</span>
                  <span className="text-[11px] font-semibold text-primary truncate">{assignment.simulation_title}</span>
                </div>

                {/* Manager identity — scoped to this simulation */}
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                    {assignment.manager.avatar}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-on-surface leading-tight truncate">{assignment.manager.name}</p>
                    <p className="text-xs text-on-surface-variant truncate">
                      {assignment.manager.role}{assignment.manager.company ? ` · ${assignment.manager.company}` : ''}
                    </p>
                  </div>
                </div>

                {/* Assignment detail */}
                <div className="border border-border rounded-xl p-3.5 bg-surface-low">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${assignment.in_progress ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                      {assignment.in_progress ? 'In progress' : 'New assignment'}
                    </span>
                    <span className="text-[11px] text-on-surface-variant">
                      {assignment.completed_count}/{assignment.total_tasks} done
                    </span>
                  </div>
                  <p className="font-bold text-on-surface text-sm mb-1">{assignment.task_name}</p>
                  {assignment.brief && (
                    <p className="text-xs text-on-surface-variant leading-relaxed mb-3">"{assignment.brief}"</p>
                  )}
                  <button
                    className="btn-primary w-full text-xs py-2"
                    onClick={() => navigate(assignmentPath)}
                  >
                    Complete this task →
                  </button>
                </div>
                <p className="text-[11px] text-on-surface-variant mt-2 text-center">
                  Needs to be completed to advance your simulation.
                </p>
              </div>
            ) : assignment?.reason === 'completed' ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                {assignment.simulation_title && (
                  <div className="inline-flex items-center gap-1.5 mb-3 px-2 py-1 rounded-md bg-primary/5 border border-primary/15">
                    <span className="text-[10px]">💼</span>
                    <span className="text-[11px] font-semibold text-primary truncate">{assignment.simulation_title}</span>
                  </div>
                )}
                <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-3 text-lg">✓</div>
                <p className="text-sm font-medium text-on-surface mb-1">All tasks completed!</p>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  You've finished every task {assignment.manager?.name} assigned. Your Skill GPS is updated.
                </p>
              </div>
            ) : assignment?.reason === 'onboarding_pending' ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                {assignment.simulation_title && (
                  <div className="inline-flex items-center gap-1.5 mb-3 px-2 py-1 rounded-md bg-primary/5 border border-primary/15">
                    <span className="text-[10px]">💼</span>
                    <span className="text-[11px] font-semibold text-primary truncate">{assignment.simulation_title}</span>
                  </div>
                )}
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-3 text-lg">📩</div>
                <p className="text-sm font-medium text-on-surface mb-1">You have an offer to accept</p>
                <p className="text-xs text-on-surface-variant leading-relaxed mb-3">
                  {assignment.manager?.name} is waiting — accept your offer to begin Week 1 and earn your Journey badge.
                </p>
                <button className="btn-primary text-xs px-4 py-2" onClick={() => navigate(assignmentPath)}>
                  Review offer →
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center text-on-surface-variant">
                <div className="w-10 h-10 rounded-full bg-surface-high flex items-center justify-center mb-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  </svg>
                </div>
                <p className="text-sm font-medium mb-1">No task assigned yet</p>
                <p className="text-xs leading-relaxed mb-3">Enroll in a Job Simulation and your manager will assign your first task.</p>
                <button className="btn-primary text-xs px-4 py-2" onClick={() => navigate('/simulations')}>
                  Browse Simulations →
                </button>
              </div>
            )}
          </div>

          {/* XP / progress card */}
          <div className="card">
            <span className="section-label">Your Progress</span>
            <div className="mt-3 flex items-end gap-2 mb-4">
              <p className="text-3xl font-bold text-primary">{xp.toLocaleString()}</p>
              <p className="text-sm text-on-surface-variant mb-1">XP earned</p>
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary text-xs px-3 py-1.5" onClick={() => navigate('/analytics')}>Analytics</button>
              <button className="btn-secondary text-xs px-3 py-1.5" onClick={() => navigate('/skill-gps')}>Skill GPS</button>
            </div>
          </div>
        </div>

        {/* ── Right: Simulation + quick links ── */}
        <div className="col-span-2 space-y-4">
          <div>
            <span className="section-label">Job Simulations</span>
            <h2 className="text-lg font-bold text-on-surface mt-0.5 mb-1">Start your first real-world project</h2>
            <p className="text-sm text-on-surface-variant">Complete tasks, earn XP, and build verified skills.</p>
          </div>

          {/* Job simulation cards — pulled from the backend's simulation list,
              not hardcoded, so a new simulation shows up here automatically. */}
          <div className="space-y-3">
            {simulationsLoading ? (
              <div className="card p-0 h-32 animate-pulse bg-surface-high" />
            ) : (
              simulations.map(sim => {
                const branding = SIM_BRANDING[sim.id]
                return (
                  <div
                    key={sim.id}
                    className="card p-0 overflow-hidden hover:border-primary transition-colors cursor-pointer group"
                    onClick={() => navigate(`/simulations/${sim.id}`)}
                  >
                    <div className={`h-1.5 w-full ${branding?.accentColor ?? 'bg-primary'}`} />
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 mb-2.5">
                            {branding?.logo && (
                              <div className="h-8 w-8 shrink-0 rounded-lg border border-border bg-white flex items-center justify-center p-1">
                                <img src={branding.logo} alt={sim.title} className="max-h-full max-w-full object-contain" />
                              </div>
                            )}
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-orange-100 text-orange-700">{sim.tag}</span>
                            <span className="chip">{sim.tasks} Tasks</span>
                          </div>
                          <h3 className="font-bold text-on-surface text-base mb-1 group-hover:text-primary transition-colors">
                            {sim.title}
                          </h3>
                          <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
                            {sim.description}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-on-surface-variant flex-wrap">
                            {(sim.skills ?? []).slice(0, 4).map(s => (
                              <span key={s} className="bg-surface-high px-2 py-0.5 rounded">{s}</span>
                            ))}
                          </div>
                        </div>
                        <button
                          className="btn-primary text-sm px-5 py-2.5 shrink-0 self-center"
                          onClick={e => { e.stopPropagation(); navigate(`/simulations/${sim.id}`) }}
                        >
                          Start →
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Quick navigation */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'AI Mentor',  desc: 'Get help with your tasks',  to: '/ai-mentor', iconBg: 'bg-violet-600', cardBg: 'bg-violet-50 border-violet-200' },
              { label: 'Skill GPS',  desc: 'Track your readiness score', to: '/skill-gps', iconBg: 'bg-teal-600',   cardBg: 'bg-teal-50 border-teal-200' },
              { label: 'Analytics', desc: 'View XP and activity',        to: '/analytics', iconBg: 'bg-amber-500',  cardBg: 'bg-amber-50 border-amber-200' },
            ].map(a => (
              <button
                key={a.to}
                onClick={() => navigate(a.to)}
                className={`flex items-center gap-3 border rounded-xl px-4 py-3 text-left hover:shadow-sm transition-all ${a.cardBg}`}
              >
                <div className={`w-8 h-8 rounded-lg ${a.iconBg} flex items-center justify-center shrink-0`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-on-surface">{a.label}</p>
                  <p className="text-xs text-on-surface-variant">{a.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
