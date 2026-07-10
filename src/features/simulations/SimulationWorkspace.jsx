import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useEnrollment, useEnroll } from '../../shared/api/hooks'

const SIMULATIONS = [
  {
    id: 'da-job-sim',
    title: 'Junior Data Analyst — Job Simulation',
    description:
      'Work through 5 real-world DA tasks: write SQL queries, run Python EDA, segment customers with RFM, design A/B tests, and present findings. Every task awards skill points and XP.',
    category: 'Data Analytics',
    categoryColor: 'bg-orange-100 text-orange-700',
    accentColor: 'bg-orange-500',
    tasks: 5,
    estimatedTime: '3–4 hours',
    difficulty: 'Beginner–Intermediate',
    skills: ['SQL', 'Python', 'Analytics', 'Statistics', 'Communication'],
    path: '/simulations/da-job-sim',
    overviewPath: '/simulations/da-job-sim/overview',
    taskList: [
      { id: 1, title: 'SQL Data Extraction',       time: '~30 min', desc: 'Write SQL queries to pull sales data from a relational database.' },
      { id: 2, title: 'Python EDA',                 time: '~45 min', desc: 'Load the data with pandas and produce an exploratory analysis.' },
      { id: 3, title: 'RFM Customer Segmentation', time: '~45 min', desc: 'Segment customers by Recency, Frequency, and Monetary value.' },
      { id: 4, title: 'A/B Test Design',            time: '~30 min', desc: 'Design a hypothesis test and interpret statistical significance.' },
      { id: 5, title: 'Data Presentation',          time: '~30 min', desc: 'Build a data story and present insights to stakeholders.' },
    ],
  },
]

export default function SimulationWorkspace() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const enrolledOnly = searchParams.get('filter') === 'enrolled'

  // There's currently one simulation, so its own enrollment status is enough
  // to decide the "My Enrolled Simulations" filter — this generalizes to a
  // per-card check (like SimCard already does) if more sims are added later.
  const { data: enrollment, isLoading } = useEnrollment(SIMULATIONS[0].id)
  const isEnrolledAnywhere = !!enrollment?.status
  const showEmptyState = enrolledOnly && !isLoading && !isEnrolledAnywhere
  const visibleSims = showEmptyState ? [] : SIMULATIONS

  return (
    <div className="max-w-container mx-auto px-6 py-8">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-on-surface mb-1">
          {enrolledOnly ? 'My Enrolled Simulations' : 'Simulations'}
        </h1>
        <p className="text-sm text-on-surface-variant">
          {enrolledOnly
            ? "Simulations you've started — pick up where you left off."
            : 'Enroll in a job simulation to start earning XP and skill points.'}
        </p>
      </div>

      {showEmptyState ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <p className="text-sm text-on-surface-variant mb-4">You haven't enrolled in any simulations yet.</p>
          <button onClick={() => navigate('/simulations')} className="btn-primary text-sm px-5 py-2.5">
            Browse all simulations
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleSims.map(sim => (
            <SimCard key={sim.id} sim={sim} />
          ))}
        </div>
      )}
    </div>
  )
}

function SimCard({ sim }) {
  const navigate = useNavigate()
  const { data: enrollment, isLoading }  = useEnrollment(sim.id)
  const { mutate: enroll, isPending: enrolling } = useEnroll(sim.id)

  const [onboarding, setOnboarding] = useState(false)
  const [step, setStep]             = useState(1)

  const status    = enrollment?.status
  const tasksDone = enrollment?.task_completions?.length ?? 0
  const progress  = status ? Math.round((tasksDone / sim.tasks) * 100) : 0

  function handleCTA() {
    if (status) {
      navigate(sim.path)
    } else {
      setStep(1)
      setOnboarding(true)
    }
  }

  function handleConfirm() {
    enroll(undefined, {
      onSuccess: () => {
        setOnboarding(false)
        navigate(sim.path)
      },
    })
  }

  return (
    <>
      <div
        onClick={isLoading ? undefined : handleCTA}
        className={`card p-0 overflow-hidden hover:border-primary transition-colors group ${isLoading ? '' : 'cursor-pointer'}`}
      >
        <div className={`h-1.5 w-full ${sim.accentColor}`} />
        <div className="p-5">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${sim.categoryColor}`}>
                  {sim.category}
                </span>
                <span className="chip">{sim.tasks} Tasks</span>
                <span className="chip">{sim.estimatedTime}</span>
                {status && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-primary/10 text-primary'
                  }`}>
                    {status === 'completed' ? 'Completed' : 'Enrolled'}
                  </span>
                )}
              </div>

              <h2 className="text-base font-bold text-on-surface mb-1 group-hover:text-primary transition-colors">
                {sim.title}
              </h2>
              <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
                {sim.description}
              </p>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {sim.skills.map(s => (
                  <span key={s} className="text-xs bg-surface-high text-on-surface-variant px-2 py-0.5 rounded">{s}</span>
                ))}
              </div>

              {status && (
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-surface-high rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <span className="text-xs text-on-surface-variant shrink-0">{tasksDone} / {sim.tasks} tasks</span>
                </div>
              )}
            </div>

            <div className="shrink-0 self-center flex flex-col items-stretch gap-2">
              {isLoading ? (
                <div className="w-28 h-9 bg-surface-high rounded-lg animate-pulse" />
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); handleCTA() }}
                  disabled={enrolling}
                  className="btn-primary px-5 py-2.5 text-sm flex items-center justify-center gap-2"
                >
                  {enrolling && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {enrolling
                    ? 'Enrolling…'
                    : status === 'completed'
                    ? 'Review'
                    : status
                    ? 'Continue →'
                    : 'Enroll & Start →'}
                </button>
              )}
              {sim.overviewPath && (
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(sim.overviewPath) }}
                  className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors px-2 py-1 text-center cursor-pointer"
                >
                  View Full Details
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {onboarding && (
        <EnrollmentModal
          sim={sim}
          step={step}
          onStep={setStep}
          onClose={() => setOnboarding(false)}
          onConfirm={handleConfirm}
          enrolling={enrolling}
        />
      )}
    </>
  )
}

