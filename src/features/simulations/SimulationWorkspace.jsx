import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQueries } from '@tanstack/react-query'
import { useEnrollment } from '../../shared/api/hooks'
import { api } from '../../shared/api/client'
import lumenLogoImg from '../../assets/lumen-logo.png'
import enigmaLogoImg from '../../assets/enigma-logo.png'
import nimbusLogoImg from '../../assets/nimbus-logo.png'

const SIMULATIONS = [
  {
    id: 'da-job-sim',
    title: 'Junior Data Analyst — Job Simulation',
    description:
      'Work through 5 real-world DA tasks: write SQL queries, run Python EDA, segment customers with RFM, design A/B tests, and present findings. Every task awards skill points and XP.',
    company: 'Lumen Corporation',
    logo: lumenLogoImg,
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
  {
    id: 'frontend-dev-sim',
    title: 'Frontend Developer — Job Simulation',
    description:
      'Ship 5 real-world frontend tickets: a semantic landing page, an accessible interactive nav, an async data fetch, a React component, and a stateful task manager app. Every task is graded against real automated tests.',
    company: 'Enigma',
    logo: enigmaLogoImg,
    category: 'Engineering',
    categoryColor: 'bg-orange-100 text-orange-700',
    accentColor: 'bg-orange-500',
    tasks: 5,
    estimatedTime: '5–7 hours',
    difficulty: 'Beginner–Advanced',
    skills: ['HTML/CSS', 'JavaScript', 'React', 'Accessibility', 'State Management'],
    path: '/simulations/frontend-dev-sim',
    overviewPath: '/simulations/frontend-dev-sim/overview',
    taskList: [
      { id: 1, title: 'Landing Hero Section',    time: '~30 min', desc: 'Build a semantic, responsive hero section with HTML and CSS.' },
      { id: 2, title: 'Interactive Navigation',  time: '~30 min', desc: 'Wire up a mobile menu toggle and active-link highlighting with vanilla JS.' },
      { id: 3, title: 'Fetch & Render Data',     time: '~45 min', desc: 'Fetch live data with proper loading and error states.' },
      { id: 4, title: 'React Component',         time: '~45 min', desc: 'Convert the data list into a proper React component.' },
      { id: 5, title: 'Task Manager App',        time: '~60 min', desc: 'Build a stateful React app with add/complete/delete and localStorage persistence.' },
    ],
  },
  {
    id: 'sales-crm-sim',
    title: 'Enterprise SaaS Sales Representative',
    description:
      'Run a full sales cycle at Nimbus CRM: qualify a lead, research the account, send cold outreach, run an AI discovery call, work the deal in a real CRM, handle objections, write a proposal, and close.',
    company: 'Nimbus CRM',
    logo: nimbusLogoImg,
    category: 'Sales',
    categoryColor: 'bg-blue-100 text-blue-700',
    accentColor: 'bg-blue-600',
    tasks: 8,
    estimatedTime: '3–5 hours',
    difficulty: 'Intermediate',
    skills: ['Discovery', 'CRM Accuracy', 'Objection Handling', 'Negotiation', 'Closing'],
    path: '/simulations/sales-crm-sim',
    overviewPath: '/simulations/sales-crm-sim/overview',
    taskList: [
      { id: 1, title: 'Lead Qualification', time: '~15 min', desc: 'Score an inbound lead and judge buying intent.' },
      { id: 2, title: 'Research',           time: '~15 min', desc: 'Build a real picture of the account before reaching out.' },
      { id: 3, title: 'Cold Outreach',      time: '~15 min', desc: 'Write a cold email that earns a reply, graded by AI.' },
      { id: 4, title: 'Discovery Call',     time: '~20 min', desc: 'Run a live discovery call with an AI prospect.' },
      { id: 5, title: 'CRM — Work the Deal',time: '~20 min', desc: 'Log the account, contact, and opportunity in a real CRM.' },
      { id: 6, title: 'Objection Handling', time: '~15 min', desc: 'Handle real objections from an AI prospect.' },
      { id: 7, title: 'Proposal',           time: '~15 min', desc: 'Write the business case — problem, solution, ROI, pricing.' },
      { id: 8, title: 'Close',              time: '~15 min', desc: 'Demo, signature, negotiation, and the onboarding handoff.' },
    ],
  },
]

// Additional simulation types from the spec's landing page that aren't
// built yet — shown as non-interactive cards so the landing page reflects
// the intended catalog without overstating what's actually playable today.
const COMING_SOON_SIMULATIONS = [
  { id: 'inside-sales-exec', title: 'Inside Sales Executive', category: 'Sales', accentColor: 'bg-slate-400' },
  { id: 'account-exec', title: 'Account Executive', category: 'Sales', accentColor: 'bg-slate-400' },
  { id: 'bdr', title: 'Business Development Representative', category: 'Sales', accentColor: 'bg-slate-400' },
  { id: 'cs-associate', title: 'Customer Success Associate', category: 'Sales', accentColor: 'bg-slate-400' },
  { id: 'sales-ops', title: 'Sales Operations Specialist', category: 'Sales', accentColor: 'bg-slate-400' },
]

export default function SimulationWorkspace() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const enrolledOnly = searchParams.get('filter') === 'enrolled'

  // Check enrollment status across every simulation (not just the first) so
  // "My Enrolled Simulations" correctly reflects enrollment in any of them.
  const enrollmentQueries = useQueries({
    queries: SIMULATIONS.map(sim => ({
      queryKey: ['enrollment', sim.id],
      queryFn: () => api.get(`/api/enrollments/by-sim/${sim.id}`),
      retry: false,
      staleTime: 30_000,
    })),
  })
  const isLoading = enrollmentQueries.some(q => q.isLoading)
  const isEnrolledAnywhere = enrollmentQueries.some(q => !!q.data?.status)
  const showEmptyState = enrolledOnly && !isLoading && !isEnrolledAnywhere
  const visibleSims = showEmptyState
    ? []
    : enrolledOnly
    ? SIMULATIONS.filter((sim, i) => !!enrollmentQueries[i].data?.status)
    : SIMULATIONS

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
        <div className="grid sm:grid-cols-2 gap-5">
          {visibleSims.map(sim => (
            <SimCard key={sim.id} sim={sim} />
          ))}
          {!enrolledOnly && COMING_SOON_SIMULATIONS.map(sim => (
            <ComingSoonCard key={sim.id} sim={sim} />
          ))}
        </div>
      )}
    </div>
  )
}

