import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import {
  useAdminStats, useAdminUniversities, useAdminUsers, useAdminActivity,
  useUserEnrollments, useDeleteUser, useDeleteEnrollment,
} from '../../shared/api/hooks'

const FEATURE_GATES = [
  { id: 'python_sandbox',   label: 'Python Sandbox',        directUser: true,  uniStudent: false, mentor: true  },
  { id: 'model_solution',   label: 'Model Solution Reveal', directUser: true,  uniStudent: false, mentor: true  },
  { id: 'certificate',      label: 'Certificate Issue',     directUser: true,  uniStudent: false, mentor: true  },
  { id: 'all_courses',      label: 'Full Course Catalog',   directUser: true,  uniStudent: false, mentor: true  },
  { id: 'download_dataset', label: 'Dataset Download',      directUser: true,  uniStudent: true,  mentor: true  },
  { id: 'assign_tasks',     label: 'Task Assignment',       directUser: false, uniStudent: false, mentor: true  },
  { id: 'admin_panel',      label: 'Admin Panel',           directUser: false, uniStudent: false, mentor: false },
]

const SECTIONS = ['Overview', 'Universities', 'Direct Users', 'All Students', 'Feature Gates', 'Activity Log']
const ICONS    = ['📊', '🏛', '👤', '🎓', '🔒', '📋']

function Toggle({ on, onChange }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`w-11 h-6 rounded-full relative transition-colors ${on ? 'bg-green-500' : 'bg-gray-200'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-5' : ''}`} />
    </button>
  )
}

