import { useState } from 'react'
import {
  Pencil, Share2, Mail, Phone, MapPin, Briefcase, FolderGit2, Globe,
  Download, FileText, Plus, GraduationCap, Trash2, Trophy, Award,
} from 'lucide-react'
import { useAuth, ROLES } from '../auth/AuthContext'
import { useUserSkills, useUserBadges, useDeleteEducation } from '../../shared/api/hooks'
import { downloadFile, resolveMediaUrl } from '../../shared/api/client'
import EditProfileModal from './components/EditProfileModal'
import EducationModal from './components/EducationModal'
import BadgeTile from './components/BadgeTile'

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

const TABS = ['Overview', 'Competencies', 'Education', 'Projects']

export default function Portfolio() {
  const { user }                 = useAuth()
  const { data: rawSkills = [] } = useUserSkills()
  const { data: badgeData }      = useUserBadges()
  const [tab, setTab]            = useState('Overview')
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [showAddEducation, setShowAddEducation] = useState(false)
  const [editingEducation, setEditingEducation] = useState(null)
  const [copied, setCopied] = useState(false)

  const deleteEducation = useDeleteEducation()

  const badges = badgeData?.badges ?? user?.badges ?? []
  const education = user?.education ?? []

  const xp       = user?.xp ?? 0
  const level    = Math.floor(xp / 500) + 1
  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'

  // Normalise: API may return array or object map
  const skills = Array.isArray(rawSkills)
    ? rawSkills
    : Object.entries(rawSkills).map(([skill_key, current_score]) => ({ skill_key, current_score }))

  const topSkills = [...skills].sort((a, b) => b.current_score - a.current_score).slice(0, 6)

  function handleShare() {
    navigator.clipboard?.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  function handleDownloadResume() {
    if (!user?.resume_url) return
    downloadFile(user.resume_url, user.resume_filename || 'resume.pdf')
  }

  async function handleDeleteEducation(id) {
    if (!window.confirm('Remove this education entry?')) return
    await deleteEducation.mutateAsync(id)
  }

  return (
    <div className="max-w-container mx-auto px-6 py-8">

      {/* ── Hero ── */}
      <div className="relative rounded-2xl border border-border overflow-hidden mb-8 bg-white">
        <div className="h-28 sm:h-36 relative overflow-hidden bg-gradient-to-r from-primary via-indigo-600 to-violet-600">
          <div
            className="absolute inset-0 opacity-25"
            style={{ backgroundImage: 'radial-gradient(circle at 15% 25%, white 0, transparent 38%), radial-gradient(circle at 85% 75%, white 0, transparent 32%)' }}
          />
        </div>

        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-11 sm:-mt-12">
            <div className="flex items-end gap-4">
              <div className="relative shrink-0">
                {user?.photo_url ? (
                  <img
                    src={resolveMediaUrl(user.photo_url)}
                    alt=""
                    className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-indigo-500 border-4 border-white shadow-lg flex items-center justify-center text-white text-2xl font-bold">
                    {initials}
                  </div>
                )}
              </div>
              <div className="pb-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-on-surface truncate">{user?.name || 'Your Portfolio'}</h1>
                  {xp > 0 && <span className="chip bg-primary/10 text-primary text-xs">Active Learner</span>}
                  {badges.length > 0 && (
                    <span className="chip bg-amber-100 text-amber-700 text-xs">{badges.length} Badge{badges.length > 1 ? 's' : ''}</span>
                  )}
                </div>
                <p className="text-sm font-semibold text-primary mt-0.5">
                  {user?.headline || (user?.role === ROLES.UNIVERSITY_STUDENT ? `${user.institution} · ${user.department}` : 'WorkLearn Platform')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setShowEditProfile(true)} className="btn-secondary text-xs px-4 py-2 flex items-center gap-1.5 cursor-pointer">
                <Pencil className="h-3.5 w-3.5" /> Edit Profile
              </button>
              <button onClick={handleShare} className="btn-secondary text-xs px-4 py-2 flex items-center gap-1.5 cursor-pointer">
                <Share2 className="h-3.5 w-3.5" /> {copied ? 'Copied!' : 'Share'}
              </button>
            </div>
          </div>

          {user?.bio && <p className="text-sm text-on-surface-variant mt-4 max-w-2xl leading-relaxed">{user.bio}</p>}

          {/* Contact + resume pills */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            {user?.email && <ContactPill icon={Mail} label={user.email} href={`mailto:${user.email}`} />}
            {user?.phone && <ContactPill icon={Phone} label={user.phone} />}
            {user?.location && <ContactPill icon={MapPin} label={user.location} />}
            {user?.linkedin_url && <ContactPill icon={Briefcase} label="LinkedIn" href={user.linkedin_url} />}
            {user?.github_url && <ContactPill icon={FolderGit2} label="GitHub" href={user.github_url} />}
            {user?.website_url && <ContactPill icon={Globe} label="Website" href={user.website_url} />}
            {user?.resume_url ? (
              <button
                onClick={handleDownloadResume}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-primary text-white hover:bg-primary-dark transition-colors cursor-pointer"
              >
                <Download className="h-3 w-3" /> Resume
              </button>
            ) : (
              <button
                onClick={() => setShowEditProfile(true)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-dashed border-border text-on-surface-variant hover:border-primary hover:text-primary transition-colors cursor-pointer"
              >
                <FileText className="h-3 w-3" /> Add resume
              </button>
            )}
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-4 gap-3 mt-5 pt-5 border-t border-border">
            {[
              { val: xp.toLocaleString(), label: 'XP Earned' },
              { val: `Lv.${level}`, label: 'Level' },
              { val: skills.length.toString(), label: 'Skills' },
              { val: badges.length.toString(), label: 'Badges' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-lg font-bold text-primary">{s.val}</p>
                <p className="text-[11px] text-on-surface-variant">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-border mb-7">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
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
                <EmptyState icon={Trophy} title="No skills earned yet" desc="Complete simulation tasks to earn verified skill points that appear here." />
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {topSkills.map(s => <SkillBar key={s.skill_key} skillKey={s.skill_key} score={s.current_score} />)}
                </div>
              )}
            </div>

            {/* Journey Badges */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="section-label">Journey Badges</span>
                  <p className="text-sm font-bold text-on-surface mt-0.5">Milestones earned on the platform</p>
                </div>
              </div>
              {badges.length === 0 ? (
                <EmptyState icon={Award} title="No badges yet" desc="Accept a job simulation offer to earn your first Simulation Journey badge." />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {badges.map(b => <BadgeTile key={b.id} badge={b} />)}
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
              <EmptyState icon={FileText} title="No projects yet" desc="Submit simulation tasks to generate verified project artifacts for your portfolio." />
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

            {education.length === 0 && (
              <div className="card border-dashed">
                <span className="section-label mb-2 block">Education</span>
                <p className="text-xs text-on-surface-variant mb-3">Add your academic background to round out your portfolio.</p>
                <button onClick={() => setShowAddEducation(true)} className="btn-ghost text-xs flex items-center gap-1 cursor-pointer">
                  <Plus className="h-3.5 w-3.5" /> Add education
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── COMPETENCIES ── */}
      {tab === 'Competencies' && (
        skills.length === 0 ? (
          <div className="py-16">
            <EmptyState icon={Trophy} large title="No skills earned yet" desc="Complete simulation tasks to earn verified skill points. Each task awards points in specific skills relevant to your target role." />
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

      {/* ── EDUCATION ── */}
      {tab === 'Education' && (
        <div className="max-w-2xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <span className="section-label">Academic Background</span>
              <p className="text-sm font-bold text-on-surface mt-0.5">Schools, degrees, and coursework</p>
            </div>
            <button onClick={() => setShowAddEducation(true)} className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 cursor-pointer">
              <Plus className="h-3.5 w-3.5" /> Add Education
            </button>
          </div>

          {education.length === 0 ? (
            <div className="card">
              <EmptyState icon={GraduationCap} title="No education added yet" desc="Add your schools and degrees so recruiters get the full picture." />
            </div>
          ) : (
            <div className="relative pl-8 space-y-6">
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
              {education.map(e => (
                <div key={e.id} className="relative">
                  <div className="absolute -left-8 top-1 w-6 h-6 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                    <GraduationCap className="h-3 w-3 text-primary" />
                  </div>
                  <div className="card group">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-on-surface">{e.institution}</p>
                        {(e.degree || e.field_of_study) && (
                          <p className="text-xs text-on-surface-variant mt-0.5">
                            {[e.degree, e.field_of_study].filter(Boolean).join(', ')}
                          </p>
                        )}
                        <p className="text-[11px] text-on-surface-variant mt-1 font-medium">
                          {e.start_year || '—'} – {e.is_current ? 'Present' : (e.end_year || '—')}
                        </p>
                        {e.description && <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">{e.description}</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditingEducation(e)} className="p-1.5 rounded-md hover:bg-surface-low text-on-surface-variant hover:text-primary cursor-pointer" aria-label="Edit">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDeleteEducation(e.id)} className="p-1.5 rounded-md hover:bg-red-50 text-on-surface-variant hover:text-red-600 cursor-pointer" aria-label="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── PROJECTS ── */}
      {tab === 'Projects' && (
        <div className="py-16">
          <EmptyState
            icon={FileText} large title="No project artifacts yet"
            desc="When you submit simulation tasks, AI-evaluated project artifacts will appear here — verified and shareable with recruiters."
          />
        </div>
      )}

      {showEditProfile && <EditProfileModal onClose={() => setShowEditProfile(false)} />}
      {showAddEducation && <EducationModal onClose={() => setShowAddEducation(false)} />}
      {editingEducation && <EducationModal entry={editingEducation} onClose={() => setEditingEducation(null)} />}
    </div>
  )
}

function ContactPill({ icon: Icon, label, href }) {
  const content = (
    <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border border-border text-on-surface-variant hover:border-primary hover:text-primary transition-colors">
      <Icon className="h-3 w-3" /> {label}
    </span>
  )
  if (!href) return content
  return <a href={href} target={href.startsWith('mailto:') ? undefined : '_blank'} rel="noreferrer" className="cursor-pointer">{content}</a>
}

function EmptyState({ icon: Icon, title, desc, large }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center text-on-surface-variant">
      <div className={`${large ? 'w-14 h-14' : 'w-12 h-12'} rounded-full bg-surface-high flex items-center justify-center mb-3`}>
        <Icon className={large ? 'h-6 w-6' : 'h-[18px] w-[18px]'} strokeWidth={1.5} />
      </div>
      <p className={`${large ? 'text-base' : 'text-sm'} font-semibold mb-1 text-on-surface`}>{title}</p>
      <p className={`${large ? 'text-sm max-w-sm' : 'text-xs max-w-xs'}`}>{desc}</p>
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
