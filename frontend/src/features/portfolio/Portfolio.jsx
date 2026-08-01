import { useState } from 'react'
import {
  Pencil, Share2, Mail, Phone, MapPin, Briefcase, FolderGit2, Globe,
  Download, FileText, Plus, GraduationCap, Trash2, Trophy, Award,
  BadgeCheck, ChevronDown, ChevronUp,
} from 'lucide-react'
import { useAuth, ROLES } from '../auth/AuthContext'
import { useUserSkills, useUserBadges, useDeleteEducation, useSimulations, useMyAssignments } from '../../hooks'
import { downloadFile, resolveMediaUrl } from '../../lib/client'
import EditProfileModal from './components/EditProfileModal'
import EducationModal from './components/EducationModal'
import BadgeTile from './components/BadgeTile'
import CaseStudyCard from './components/CaseStudyCard'

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

const categoryDot = {
  Technical:  'bg-blue-500',
  Cognitive:  'bg-violet-500',
  Leadership: 'bg-purple-500',
  Domain:     'bg-teal-500',
}

const CATEGORY_ORDER = ['Technical', 'Domain', 'Cognitive', 'Leadership']

const TABS = ['Overview', 'Competencies', 'Education', 'Projects']

export default function Portfolio() {
  const { user }                 = useAuth()
  const { data: rawSkills = [] } = useUserSkills()
  const { data: badgeData }      = useUserBadges()
  const { data: simsData }       = useSimulations()
  const { data: assignmentsData } = useMyAssignments()
  const [tab, setTab]            = useState('Overview')
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [showAddEducation, setShowAddEducation] = useState(false)
  const [editingEducation, setEditingEducation] = useState(null)
  const [copied, setCopied] = useState(false)
  const [bioExpanded, setBioExpanded] = useState(false)

  const deleteEducation = useDeleteEducation()

  const badges = badgeData?.badges ?? user?.badges ?? []
  const education = user?.education ?? []
  // Each published simulation grants exactly one Journey badge on offer
  // acceptance, so "possible" here is real and derivable — not a fabricated
  // gamification number. Only shown once there's something to compare against.
  const possibleBadges = simsData?.simulations?.length ?? 0

  // "Case studies" — real completed job simulations, not fabricated project
  // write-ups. reason === 'completed' means every task is done (see
  // backend's _build_assignment); matched back to the full simulation
  // record (title/company/logo/accent color) via useSimulations.
  const completedSims = (assignmentsData?.assignments || [])
    .filter((a) => a.reason === 'completed')
    .map((a) => simsData?.simulations?.find((s) => s.id === a.simulation_id))
    .filter(Boolean)

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

      {/* ── Profile card ── */}
      <div className="relative rounded-2xl border border-border overflow-hidden mb-6 bg-white">
        {/* Faint dot-grid texture, top-right corner only — purely decorative */}
        <div
          className="absolute top-0 right-0 w-72 h-48 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #312E81 1.5px, transparent 1.5px)', backgroundSize: '16px 16px' }}
        />

        {/* Identity bar */}
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 pb-5">
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative shrink-0">
              {user?.photo_url ? (
                <img
                  src={resolveMediaUrl(user.photo_url)}
                  alt=""
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-indigo-500 border-4 border-white shadow-md flex items-center justify-center text-white text-xl font-bold">
                  {initials}
                </div>
              )}
              <div
                className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center"
                title="Verified WorkLearn portfolio — skills and badges are earned through graded simulations, not self-reported"
              >
                <BadgeCheck className="h-3.5 w-3.5 text-white" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-on-surface truncate">{user?.name || 'Your Portfolio'}</h1>
                {xp > 0 && <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" title="Active learner" />}
              </div>
              <p className="text-sm text-on-surface-variant mt-0.5 truncate">
                {user?.headline || (user?.role === ROLES.UNIVERSITY_STUDENT ? `${user.institution} · ${user.department}` : 'Building my career on WorkLearn')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button onClick={handleShare} className="btn-secondary text-xs px-4 py-2 flex items-center gap-1.5 cursor-pointer">
              <Share2 className="h-3.5 w-3.5" /> {copied ? 'Copied!' : 'Share'}
            </button>
            <button onClick={() => setShowEditProfile(true)} className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 cursor-pointer">
              <Pencil className="h-3.5 w-3.5" /> Edit Profile
            </button>
          </div>
        </div>

        {/* Two-column info panel */}
        <div className="grid sm:grid-cols-3 gap-6 px-6 pb-6">
          <div className="sm:col-span-2 space-y-4">
            <div>
              <p className="text-xs font-bold text-on-surface uppercase tracking-wide mb-1.5">Experience</p>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {user?.headline || `${skills.length > 0 ? `${skills.length} verified skill${skills.length !== 1 ? 's' : ''}` : 'Getting started'} through hands-on job simulations on WorkLearn.`}
              </p>
            </div>
            <div className="pt-4 border-t border-border">
              <p className="text-xs font-bold text-on-surface uppercase tracking-wide mb-1.5">About me</p>
              {user?.bio ? (
                <>
                  <p className={`text-sm text-on-surface-variant leading-relaxed ${!bioExpanded && user.bio.length > 220 ? 'line-clamp-3' : ''}`}>
                    {user.bio}
                  </p>
                  {user.bio.length > 220 && (
                    <button
                      onClick={() => setBioExpanded((v) => !v)}
                      className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 mt-1.5 cursor-pointer"
                    >
                      {bioExpanded ? <>Show less <ChevronUp className="h-3 w-3" /></> : <>Read more <ChevronDown className="h-3 w-3" /></>}
                    </button>
                  )}
                </>
              ) : (
                <button onClick={() => setShowEditProfile(true)} className="text-sm text-primary font-semibold hover:underline cursor-pointer">
                  Add a bio to tell recruiters about yourself →
                </button>
              )}
            </div>
          </div>

          <div className="sm:col-span-1 space-y-4">
            {topSkills.length > 0 && (
              <div>
                <p className="text-xs font-bold text-on-surface uppercase tracking-wide mb-2">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {topSkills.slice(0, 5).map((s) => (
                    <span key={s.skill_key} className="chip bg-surface-low text-on-surface normal-case tracking-normal font-semibold">
                      {SKILL_LABELS[s.skill_key] || s.skill_key}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2.5">
              {user?.location && (
                <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                  <MapPin className="h-3.5 w-3.5 shrink-0" /> {user.location}
                </div>
              )}
              {user?.phone && (
                <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                  <Phone className="h-3.5 w-3.5 shrink-0" /> {user.phone}
                </div>
              )}
              {user?.website_url && (
                <a href={user.website_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Globe className="h-3.5 w-3.5 shrink-0" /> {user.website_url.replace(/^https?:\/\//, '')}
                </a>
              )}
              {user?.email && (
                <a href={`mailto:${user.email}`} className="flex items-center gap-2 text-sm text-primary hover:underline truncate">
                  <Mail className="h-3.5 w-3.5 shrink-0" /> {user.email}
                </a>
              )}
              {user?.linkedin_url && (
                <a href={user.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Briefcase className="h-3.5 w-3.5 shrink-0" /> LinkedIn
                </a>
              )}
              {user?.github_url && (
                <a href={user.github_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <FolderGit2 className="h-3.5 w-3.5 shrink-0" /> GitHub
                </a>
              )}
            </div>

            {user?.resume_url ? (
              <button
                onClick={handleDownloadResume}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" /> Download Resume
              </button>
            ) : (
              <button
                onClick={() => setShowEditProfile(true)}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-dashed border-border text-on-surface-variant hover:border-primary hover:text-primary transition-colors cursor-pointer"
              >
                <FileText className="h-3.5 w-3.5" /> Add resume
              </button>
            )}
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-4 gap-3 px-6 py-4 border-t border-border bg-surface-low/50">
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

      {/* ── Case Studies — completed job simulations, shown as real
          proof-of-work project cards. Always visible (not tab-gated),
          same real data the Overview/Projects tabs point back to. ── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="section-label">Case Studies</span>
            <p className="text-sm font-bold text-on-surface mt-0.5">Completed job simulations</p>
          </div>
          {completedSims.length > 0 && (
            <button onClick={() => setTab('Projects')} className="btn-ghost text-xs flex items-center gap-1">
              View more →
            </button>
          )}
        </div>
        {completedSims.length === 0 ? (
          <div className="card">
            <EmptyState icon={FileText} title="No completed simulations yet" desc="Finish every task in a job simulation to add it here as a verified case study." />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {completedSims.map((sim) => <CaseStudyCard key={sim.id} sim={sim} />)}
          </div>
        )}
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

      {/* ── OVERVIEW — bento grid: varied tile spans instead of a plain
          2-col+1-col split, each tile fading/rising in with a small stagger
          on mount (see .portfolio-fade-in, index.css). ── */}
      {tab === 'Overview' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">

          {/* Skill Snapshot */}
          <div className="card md:col-span-2 portfolio-fade-in hover:shadow-md transition-shadow" style={{ animationDelay: '0ms' }}>
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

          {/* Progress / level card */}
          <div className="card md:col-span-2 border-primary/20 bg-gradient-to-r from-primary/5 to-indigo-50 portfolio-fade-in hover:shadow-md transition-shadow" style={{ animationDelay: '60ms' }}>
            <div className="flex items-center gap-5 h-full">
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

          {/* Journey Badges — wide tile */}
          <div className="card md:col-span-3 portfolio-fade-in hover:shadow-md transition-shadow" style={{ animationDelay: '120ms' }}>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <span className="section-label">Journey Badges</span>
                <p className="text-sm font-bold text-on-surface mt-0.5">Milestones earned on the platform</p>
              </div>
              {possibleBadges > 0 && (
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-20 h-1.5 bg-surface-high rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-primary rounded-full transition-all"
                      style={{ width: `${Math.min((badges.length / possibleBadges) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-on-surface-variant whitespace-nowrap">
                    {badges.length} of {possibleBadges} collected
                  </span>
                </div>
              )}
            </div>
            {badges.length === 0 ? (
              <EmptyState icon={Award} title="No badges yet" desc="Accept a job simulation offer to earn your first Simulation Journey badge." />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {badges.map(b => <BadgeTile key={b.id} badge={b} />)}
              </div>
            )}
          </div>

          {/* What's next */}
          <div className="card md:col-span-1 portfolio-fade-in hover:shadow-md transition-shadow" style={{ animationDelay: '180ms' }}>
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

          {/* Education preview — only while empty, so it doesn't duplicate the full Education tab */}
          {education.length === 0 && (
            <div className="card md:col-span-2 border-dashed portfolio-fade-in hover:shadow-md transition-shadow" style={{ animationDelay: '300ms' }}>
              <span className="section-label mb-2 block">Education</span>
              <p className="text-xs text-on-surface-variant mb-3">Add your academic background to round out your portfolio.</p>
              <button onClick={() => setShowAddEducation(true)} className="btn-ghost text-xs flex items-center gap-1 cursor-pointer">
                <Plus className="h-3.5 w-3.5" /> Add education
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── COMPETENCIES — grouped by category instead of one flat grid, so
          a recruiter scanning this can immediately see the technical vs.
          domain vs. cognitive vs. leadership spread rather than a wall of
          identical cards. ── */}
      {tab === 'Competencies' && (
        skills.length === 0 ? (
          <div className="py-16">
            <EmptyState icon={Trophy} large title="No skills earned yet" desc="Complete simulation tasks to earn verified skill points. Each task awards points in specific skills relevant to your target role." />
          </div>
        ) : (
          <div className="space-y-8">
            {CATEGORY_ORDER.map((category, groupIdx) => {
              const items = skills.filter(s => (SKILL_CATEGORIES[s.skill_key] || 'Technical') === category)
              if (items.length === 0) return null
              return (
                <div
                  key={category}
                  className="portfolio-fade-in"
                  style={{ animationDelay: `${groupIdx * 70}ms` }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-2 h-2 rounded-full ${categoryDot[category]}`} />
                    <h3 className="text-sm font-bold text-on-surface">{category}</h3>
                    <span className="text-xs text-on-surface-variant">({items.length})</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {items.map(s => {
                      const label = SKILL_LABELS[s.skill_key] || s.skill_key
                      return (
                        <div
                          key={s.skill_key}
                          className={`card border-l-4 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-default ${
                            { Technical: 'border-l-blue-500', Cognitive: 'border-l-violet-500', Leadership: 'border-l-purple-500', Domain: 'border-l-teal-500' }[category]
                          }`}
                        >
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

      {/* ── PROJECTS — same completed-simulation case studies shown above,
          just the full grid rather than the top-of-page preview. ── */}
      {tab === 'Projects' && (
        completedSims.length === 0 ? (
          <div className="py-16">
            <EmptyState
              icon={FileText} large title="No completed simulations yet"
              desc="Finish every task in a job simulation and it'll show up here as a verified case study — shareable with recruiters."
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {completedSims.map((sim) => <CaseStudyCard key={sim.id} sim={sim} />)}
          </div>
        )
      )}

      {showEditProfile && <EditProfileModal onClose={() => setShowEditProfile(false)} />}
      {showAddEducation && <EducationModal onClose={() => setShowAddEducation(false)} />}
      {editingEducation && <EducationModal entry={editingEducation} onClose={() => setEditingEducation(null)} />}
    </div>
  )
}

function EmptyState({ icon: Icon, title, desc, large }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center text-on-surface-variant">
      <div className={`${large ? 'w-14 h-14' : 'w-12 h-12'} rounded-full bg-gradient-to-br from-surface-high to-surface-low flex items-center justify-center mb-3 text-primary/70`}>
        <Icon className={large ? 'h-6 w-6' : 'h-[18px] w-[18px]'} strokeWidth={1.5} />
      </div>
      <p className={`${large ? 'text-base' : 'text-sm'} font-semibold mb-1 text-on-surface`}>{title}</p>
      <p className={`${large ? 'text-sm max-w-sm' : 'text-xs max-w-xs'}`}>{desc}</p>
    </div>
  )
}

function SkillBar({ skillKey, score }) {
  const label    = SKILL_LABELS[skillKey] || skillKey
  const category = SKILL_CATEGORIES[skillKey] || 'Technical'
  return (
    <div className="flex items-center gap-3 p-3 border border-border rounded-lg hover:border-primary transition-colors">
      <div className="w-8 h-8 bg-surface-low rounded-lg flex items-center justify-center shrink-0">
        <BarIcon />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-semibold text-on-surface truncate flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${categoryDot[category]}`} />
            {label}
          </p>
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
