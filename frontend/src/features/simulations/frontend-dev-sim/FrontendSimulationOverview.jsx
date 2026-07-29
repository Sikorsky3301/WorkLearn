import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEnrollment } from '../../../shared/api/hooks'
import { TASKS, TASK_ICONS, TASK_COLORS } from './FrontendSimulationWorkspace'

const SIM_ID = 'frontend-dev-sim'
const SIM_PATH = '/simulations/frontend-dev-sim'

const OBJECTIVES = [
  'Build a semantic, accessible HTML/CSS layout from a real design ticket.',
  'Add vanilla JavaScript interactivity that behaves correctly, not just looks right.',
  'Handle async data properly — loading, success, and error states, every time.',
  'Write your first React components with props and conditional rendering.',
  'Manage state in React with hooks, and persist it across page reloads.',
]

const PREREQUISITES = [
  'Comfort with HTML and CSS basics',
  'Some JavaScript helpful but not required',
  'No prior frontend job experience needed',
  'Works with any modern browser — nothing to install locally',
]

// Illustrative learner feedback — not pulled from a review system (this app
// doesn't have one yet); presented as example testimonials, not live metrics.
const REVIEWS = [
  { name: 'Jordan P.', role: 'Bootcamp graduate → Frontend Developer', rating: 5,
    quote: "The nav toggle task caught me completely underestimating aria-expanded. Maya's hint about screen readers actually reading that attribute changed how I write every button now." },
  { name: 'Sofia M.', role: 'Backend dev, going full-stack', rating: 5,
    quote: 'The React tasks build on each other so naturally — vanilla JS fetch, then the exact same feature as a component. Finally understood props vs. state by actually doing it twice.' },
  { name: 'Devon L.', role: 'Self-taught, first job search', rating: 4,
    quote: "Real automated tests running against my actual code, not just a checklist — that pressure is exactly what a real PR review feels like. Wish there were a CSS-Grid-specific task." },
]
const AVG_RATING = REVIEWS.reduce((s, r) => s + r.rating, 0) / REVIEWS.length

// ── Icons — SVG only, consistent 24 viewBox / 2px stroke, no emoji ─────────
function BookIcon(props) {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
}
function ClockIcon(props) {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></svg>
}
function ToolsIcon(props) {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14.7 6.3a4 4 0 0 0-5.6 5.6L3 18l3 3 6.1-6.1a4 4 0 0 0 5.6-5.6l-2.6 2.6-2-2z"/></svg>
}
function CompassIcon(props) {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="9"/><polygon points="16 8 13.5 13.5 8 16 10.5 10.5 16 8"/></svg>
}
function CheckCircleIcon(props) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="9"/><polyline points="8.5 12.5 11 15 15.5 9.5"/></svg>
}
function QuoteIcon(props) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M9.5 6C6.5 7.5 5 9.8 5 13c0 2.5 1.6 4 3.5 4S12 15.5 12 13.3c0-1.8-1.2-3.1-3-3.1-.3 0-.6 0-.9.1.3-1.5 1.5-2.7 3.2-3.5L9.5 6zm9 0c-3 1.5-4.5 3.8-4.5 7 0 2.5 1.6 4 3.5 4s3.5-1.5 3.5-3.7c0-1.8-1.2-3.1-3-3.1-.3 0-.6 0-.9.1.3-1.5 1.5-2.7 3.2-3.5L18.5 6z"/></svg>
}
function WaveIcon(props) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 11.5V9a2 2 0 0 0-4 0v-1a2 2 0 0 0-4 0v-1a2 2 0 0 0-4 0v9.5a6 6 0 0 0 6 6h2a6 6 0 0 0 6-6v-3a2 2 0 0 0-2-2z"/><path d="M10 8V4a2 2 0 0 1 4 0"/></svg>
}
function ChevronDownIcon(props) {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="6 9 12 15 18 9"/></svg>
}
function ListCheckIcon(props) {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
}
function SparkleIcon(props) {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/></svg>
}

function StarIcon({ filled, half }) {
  const id = 'half-star-fill-fe'
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinejoin="round">
      {half && (
        <defs>
          <linearGradient id={id}>
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="50%" stopColor="transparent" stopOpacity="1" />
          </linearGradient>
        </defs>
      )}
      <polygon
        points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
        fill={half ? `url(#${id})` : filled ? '#f59e0b' : 'none'}
        stroke={filled || half ? '#f59e0b' : '#d1d5db'}
      />
    </svg>
  )
}
function Stars({ rating, size = 14 }) {
  return (
    <div className="flex items-center gap-0.5" style={{ fontSize: size }} aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(n => (
        <StarIcon key={n} filled={n <= Math.floor(rating)} half={n === Math.ceil(rating) && !Number.isInteger(rating)} />
      ))}
    </div>
  )
}

