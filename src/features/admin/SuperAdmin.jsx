import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Building2, UserCircle2, GraduationCap, Blocks, ShieldCheck,
  ClipboardList, LogOut, Search, Trash2, Users, Award, Activity as ActivityIcon,
  AlertTriangle, X,
} from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import {
  useAdminStats, useAdminUniversities, useAdminUsers, useAdminActivity,
  useUserEnrollments, useDeleteUser, useDeleteEnrollment,
} from '../../shared/api/hooks'
import SimulationsListPanel from './cms/SimulationsListPanel'
import logo from '../../assets/logo.png'

const FEATURE_GATES = [
  { id: 'python_sandbox',   label: 'Python Sandbox',        description: 'Run and execute Python code in an isolated sandbox.',   directUser: true,  uniStudent: false, mentor: true  },
  { id: 'model_solution',   label: 'Model Solution Reveal', description: 'Reveal the reference solution after an attempt.',        directUser: true,  uniStudent: false, mentor: true  },
  { id: 'certificate',      label: 'Certificate Issue',     description: 'Issue a completion certificate for finished simulations.', directUser: true,  uniStudent: false, mentor: true  },
  { id: 'all_courses',      label: 'Full Course Catalog',   description: 'Browse and enroll in every published simulation.',       directUser: true,  uniStudent: false, mentor: true  },
  { id: 'download_dataset', label: 'Dataset Download',      description: 'Download the raw dataset behind a data task.',           directUser: true,  uniStudent: true,  mentor: true  },
  { id: 'assign_tasks',     label: 'Task Assignment',       description: 'Assign specific tasks to individual students.',          directUser: false, uniStudent: false, mentor: true  },
  { id: 'admin_panel',      label: 'Admin Panel',           description: 'Access this platform-management panel.',                directUser: false, uniStudent: false, mentor: false },
]

const SECTIONS = [
  { name: 'Overview',      Icon: LayoutDashboard, group: null },
  { name: 'Universities',  Icon: Building2,       group: 'People' },
  { name: 'Direct Users',  Icon: UserCircle2,     group: 'People' },
  { name: 'All Students',  Icon: GraduationCap,   group: 'People' },
  { name: 'Simulations',   Icon: Blocks,          group: 'Content' },
  { name: 'Feature Gates', Icon: ShieldCheck,     group: 'Content' },
  { name: 'Activity Log',  Icon: ClipboardList,   group: 'Monitoring' },
]

