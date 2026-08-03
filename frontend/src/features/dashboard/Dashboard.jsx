import { useNavigate } from 'react-router-dom'
import { Lock, Check, ClipboardList } from 'lucide-react'
import { useAuth, ROLES } from '../auth/AuthContext'
import { useMyAssignments, useSimulations } from '../../hooks'
import AssignmentCard from './components/AssignmentCard'
import JobSimulationsSection from './components/JobSimulationsSection'
import WelcomeVideoCard from './components/WelcomeVideoCard'

const UNI_FEATURES = [
  { key: 'python_sandbox', label: 'Python Sandbox' },
  { key: 'model_solution', label: 'Model Solution' },
  { key: 'certificate', label: 'Certificate' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, hasFeature } = useAuth()
  const { data: assignmentsData, isLoading: assignmentsLoading } = useMyAssignments()
  const { data: simulationsData, isLoading: simulationsLoading } = useSimulations()

  const simulations = simulationsData?.simulations ?? []
  const assignments = assignmentsData?.assignments ?? []

  const isUniStudent = user?.role === ROLES.UNIVERSITY_STUDENT
  const firstName    = user?.name?.split(' ')[0] || 'there'

  return (
    <div className="max-w-container mx-auto px-6 py-8">

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-on-surface tracking-tight mb-1">Welcome back, {firstName}</h1>
        <p className="text-on-surface-variant text-sm">
          {isUniStudent
            ? `${user.institution} · ${user.department} · Section ${user.section}`
            : 'Your AI-managed career learning platform.'}
        </p>
      </div>

      <WelcomeVideoCard />

      {/* University student feature access */}
      {isUniStudent && (
        <div className="mb-6 rounded-xl border border-border bg-white shadow-sm px-5 py-4">
          <p className="section-label mb-3">Feature Access</p>
          <div className="flex flex-wrap gap-2 items-center">
            {UNI_FEATURES.map((f) => {
              const on = hasFeature(f.key)
              return (
                <span
                  key={f.key}
                  className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${
                    on
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-surface-low border-border text-on-surface-variant'
                  }`}
                >
                  {on ? <Check className="h-3 w-3" /> : <Lock className="h-3 w-3" />} {f.label}
                </span>
              )
            })}
            <span className="text-xs text-on-surface-variant">Contact your mentor to unlock features.</span>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6 items-start">

        {/* ── Left: manager + assigned task, one card per enrolled simulation ── */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-bold text-on-surface">
              {assignments.length > 1 ? 'Your Managers' : 'Your Manager'}
            </h2>
            {assignments.length > 1 && (
              <span className="text-xs text-on-surface-variant">{assignments.length} active</span>
            )}
          </div>

          {assignmentsLoading ? (
            <div className="rounded-xl border border-border bg-white shadow-sm flex items-center justify-center py-12">
              <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : assignments.length === 0 ? (
            <div className="rounded-xl border border-border bg-white shadow-sm flex flex-col items-center justify-center py-10 px-5 text-center">
              <span className="w-11 h-11 rounded-full bg-primary/[0.07] text-primary flex items-center justify-center mb-3">
                <ClipboardList className="h-5 w-5" />
              </span>
              <p className="text-sm font-semibold text-on-surface mb-1">No task assigned yet</p>
              <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                Enroll in a job simulation and your manager will assign your first task.
              </p>
              <button className="btn-primary text-xs px-4 py-2" onClick={() => navigate('/simulations')}>
                Browse simulations →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.map((a) => (
                <AssignmentCard key={a.simulation_id} assignment={a} onGo={() => navigate(`/simulations/${a.simulation_id}`)} />
              ))}
            </div>
          )}
        </div>

        {/* ── Right: job simulations ── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-baseline justify-between">
            <div>
              <h2 className="text-base font-bold text-on-surface">Job Simulations</h2>
              <p className="text-sm text-on-surface-variant mt-0.5">
                Complete real tasks, earn XP, and build verified skills.
              </p>
            </div>
            <button
              onClick={() => navigate('/simulations')}
              className="text-xs font-semibold text-primary hover:underline shrink-0 cursor-pointer"
            >
              View all →
            </button>
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
        </div>
      </div>
    </div>
  )
}