function EnrollCard({ status, isLoading, tasksDone, onGo }) {
  return (
    <div className="card border-2 border-primary/15 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-3">
        {status === 'completed' ? 'Completed' : status ? 'In Progress' : 'Get Started'}
      </p>

      {isLoading ? (
        <div className="h-11 bg-surface-high rounded-lg animate-pulse mb-4" />
      ) : (
        <button
          onClick={onGo}
          className="btn-primary w-full py-3 text-sm mb-4 cursor-pointer flex items-center justify-center gap-1.5"
        >
          {status === 'completed' ? 'Review Simulation' : status ? 'Continue Simulation' : 'Start Simulation'}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      )}

      {status && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-on-surface-variant font-medium">Your progress</span>
            <span className="font-semibold text-on-surface">{tasksDone} / {TASKS.length} tasks</span>
          </div>
          <div className="h-1.5 bg-surface-high rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.round((tasksDone / TASKS.length) * 100)}%` }} />
          </div>
        </div>
      )}

      <ul className="space-y-2.5 pt-4 border-t border-border">
        <li className="flex items-center gap-2.5 text-sm text-on-surface-variant">
          <BookIcon className="text-primary shrink-0" /> 3 weeks, 6 modules
        </li>
        <li className="flex items-center gap-2.5 text-sm text-on-surface-variant">
          <ClockIcon className="text-primary shrink-0" /> 5–7 hours, self-paced
        </li>
        <li className="flex items-center gap-2.5 text-sm text-on-surface-variant">
          <ToolsIcon className="text-primary shrink-0" /> HTML, CSS, JavaScript, React
        </li>
        <li className="flex items-center gap-2.5 text-sm text-on-surface-variant">
          <CompassIcon className="text-primary shrink-0" /> Graded by real automated tests
        </li>
      </ul>
    </div>
  )
}

