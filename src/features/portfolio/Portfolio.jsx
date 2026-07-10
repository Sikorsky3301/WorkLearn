import { useState } from 'react'
import { useAuth, ROLES } from '../auth/AuthContext'
import { useUserSkills, useUserBadges } from '../../shared/api/hooks'

const SKILL_LABELS = {
  sql:                'SQL Queries',
  python:             'Python & EDA',
  analytics:          'Data Analytics',
  data_cleaning:      'Data Cleaning',
  data_viz:           'Data Visualization',
  customer_analysis:  'Customer Analysis',
  segmentation:       'RFM Segmentation',
  statistics:         'Statistics',
  hypothesis_testing: 'Hypothesis Testing',
  communication:      'Communication',
  data_storytelling:  'Data Storytelling',
}

const SKILL_CATEGORIES = {
  sql:                'Technical',
  python:             'Technical',
  analytics:          'Technical',
  data_cleaning:      'Technical',
  data_viz:           'Technical',
  customer_analysis:  'Domain',
  segmentation:       'Domain',
  statistics:         'Cognitive',
  hypothesis_testing: 'Cognitive',
  communication:      'Leadership',
  data_storytelling:  'Leadership',
}

const categoryColors = {
  Technical:  'bg-blue-100 text-blue-700',
  Cognitive:  'bg-violet-100 text-violet-700',
  Leadership: 'bg-purple-100 text-purple-700',
  Domain:     'bg-teal-100 text-teal-700',
}

const TABS = ['Overview', 'Competencies', 'Projects']

