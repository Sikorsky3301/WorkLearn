import { useState } from 'react'
import {
  Pencil, Share2, Mail, Phone, MapPin, Briefcase, FolderGit2, Globe,
  Download, FileText, Plus, Trash2,
  BadgeCheck, ChevronDown, ChevronUp, Camera, Check,
} from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { useUserSkills, useUserBadges, useDeleteEducation, useSimulations, useMyAssignments, useUserCertificates } from '../../../hooks'
import { downloadFile, resolveMediaUrl } from '../../../lib/client'
import EditProfileModal from './components/EditProfileModal'
import EducationModal from './components/EducationModal'
import BadgeTile from './components/BadgeTile'
import CaseStudyCard from './components/CaseStudyCard'
import CertificateCard from './components/CertificateCard'

// Fallbacks only. Every row from GET /api/users/me/skills carries its own
// `label` and `category`, resolved from the one config vocabulary on the
// server. These maps used to be the only source and covered just the Data
// Analytics skills, so an Engineering or Sales student saw raw keys like
// "state_management" filed under the wrong heading.
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

const prettyKey = (key) => key.replace(/_/g, ' ').replace(/\w/g, (c) => c.toUpperCase())
const skillLabel = (s) => s.label || SKILL_LABELS[s.skill_key] || prettyKey(s.skill_key)
const skillCategory = (s) => s.category || SKILL_CATEGORIES[s.skill_key] || 'Technical'

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

const categoryDot = {
  Technical:  'bg-blue-500',
  Cognitive:  'bg-violet-500',
  Leadership: 'bg-purple-500',
  Domain:     'bg-teal-500',
}

const categoryBorder = {
  Technical:  'border-l-blue-500',
  Cognitive:  'border-l-violet-500',
  Leadership: 'border-l-purple-500',
  Domain:     'border-l-teal-500',
}

const CATEGORY_ORDER = ['Technical', 'Domain', 'Cognitive', 'Leadership']
const TABS = ['Overview', 'Competencies', 'Certificates', 'Education', 'Projects']