function Skeleton({ h = 'h-8', w = 'w-full' }) {
  return <div className={`${h} ${w} bg-gray-100 rounded animate-pulse`} />
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
    if (type === 'success') return 'bg-green-500'
    if (type === 'cert')    return 'bg-purple-500'
    if (type === 'request') return 'bg-orange-500'
    if (type === 'warn')    return 'bg-amber-500'
    return 'bg-blue-400'
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* ── Sidebar ── */}
      <aside className="w-56 bg-gray-900 text-white flex flex-col fixed inset-y-0">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">W</span>
            </div>
            <div>
              <p className="font-bold text-sm">WorkLearn AI</p>
              <p className="text-[10px] text-white/40">Super Admin</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {SECTIONS.map((s, i) => (
            <button
              key={s}
              onClick={() => setSection(s)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                section === s ? 'bg-white/15 text-white font-semibold' : 'text-white/60 hover:text-white hover:bg-white/8'
              }`}
            >
              <span className="text-base">{ICONS[i]}</span>
              {s}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center text-xs font-bold">SA</div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{user?.name || 'Admin'}</p>
              <p className="text-[10px] text-white/40 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/admin') }}
            className="w-full text-xs text-white/50 hover:text-white transition-colors text-left px-2 py-1"
          >
            Sign out →
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="ml-56 flex-1 p-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{section}</h1>
            <p className="text-sm text-gray-500 mt-0.5">Platform management · WorkLearn AI</p>
          </div>
        </div>

        {/* ── OVERVIEW ── */}
        {section === 'Overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              {statsLoading ? Array(4).fill(0).map((_, i) => <div key={i} className="card"><Skeleton h="h-12" /></div>) : [
                { label: 'Total Users',          value: (stats?.total_users ?? 0).toLocaleString(), color: 'text-primary',    bg: 'bg-primary/5' },
                { label: 'Partner Universities', value: (stats?.universities ?? 0).toString(),      color: 'text-orange-600', bg: 'bg-orange-50' },
                { label: 'Active Today',         value: (stats?.active_today ?? 0).toLocaleString(),color: 'text-green-600',  bg: 'bg-green-50' },
                { label: 'Certificates Issued',  value: (stats?.certificates ?? 0).toLocaleString(),color: 'text-purple-600', bg: 'bg-purple-50' },
              ].map(s => (
                <div key={s.label} className={`card ${s.bg}`}>
                  <p className={`text-2xl font-bold ${s.color} mb-0.5`}>{s.value}</p>
                  <p className="text-xs font-semibold text-gray-700">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 card">
                <h3 className="font-bold text-sm text-gray-800 mb-4">Top Universities by Students</h3>
                {uniLoading ? <Skeleton h="h-32" /> : (universities ?? []).length === 0 ? (
                  <p className="text-xs text-gray-400 py-4 text-center">No universities enrolled yet.</p>
                ) : (
                  <table className="w-full text-xs">
                    <thead><tr className="border-b border-gray-100">
                      <th className="text-left pb-2 text-gray-500 font-semibold">Institution</th>
                      <th className="text-right pb-2 text-gray-500 font-semibold">Students</th>
                      <th className="text-right pb-2 text-gray-500 font-semibold">Mentors</th>
                      <th className="text-right pb-2 text-gray-500 font-semibold">Status</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {(universities ?? []).slice(0, 6).map(u => (
                        <tr key={u.code}>
                          <td className="py-2.5 font-medium text-gray-800">{u.name}</td>
                          <td className="py-2.5 text-right text-gray-600">{u.students.toLocaleString()}</td>
                          <td className="py-2.5 text-right text-gray-600">{u.mentors}</td>
                          <td className="py-2.5 text-right">
                            <span className="chip text-[10px] bg-green-100 text-green-700">{u.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="card">
                <h3 className="font-bold text-sm text-gray-800 mb-4">Live Activity</h3>
                {actLoading ? <Skeleton h="h-40" /> : (activity ?? []).length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No activity yet.</p>
                ) : (
                  <div className="space-y-3">
                    {(activity ?? []).slice(0, 6).map((a, i) => (
                      <div key={i} className="flex gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${dotColor(a.type)}`} />
                        <div className="min-w-0">
                          <p className="text-xs text-gray-800 leading-snug">{a.action}</p>
                          <p className="text-[10px] text-gray-400">{a.user} · {a.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="card">
                <h3 className="font-bold text-sm text-gray-800 mb-4">User Breakdown</h3>
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
                            <span className="text-gray-700">{b.label}</span>
                            <span className="font-semibold text-gray-900">{b.val.toLocaleString()}</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full ${b.color} rounded-full`} style={{ width: `${b.pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
              <div className="card">
                <h3 className="font-bold text-sm text-gray-800 mb-4">Platform Summary</h3>
                {statsLoading ? <Skeleton h="h-20" /> : (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Total Users',   val: stats?.total_users ?? 0 },
                      { label: 'Universities',  val: stats?.universities ?? 0 },
                      { label: 'Active Today',  val: stats?.active_today ?? 0 },
                      { label: 'Certificates',  val: stats?.certificates ?? 0 },
                    ].map(s => (
                      <div key={s.label} className="bg-gray-50 rounded-lg p-3">
                        <p className="text-lg font-bold text-gray-900">{s.val.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{s.label}</p>
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
            <input
              value={uniSearch}
              onChange={e => setUniSearch(e.target.value)}
              placeholder="Search universities…"
              className="input w-72"
            />
            {uniLoading ? <Skeleton h="h-64" /> : filteredUnis.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-sm text-gray-500">No universities found.</p>
                <p className="text-xs text-gray-400 mt-1">Universities appear here when university students register.</p>
              </div>
            ) : (
              <div className="card p-0 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Institution', 'Code', 'Students', 'Mentors', 'Status'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredUnis.map(u => (
                      <tr key={u.code} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{u.code}</td>
                        <td className="px-4 py-3 text-gray-700">{u.students}</td>
                        <td className="px-4 py-3 text-gray-700">{u.mentors}</td>
                        <td className="px-4 py-3">
                          <span className="chip text-[10px] bg-green-100 text-green-700">{u.status}</span>
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
            <input
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              placeholder="Search users…"
              className="input w-72"
            />
            {usersLoading ? <Skeleton h="h-64" /> : (directUsers ?? []).length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-sm text-gray-500">No direct users yet.</p>
              </div>
            ) : (
              <div className="card p-0 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Name', 'Email', 'Joined', 'XP', 'Enrollments', 'Last Active', ''].map((h, i) => (
                        <th key={i} className="text-left px-4 py-3 text-xs font-semibold text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(directUsers ?? []).map(u => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{u.email}</td>
                        <td className="px-4 py-3 text-xs text-gray-400">{u.joined}</td>
                        <td className="px-4 py-3 text-gray-700">{u.xp}</td>
                        <td className="px-4 py-3 text-gray-700">{u.enrollments}</td>
                        <td className="px-4 py-3 text-xs text-gray-400">{u.last_active}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setManageUser(u)}
                            className="text-xs font-semibold text-primary hover:underline"
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
          <div className="card">
            {statsLoading ? <Skeleton h="h-40" /> : (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Showing university students across {stats?.universities ?? 0} institution{(stats?.universities ?? 0) !== 1 ? 's' : ''}.
                </p>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { label: 'Total University Students', value: (stats?.university_students ?? 0).toLocaleString() },
                    { label: 'Active Today',              value: (stats?.active_today ?? 0).toLocaleString() },
                    { label: 'Certificates Issued',       value: (stats?.certificates ?? 0).toLocaleString() },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xl font-bold text-gray-900">{s.value}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400">Drill into a specific university in the Universities tab to see institution details.</p>
              </>
            )}
          </div>
        )}

        {/* ── FEATURE GATES ── */}
        {section === 'Feature Gates' && (
          <div className="card">
            <p className="text-xs text-gray-500 mb-1">Control default feature access by role. These are role-level defaults — mentors can additionally unlock features for individual students.</p>
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-6">Note: These toggles show current role defaults. Changes here are UI-only; to persist gate changes, update ROLE_FEATURES in AuthContext.jsx.</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left pb-3 text-xs font-semibold text-gray-500">Feature</th>
                  <th className="text-center pb-3 text-xs font-semibold text-gray-500">Direct User</th>
                  <th className="text-center pb-3 text-xs font-semibold text-gray-500">University Student</th>
                  <th className="text-center pb-3 text-xs font-semibold text-gray-500">Class Mentor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {gates.map(g => (
                  <tr key={g.id}>
                    <td className="py-4 font-medium text-gray-800">{g.label}</td>
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
          <div className="card">
            {actLoading ? <Skeleton h="h-64" /> : (activity ?? []).length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-gray-500">No activity yet.</p>
                <p className="text-xs text-gray-400 mt-1">XP events will appear here as users complete tasks.</p>
              </div>
            ) : (
              <div className="space-y-0 divide-y divide-gray-50">
                {(activity ?? []).map((a, i) => (
                  <div key={i} className="flex items-start gap-4 py-4">
                    <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${dotColor(a.type)}`} />
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">{a.action}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{a.user}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{a.time}</span>
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

  const handleDeleteUser = async () => {
    await deleteUser.mutateAsync(user.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900">{user.name}</h3>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl leading-none">×</button>
        </div>

        {/* Enrollments */}
        <div className="p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Course Enrollments</p>
          {isLoading ? (
            <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          ) : enrollments.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center bg-gray-50 rounded-lg">No enrollments.</p>
          ) : (
            <div className="space-y-2">
              {enrollments.map(e => (
                <div key={e.id} className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{e.simulation_title}</p>
                    <p className="text-xs text-gray-400">
                      {e.status} · {e.completed_tasks}/5 tasks · enrolled {e.enrolled_at}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteEnrollment.mutate(e.id)}
                    disabled={deleteEnrollment.isPending}
                    className="text-xs font-semibold text-red-500 hover:text-red-700 shrink-0 ml-3 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Danger zone */}
        <div className="p-5 border-t border-gray-100 bg-red-50/50">
          <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">Danger Zone</p>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-sm font-semibold text-red-600 border border-red-200 rounded-lg px-4 py-2 hover:bg-red-100 transition-colors"
            >
              Delete this user
            </button>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-700">Permanently delete {user.name} and all their data?</span>
              <button
                onClick={handleDeleteUser}
                disabled={deleteUser.isPending}
                className="text-sm text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg font-semibold disabled:opacity-50"
              >
                {deleteUser.isPending ? 'Deleting…' : 'Yes, delete'}
              </button>
              <button onClick={() => setConfirmDelete(false)} className="text-sm text-gray-500 hover:text-gray-800 font-medium">
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
