import { useState } from 'react'

const competencies = [
  { name: 'Systems Architecture', category: 'Technical', score: 94, level: 'Expert', icon: 'arch', verified: true },
  { name: 'Data Literacy & Analytics', category: 'Technical', score: 88, level: 'Advanced', icon: 'data', verified: true },
  { name: 'Critical Systems Thinking', category: 'Cognitive', score: 91, level: 'Expert', icon: 'logic', verified: true },
  { name: 'Cross-functional Team Ops', category: 'Leadership', score: 82, level: 'Advanced', icon: 'team', verified: true },
  { name: 'AI Ethics & Governance', category: 'Domain', score: 87, level: 'Advanced', icon: 'ethics', verified: true },
  { name: 'Agile Project Management', category: 'Process', score: 90, level: 'Expert', icon: 'agile', verified: true },
  { name: 'Quantitative Analysis', category: 'Technical', score: 78, level: 'Proficient', icon: 'quant', verified: true },
  { name: 'Product UX Reasoning', category: 'Domain', score: 72, level: 'Proficient', icon: 'ux', verified: false },
]

const categoryColors = {
  Technical: 'bg-blue-100 text-blue-700',
  Cognitive: 'bg-violet-100 text-violet-700',
  Leadership: 'bg-purple-100 text-purple-700',
  Domain: 'bg-teal-100 text-teal-700',
  Process: 'bg-green-100 text-green-700',
}

const levelColors = {
  Expert: 'text-indigo-700 bg-indigo-50 border-indigo-200',
  Advanced: 'text-blue-700 bg-blue-50 border-blue-200',
  Proficient: 'text-amber-700 bg-amber-50 border-amber-200',
}

const artifacts = [
  {
    id: 1,
    title: 'Q3 Systems Optimization',
    subtitle: 'Global Logistics Simulation',
    desc: 'Redesigned the internal routing logic for the Global Logistics Simulation achieving a 98% efficiency score — top 3% of all learners in cohort.',
    tags: ['System Design', 'Optimization'],
    status: 'VERIFIED',
    statusColor: 'bg-green-100 text-green-700 border-green-200',
    metrics: [
      { label: 'Efficiency Score', value: '98%' },
      { label: 'Cohort Rank', value: 'Top 3%' },
    ],
    bg: 'from-indigo-900 to-blue-900',
    icon: 'map',
    date: 'Jun 2024',
  },
  {
    id: 2,
    title: 'AI Mentor Feedback Report',
    subtitle: 'Data Analysis Project',
    desc: 'Synthesized 40 hours of mentor feedback into a comprehensive growth report using quantitative linguistic modelling and gap analysis.',
    tags: ['Data Analysis', 'Reporting'],
    status: 'VERIFIED',
    statusColor: 'bg-green-100 text-green-700 border-green-200',
    metrics: [
      { label: 'Hours Analyzed', value: '40 hrs' },
      { label: 'Insight Score', value: '96/100' },
    ],
    bg: 'from-teal-900 to-emerald-900',
    icon: 'chart',
    date: 'May 2024',
  },
  {
    id: 3,
    title: 'SaaS Migration PRD',
    subtitle: 'Enterprise Cloud Integration',
    desc: 'Led the product documentation for a complex legacy billing system migration affecting 4,200 enterprise users with zero downtime delivery.',
    tags: ['PRD', 'Stakeholder Mgmt'],
    status: 'IN REVIEW',
    statusColor: 'bg-amber-100 text-amber-700 border-amber-200',
    metrics: [
      { label: 'Users Impacted', value: '4.2K' },
      { label: 'Downtime', value: '0 hrs' },
    ],
    bg: 'from-slate-800 to-indigo-900',
    icon: 'doc',
    date: 'Jun 2024',
  },
]

const timeline = [
  { date: 'Jun 2024', event: 'Systems Architecture elevated to Expert', delta: '+6 pts', color: 'bg-indigo-600' },
  { date: 'May 2024', event: 'Agile PM certified — 90% evaluator score', delta: '+Cert', color: 'bg-green-600' },
  { date: 'Apr 2024', event: 'Data Literacy: Advanced tier unlocked', delta: '+12%', color: 'bg-teal-600' },
  { date: 'Mar 2024', event: 'Completed Enterprise Simulation Track', delta: '+3 badges', color: 'bg-primary' },
]

