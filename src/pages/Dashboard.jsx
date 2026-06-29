import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const quickActions = [
  {
    label: 'Share Interview Experience',
    desc: 'Help peers with your insights',
    color: 'bg-violet-50 border-violet-200',
    iconBg: 'bg-violet-600',
    to: null,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <polyline points="12 9 12 13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    label: 'Start a Course',
    desc: 'Browse the full simulation library',
    color: 'bg-blue-50 border-blue-200',
    iconBg: 'bg-blue-600',
    to: '/courses',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    label: 'Prep for AI Companies',
    desc: 'Tailored AI-role readiness path',
    color: 'bg-indigo-50 border-indigo-200',
    iconBg: 'bg-primary',
    to: '/simulations',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
        <circle cx="12" cy="16" r="1" fill="white" />
      </svg>
    ),
  },
  {
    label: 'View Questions',
    desc: 'Practice question bank by topic',
    color: 'bg-amber-50 border-amber-200',
    iconBg: 'bg-amber-500',
    to: null,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    label: 'Practice with AI',
    desc: 'Live AI-driven skill drills',
    color: 'bg-emerald-50 border-emerald-200',
    iconBg: 'bg-emerald-600',
    to: '/ai-mentor',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    label: 'Mock Interviews',
    desc: 'Simulate real interview sessions',
    color: 'bg-rose-50 border-rose-200',
    iconBg: 'bg-rose-600',
    to: '/simulations',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    ),
  },
  {
    label: 'Company Briefs',
    desc: 'Interview prep by company',
    color: 'bg-slate-50 border-slate-200',
    iconBg: 'bg-slate-600',
    to: null,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  },
]

const recommendedSimulations = [
  {
    id: 'advanced-system-design',
    title: 'Advanced System Design for Product Managers',
    desc: 'Navigate complex technical architectures and lead engineering teams with confidence.',
    tag: 'Product',
    tagColor: 'bg-blue-100 text-blue-700',
    level: 'Mastery Level',
    lessons: 12,
    hours: '4.5 hrs',
    progress: 33,
    progressLabel: '4 of 12 lessons',
    accentBg: 'bg-indigo-900',
    accentText: 'Systems Arch',
  },
  {
    id: 'data-driven-decision',
    title: 'Data-Driven Decision Making',
    desc: 'Learn to analyze complex datasets and translate insights into actionable business strategies.',
    tag: 'Data',
    tagColor: 'bg-teal-100 text-teal-700',
    level: 'Mastery Level',
    lessons: 10,
    hours: '5 hrs',
    progress: 0,
    progressLabel: 'Not started',
    accentBg: 'bg-teal-800',
    accentText: 'Data Literacy',
  },
  {
    id: 'leadership-ai-native',
    title: 'Leadership in AI-Native Teams',
    desc: 'Empower your team to leverage generative AI tools while maintaining high human collaboration.',
    tag: 'Leadership',
    tagColor: 'bg-purple-100 text-purple-700',
    level: 'Mastery Level',
    lessons: 11,
    hours: '4 hrs',
    progress: 0,
    progressLabel: 'Not started',
    accentBg: 'bg-purple-900',
    accentText: 'Leadership',
  },
]