function SimCard({ sim }) {
  const navigate = useNavigate()
  const { data: enrollment, isLoading } = useEnrollment(sim.id)

  const status    = enrollment?.status
  const tasksDone = enrollment?.task_completions?.length ?? 0
  const progress  = status ? Math.round((tasksDone / sim.tasks) * 100) : 0

  // The card always opens the overview page — enrolling and resuming a
  // pending stage both happen from the overview page's own CTA button
  // (which the workspace itself handles via auto-enroll-on-entry), not here.
  const goToOverview = () => navigate(sim.overviewPath ?? sim.path)

  return (
    <div
      onClick={isLoading ? undefined : goToOverview}
      className={`card p-0 overflow-hidden flex flex-col group transition-all duration-200 ease-out hover:-translate-y-1.5 hover:shadow-xl hover:border-primary/50 ${isLoading ? '' : 'cursor-pointer'}`}
    >
        <div className={`h-1.5 w-full ${sim.accentColor}`} />
        <div className="p-5 flex flex-col flex-1">

          {/* Logo + company row */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5 min-w-0">
              {sim.logo ? (
                <img src={sim.logo} alt={sim.company} className="h-8 w-auto max-w-[100px] object-contain shrink-0" />
              ) : (
                <div className={`h-10 w-10 shrink-0 rounded-lg flex items-center justify-center text-white text-xs font-bold ${sim.accentColor}`}>
                  {sim.company.split(' ').map(w => w[0]).slice(0, 2).join('')}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-bold text-on-surface truncate">{sim.company}</p>
                <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${sim.categoryColor}`}>
                  {sim.category}
                </span>
              </div>
            </div>
            {status && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded shrink-0 ${
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

          <div className="flex items-center gap-1.5 mb-4">
            <span className="chip">{sim.tasks} Tasks</span>
            <span className="chip">{sim.estimatedTime}</span>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {sim.skills.map(s => (
              <span key={s} className="text-xs bg-surface-high text-on-surface-variant px-2 py-0.5 rounded">{s}</span>
            ))}
          </div>

          {status && (
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-1.5 bg-surface-high rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-xs text-on-surface-variant shrink-0">{tasksDone} / {sim.tasks} tasks</span>
            </div>
          )}

          <div className="mt-auto pt-1">
            {isLoading ? (
              <div className="h-9 bg-surface-high rounded-lg animate-pulse" />
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); goToOverview() }}
                className="w-full btn-primary px-5 py-2.5 text-sm flex items-center justify-center gap-2"
              >
                {status === 'completed' ? 'Review' : status ? 'Continue →' : 'View Overview →'}
              </button>
            )}
          </div>
        </div>
      </div>
  )
}

function ComingSoonCard({ sim }) {
  return (
    <div className="card p-0 overflow-hidden flex flex-col opacity-70">
      <div className={`h-1.5 w-full ${sim.accentColor}`} />
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`h-10 w-10 shrink-0 rounded-lg flex items-center justify-center text-white text-xs font-bold ${sim.accentColor}`}>
              {sim.title.split(' ').map(w => w[0]).slice(0, 2).join('')}
            </div>
            <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded bg-surface-high text-on-surface-variant`}>
              {sim.category}
            </span>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded shrink-0 bg-surface-high text-on-surface-variant">
            Coming Soon
          </span>
        </div>
        <h2 className="text-base font-bold text-on-surface mb-1">{sim.title}</h2>
        <p className="text-sm text-on-surface-variant leading-relaxed mb-4 flex-1">
          This job simulation is on our roadmap — check back soon.
        </p>
        <button disabled className="btn-secondary px-5 py-2.5 text-sm cursor-not-allowed">
          Not yet available
        </button>
      </div>
    </div>
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