const resumeData = {
  name: 'Rishi Raj',
  title: 'Aspiring Product Manager — AI & Enterprise Systems',
  contact: 'rishirajidentity@gmail.com',
  summary: 'Results-driven learner specialising in system-level product thinking, cross-functional leadership, and data-driven decision-making through immersive AI simulations.',
  experience: [
    {
      role: 'AI Simulation Engineer',
      org: 'WorkLearn Platform',
      period: '2023 – Present',
      bullets: [
        'Led Q3 Systems Optimisation, achieving 98% efficiency (top 3% cohort).',
        'Produced a 40-hr AI Mentor feedback synthesis with 96/100 insight score.',
      ],
    },
    {
      role: 'SaaS Migration PM (Simulation)',
      org: 'Enterprise Cloud Integration Track',
      period: '2024',
      bullets: [
        'Managed PRD for legacy-to-cloud migration: 4,200 enterprise users, zero downtime.',
      ],
    },
  ],
  education: [
    { degree: 'Cognitive Science Foundation', org: 'WorkLearn Certified' },
    { degree: 'Applied Game Theory', org: 'WorkLearn Certified' },
    { degree: 'Quantitative Ethics', org: 'WorkLearn Certified' },
  ],
}

const TABS = ['Overview', 'Competencies', 'Projects', 'Resume']

