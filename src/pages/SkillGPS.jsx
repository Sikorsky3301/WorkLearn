import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const roles = ['Junior PM', 'Senior PM', 'Principal PM', 'Director of Product', 'VP of Product']

const gapData = [
  { skill: 'Systems Architecture', current: 94, required: 90, category: 'Technical', status: 'met' },
  { skill: 'Data-Driven Decision Making', current: 88, required: 92, category: 'Technical', status: 'gap' },
  { skill: 'Stakeholder Management', current: 72, required: 95, category: 'Leadership', status: 'gap' },
  { skill: 'Product Strategy', current: 65, required: 90, category: 'Domain', status: 'gap' },
  { skill: 'Agile Execution', current: 90, required: 85, category: 'Process', status: 'met' },
  { skill: 'Cross-functional Leadership', current: 82, required: 88, category: 'Leadership', status: 'gap' },
  { skill: 'Quantitative Analysis', current: 78, required: 75, category: 'Technical', status: 'met' },
  { skill: 'Executive Communication', current: 55, required: 88, category: 'Communication', status: 'gap' },
]

const nextActions = [
  {
    priority: 1,
    type: 'simulation',
    label: 'Run Simulation',
    title: 'Advanced Stakeholder Management',
    desc: 'Close your #1 gap — Executive pushback & boardroom communication.',
    impact: '+16% readiness',
    time: '3.5 hrs',
    impactColor: 'text-green-600',
    icon: 'sim',
    to: '/simulations',
    badge: 'Highest Impact',
    badgeColor: 'bg-green-100 text-green-700',
  },
  {
    priority: 2,
    type: 'course',
    label: 'Start Course',
    title: 'Product Strategy & Metrics Mastery',
    desc: 'Fill the Product Strategy gap required for Senior PM benchmark.',
    impact: '+11% readiness',
    time: '4 hrs',
    impactColor: 'text-blue-600',
    icon: 'course',
    to: '/courses/product-strategy-metrics',
    badge: 'Recommended',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  {
    priority: 3,
    type: 'mentor',
    label: 'Schedule Session',
    title: 'Executive Communication Deep-dive',
    desc: 'Your AI Mentor Sarah will guide you through structured communication frameworks.',
    impact: '+9% readiness',
    time: '45 min session',
    impactColor: 'text-violet-600',
    icon: 'mentor',
    to: '/ai-mentor',
    badge: 'Quick Win',
    badgeColor: 'bg-violet-100 text-violet-700',
  },
]

const weekPlan = [
  { day: 'Mon', task: 'Stakeholder Management Simulation — Part 1', type: 'sim', done: true },
  { day: 'Tue', task: 'Product Strategy Course — Module 1 & 2', type: 'course', done: true },
  { day: 'Wed', task: 'AI Mentor Session — Executive Comms', type: 'mentor', done: false },
  { day: 'Thu', task: 'Stakeholder Management Simulation — Part 2', type: 'sim', done: false },
  { day: 'Fri', task: 'Practice Quiz — Data-Driven Decision Making', type: 'quiz', done: false },
  { day: 'Sat', task: 'Review & Reflection — Weekly Portfolio Update', type: 'review', done: false },
]

const typeColors = {
  sim: 'bg-indigo-100 text-indigo-700',
  course: 'bg-blue-100 text-blue-700',
  mentor: 'bg-violet-100 text-violet-700',
  quiz: 'bg-amber-100 text-amber-700',
  review: 'bg-slate-100 text-slate-700',
}

export default function SkillGPS() {
  const navigate = useNavigate()
  const [targetRole, setTargetRole] = useState('Senior PM')
  const [filterStatus, setFilterStatus] = useState('all')

  const overallReadiness = 74
  const gaps = gapData.filter(s => s.status === 'gap')
  const met = gapData.filter(s => s.status === 'met')

  const filtered = filterStatus === 'all' ? gapData : filterStatus === 'gap' ? gaps : met

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
          <p className="text-sm text-on-surface-variant mt-1">Your AI-powered gap analysis and learning navigation system.</p>
        </div>

        {/* Target role selector */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm text-on-surface-variant font-medium">Target Role:</span>
          <div className="flex border border-border rounded-lg overflow-hidden">
            {roles.map(r => (
              <button
                key={r}
                onClick={() => setTargetRole(r)}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                  targetRole === r ? 'bg-primary text-white' : 'bg-white text-on-surface-variant hover:bg-surface-low'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-5">

        {/* ── LEFT: Readiness Score ── */}
        <div className="col-span-1 space-y-4">

          {/* Overall score */}
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
                <span className="text-xs text-on-surface-variant font-medium">of {targetRole}</span>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Skills Met', val: met.length, color: 'text-green-600' },
                { label: 'Gaps Remaining', val: gaps.length, color: 'text-red-500' },
                { label: 'Est. Completion', val: '~6 wks', color: 'text-primary' },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between text-sm">
                  <span className="text-on-surface-variant">{s.label}</span>
                  <span className={`font-bold ${s.color}`}>{s.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Career path visualizer */}
          <div className="card">
            <span className="section-label mb-3 block">Career Path</span>
            <div className="relative pl-5">
              <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-border" />
              {roles.map((r, i) => {
                const isCurrent = r === 'Junior PM'
                const isTarget = r === targetRole
                const isPast = i < roles.indexOf('Junior PM')
                const isFuture = i > roles.indexOf(targetRole)
                return (
                  <div key={r} className="relative mb-5 last:mb-0 flex items-center gap-2">
                    <div className={`absolute -left-5 w-3 h-3 rounded-full border-2 ${
                      isTarget ? 'bg-primary border-primary' :
                      isCurrent ? 'bg-green-500 border-green-500' :
                      isFuture ? 'bg-white border-border' : 'bg-green-400 border-green-400'
                    }`} />
                    <div>
                      <p className={`text-xs font-semibold ${isTarget ? 'text-primary' : isCurrent ? 'text-green-700' : 'text-on-surface-variant'}`}>
                        {r}
                        {isCurrent && <span className="ml-1 text-green-600">(You)</span>}
                        {isTarget && !isCurrent && <span className="ml-1 text-primary">← Target</span>}
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

          {/* Gap table */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="section-label">Skill Gap Analysis</span>
                <p className="text-sm font-bold text-on-surface mt-0.5">vs. {targetRole} Benchmark</p>
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
                const delta = skill.required - skill.current
                const isGap = skill.status === 'gap'
                return (
                  <div key={skill.skill} className={`p-3 rounded-lg border ${isGap ? 'border-red-200 bg-red-50/40' : 'border-green-200 bg-green-50/40'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-on-surface">{skill.skill}</p>
                        <span className="chip text-xs">{skill.category}</span>
                      </div>
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
                        <div className={`h-full rounded-full ${isGap ? 'bg-primary' : 'bg-green-500'}`} style={{ width: `${skill.current}%` }} />
                        <div className="absolute top-0 bottom-0 w-0.5 bg-on-surface/30" style={{ left: `${skill.required}%` }} title={`Required: ${skill.required}%`} />
                      </div>
                      <span className="text-xs text-on-surface-variant shrink-0 w-16 text-right">
                        {skill.current}% / {skill.required}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Next Actions + Week Plan ── */}
        <div className="col-span-1 space-y-4">

          {/* Next best actions */}
          <div className="card">
            <span className="section-label mb-3 block">Next Best Actions</span>
            <div className="space-y-3">
              {nextActions.map(a => (
                <div key={a.priority} className="border border-border rounded-lg p-3 hover:border-primary transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${a.badgeColor}`}>{a.badge}</span>
                    <span className={`text-xs font-bold ${a.impactColor}`}>{a.impact}</span>
                  </div>
                  <p className="text-sm font-semibold text-on-surface mb-0.5">{a.title}</p>
                  <p className="text-xs text-on-surface-variant leading-snug mb-2">{a.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-on-surface-variant">{a.time}</span>
                    <button onClick={() => navigate(a.to)} className="btn-primary text-xs px-2.5 py-1">{a.label} →</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly learning plan */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <span className="section-label">This Week's Plan</span>
              <span className="text-xs text-on-surface-variant">{weekPlan.filter(d => d.done).length}/{weekPlan.length} done</span>
            </div>
            <div className="space-y-2">
              {weekPlan.map((d, i) => (
                <div key={i} className={`flex items-start gap-2.5 p-2 rounded-lg ${d.done ? 'opacity-60' : ''}`}>
                  <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${d.done ? 'bg-primary border-primary' : 'border-border'}`}>
                    {d.done && <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="2,6 5,9 10,3"/></svg>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-bold text-on-surface-variant">{d.day}</span>
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${typeColors[d.type]}`}>{d.type}</span>
                    </div>
                    <p className={`text-xs leading-snug ${d.done ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>{d.task}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <div className="h-1.5 bg-surface-high rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${(weekPlan.filter(d=>d.done).length/weekPlan.length)*100}%` }} />
              </div>
              <p className="text-xs text-on-surface-variant mt-1">Weekly progress</p>
            </div>
          </div>
        </div>
      </div>

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