export default function Portfolio() {
  const { user }                  = useAuth()
  const { data: rawSkills = [] }  = useUserSkills()
  const { data: badgeData }       = useUserBadges()
  const { data: simsData }        = useSimulations()
  const { data: assignmentsData } = useMyAssignments()
  const { data: certificateData } = useUserCertificates()
  const [tab, setTab]             = useState('Overview')
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [showAddEducation, setShowAddEducation] = useState(false)
  const [editingEducation, setEditingEducation] = useState(null)
  const [copied, setCopied] = useState(false)
  const [bioExpanded, setBioExpanded] = useState(false)

  const deleteEducation = useDeleteEducation()

  const badges = badgeData?.badges ?? user?.badges ?? []
  const certificates = certificateData?.certificates ?? []
  const education = user?.education ?? []

  // "Case studies" — real completed job simulations, not fabricated project
  // write-ups. reason === 'completed' means every task is done (see
  // backend's _build_assignment); matched back to the full simulation
  // record (title/company/logo/accent color) via useSimulations.
  const completedSims = (assignmentsData?.assignments || [])
    .filter((a) => a.reason === 'completed')
    .map((a) => simsData?.simulations?.find((s) => s.id === a.simulation_id))
    .filter(Boolean)

  const xp       = user?.xp ?? 0
  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'

  // Normalise: API may return array or object map
  const skills = Array.isArray(rawSkills)
    ? rawSkills
    : Object.entries(rawSkills).map(([skill_key, current_score]) => ({ skill_key, current_score }))

  const topSkills = [...skills].sort((a, b) => b.current_score - a.current_score).slice(0, 6)

  const hasContact = user?.location || user?.phone || user?.email || user?.website_url || user?.linkedin_url || user?.github_url

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

      {/* ══ Profile header ══ */}
      <div className="rounded-2xl border border-border bg-white overflow-hidden mb-6 shadow-sm">
        {/* Cover band — the one dark surface on the page, so the identity
            block below reads as the anchor rather than one card among many. */}
        <div className="relative h-28 bg-gradient-to-r from-[#151046] via-primary-dark to-primary">
          <div
            className="absolute inset-0 opacity-[0.10]"
            style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1.5px, transparent 1.5px)', backgroundSize: '18px 18px' }}
            aria-hidden="true"
          />
        </div>

        <div className="px-6 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12">
            <div className="flex items-end gap-4 min-w-0">
              {/* Avatar doubles as an upload affordance — the camera badge
                  opens the same Edit Profile modal that owns the real file
                  input, so there's one upload path, not two. */}
              <button
                onClick={() => setShowEditProfile(true)}
                className="relative shrink-0 group cursor-pointer rounded-2xl"
                aria-label="Change profile photo"
                type="button"
              >
                {user?.photo_url ? (
                  <img
                    src={resolveMediaUrl(user.photo_url)}
                    alt=""
                    className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-md bg-surface-low"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-indigo-500 border-4 border-white shadow-md flex items-center justify-center text-white text-2xl font-bold">
                    {initials}
                  </div>
                )}
                <span className="absolute inset-0 rounded-2xl bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="h-5 w-5 text-white" />
                </span>
                <span
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center"
                  title="Verified WorkLearn portfolio — skills and badges are earned through graded simulations, not self-reported"
                >
                  <BadgeCheck className="h-3.5 w-3.5 text-white" />
                </span>
              </button>

              <div className="min-w-0 pb-1">
                <h1 className="text-xl font-bold text-on-surface truncate">{user?.name || 'Your Portfolio'}</h1>
                <p className="text-sm text-on-surface-variant mt-0.5 truncate">
                  {user?.headline || (user?.university && !user.university.is_default ? `${user.university.name}${user.department ? ` · ${user.department}` : ''}` : 'Building my career on WorkLearn')}
                </p>
                {(user?.location || user?.email) && (
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-on-surface-variant flex-wrap">
                    {user?.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {user.location}</span>}
                    {user?.email && <span className="inline-flex items-center gap-1 truncate"><Mail className="h-3 w-3" /> {user.email}</span>}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 pb-1">
              <button onClick={handleShare} className="btn-secondary text-xs px-3.5 py-2">
                {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Share2 className="h-3.5 w-3.5" /> Share</>}
              </button>
              <button onClick={() => setShowEditProfile(true)} className="btn-primary text-xs px-3.5 py-2">
                <Pencil className="h-3.5 w-3.5" /> Edit Profile
              </button>
            </div>
          </div>

          {/* One consolidated stat row — these used to appear three separate
              times on this page (header strip, progress card, and again in
              its inner grid). */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border border border-border rounded-xl mt-5 overflow-hidden bg-surface-low/40">
            {[
              { val: xp.toLocaleString(), label: 'XP earned' },
              { val: skills.length, label: skills.length === 1 ? 'Verified skill' : 'Verified skills' },
              { val: badges.length, label: badges.length === 1 ? 'Badge' : 'Badges' },
              { val: certificates.length, label: certificates.length === 1 ? 'Certificate' : 'Certificates' },
            ].map((s) => (
              <div key={s.label} className="px-4 py-3 text-center">
                <p className="text-lg font-bold text-on-surface tabular-nums leading-none">{s.val}</p>
                <p className="text-[11px] text-on-surface-variant mt-1.5 leading-none">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ Tabs ══ */}
      <div className="flex border-b border-border mb-6">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative px-5 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
              tab === t ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {t}
            {tab === t && <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-primary rounded-full" />}
          </button>
        ))}
      </div>

      {/* ══ Body: main column + persistent sidebar ══ */}
      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">

          {tab === 'Overview' && (
            <>
              <Panel title="About">
                {user?.bio ? (
                  <>
                    <p className={`text-sm text-on-surface-variant leading-relaxed ${!bioExpanded && user.bio.length > 320 ? 'line-clamp-4' : ''}`}>
                      {user.bio}
                    </p>
                    {user.bio.length > 320 && (
                      <button
                        onClick={() => setBioExpanded((v) => !v)}
                        className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 mt-2 cursor-pointer"
                      >
                        {bioExpanded ? <>Show less <ChevronUp className="h-3 w-3" /></> : <>Read more <ChevronDown className="h-3 w-3" /></>}
                      </button>
                    )}
                  </>
                ) : (
                  <InlinePrompt
                    text="No bio yet — a short summary helps recruiters understand what you're working toward."
                    action="Add a bio"
                    onClick={() => setShowEditProfile(true)}
                  />
                )}
              </Panel>

              <Panel
                title="Top Skills"
                subtitle="Earned through graded simulation tasks"
                action={skills.length > 0 && <button className="btn-ghost text-xs" onClick={() => setTab('Competencies')}>View all →</button>}
              >
                {topSkills.length === 0 ? (
                  <InlinePrompt text="Complete simulation tasks to earn verified skill points — they'll appear here automatically." />
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {topSkills.map(s => <SkillBar key={s.skill_key} label={skillLabel(s)} category={skillCategory(s)} score={s.current_score} />)}
                  </div>
                )}
              </Panel>

              <Panel
                title="Case Studies"
                subtitle="Completed job simulations"
                action={completedSims.length > 0 && <button className="btn-ghost text-xs" onClick={() => setTab('Projects')}>View all →</button>}
              >
                {completedSims.length === 0 ? (
                  <InlinePrompt text="Finish every task in a job simulation and it'll show up here as a verified case study you can share with recruiters." />
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {completedSims.slice(0, 3).map((sim) => <CaseStudyCard key={sim.id} sim={sim} />)}
                  </div>
                )}
              </Panel>
            </>
          )}

          {tab === 'Competencies' && (
            skills.length === 0 ? (
              <Panel title="Competencies">
                <InlinePrompt text="Complete simulation tasks to earn verified skill points. Each task awards points in specific skills relevant to your target role." />
              </Panel>
            ) : (
              <div className="space-y-6">
                {CATEGORY_ORDER.map((category) => {
                  const items = skills.filter(s => skillCategory(s) === category)
                  if (items.length === 0) return null
                  return (
                    <Panel key={category} title={category} subtitle={`${items.length} skill${items.length !== 1 ? 's' : ''}`} dot={categoryDot[category]}>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {items.map(s => (
                          <div key={s.skill_key} className={`border border-border border-l-[3px] ${categoryBorder[category]} rounded-lg p-4 hover:shadow-sm transition-shadow`}>
                            <div className="flex items-center justify-between mb-2.5">
                              <p className="text-sm font-semibold text-on-surface">{skillLabel(s)}</p>
                              <span className="text-sm font-bold text-primary tabular-nums ml-2 shrink-0">{s.current_score}</span>
                            </div>
                            <div className="h-1.5 bg-surface-high rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(s.current_score, 100)}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </Panel>
                  )
                })}
              </div>
            )
          )}

          {tab === 'Certificates' && (
            <Panel
              title="Certificates"
              subtitle="Issued automatically when you complete every task in a simulation"
            >
              {certificates.length === 0 ? (
                <InlinePrompt text="No certificates yet. Complete every task in a job simulation and its certificate — with a unique verification number — is issued to you automatically." />
              ) : (
                <div className="space-y-3">
                  {certificates.map((c) => <CertificateCard key={c.id} certificate={c} />)}
                </div>
              )}
            </Panel>
          )}

          {tab === 'Education' && (
            <Panel
              title="Education"
              subtitle="Schools, degrees, and coursework"
              action={
                <button onClick={() => setShowAddEducation(true)} className="btn-primary text-xs px-3.5 py-2">
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              }
            >
              {education.length === 0 ? (
                <InlinePrompt
                  text="Add your schools and degrees so recruiters get the full picture."
                  action="Add education"
                  onClick={() => setShowAddEducation(true)}
                />
              ) : (
                <div className="relative pl-7 space-y-5">
                  <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />
                  {education.map(e => (
                    <div key={e.id} className="relative group">
                      <span className="absolute -left-7 top-1 w-[18px] h-[18px] rounded-full bg-white border-2 border-primary flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      </span>
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
                  ))}
                </div>
              )}
            </Panel>
          )}

          {tab === 'Projects' && (
            <Panel title="Projects" subtitle="Completed job simulations, as verified case studies">
              {completedSims.length === 0 ? (
                <InlinePrompt text="Finish every task in a job simulation and it'll show up here as a verified case study — shareable with recruiters." />
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {completedSims.map((sim) => <CaseStudyCard key={sim.id} sim={sim} />)}
                </div>
              )}
            </Panel>
          )}
        </div>

        {/* ── Sidebar: always present, so the page never reads as half-empty
            regardless of which tab is open ── */}
        <div className="space-y-6">
          <Panel title="Contact" compact>
            {hasContact ? (
              <div className="space-y-2.5">
                {user?.email && (
                  <a href={`mailto:${user.email}`} className="flex items-center gap-2.5 text-sm text-primary hover:underline truncate">
                    <Mail className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{user.email}</span>
                  </a>
                )}
                {user?.phone && (
                  <div className="flex items-center gap-2.5 text-sm text-on-surface-variant">
                    <Phone className="h-3.5 w-3.5 shrink-0" /> {user.phone}
                  </div>
                )}
                {user?.location && (
                  <div className="flex items-center gap-2.5 text-sm text-on-surface-variant">
                    <MapPin className="h-3.5 w-3.5 shrink-0" /> {user.location}
                  </div>
                )}
                {user?.website_url && (
                  <a href={user.website_url} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 text-sm text-primary hover:underline truncate">
                    <Globe className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{user.website_url.replace(/^https?:\/\//, '')}</span>
                  </a>
                )}
                {user?.linkedin_url && (
                  <a href={user.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 text-sm text-primary hover:underline">
                    <Briefcase className="h-3.5 w-3.5 shrink-0" /> LinkedIn
                  </a>
                )}
                {user?.github_url && (
                  <a href={user.github_url} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 text-sm text-primary hover:underline">
                    <FolderGit2 className="h-3.5 w-3.5 shrink-0" /> GitHub
                  </a>
                )}
              </div>
            ) : (
              <InlinePrompt text="No contact details yet." action="Add contact info" onClick={() => setShowEditProfile(true)} />
            )}
          </Panel>

          <Panel title="Resume" compact>
            {user?.resume_url ? (
              <>
                <div className="flex items-center gap-2.5 mb-3 min-w-0">
                  <span className="h-9 w-9 rounded-lg bg-primary/[0.07] text-primary flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4" />
                  </span>
                  <p className="text-sm text-on-surface truncate">{user.resume_filename || 'Resume.pdf'}</p>
                </div>
                <button onClick={handleDownloadResume} className="btn-primary w-full text-xs py-2">
                  <Download className="h-3.5 w-3.5" /> Download
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowEditProfile(true)}
                className="w-full flex flex-col items-center gap-1.5 border border-dashed border-border rounded-lg py-5 text-on-surface-variant hover:border-primary hover:text-primary transition-colors cursor-pointer"
              >
                <FileText className="h-4 w-4" />
                <span className="text-xs font-semibold">Add resume</span>
              </button>
            )}
          </Panel>

          <Panel title="Badges" subtitle={badges.length > 0 ? `${badges.length} earned` : undefined} compact>
            {badges.length === 0 ? (
              <InlinePrompt text="Accept a job simulation offer to earn your first Journey badge." />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {badges.map(b => <BadgeTile key={b.id} badge={b} />)}
              </div>
            )}
          </Panel>
        </div>
      </div>

      {showEditProfile && <EditProfileModal onClose={() => setShowEditProfile(false)} />}
      {showAddEducation && <EducationModal onClose={() => setShowAddEducation(false)} />}
      {editingEducation && <EducationModal entry={editingEducation} onClose={() => setEditingEducation(null)} />}
    </div>
  )
}

/** Shared section shell — one border/padding/heading treatment instead of
 * each block inventing its own, which is what made the old page read as a
 * pile of unrelated cards. */
function Panel({ title, subtitle, action, dot, compact, children }) {
  return (
    <section className="rounded-xl border border-border bg-white shadow-sm">
      <div className={`flex items-start justify-between gap-3 ${compact ? 'px-5 pt-4 pb-3' : 'px-6 pt-5 pb-4'}`}>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
            {dot && <span className={`w-2 h-2 rounded-full ${dot}`} />}
            {title}
          </h2>
          {subtitle && <p className="text-xs text-on-surface-variant mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className={`border-t border-border ${compact ? 'px-5 py-4' : 'px-6 py-5'}`}>{children}</div>
    </section>
  )
}

/** Replaces the old full-height EmptyState illustrations — those took a lot
 * of vertical space to say very little, which is exactly what made an
 * early-stage portfolio look empty rather than just new. */
function InlinePrompt({ text, action, onClick }) {
  return (
    <div className="text-sm text-on-surface-variant leading-relaxed">
      {text}
      {action && (
        <button onClick={onClick} className="ml-1.5 text-primary font-semibold hover:underline cursor-pointer">
          {action} →
        </button>
      )}
    </div>
  )
}

function SkillBar({ label, category, score }) {
  return (
    <div className="border border-border rounded-lg p-3.5 hover:border-primary/40 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-on-surface truncate flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${categoryDot[category]}`} />
          {label}
        </p>
        <span className="text-xs font-bold text-primary ml-2 shrink-0 tabular-nums">{score}</span>
      </div>
      <div className="h-1.5 bg-surface-high rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(score, 100)}%` }} />
      </div>
    </div>
  )
}