function EnrollmentModal({ sim, step, onStep, onClose, onConfirm, enrolling }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Progress strip */}
        <div className="h-1 bg-surface-high w-full">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map(n => (
              <div key={n} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step > n ? 'bg-green-500 text-white' : step === n ? 'bg-primary text-white' : 'bg-surface-high text-on-surface-variant'
                }`}>
                  {step > n ? '✓' : n}
                </div>
                {n < 3 && <div className="w-6 h-px bg-border" />}
              </div>
            ))}
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">

          {step === 1 && (
            <div>
              <div className="flex items-start gap-3 mb-5">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c2410c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-on-surface leading-tight">{sim.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${sim.categoryColor}`}>{sim.category}</span>
                    <span className="text-xs text-on-surface-variant">{sim.difficulty}</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-on-surface-variant leading-relaxed mb-5">{sim.description}</p>

              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { val: sim.tasks.toString(), label: 'Tasks' },
                  { val: sim.estimatedTime, label: 'Est. time' },
                  { val: sim.skills.length.toString(), label: 'Skills earned' },
                ].map(s => (
                  <div key={s.label} className="bg-surface-low border border-border rounded-xl p-3 text-center">
                    <p className="text-base font-bold text-primary">{s.val}</p>
                    <p className="text-xs text-on-surface-variant">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                <p className="text-xs font-semibold text-primary mb-2">What you'll earn</p>
                <div className="flex flex-wrap gap-1.5">
                  {sim.skills.map(s => (
                    <span key={s} className="text-xs bg-white border border-primary/20 text-primary px-2 py-0.5 rounded font-medium">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-lg font-bold text-on-surface mb-1">Your 5 tasks</h2>
              <p className="text-sm text-on-surface-variant mb-5">Each task mirrors real work a junior data analyst would do. You'll submit your work and receive AI feedback.</p>

              <div className="space-y-3">
                {sim.taskList.map((t, i) => (
                  <div key={t.id} className="flex items-start gap-3 p-3 border border-border rounded-xl hover:border-primary transition-colors">
                    <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-on-surface">{t.title}</p>
                        <span className="text-xs text-on-surface-variant shrink-0">{t.time}</span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">{t.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-lg font-bold text-on-surface mb-1">Ready to start?</h2>
              <p className="text-sm text-on-surface-variant mb-5">
                You can pause and continue at any time. Your progress is saved automatically.
              </p>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5">
                <p className="text-sm font-semibold text-green-800 mb-3">When you enroll, you'll get:</p>
                <div className="space-y-2">
                  {[
                    'Access to all 5 simulation tasks',
                    'AI-powered feedback on every submission',
                    'Skill points added to your portfolio',
                    'XP and level progression',
                    'Manager task reminders & deadlines',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                        <svg width="7" height="7" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="2,6 5,9 10,3" />
                        </svg>
                      </div>
                      <p className="text-xs text-green-800">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-surface-low border border-border rounded-xl">
                <div className={`h-8 w-8 rounded-lg ${sim.accentColor} flex items-center justify-center shrink-0`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-on-surface truncate">{sim.title}</p>
                  <p className="text-xs text-on-surface-variant">{sim.tasks} tasks · {sim.estimatedTime}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 pb-6">
          {step > 1 ? (
            <button onClick={() => onStep(step - 1)} className="btn-secondary text-sm px-4 py-2">← Back</button>
          ) : (
            <button onClick={onClose} className="btn-secondary text-sm px-4 py-2">Cancel</button>
          )}

          {step < 3 ? (
            <button onClick={() => onStep(step + 1)} className="btn-primary text-sm px-5 py-2">
              Next →
            </button>
          ) : (
            <button
              onClick={onConfirm}
              disabled={enrolling}
              className="btn-primary text-sm px-6 py-2 flex items-center gap-2"
            >
              {enrolling && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {enrolling ? 'Enrolling…' : 'Confirm Enrollment'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