function Toggle({ on, onChange }) {
  return (
    <button
      onClick={() => onChange(!on)}
      role="switch"
      aria-checked={on}
      className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 ${on ? 'bg-emerald-500' : 'bg-surface-high'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-5' : ''}`} />
    </button>
  )
}

function Skeleton({ h = 'h-8', w = 'w-full' }) {
  return <div className={`${h} ${w} bg-surface-high rounded animate-pulse`} />
}

function Avatar({ name, size = 'h-8 w-8', className = '' }) {
  const initials = (name || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className={`${size} rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 ${className}`}>
      {initials}
    </div>
  )
}

export default function SuperAdmin() {
  const navigate         = useNavigate()
  const { user, logout } = useAuth()
  const [section, setSection]       = useState('Overview')
  const [gates,   setGates]         = useState(FEATURE_GATES)
  const [uniSearch, setUniSearch]   = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [manageUser, setManageUser] = useState(null)  // user object being managed

  const { data: stats,        isLoading: statsLoading }  = useAdminStats()
  const { data: universities, isLoading: uniLoading }    = useAdminUniversities()
  const { data: directUsers,  isLoading: usersLoading }  = useAdminUsers('DIRECT_USER', userSearch)
  const { data: activity,     isLoading: actLoading }    = useAdminActivity()

  const handleGateToggle = (id, role, val) => {
    setGates(prev => prev.map(g => g.id === id ? { ...g, [role]: val } : g))
  }

  const filteredUnis  = (universities ?? []).filter(u =>
    u.name.toLowerCase().includes(uniSearch.toLowerCase()) ||
    u.code.toLowerCase().includes(uniSearch.toLowerCase())
  )

  const dotColor = (type) => {
    if (type === 'success') return 'bg-emerald-500'
    if (type === 'cert')    return 'bg-purple-500'
    if (type === 'request') return 'bg-orange-500'
    if (type === 'warn')    return 'bg-amber-500'
    return 'bg-secondary'
  }

  const activeSection = SECTIONS.find((s) => s.name === section)

  return (
    <div className="min-h-screen bg-surface-low flex">

      {/* ── Sidebar ── */}
      <aside className="w-60 bg-primary-dark text-white flex flex-col fixed inset-y-0 shadow-xl z-10">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="WorkLearn AI" className="w-9 h-9 rounded-lg object-cover shrink-0 shadow-sm ring-1 ring-white/10" />
            <div className="min-w-0">
              <p className="font-bold text-sm leading-tight truncate">WorkLearn AI</p>
              <p className="text-[10px] text-white/40 leading-tight">Super Admin</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {SECTIONS.map(({ name, Icon, group }, i) => {
            const active = section === name
            const showGroupLabel = group && group !== SECTIONS[i - 1]?.group
            return (
              <div key={name}>
                {showGroupLabel && (
                  <p className={`px-3 text-[10px] font-bold uppercase tracking-widest text-white/30 ${i === 0 ? 'mb-1.5' : 'mt-5 mb-1.5'}`}>
                    {group}
                  </p>
                )}
                <button
                  onClick={() => setSection(name)}
                  aria-current={active ? 'page' : undefined}
                  className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/70 ${
                    active ? 'bg-white/10 text-white font-semibold shadow-sm' : 'text-white/55 hover:text-white hover:bg-white/5 hover:translate-x-0.5'
                  }`}
                >
                  {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-secondary" />}
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-colors ${active ? 'text-secondary' : 'text-white/40 group-hover:text-white/70'}`}
                    strokeWidth={2}
                  />
                  {name}
                </button>
              </div>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 bg-secondary/80 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
              {(user?.name || 'Admin').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{user?.name || 'Admin'}</p>
              <p className="text-[10px] text-white/40 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/admin') }}
            className="w-full flex items-center gap-2 text-xs text-white/50 hover:text-white transition-colors text-left px-2 py-1.5 rounded-md hover:bg-white/5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/70"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="ml-60 flex-1 p-8 max-w-[1400px]">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              {activeSection && <activeSection.Icon className="h-5 w-5" />}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-on-surface leading-tight">{section}</h1>
              <p className="text-sm text-on-surface-variant mt-0.5">Platform management · WorkLearn AI</p>
            </div>
          </div>
          <span className="chip bg-primary/10 text-primary shrink-0">Super Admin</span>
        </div>

        {/* ── OVERVIEW ── */}
        {section === 'Overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              {statsLoading ? Array(4).fill(0).map((_, i) => <div key={i} className="card shadow-sm"><Skeleton h="h-12" /></div>) : [
                { label: 'Total Users',          value: (stats?.total_users ?? 0).toLocaleString(),  Icon: Users,        color: 'text-primary',    bg: 'bg-primary/10' },
                { label: 'Partner Universities', value: (stats?.universities ?? 0).toString(),       Icon: Building2,    color: 'text-orange-600', bg: 'bg-orange-50' },
                { label: 'Active Today',         value: (stats?.active_today ?? 0).toLocaleString(), Icon: ActivityIcon, color: 'text-emerald-600',bg: 'bg-emerald-50' },
                { label: 'Certificates Issued',  value: (stats?.certificates ?? 0).toLocaleString(), Icon: Award,        color: 'text-purple-600', bg: 'bg-purple-50' },
              ].map(s => (
                <div key={s.label} className="card shadow-sm flex items-center gap-3.5">
                  <div className={`h-11 w-11 rounded-xl ${s.bg} ${s.color} flex items-center justify-center shrink-0`}>
                    <s.Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-2xl font-bold text-on-surface leading-tight tabular-nums">{s.value}</p>
                    <p className="text-xs font-medium text-on-surface-variant truncate">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 card shadow-sm">
                <h3 className="font-bold text-sm text-on-surface mb-4">Top Universities by Students</h3>
                {uniLoading ? <Skeleton h="h-32" /> : (universities ?? []).length === 0 ? (
                  <p className="text-xs text-on-surface-variant py-4 text-center">No universities enrolled yet.</p>
                ) : (
                  <table className="w-full text-xs">
                    <thead><tr className="border-b border-border">
                      <th className="text-left pb-2 text-on-surface-variant font-semibold">Institution</th>
                      <th className="text-right pb-2 text-on-surface-variant font-semibold">Students</th>
                      <th className="text-right pb-2 text-on-surface-variant font-semibold">Mentors</th>
                      <th className="text-right pb-2 text-on-surface-variant font-semibold">Status</th>
                    </tr></thead>
                    <tbody className="divide-y divide-border/60">
                      {(universities ?? []).slice(0, 6).map(u => (
                        <tr key={u.code}>
                          <td className="py-2.5 font-medium text-on-surface">{u.name}</td>
                          <td className="py-2.5 text-right text-on-surface-variant tabular-nums">{u.students.toLocaleString()}</td>
                          <td className="py-2.5 text-right text-on-surface-variant tabular-nums">{u.mentors}</td>
                          <td className="py-2.5 text-right">
                            <span className="chip text-[10px] bg-emerald-100 text-emerald-700">{u.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="card shadow-sm">
                <h3 className="font-bold text-sm text-on-surface mb-4">Live Activity</h3>
                {actLoading ? <Skeleton h="h-40" /> : (activity ?? []).length === 0 ? (
                  <p className="text-xs text-on-surface-variant text-center py-4">No activity yet.</p>
                ) : (
                  <div className="space-y-3">
                    {(activity ?? []).slice(0, 6).map((a, i) => (
                      <div key={i} className="flex gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${dotColor(a.type)}`} />
                        <div className="min-w-0">
                          <p className="text-xs text-on-surface leading-snug">{a.action}</p>
                          <p className="text-[10px] text-outline">{a.user} · {a.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="card shadow-sm">
                <h3 className="font-bold text-sm text-on-surface mb-4">User Breakdown</h3>
                {statsLoading ? <Skeleton h="h-20" /> : (() => {
                  const total = (stats?.university_students ?? 0) + (stats?.direct_users ?? 0)
                  const uniPct = total ? Math.round((stats.university_students / total) * 100) : 0
                  const dirPct = total ? Math.round((stats.direct_users / total) * 100) : 0
                  return (
                    <div className="space-y-3">
                      {[
                        { label: 'University Students', val: stats?.university_students ?? 0, color: 'bg-orange-500', pct: uniPct },
                        { label: 'Direct Users',        val: stats?.direct_users ?? 0,        color: 'bg-primary',    pct: dirPct },
                      ].map(b => (
                        <div key={b.label}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-on-surface-variant">{b.label}</span>
                            <span className="font-semibold text-on-surface tabular-nums">{b.val.toLocaleString()}</span>
                          </div>
                          <div className="h-2 bg-surface-high rounded-full overflow-hidden">
                            <div className={`h-full ${b.color} rounded-full`} style={{ width: `${b.pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
              <div className="card shadow-sm">
                <h3 className="font-bold text-sm text-on-surface mb-4">Platform Summary</h3>
                {statsLoading ? <Skeleton h="h-20" /> : (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Total Users',   val: stats?.total_users ?? 0 },
                      { label: 'Universities',  val: stats?.universities ?? 0 },
                      { label: 'Active Today',  val: stats?.active_today ?? 0 },
                      { label: 'Certificates',  val: stats?.certificates ?? 0 },
                    ].map(s => (
                      <div key={s.label} className="bg-surface-low rounded-lg p-3">
                        <p className="text-lg font-bold text-on-surface tabular-nums">{s.val.toLocaleString()}</p>
                        <p className="text-xs text-on-surface-variant">{s.label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── UNIVERSITIES ── */}
        {section === 'Universities' && (
          <div className="space-y-4">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline" />
              <input
                value={uniSearch}
                onChange={e => setUniSearch(e.target.value)}
                placeholder="Search universities…"
                className="input pl-9"
              />
            </div>
            {uniLoading ? <Skeleton h="h-64" /> : filteredUnis.length === 0 ? (
              <div className="card shadow-sm text-center py-14">
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                  <Building2 className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-on-surface">No universities found</p>
                <p className="text-xs text-outline mt-1">Universities appear here when university students register.</p>
              </div>
            ) : (
              <div className="card shadow-sm p-0 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-surface-low border-b border-border">
                    <tr>
                      {['Institution', 'Code', 'Students', 'Mentors', 'Status'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredUnis.map(u => (
                      <tr key={u.code} className="hover:bg-surface-low transition-colors">
                        <td className="px-4 py-3 font-medium text-on-surface">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={u.name} />
                            {u.name}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-on-surface-variant">{u.code}</td>
                        <td className="px-4 py-3 text-on-surface-variant tabular-nums">{u.students}</td>
                        <td className="px-4 py-3 text-on-surface-variant tabular-nums">{u.mentors}</td>
                        <td className="px-4 py-3">
                          <span className="chip text-[10px] bg-emerald-100 text-emerald-700">{u.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── DIRECT USERS ── */}
        {section === 'Direct Users' && (
          <div className="space-y-4">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline" />
              <input
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="Search users…"
                className="input pl-9"
              />
            </div>
            {usersLoading ? <Skeleton h="h-64" /> : (directUsers ?? []).length === 0 ? (
              <div className="card shadow-sm text-center py-14">
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                  <UserCircle2 className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-on-surface">No direct users yet</p>
              </div>
            ) : (
              <div className="card shadow-sm p-0 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-surface-low border-b border-border">
                    <tr>
                      {['Name', 'Email', 'Joined', 'XP', 'Enrollments', 'Last Active', ''].map((h, i) => (
                        <th key={i} className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {(directUsers ?? []).map(u => (
                      <tr key={u.id} className="hover:bg-surface-low transition-colors">
                        <td className="px-4 py-3 font-medium text-on-surface">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={u.name} />
                            {u.name}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-on-surface-variant">{u.email}</td>
                        <td className="px-4 py-3 text-xs text-outline">{u.joined}</td>
                        <td className="px-4 py-3 text-on-surface-variant tabular-nums">{u.xp}</td>
                        <td className="px-4 py-3 text-on-surface-variant tabular-nums">{u.enrollments}</td>
                        <td className="px-4 py-3 text-xs text-outline">{u.last_active}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setManageUser(u)}
                            className="text-xs font-semibold text-primary hover:underline cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── ALL STUDENTS ── */}
        {section === 'All Students' && (
          <div className="card shadow-sm">
            {statsLoading ? <Skeleton h="h-40" /> : (
              <>
                <p className="text-sm text-on-surface-variant mb-4">
                  Showing university students across {stats?.universities ?? 0} institution{(stats?.universities ?? 0) !== 1 ? 's' : ''}.
                </p>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { label: 'Total University Students', value: (stats?.university_students ?? 0).toLocaleString() },
                    { label: 'Active Today',              value: (stats?.active_today ?? 0).toLocaleString() },
                    { label: 'Certificates Issued',       value: (stats?.certificates ?? 0).toLocaleString() },
                  ].map(s => (
                    <div key={s.label} className="bg-surface-low rounded-xl p-4">
                      <p className="text-xl font-bold text-on-surface tabular-nums">{s.value}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-outline">Drill into a specific university in the Universities tab to see institution details.</p>
              </>
            )}
          </div>
        )}

        {/* ── SIMULATIONS ── */}
        {section === 'Simulations' && <SimulationsListPanel />}

        {/* ── FEATURE GATES ── */}
        {section === 'Feature Gates' && (
          <div className="card shadow-sm">
            <p className="text-xs text-on-surface-variant mb-1">Control default feature access by role. These are role-level defaults — mentors can additionally unlock features for individual students.</p>
            <p className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-6">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              Note: these toggles show current role defaults. Changes here are UI-only; to persist gate changes, update ROLE_FEATURES in AuthContext.jsx.
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left pb-3 text-xs font-semibold text-on-surface-variant">Feature</th>
                  <th className="text-center pb-3 text-xs font-semibold text-on-surface-variant">Direct User</th>
                  <th className="text-center pb-3 text-xs font-semibold text-on-surface-variant">University Student</th>
                  <th className="text-center pb-3 text-xs font-semibold text-on-surface-variant">Class Mentor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {gates.map(g => (
                  <tr key={g.id}>
                    <td className="py-4 pr-4">
                      <p className="font-medium text-on-surface">{g.label}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">{g.description}</p>
                    </td>
                    <td className="py-4 text-center"><Toggle on={g.directUser}  onChange={v => handleGateToggle(g.id, 'directUser', v)} /></td>
                    <td className="py-4 text-center"><Toggle on={g.uniStudent}  onChange={v => handleGateToggle(g.id, 'uniStudent', v)} /></td>
                    <td className="py-4 text-center"><Toggle on={g.mentor}      onChange={v => handleGateToggle(g.id, 'mentor', v)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── ACTIVITY LOG ── */}
        {section === 'Activity Log' && (
          <div className="card shadow-sm">
            {actLoading ? <Skeleton h="h-64" /> : (activity ?? []).length === 0 ? (
              <div className="text-center py-14">
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-on-surface">No activity yet</p>
                <p className="text-xs text-outline mt-1">XP events will appear here as users complete tasks.</p>
              </div>
            ) : (
              <div className="space-y-0 divide-y divide-border/60">
                {(activity ?? []).map((a, i) => (
                  <div key={i} className="flex items-start gap-4 py-4">
                    <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${dotColor(a.type)}`} />
                    <div className="flex-1">
                      <p className="text-sm text-on-surface">{a.action}</p>
                      <p className="text-xs text-outline mt-0.5">{a.user}</p>
                    </div>
                    <span className="text-xs text-outline shrink-0">{a.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {manageUser && (
        <ManageUserModal user={manageUser} onClose={() => setManageUser(null)} />
      )}
    </div>
  )
}

function ManageUserModal({ user, onClose }) {
  const { data, isLoading }  = useUserEnrollments(user.id)
  const deleteUser           = useDeleteUser()
  const deleteEnrollment     = useDeleteEnrollment()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const enrollments = data?.enrollments ?? []

  useEffect(() => {
    const onKeyDown = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  const handleDeleteUser = async () => {
    await deleteUser.mutateAsync(user.id)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-on-surface/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-xl"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="manage-user-title"
      >

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} size="h-10 w-10" />
            <div>
              <h3 id="manage-user-title" className="font-bold text-on-surface">{user.name}</h3>
              <p className="text-xs text-on-surface-variant">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-outline hover:text-on-surface transition-colors shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-md p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Enrollments */}
        <div className="p-5">
          <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-3">Course Enrollments</p>
          {isLoading ? (
            <div className="h-16 bg-surface-high rounded-lg animate-pulse" />
          ) : enrollments.length === 0 ? (
            <p className="text-sm text-on-surface-variant py-4 text-center bg-surface-low rounded-lg">No enrollments.</p>
          ) : (
            <div className="space-y-2">
              {enrollments.map(e => (
                <div key={e.id} className="flex items-center justify-between border border-border rounded-lg px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-on-surface truncate">{e.simulation_title}</p>
                    <p className="text-xs text-outline">
                      {e.status} · {e.completed_tasks}/5 tasks · enrolled {e.enrolled_at}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteEnrollment.mutate(e.id)}
                    disabled={deleteEnrollment.isPending}
                    className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 shrink-0 ml-3 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 rounded"
                  >
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Danger zone */}
        <div className="p-5 border-t border-border bg-red-50/50">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">
            <AlertTriangle className="h-3.5 w-3.5" /> Danger Zone
          </p>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-sm font-semibold text-red-600 border border-red-200 rounded-lg px-4 py-2 hover:bg-red-100 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
            >
              Delete this user
            </button>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-on-surface">Permanently delete {user.name} and all their data?</span>
              <button
                onClick={handleDeleteUser}
                disabled={deleteUser.isPending}
                className="text-sm text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg font-semibold disabled:opacity-50 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
              >
                {deleteUser.isPending ? 'Deleting…' : 'Yes, delete'}
              </button>
              <button onClick={() => setConfirmDelete(false)} className="text-sm text-on-surface-variant hover:text-on-surface font-medium cursor-pointer">
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
