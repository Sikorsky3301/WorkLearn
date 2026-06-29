import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const cohortMembers = [
  { name: 'Priya Sharma', role: 'Aspiring PM', initials: 'PS', color: 'bg-violet-600', level: 7, xp: 2810, skills: ['Product Strategy', 'Stakeholder Mgmt'], streak: 21, badge: 'Expert', sims: 14 },
  { name: 'Arjun Mehta', role: 'SWE → EM', initials: 'AM', color: 'bg-blue-600', level: 6, xp: 2240, skills: ['System Design', 'Engineering Leadership'], streak: 9, badge: 'Advanced', sims: 11 },
  { name: 'Rishi Raj', role: 'Aspiring PM', initials: 'RR', color: 'bg-primary', level: 7, xp: 2450, skills: ['Data Analysis', 'Risk Management'], streak: 14, badge: 'Advanced', sims: 12, isYou: true },
  { name: 'Neha Gupta', role: 'Data Analyst', initials: 'NG', color: 'bg-teal-600', level: 5, xp: 1890, skills: ['SQL', 'Data Storytelling'], streak: 6, badge: 'Proficient', sims: 8 },
  { name: 'Karan Bose', role: 'TPM', initials: 'KB', color: 'bg-amber-600', level: 6, xp: 2180, skills: ['Program Management', 'Roadmapping'], streak: 12, badge: 'Advanced', sims: 10 },
  { name: 'Ananya Iyer', role: 'ML Engineer', initials: 'AI', color: 'bg-emerald-600', level: 8, xp: 3120, skills: ['Machine Learning', 'Python'], streak: 30, badge: 'Expert', sims: 18 },
]

const discussions = [
  {
    id: 1, type: 'experience', author: 'Priya Sharma', initials: 'PS', color: 'bg-violet-600',
    tag: 'Interview Experience', tagColor: 'bg-violet-100 text-violet-700',
    title: 'Google PM Interview — L4 Offer (Bangalore)',
    body: 'Just got my offer! The design round was a nested product question — "Design a feature for Maps to help blind users navigate shopping malls." I used the framework from the PM Interview Prep simulation and structured it as: user context → JTBD → success metrics → feature ideation → prioritize → MVP. The interviewer appreciated the structured framing.',
    likes: 34, replies: 12, time: '2h ago', pinned: true,
  },
  {
    id: 2, type: 'question', author: 'Karan Bose', initials: 'KB', color: 'bg-amber-600',
    tag: 'Question', tagColor: 'bg-amber-100 text-amber-700',
    title: 'Best way to handle the "why PM and not SWE?" question as a career switcher?',
    body: 'I keep getting this in behavioral rounds and I fumble on it. I\'ve been a software engineer for 3 years and now targeting PM roles. Does anyone have a solid framework for addressing this without sounding like I\'m running away from engineering?',
    likes: 18, replies: 7, time: '5h ago',
  },
  {
    id: 3, type: 'resource', author: 'Ananya Iyer', initials: 'AI', color: 'bg-emerald-600',
    tag: 'Resource', tagColor: 'bg-emerald-100 text-emerald-700',
    title: 'Reading List for ML System Design interviews at FAANG',
    body: 'I compiled everything I used to prep for my ML System Design rounds. Key focus areas: feature stores, model serving infrastructure, A/B testing at scale, and ML monitoring. Posting my full notes from the ML simulations here for the cohort.',
    likes: 52, replies: 19, time: '1d ago',
  },
  {
    id: 4, type: 'milestone', author: 'Arjun Mehta', initials: 'AM', color: 'bg-blue-600',
    tag: 'Milestone', tagColor: 'bg-blue-100 text-blue-700',
    title: 'Completed all 4 Engineering Management simulations — AMA!',
    body: 'Just finished the last EM simulation (Hiring & Scaling). My biggest takeaway was the hiring loop design exercise — the AI evaluator caught that my interview panel had no diversity in technical depth. Will be doing a full write-up for the cohort.',
    likes: 27, replies: 9, time: '2d ago',
  },
]