export default function Portfolio() {
  const { user }                 = useAuth()
  const { data: rawSkills = [] } = useUserSkills()
  const { data: badgeData }      = useUserBadges()
  const [tab, setTab]            = useState('Overview')

  const badges = badgeData?.badges ?? user?.badges ?? []

  const xp       = user?.xp ?? 0
  const level    = Math.floor(xp / 500) + 1
  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'

  // Normalise: API may return array or object map
  const skills = Array.isArray(rawSkills)
    ? rawSkills
    : Object.entries(rawSkills).map(([skill_key, current_score]) => ({ skill_key, current_score }))

  const topSkills = [...skills].sort((a, b) => b.current_score - a.current_score).slice(0, 6)

  return (
    <div className="max-w-container mx-auto px-6 py-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center shrink-0">
            <span className="text-white text-xl font-bold">{initials}</span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-2xl font-bold text-on-surface">{user?.name || 'Your Portfolio'}</h1>
              {xp > 0 && <span className="chip bg-primary/10 text-primary text-xs">Active Learner</span>}
              {badges.length > 0 && (
                <span className="chip bg-amber-100 text-amber-700 text-xs">🎖️ {badges.length} Badge{badges.length > 1 ? 's' : ''}</span>
              )}
            </div>
            <p className="text-sm text-on-surface-variant">
              {user?.role === ROLES.UNIVERSITY_STUDENT
                ? `${user.institution} · ${user.department}`
                : 'WorkLearn Platform'}
            </p>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-primary">{xp.toLocaleString()}</span>
                <span className="text-xs text-on-surface-variant">XP</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-primary">Lv.{level}</span>
                <span className="text-xs text-on-surface-variant">Level</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-primary">{skills.length}</span>
                <span className="text-xs text-on-surface-variant">Skills</span>
              </div>
            </div>
          </div>
        </div>
        <button className="btn-secondary text-xs px-4 py-2 flex items-center gap-1.5 shrink-0">
          <LinkIcon /> Share Portfolio
        </button>
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

            {/* Skills snapshot */}
            <div className="card">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <span className="section-label">Skill Snapshot</span>
                  <p className="text-sm font-bold text-on-surface mt-0.5">Earned through simulations</p>
                </div>
                <button className="btn-ghost text-xs" onClick={() => setTab('Competencies')}>View all →</button>
              </div>

              {topSkills.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center text-on-surface-variant">
                  <div className="w-12 h-12 rounded-full bg-surface-high flex items-center justify-center mb-3">
                    <TrophyIcon />
                  </div>
                  <p className="text-sm font-medium mb-1">No skills earned yet</p>
                  <p className="text-xs max-w-xs">Complete simulation tasks to earn verified skill points that appear here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {topSkills.map(s => <SkillBar key={s.skill_key} skillKey={s.skill_key} score={s.current_score} />)}
                </div>
              )}
            </div>

            {/* Journey Badges */}
            <div className="card">
              <div className="mb-4">
                <span className="section-label">Journey Badges</span>
                <p className="text-sm font-bold text-on-surface mt-0.5">Milestones earned on the platform</p>
              </div>
              {badges.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-on-surface-variant">
                  <div className="w-12 h-12 rounded-full bg-surface-high flex items-center justify-center mb-3 text-xl">🎖️</div>
                  <p className="text-sm font-medium mb-1">No badges yet</p>
                  <p className="text-xs max-w-xs">Accept a job simulation offer to earn your first Simulation Journey badge.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {badges.map(b => (
                    <div key={b.id} className="flex items-center gap-3 border border-border rounded-xl p-3 bg-surface-low">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-xl shrink-0">{b.icon}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-on-surface leading-tight truncate">{b.label}</p>
                        <p className="text-[11px] text-on-surface-variant">
                          {new Date(b.granted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Projects */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="section-label">Project Artifacts</span>
                  <p className="text-sm font-bold text-on-surface mt-0.5">AI-evaluated submissions</p>
                </div>
                <button className="btn-ghost text-xs" onClick={() => setTab('Projects')}>View all →</button>
              </div>
              <div className="flex flex-col items-center justify-center py-10 text-center text-on-surface-variant">
                <div className="w-12 h-12 rounded-full bg-surface-high flex items-center justify-center mb-3">
                  <DocIcon />
                </div>
                <p className="text-sm font-medium mb-1">No projects yet</p>
                <p className="text-xs max-w-xs">Submit simulation tasks to generate verified project artifacts for your portfolio.</p>
              </div>
            </div>

            {/* Progress card */}
            <div className="card p-5 border-primary/20 bg-gradient-to-r from-primary/5 to-indigo-50">
              <div className="flex items-center gap-5">
                <div className="text-center shrink-0">
                  <div className="relative w-20 h-20">
                    <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                      <circle cx="40" cy="40" r="32" fill="none" stroke="#e5e1e9" strokeWidth="8" />
                      <circle cx="40" cy="40" r="32" fill="none" stroke="#312E81" strokeWidth="8"
                        strokeDasharray={`${2 * Math.PI * 32 * ((xp % 500) / 500)} ${2 * Math.PI * 32 * (1 - (xp % 500) / 500)}`}
                        strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg font-bold text-primary">{level}</span>
                      <span className="text-xs text-on-surface-variant">Lv</span>
                    </div>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">Current Level</p>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-on-surface mb-1">Your Learning Progress</p>
                  <p className="text-sm text-on-surface-variant mb-3">
                    {xp === 0
                      ? 'Start your first simulation to begin earning XP and building your profile.'
                      : `${xp.toLocaleString()} XP earned across ${skills.length} skill${skills.length !== 1 ? 's' : ''}. Keep it up!`}
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { val: xp.toLocaleString(), label: 'XP Earned', color: 'text-primary' },
                      { val: skills.length.toString(), label: 'Skills', color: 'text-green-600' },
                      { val: `Lv.${level}`, label: 'Level', color: 'text-indigo-500' },
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

          {/* Right col */}
          <div className="col-span-1 space-y-4">
            <div className="card">
              <span className="section-label mb-3 block">What's next</span>
              {skills.length === 0 ? (
                <div className="space-y-2.5">
                  <div className="flex items-start gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="w-2.5 h-2.5 bg-primary rounded-full mt-1 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-on-surface">Enroll in the DA Job Simulation</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">Start your first real-world data analyst task.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 border border-border rounded-lg opacity-50">
                    <div className="w-2.5 h-2.5 bg-border rounded-full mt-1 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-on-surface">Complete Task 1 — SQL</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">Earn your first skill points.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 border border-border rounded-lg opacity-30">
                    <div className="w-2.5 h-2.5 bg-border rounded-full mt-1 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-on-surface">Build your portfolio</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">Submit tasks to generate verified artifacts.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Keep completing tasks to unlock more skills and project artifacts. Every completed task adds verified proof of work to your portfolio.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── COMPETENCIES ── */}
      {tab === 'Competencies' && (
        skills.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-on-surface-variant">
            <div className="w-14 h-14 rounded-full bg-surface-high flex items-center justify-center mb-4">
              <TrophyIcon large />
            </div>
            <p className="text-base font-semibold mb-2">No skills earned yet</p>
            <p className="text-sm max-w-sm">Complete simulation tasks to earn verified skill points. Each task awards points in specific skills relevant to your target role.</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {skills.map(s => {
              const label    = SKILL_LABELS[s.skill_key]    || s.skill_key
              const category = SKILL_CATEGORIES[s.skill_key] || 'Technical'
              return (
                <div key={s.skill_key} className="card hover:border-primary transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-surface-low rounded-xl flex items-center justify-center">
                      <BarIcon size={18} />
                    </div>
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${categoryColors[category]}`}>
                      {category}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-on-surface mb-1 leading-tight">{label}</p>
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-on-surface-variant">Score</span>
                      <span className="text-sm font-bold text-primary">{s.current_score}</span>
                    </div>
                    <div className="h-2 bg-surface-high rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(s.current_score, 100)}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {/* ── PROJECTS ── */}
      {tab === 'Projects' && (
        <div className="flex flex-col items-center justify-center py-20 text-center text-on-surface-variant">
          <div className="w-14 h-14 rounded-full bg-surface-high flex items-center justify-center mb-4">
            <DocIcon large />
          </div>
          <p className="text-base font-semibold mb-2">No project artifacts yet</p>
          <p className="text-sm max-w-sm">
            When you submit simulation tasks, AI-evaluated project artifacts will appear here — verified and shareable with recruiters.
          </p>
        </div>
      )}

      <footer className="mt-10 border-t border-border pt-4 flex items-center justify-between text-xs text-on-surface-variant">
        <span>WorkLearn AI</span>
        <div className="flex gap-4">
          <a href="#" className="hover:text-primary">Terms</a>
          <a href="#" className="hover:text-primary">Privacy</a>
          <a href="#" className="hover:text-primary">Help</a>
        </div>
        <span>© 2024 WorkLearn AI. All rights reserved.</span>
      </footer>
    </div>
  )
}

function SkillBar({ skillKey, score }) {
  const label = SKILL_LABELS[skillKey] || skillKey
  return (
    <div className="flex items-center gap-3 p-3 border border-border rounded-lg hover:border-primary transition-colors">
      <div className="w-8 h-8 bg-surface-low rounded-lg flex items-center justify-center shrink-0">
        <BarIcon />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-semibold text-on-surface truncate">{label}</p>
          <span className="text-xs font-bold text-primary ml-2 shrink-0">{score}</span>
        </div>
        <div className="h-1.5 bg-surface-high rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(score, 100)}%` }} />
        </div>
      </div>
    </div>
  )
}

function BarIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#312E81" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

function TrophyIcon({ large } = {}) {
  const size = large ? 24 : 18
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="8 19 12 22 16 19" />
      <line x1="12" y1="22" x2="12" y2="17" />
      <path d="M6.5 15H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-1.5" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

function DocIcon({ large } = {}) {
  const size = large ? 24 : 14
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}