export default function FrontendSimulationOverview() {
  const navigate = useNavigate()
  const { data: enrollment, isLoading } = useEnrollment(SIM_ID)
  const status = enrollment?.status
  const tasksDone = enrollment?.task_completions?.length ?? 0

  const [expandedTasks, setExpandedTasks] = useState(new Set())
  const toggleTask = (id) => setExpandedTasks(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  return (
    <div className="max-w-container mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-on-surface-variant mb-6">
        <button className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/simulations')}>Simulations</button>
        <span className="text-border">/</span>
        <span className="text-on-surface font-medium">Frontend Developer — Job Simulation</span>
      </nav>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* ── Main column ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Hero */}
          <div>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="chip bg-orange-100 text-orange-700">Engineering</span>
              <span className="chip">Beginner → Advanced</span>
              <span className="flex items-center gap-1.5 text-sm">
                <Stars rating={AVG_RATING} />
                <span className="font-semibold text-on-surface">{AVG_RATING.toFixed(1)}</span>
                <span className="text-on-surface-variant">({REVIEWS.length} reviews)</span>
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-on-surface mb-3 leading-tight tracking-tight">
              Frontend Developer — Job Simulation
            </h1>

            <p className="text-on-surface-variant leading-relaxed mb-5 max-w-2xl">
              You won't watch lectures. You'll ship the actual tickets a junior frontend developer
              gets in their first few weeks: a semantic landing page, an accessible interactive nav,
              a real async data fetch with proper error handling, and a stateful React app — each one
              graded against hidden automated tests, the same way a real PR gets checked by CI. Every
              ticket comes from your manager, Maya Chen.
            </p>

            <div className="flex items-center gap-5 text-sm text-on-surface-variant flex-wrap">
              <span className="flex items-center gap-1.5"><BookIcon /> 3 weeks</span>
              <span className="flex items-center gap-1.5"><ClockIcon /> 5–7 hours</span>
              <span className="flex items-center gap-1.5"><ToolsIcon /> HTML → JS → React</span>
              <span className="flex items-center gap-1.5"><CompassIcon /> Self-paced</span>
            </div>
          </div>

          {/* Weekly curriculum */}
          <div className="card">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-on-surface">Curriculum — Week by Week</h2>
              <span className="text-xs font-medium text-on-surface-variant">{TASKS.length + 1} stages</span>
            </div>
            <p className="text-xs text-on-surface-variant mb-5">Click a task to see exactly what you'll do and what you'll learn.</p>
            <div className="relative">
              <div className="absolute left-[17px] top-2 bottom-2 w-px bg-border" aria-hidden="true" />

              <div className="relative flex items-start gap-4 pb-6">
                <div className="relative z-10 w-9 h-9 rounded-full bg-surface-low border-2 border-white ring-1 ring-border text-on-surface-variant flex items-center justify-center shrink-0">
                  <WaveIcon />
                </div>
                <div className="pt-1">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-0.5">Week 0 — Onboarding</p>
                  <p className="font-semibold text-on-surface text-sm">Welcome to the Web Platform team</p>
                  <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">Meet your manager Maya Chen, get the lay of the Enigma codebase, and read your first ticket.</p>
                </div>
              </div>

              {TASKS.map((t, i) => {
                const Icon = TASK_ICONS[t.id]
                const color = TASK_COLORS[t.id]
                const isLast = i === TASKS.length - 1
                const isOpen = expandedTasks.has(t.id)
                return (
                  <div key={t.id} className={`relative flex items-start gap-4 ${isLast ? '' : 'pb-6'}`}>
                    <div className={`relative z-10 w-9 h-9 rounded-full ${color.bg} ring-1 ring-white/40 text-white flex items-center justify-center shrink-0 shadow-sm`}>
                      <Icon width={16} height={16} />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <button
                        onClick={() => toggleTask(t.id)}
                        aria-expanded={isOpen}
                        className="w-full flex items-start justify-between gap-3 text-left group cursor-pointer"
                      >
                        <div className="min-w-0">
                          <p className={`text-[11px] font-bold uppercase tracking-widest mb-0.5 ${color.text}`}>Week {t.week}</p>
                          <p className="font-semibold text-on-surface text-sm group-hover:text-primary transition-colors">{t.title}</p>
                          <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">{t.subject}</p>
                        </div>
                        <ChevronDownIcon className={`text-on-surface-variant shrink-0 mt-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isOpen && (
                        <div className="mt-3 pl-3 border-l-2 border-border space-y-3 animate-[fadeIn_0.2s_ease]">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5 flex items-center gap-1.5">
                              <ListCheckIcon /> What you'll do
                            </p>
                            <ul className="space-y-1">
                              {t.whatToDo.map((item, j) => (
                                <li key={j} className="text-xs text-on-surface-variant leading-relaxed flex items-start gap-1.5">
                                  <span className={`mt-1.5 w-1 h-1 rounded-full shrink-0 ${color.bg}`} />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5 flex items-center gap-1.5">
                              <SparkleIcon /> Skills you'll build
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {t.skills.map(s => (
                                <span key={s} className={`text-[11px] font-semibold px-2 py-0.5 rounded ${color.bgSoft} ${color.text}`}>{s}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Learning objectives */}
          <div className="card">
            <h2 className="text-lg font-bold text-on-surface mb-4">Learning Objectives</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {OBJECTIVES.map((obj, i) => (
                <div key={i} className="flex items-start gap-3 p-3.5 bg-surface-low rounded-lg">
                  <CheckCircleIcon className="text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-on-surface leading-snug">{obj}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Prerequisites */}
          <div className="card">
            <h2 className="text-lg font-bold text-on-surface mb-3">Prerequisites</h2>
            <div className="flex flex-wrap gap-2">
              {PREREQUISITES.map((p, i) => <span key={i} className="chip">{p}</span>)}
            </div>
          </div>

          {/* Reviews */}
          <div className="card">
            <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
              <h2 className="text-lg font-bold text-on-surface">What Learners Say</h2>
              <div className="flex items-center gap-2">
                <Stars rating={AVG_RATING} />
                <span className="text-sm font-semibold text-on-surface">{AVG_RATING.toFixed(1)}</span>
                <span className="text-xs text-on-surface-variant">({REVIEWS.length} reviews)</span>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant mb-5">Illustrative feedback from the simulation's early cohort.</p>

            <div className="grid sm:grid-cols-1 gap-3">
              {REVIEWS.map((r, i) => (
                <div key={i} className="relative border border-border rounded-lg p-4 bg-surface-low/40">
                  <QuoteIcon className="absolute top-3 right-3 text-border" />
                  <div className="flex items-center justify-between mb-2 pr-6">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {r.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-on-surface leading-tight">{r.name}</p>
                        <p className="text-xs text-on-surface-variant">{r.role}</p>
                      </div>
                    </div>
                  </div>
                  <Stars rating={r.rating} size={12} />
                  <p className="text-sm text-on-surface-variant leading-relaxed mt-2">{r.quote}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-5 lg:sticky lg:top-20">
          <EnrollCard status={status} isLoading={isLoading} tasksDone={tasksDone} onGo={() => navigate(SIM_PATH)} />

          <div className="card border-2 border-primary/15 bg-primary/[0.02]">
            <div className="pb-4 mb-4 border-b border-border">
              <p className="text-[11px] font-bold tracking-widest text-primary uppercase mb-1">Certification</p>
              <p className="font-bold text-on-surface text-sm">Frontend Developer</p>
            </div>
            <p className="text-xs text-on-surface leading-relaxed mb-3">
              Pass a 5-question final assessment after your last task to earn the "Simulation Journey"
              badge and a portfolio-ready deliverables package — your landing page, interactive nav,
              live data fetch, React component, and task manager app.
            </p>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-green-500 rounded-full shrink-0" />
              <span className="text-xs font-semibold text-green-700">Verifiable on your profile</span>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">MC</span>
              </div>
              <div>
                <p className="font-semibold text-on-surface text-sm">Your Manager: Maya Chen</p>
                <p className="text-xs text-on-surface-variant">Frontend Engineering Lead</p>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Maya reviews your actual submitted code against hidden automated tests, the same way a
              real PR gets checked by CI — every task has to genuinely work, not just look right.
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}