const milestones = [
  { actor: 'Ananya Iyer', initials: 'AI', color: 'bg-emerald-600', event: 'Earned Expert badge in Machine Learning', time: '1h ago', icon: '★' },
  { actor: 'Priya Sharma', initials: 'PS', color: 'bg-violet-600', event: 'Hit a 21-day streak 🔥', time: '3h ago', icon: '🔥' },
  { actor: 'Karan Bose', initials: 'KB', color: 'bg-amber-600', event: 'Completed TPM Simulation with 91% score', time: '6h ago', icon: '✓' },
  { actor: 'Neha Gupta', initials: 'NG', color: 'bg-teal-600', event: 'Submitted Data Analytics portfolio', time: '1d ago', icon: '📁' },
  { actor: 'Arjun Mehta', initials: 'AM', color: 'bg-blue-600', event: 'Reached Level 6', time: '2d ago', icon: '⬆' },
]

const badgeColors = { Expert: 'bg-primary text-white', Advanced: 'bg-violet-100 text-violet-700', Proficient: 'bg-blue-100 text-blue-700' }

export default function Community() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('discussions')
  const [newPost, setNewPost] = useState(false)
  const [liked, setLiked] = useState({})
  const [filterType, setFilterType] = useState('all')

  const filteredDiscussions = discussions.filter(d => filterType === 'all' || d.type === filterType)

  return (
    <div className="max-w-container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Cohort Community</h1>
          <p className="text-sm text-on-surface-variant mt-1">{cohortMembers.length} members · Share experiences, ask questions, celebrate milestones</p>
        </div>
        <button onClick={() => setNewPost(true)} className="btn-primary text-sm px-4 py-2 flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Share Experience
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-6">
        {[
          { key: 'discussions', label: 'Discussions' },
          { key: 'cohort', label: 'Cohort Members' },
          { key: 'leaderboard', label: 'Leaderboard' },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${activeTab === t.key ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Discussions ── */}
      {activeTab === 'discussions' && (
        <div className="grid grid-cols-3 gap-6">
          {/* Main feed */}
          <div className="col-span-2 space-y-4">
            {/* Filter chips */}
            <div className="flex gap-2">
              {[
                { key: 'all', label: 'All' },
                { key: 'experience', label: 'Interview Experiences' },
                { key: 'question', label: 'Questions' },
                { key: 'resource', label: 'Resources' },
                { key: 'milestone', label: 'Milestones' },
              ].map(f => (
                <button key={f.key} onClick={() => setFilterType(f.key)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${filterType === f.key ? 'bg-primary text-white border-primary' : 'bg-white text-on-surface-variant border-border hover:border-primary'}`}>
                  {f.label}
                </button>
              ))}
            </div>

            {filteredDiscussions.map(post => (
              <div key={post.id} className={`card ${post.pinned ? 'border-primary/30 bg-primary/2' : ''}`}>
                {post.pinned && (
                  <div className="flex items-center gap-1 text-xs text-primary font-semibold mb-2">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>
                    Pinned Post
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 ${post.color} rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold`}>{post.initials}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-semibold text-on-surface">{post.author}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${post.tagColor}`}>{post.tag}</span>
                      <span className="text-xs text-on-surface-variant ml-auto">{post.time}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-on-surface mb-2 hover:text-primary cursor-pointer">{post.title}</h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed mb-3 line-clamp-3">{post.body}</p>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setLiked(l => ({ ...l, [post.id]: !l[post.id] }))}
                        className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${liked[post.id] ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill={liked[post.id] ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                        {post.likes + (liked[post.id] ? 1 : 0)}
                      </button>
                      <button className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary font-semibold">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        {post.replies} replies
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            {/* Recent milestones */}
            <div className="card">
              <p className="text-xs font-bold text-on-surface mb-3">Recent Milestones</p>
              <div className="space-y-3">
                {milestones.map((m, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className={`w-7 h-7 ${m.color} rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold`}>{m.initials}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-on-surface">{m.actor}</p>
                      <p className="text-xs text-on-surface-variant leading-snug">{m.event}</p>
                      <p className="text-xs text-on-surface-variant opacity-60 mt-0.5">{m.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top contributors */}
            <div className="card">
              <p className="text-xs font-bold text-on-surface mb-3">Top Contributors</p>
              {cohortMembers.sort((a, b) => b.xp - a.xp).slice(0, 3).map((m, i) => (
                <div key={m.name} className="flex items-center gap-2.5 mb-2">
                  <span className={`text-xs font-bold w-4 ${i === 0 ? 'text-amber-500' : 'text-on-surface-variant'}`}>#{i + 1}</span>
                  <div className={`w-7 h-7 ${m.color} rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold`}>{m.initials}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-on-surface">{m.name} {m.isYou ? '(You)' : ''}</p>
                    <p className="text-xs text-on-surface-variant">{m.xp.toLocaleString()} XP</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Cohort Members ── */}
      {activeTab === 'cohort' && (
        <div className="grid grid-cols-3 gap-4">
          {cohortMembers.map(m => (
            <div key={m.name} className={`card ${m.isYou ? 'border-primary/40 bg-primary/3' : ''}`}>
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-12 h-12 ${m.color} rounded-xl flex items-center justify-center shrink-0 text-white text-sm font-bold relative`}>
                  {m.initials}
                  {m.isYou && <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-on-surface">{m.name}</p>
                    {m.isYou && <span className="text-[10px] font-bold text-primary">(You)</span>}
                  </div>
                  <p className="text-xs text-on-surface-variant">{m.role}</p>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${badgeColors[m.badge]}`}>{m.badge}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                <div className="bg-surface-low rounded-lg p-1.5">
                  <p className="text-sm font-bold text-on-surface">Lv.{m.level}</p>
                  <p className="text-[10px] text-on-surface-variant">Level</p>
                </div>
                <div className="bg-surface-low rounded-lg p-1.5">
                  <p className="text-sm font-bold text-on-surface">{m.streak}d</p>
                  <p className="text-[10px] text-on-surface-variant">Streak</p>
                </div>
                <div className="bg-surface-low rounded-lg p-1.5">
                  <p className="text-sm font-bold text-on-surface">{m.sims}</p>
                  <p className="text-[10px] text-on-surface-variant">Sims</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                {m.skills.map(s => (
                  <span key={s} className="text-[10px] font-semibold bg-surface-high text-on-surface-variant px-2 py-0.5 rounded-full">{s}</span>
                ))}
              </div>

              {!m.isYou && (
                <button className="btn-secondary w-full text-xs py-1.5">View Portfolio</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Leaderboard ── */}
      {activeTab === 'leaderboard' && (
        <div className="max-w-2xl">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-on-surface">XP Leaderboard — This Month</p>
              <span className="text-xs text-on-surface-variant">Resets July 1</span>
            </div>
            {cohortMembers.sort((a, b) => b.xp - a.xp).map((m, i) => (
              <div key={m.name} className={`flex items-center gap-4 py-3 border-b border-border last:border-0 ${m.isYou ? 'bg-primary/3 -mx-5 px-5 rounded' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${i === 0 ? 'bg-amber-100 text-amber-600' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-surface-low text-on-surface-variant'}`}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                </div>
                <div className={`w-9 h-9 ${m.color} rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold`}>{m.initials}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-on-surface">{m.name}</p>
                    {m.isYou && <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">You</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex-1 h-1.5 bg-border rounded-full">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${(m.xp / 3500) * 100}%` }} />
                    </div>
                    <span className="text-xs font-bold text-on-surface-variant shrink-0">{m.xp.toLocaleString()} XP</span>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeColors[m.badge]}`}>{m.badge}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New post modal */}
      {newPost && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setNewPost(false)}>
          <div className="bg-white rounded-xl border border-border p-6 w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-on-surface mb-4">Share with Your Cohort</h2>
            <div className="flex gap-2 mb-4">
              {[
                { key: 'experience', label: 'Interview Experience', color: 'bg-violet-100 text-violet-700' },
                { key: 'question', label: 'Question', color: 'bg-amber-100 text-amber-700' },
                { key: 'resource', label: 'Resource', color: 'bg-emerald-100 text-emerald-700' },
              ].map(t => (
                <button key={t.key} className={`text-xs font-bold px-3 py-1.5 rounded-full border border-transparent ${t.color}`}>{t.label}</button>
              ))}
            </div>
            <input type="text" placeholder="Title" className="input text-sm mb-3 w-full" />
            <textarea rows={5} placeholder="What would you like to share?" className="input resize-none text-sm w-full mb-4" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setNewPost(false)} className="btn-secondary text-sm px-4 py-2">Cancel</button>
              <button onClick={() => setNewPost(false)} className="btn-primary text-sm px-4 py-2">Post to Community</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