export default function Portfolio() {
  const [tab, setTab] = useState('Overview')

  return (
    <div className="max-w-container mx-auto px-6 py-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center shrink-0">
            <span className="text-white text-xl font-bold">RR</span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-2xl font-bold text-on-surface">Rishi Raj</h1>
              <span className="chip bg-primary/10 text-primary text-xs">Verified Learner</span>
            </div>
            <p className="text-sm text-on-surface-variant">Aspiring Product Manager · AI & Enterprise Systems</p>
            <div className="flex items-center gap-4 mt-2">
              {[
                { val: '124', label: 'Simulations' },
                { val: '12', label: 'Skills Certified' },
                { val: '08', label: 'Certificates' },
                { val: '98th', label: 'Percentile' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-primary">{s.val}</span>
                  <span className="text-xs text-on-surface-variant">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button className="btn-secondary text-xs px-4 py-2 flex items-center gap-1.5">
            <LinkIcon /> Share Portfolio
          </button>
          <button className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5">
            <DocIcon /> PDF Export
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-border mb-7">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              tab === t ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'Overview' && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">

            {/* Top competency snapshot */}
            <div className="card">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <span className="section-label">Competency Snapshot</span>
                  <p className="text-sm font-bold text-on-surface mt-0.5">Verified by AI Evaluator</p>
                </div>
                <button className="btn-ghost text-xs" onClick={() => setTab('Competencies')}>View all →</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {competencies.slice(0, 6).map(skill => (
                  <div key={skill.name} className="flex items-center gap-3 p-3 border border-border rounded-lg hover:border-primary transition-colors">
                    <div className="w-8 h-8 bg-surface-low rounded-lg flex items-center justify-center shrink-0">
                      <SkillIcon type={skill.icon} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-semibold text-on-surface truncate">{skill.name}</p>
                        <span className="text-xs font-bold text-primary ml-2 shrink-0">{skill.score}%</span>
                      </div>
                      <div className="h-1.5 bg-surface-high rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${skill.score}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent projects */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="section-label">Recent Project Artifacts</span>
                  <p className="text-sm font-bold text-on-surface mt-0.5">AI-evaluated submissions</p>
                </div>
                <button className="btn-ghost text-xs" onClick={() => setTab('Projects')}>View all →</button>
              </div>
              <div className="space-y-3">
                {artifacts.slice(0, 2).map(a => (
                  <div key={a.id} className="flex items-center gap-4 p-3 border border-border rounded-lg hover:border-primary transition-colors cursor-pointer">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${a.bg} flex items-center justify-center shrink-0`}>
                      <ArtifactIcon type={a.icon} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-on-surface">{a.title}</p>
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded border ${a.statusColor}`}>{a.status}</span>
                      </div>
                      <p className="text-xs text-on-surface-variant">{a.subtitle} · {a.date}</p>
                    </div>
                    <div className="flex gap-3 shrink-0">
                      {a.metrics.map(m => (
                        <div key={m.label} className="text-right">
                          <p className="text-sm font-bold text-primary">{m.value}</p>
                          <p className="text-xs text-on-surface-variant">{m.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Growth Index */}
            <div className="card p-5 border-primary/20 bg-gradient-to-r from-primary/5 to-indigo-50">
              <div className="flex items-center gap-5">
                <div className="text-center shrink-0">
                  <div className="relative w-20 h-20">
                    <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                      <circle cx="40" cy="40" r="32" fill="none" stroke="#e5e1e9" strokeWidth="8" />
                      <circle cx="40" cy="40" r="32" fill="none" stroke="#312E81" strokeWidth="8"
                        strokeDasharray={`${2 * Math.PI * 32 * 0.98} ${2 * Math.PI * 32 * 0.02}`}
                        strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg font-bold text-primary">98</span>
                      <span className="text-xs text-on-surface-variant">%ile</span>
                    </div>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">Overall Growth</p>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-on-surface mb-1">Overall Growth Index</p>
                  <p className="text-sm text-on-surface-variant mb-3">Top 5% of your cohort globally. You're consistently outperforming peers in Systems and Agile competencies.</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { val: '124', label: 'Simulations', color: 'text-primary' },
                      { val: '08', label: 'Certificates', color: 'text-green-600' },
                      { val: '1.2k', label: 'Network', color: 'text-indigo-500' },
                    ].map(s => (
                      <div key={s.label} className="bg-white rounded-lg border border-border p-2.5 text-center">
                        <p className={`text-base font-bold ${s.color}`}>{s.val}</p>
                        <p className="text-xs text-on-surface-variant">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Skill timeline + Resume preview */}
          <div className="col-span-1 space-y-4">
            {/* Skill timeline */}
            <div className="card">
              <span className="section-label mb-3 block">Skill Progress Timeline</span>
              <div className="relative pl-4">
                <div className="absolute left-0 top-0 bottom-0 w-px bg-border ml-1.5" />
                {timeline.map((t, i) => (
                  <div key={i} className="relative mb-5 last:mb-0">
                    <div className={`absolute -left-4 top-1 w-3 h-3 ${t.color} rounded-full border-2 border-white`} />
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs text-on-surface-variant">{t.date}</p>
                        <p className="text-xs font-semibold text-on-surface leading-snug mt-0.5">{t.event}</p>
                      </div>
                      <span className="text-xs font-bold text-green-600 shrink-0">{t.delta}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resume preview */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <span className="section-label">Resume Preview</span>
                <button className="text-xs text-primary font-semibold hover:underline">Edit</button>
              </div>
              <div className="border border-border rounded-lg p-4 text-xs">
                <p className="font-bold text-on-surface text-sm">{resumeData.name}</p>
                <p className="text-on-surface-variant mb-1">{resumeData.title}</p>
                <p className="text-on-surface-variant mb-3 text-xs">{resumeData.contact}</p>
                <div className="border-t border-border pt-3 mb-3">
                  <p className="font-semibold text-on-surface uppercase tracking-wide text-xs mb-1">Summary</p>
                  <p className="text-on-surface-variant leading-relaxed">{resumeData.summary}</p>
                </div>
                <div className="border-t border-border pt-3">
                  <p className="font-semibold text-on-surface uppercase tracking-wide text-xs mb-2">Experience</p>
                  {resumeData.experience.map((e, i) => (
                    <div key={i} className="mb-2">
                      <div className="flex items-start justify-between">
                        <p className="font-semibold text-on-surface">{e.role}</p>
                        <span className="text-on-surface-variant shrink-0 ml-2">{e.period}</span>
                      </div>
                      <p className="text-on-surface-variant italic mb-1">{e.org}</p>
                      {e.bullets.map((b, j) => (
                        <p key={j} className="text-on-surface-variant">· {b}</p>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-3 p-2.5 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                  <svg width="7" height="7" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="2,6 5,9 10,3" /></svg>
                </div>
                <p className="text-xs text-green-700">Auto-synced with latest verified achievements</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── COMPETENCIES ── */}
      {tab === 'Competencies' && (
        <div className="space-y-5">
          <div className="grid grid-cols-4 gap-4">
            {competencies.map(skill => (
              <div key={skill.name} className="card hover:border-primary transition-colors cursor-default">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-surface-low rounded-xl flex items-center justify-center">
                    <SkillIcon type={skill.icon} size={18} />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {skill.verified && (
                      <div className="flex items-center gap-1">
                        <div className="w-3.5 h-3.5 bg-green-500 rounded-full flex items-center justify-center">
                          <svg width="7" height="7" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="2,6 5,9 10,3" /></svg>
                        </div>
                        <span className="text-xs text-green-600 font-semibold">Certified</span>
                      </div>
                    )}
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${levelColors[skill.level]}`}>{skill.level}</span>
                  </div>
                </div>
                <p className="text-sm font-semibold text-on-surface mb-1 leading-tight">{skill.name}</p>
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${categoryColors[skill.category]}`}>{skill.category}</span>
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-on-surface-variant">Proficiency</span>
                    <span className="text-sm font-bold text-primary">{skill.score}%</span>
                  </div>
                  <div className="h-2 bg-surface-high rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${skill.score}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PROJECTS ── */}
      {tab === 'Projects' && (
        <div className="grid grid-cols-3 gap-5">
          {artifacts.map(a => (
            <div key={a.id} className="card p-0 overflow-hidden hover:border-primary transition-colors cursor-pointer group">
              <div className={`h-36 bg-gradient-to-br ${a.bg} flex items-center justify-center relative`}>
                <ArtifactIcon type={a.icon} large />
                <div className="absolute top-3 right-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded border ${a.statusColor}`}>{a.status}</span>
                </div>
                <div className="absolute bottom-3 left-3 flex gap-1.5">
                  {a.tags.map(tag => (
                    <span key={tag} className="text-xs bg-white/20 text-white font-medium px-2 py-0.5 rounded">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="p-4">
                <p className="font-bold text-on-surface text-sm mb-0.5 group-hover:text-primary transition-colors">{a.title}</p>
                <p className="text-xs text-on-surface-variant mb-3">{a.subtitle} · {a.date}</p>
                <p className="text-xs text-on-surface-variant leading-relaxed mb-4">{a.desc}</p>
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                  {a.metrics.map(m => (
                    <div key={m.label} className="bg-surface-low rounded-lg p-2.5 text-center">
                      <p className="text-base font-bold text-primary">{m.value}</p>
                      <p className="text-xs text-on-surface-variant">{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── RESUME ── */}
      {tab === 'Resume' && (
        <div className="max-w-2xl mx-auto">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <span className="section-label">Resume</span>
              <div className="flex gap-2">
                <button className="btn-secondary text-xs px-3 py-1.5">Edit Data</button>
                <button className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5"><DocIcon /> Export PDF</button>
              </div>
            </div>
            <div className="border border-border rounded-xl p-6 space-y-5">
              <div className="pb-4 border-b border-border">
                <h2 className="text-xl font-bold text-on-surface">{resumeData.name}</h2>
                <p className="text-sm text-primary font-semibold mt-0.5">{resumeData.title}</p>
                <p className="text-xs text-on-surface-variant mt-1">{resumeData.contact}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Professional Summary</p>
                <p className="text-sm text-on-surface leading-relaxed">{resumeData.summary}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">Experience</p>
                {resumeData.experience.map((e, i) => (
                  <div key={i} className={`${i > 0 ? 'mt-4 pt-4 border-t border-border' : ''}`}>
                    <div className="flex items-start justify-between mb-0.5">
                      <p className="text-sm font-bold text-on-surface">{e.role}</p>
                      <span className="text-xs text-on-surface-variant">{e.period}</span>
                    </div>
                    <p className="text-xs text-on-surface-variant italic mb-2">{e.org}</p>
                    <ul className="space-y-1">
                      {e.bullets.map((b, j) => (
                        <li key={j} className="text-sm text-on-surface flex items-start gap-2">
                          <span className="text-primary mt-0.5">·</span> {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-border">
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">Education & Certifications</p>
                <div className="grid grid-cols-3 gap-3">
                  {resumeData.education.map((ed, i) => (
                    <div key={i} className="p-3 bg-surface-low border border-border rounded-lg">
                      <p className="text-xs font-semibold text-on-surface">{ed.degree}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">{ed.org}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                <svg width="7" height="7" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="2,6 5,9 10,3" /></svg>
              </div>
              <p className="text-xs text-green-700">Resume is automatically synced with your verified simulations and skill assessments.</p>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-10 border-t border-border pt-4 flex items-center justify-between text-xs text-on-surface-variant">
        <span>WorkLearn AI</span>
        <div className="flex gap-4">
          <a href="#" className="hover:text-primary">Terms</a>
          <a href="#" className="hover:text-primary">Privacy</a>
          <a href="#" className="hover:text-primary">Help Center</a>
          <a href="#" className="hover:text-primary">Support</a>
        </div>
        <span>© 2024 WorkLearn AI. All rights reserved.</span>
      </footer>
    </div>
  )
}

function SkillIcon({ type, size = 14 }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: '#312E81', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (type === 'arch') return <svg {...p}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
  if (type === 'data') return <svg {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
  if (type === 'logic') return <svg {...p}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
  if (type === 'team') return <svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  if (type === 'ethics') return <svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
  if (type === 'agile') return <svg {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
  if (type === 'quant') return <svg {...p}><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>
  return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
}

function ArtifactIcon({ type, large }) {
  const size = large ? 36 : 20
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'white', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (type === 'map') return <svg {...p}><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>
  if (type === 'chart') return <svg {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
  return <svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
}

function LinkIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
}

function DocIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
}