const standupTasks = [
  { label: "Complete 'Behavioral Interviews' Module 1", done: true },
  { label: 'Submit 3 STAR method responses', done: false },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [doubt, setDoubt] = useState('')

  return (
    <div className="max-w-container mx-auto px-6 py-8">
      {/* Welcome header */}
      <div className="mb-7">
        <h1 className="text-3xl font-bold text-on-surface mb-1">Welcome, Rishi!</h1>
        <p className="text-on-surface-variant text-sm">Your AI-managed career roadmap for today. Stay on track to reach your Junior PM goals.</p>
      </div>

      {/* Quick Actions — pill cards */}
      <div className="flex items-stretch gap-3 mb-8 overflow-x-auto pb-1">
        {quickActions.map((a, i) => (
          <button
            key={i}
            onClick={() => a.to && navigate(a.to)}
            className={`flex items-center gap-3 shrink-0 border rounded-lg px-4 py-3 text-left hover:shadow-sm transition-all group ${a.color}`}
            style={{ minWidth: 192 }}
          >
            <div className={`w-9 h-9 rounded-lg ${a.iconBg} flex items-center justify-center shrink-0`}>
              {a.icon}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-on-surface leading-tight">{a.label}</p>
              <p className="text-xs text-on-surface-variant mt-0.5 leading-tight">{a.desc}</p>
            </div>
            <svg className="w-3.5 h-3.5 text-on-surface-variant ml-auto shrink-0 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: AI Manager standup */}
        <div className="col-span-1 space-y-4">
          {/* Morning Standup Card */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="section-label">AI Manager</span>
                <h3 className="font-bold text-on-surface mt-0.5">Morning Standup</h3>
                <p className="text-xs text-on-surface-variant">Today's objectives</p>
              </div>
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">AI</div>
            </div>

            <div className="space-y-2 mb-4">
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Today's priorities</p>
              {standupTasks.map((t, i) => (
                <label key={i} className="flex items-start gap-2 cursor-pointer group">
                  <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${t.done ? 'bg-primary border-primary' : 'border-border group-hover:border-primary'}`}>
                    {t.done && <CheckIcon />}
                  </div>
                  <span className={`text-sm ${t.done ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>{t.label}</span>
                </label>
              ))}
            </div>

            <div className="border-t border-border pt-3 mb-3">
              <p className="text-xs text-on-surface-variant mb-1">Estimated</p>
              <p className="text-sm font-semibold text-on-surface">2.5 hours</p>
            </div>

            <div className="border-t border-border pt-3 mb-3">
              <p className="text-xs text-on-surface-variant mb-1">AI Readiness Score</p>
              <p className="text-sm font-semibold text-primary">Quiz Score &gt; 80%</p>
            </div>

            <div className="border-t border-border pt-3">
              <p className="text-xs font-semibold text-on-surface-variant mb-2">Question of the day</p>
              <p className="text-sm text-on-surface leading-relaxed italic">
                "Can you provide an example of a strategy you developed to address a technology gap at your company?"
              </p>
              <div className="flex gap-2 mt-3">
                <button className="btn-primary text-xs px-3 py-1.5">Answer Now</button>
                <button className="btn-secondary text-xs px-3 py-1.5">Shuffle</button>
              </div>
              <button className="mt-2 btn-primary w-full text-xs py-2">Start Daily Sprint</button>
            </div>
          </div>

          {/* Mentoring Doubt Collector */}
          <div className="card">
            <span className="section-label">Mentoring Doubt Collection</span>
            <p className="text-xs text-on-surface-variant mt-1 mb-3">Have a question for your next session? Log it here.</p>
            <textarea
              value={doubt}
              onChange={(e) => setDoubt(e.target.value)}
              placeholder="Describe your doubt in concise terms..."
              rows={3}
              className="input resize-none text-sm mb-3"
            />
            <button className="btn-primary w-full text-xs py-2">+ Submit for Next Session</button>
          </div>
        </div>

        {/* Right: Simulation recommendations */}
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="section-label">Recommended Simulations</span>
              <h2 className="text-lg font-bold text-on-surface mt-0.5">Start a new simulation</h2>
              <p className="text-sm text-on-surface-variant">Curated based on your Junior PM career goals.</p>
            </div>
            <button className="btn-secondary text-xs px-3 py-1.5" onClick={() => navigate('/courses')}>Browse all →</button>
          </div>

          <div className="space-y-3">
            {recommendedSimulations.map((sim) => (
              <div
                key={sim.id}
                className="card p-0 overflow-hidden hover:border-primary transition-colors cursor-pointer group"
                onClick={() => navigate(`/courses/${sim.id}`)}
              >
                <div className="flex items-stretch">
                  {/* Left accent strip */}
                  <div className={`w-2 shrink-0 ${sim.accentBg}`} />

                  {/* Content */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${sim.tagColor}`}>{sim.tag}</span>
                          <span className="chip">{sim.level}</span>
                        </div>
                        <h3 className="font-semibold text-on-surface text-sm leading-snug mb-1 group-hover:text-primary transition-colors">
                          {sim.title}
                        </h3>
                        <p className="text-xs text-on-surface-variant leading-relaxed mb-3">{sim.desc}</p>

                        {/* Meta row */}
                        <div className="flex items-center gap-4 text-xs text-on-surface-variant mb-3">
                          <span className="flex items-center gap-1.5">
                            <MetaIcon type="lessons" />
                            {sim.lessons} lessons
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MetaIcon type="clock" />
                            {sim.hours}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MetaIcon type="badge" />
                            {sim.accentText}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-surface-high rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${sim.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-on-surface-variant shrink-0">{sim.progressLabel}</span>
                        </div>
                      </div>

                      <button
                        className="btn-primary text-xs px-4 py-2 shrink-0 self-center"
                        onClick={(e) => { e.stopPropagation(); navigate(`/courses/${sim.id}`) }}
                      >
                        {sim.progress > 0 ? 'Continue →' : 'Start →'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* AI Readiness Summary */}
          <div className="mt-5 card bg-surface-low border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-primary text-xs font-bold">AI</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-on-surface">AI Manager Summary</p>
                <p className="text-xs text-on-surface-variant">Based on your current trajectory</p>
              </div>
              {/* Streak badge */}
              <div className="ml-auto flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
                <span className="text-sm">🔥</span>
                <span className="text-xs font-bold text-amber-700">14-day streak</span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Courses In Progress', value: '2', color: 'text-primary' },
                { label: 'Simulations Done', value: '124', color: 'text-green-600' },
                { label: 'Skills Certified', value: '12', color: 'text-amber-600' },
                { label: 'XP Earned Today', value: '+180', color: 'text-violet-600' },
              ].map((stat) => (
                <div key={stat.label} className="text-center p-3 bg-white rounded-lg border border-border">
                  <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-on-surface-variant mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Evening Review Card */}
          <div className="mt-3 card border-indigo-200 bg-indigo-50/60">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-bold text-indigo-900">Evening Review — Tonight at 9:00 PM</p>
                  <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full border border-indigo-200">Upcoming</span>
                </div>
                <p className="text-xs text-indigo-700 leading-relaxed mb-2">Your AI Manager will summarise today's accomplishments, highlight what you didn't complete, and build tomorrow's sprint. Complete at least 1 more objective to unlock the full review.</p>
                <div className="flex gap-2">
                  <button className="text-xs bg-indigo-600 text-white font-semibold px-3 py-1.5 rounded hover:bg-indigo-700 transition-colors" onClick={() => navigate('/analytics')}>View Today's Progress</button>
                  <button className="text-xs text-indigo-600 font-semibold hover:underline">Set Review Time</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="2,6 5,9 10,3" />
    </svg>
  )
}

function MetaIcon({ type }) {
  if (type === 'lessons') return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
  if (type === 'clock') return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  )
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  )
}
