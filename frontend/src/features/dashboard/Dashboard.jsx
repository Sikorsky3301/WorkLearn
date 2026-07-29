import { useNavigate } from 'react-router-dom'
import { useAuth, ROLES } from '../auth/AuthContext'
import { useMyAssignments, useSimulations } from '../../shared/api/hooks'
import AssignmentCard from './components/AssignmentCard'
import JobSimulationsSection from './components/JobSimulationsSection'
import WelcomeVideoCard from './components/WelcomeVideoCard'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, hasFeature } = useAuth()
  const { data: assignmentsData, isLoading: assignmentsLoading } = useMyAssignments()
  const { data: simulationsData, isLoading: simulationsLoading } = useSimulations()
  const simulations = simulationsData?.simulations ?? []
  const assignments = assignmentsData?.assignments ?? []

  const isUniStudent = user?.role === ROLES.UNIVERSITY_STUDENT
  const firstName    = user?.name?.split(' ')[0] || 'there'
  const xp           = user?.xp ?? 0

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

      <WelcomeVideoCard />

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

        {/* ── Left: Managers + XP ── */}
        <div className="col-span-1 space-y-4">

          {/* Managers + assigned tasks — one card per enrolled simulation, so
              running multiple job simulations at once shows every manager. */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="section-label">{assignments.length > 1 ? 'Your Managers' : 'Your Manager'}</span>
                <h3 className="font-bold text-on-surface mt-0.5">
                  {assignments.length > 1 ? `${assignments.length} Active Simulations` : 'Assigned Task'}
                </h3>
              </div>
            </div>

            {assignmentsLoading ? (
              <div className="card card-shadow flex items-center justify-center py-10">
                <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : assignments.length === 0 ? (
              <div className="card card-shadow flex flex-col items-center justify-center py-8 text-center text-on-surface-variant">
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
            ) : (
              <div className="space-y-3">
                {assignments.map(a => (
                  <AssignmentCard key={a.simulation_id} assignment={a} onGo={() => navigate(`/simulations/${a.simulation_id}`)} />
                ))}
              </div>
            )}
          </div>

          {/* XP / progress card */}
          <div className="card card-shadow">
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

          {/* Grouped by domain — pulled from the backend's simulation list,
              not hardcoded, so a new simulation/domain shows up automatically.
              The student's preferred_domain (set during onboarding) surfaces
              first with a "Recommended for you" badge. */}
          <JobSimulationsSection
            simulations={simulations}
            loading={simulationsLoading}
            preferredDomain={user?.preferred_domain}
          />

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
