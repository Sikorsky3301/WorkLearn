import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

// ── Mock data ────────────────────────────────────────────────────────────────
const UNIVERSITIES = [
  { id: 'u1',  code: 'IITD',  name: 'IIT Delhi',        students: 450, mentors: 18, plan: 'Enterprise', status: 'active',    since: 'Jan 2025' },
  { id: 'u2',  code: 'BITS',  name: 'BITS Pilani',      students: 380, mentors: 15, plan: 'Pro',        status: 'active',    since: 'Feb 2025' },
  { id: 'u3',  code: 'VIT',   name: 'VIT Vellore',      students: 520, mentors: 22, plan: 'Pro',        status: 'active',    since: 'Mar 2025' },
  { id: 'u4',  code: 'NIT',   name: 'NIT Trichy',       students: 410, mentors: 16, plan: 'Basic',      status: 'active',    since: 'Mar 2025' },
  { id: 'u5',  code: 'MNP',   name: 'Manipal University',students: 460, mentors: 19, plan: 'Pro',       status: 'active',    since: 'Apr 2025' },
  { id: 'u6',  code: 'ISB',   name: 'ISB Hyderabad',    students: 290, mentors: 11, plan: 'Enterprise', status: 'active',    since: 'Jan 2025' },
  { id: 'u7',  code: 'IIIT',  name: 'IIIT Bangalore',   students: 340, mentors: 14, plan: 'Pro',        status: 'active',    since: 'May 2025' },
  { id: 'u8',  code: 'SRM',   name: 'SRM University',   students: 380, mentors: 16, plan: 'Basic',      status: 'trial',     since: 'Jun 2025' },
  { id: 'u9',  code: 'DTU',   name: 'DTU Delhi',        students: 310, mentors: 13, plan: 'Basic',      status: 'active',    since: 'May 2025' },
  { id: 'u10', code: 'AMY',   name: 'Amity University', students: 310, mentors: 12, plan: 'Basic',      status: 'suspended', since: 'Apr 2025' },
  { id: 'u11', code: 'MIT',   name: 'MIT (US)',          students: 320, mentors: 12, plan: 'Enterprise', status: 'active',    since: 'Dec 2024' },
  { id: 'u12', code: 'STN',   name: 'Stanford (US)',    students: 280, mentors: 10, plan: 'Enterprise', status: 'active',    since: 'Dec 2024' },
]

const DIRECT_USERS = [
  { id: 'd1',  name: 'Alex Demo',      email: 'demo@worklearn.ai',  joined: 'Jan 10', plan: 'Free',  status: 'active',   sims: 3, certs: 1 },
  { id: 'd2',  name: 'Sarah Chen',     email: 'sarah@gmail.com',    joined: 'Feb 02', plan: 'Pro',   status: 'active',   sims: 7, certs: 4 },
  { id: 'd3',  name: 'James Wilson',   email: 'james@yahoo.com',    joined: 'Feb 14', plan: 'Free',  status: 'active',   sims: 1, certs: 0 },
  { id: 'd4',  name: 'Neha Patel',     email: 'neha@outlook.com',   joined: 'Mar 01', plan: 'Pro',   status: 'active',   sims: 5, certs: 3 },
  { id: 'd5',  name: 'Carlos Lopez',   email: 'carlos@gmail.com',   joined: 'Mar 22', plan: 'Free',  status: 'inactive', sims: 0, certs: 0 },
  { id: 'd6',  name: 'Aisha Rahman',   email: 'aisha@gmail.com',    joined: 'Apr 08', plan: 'Pro',   status: 'active',   sims: 9, certs: 5 },
  { id: 'd7',  name: 'Tom Harris',     email: 'tom@company.com',    joined: 'Apr 17', plan: 'Free',  status: 'active',   sims: 2, certs: 1 },
  { id: 'd8',  name: 'Yuki Tanaka',    email: 'yuki@gmail.com',     joined: 'May 03', plan: 'Pro',   status: 'active',   sims: 6, certs: 4 },
]

const FEATURE_GATES = [
  { id: 'python_sandbox',   label: 'Python Sandbox',      directUser: true,  uniStudent: false, mentor: true  },
  { id: 'model_solution',   label: 'Model Solution Reveal', directUser: true, uniStudent: false, mentor: true  },
  { id: 'certificate',      label: 'Certificate Issue',   directUser: true,  uniStudent: false, mentor: true  },
  { id: 'all_courses',      label: 'Full Course Catalog', directUser: true,  uniStudent: false, mentor: true  },
  { id: 'download_dataset', label: 'Dataset Download',    directUser: true,  uniStudent: true,  mentor: true  },
  { id: 'assign_tasks',     label: 'Task Assignment',     directUser: false, uniStudent: false, mentor: true  },
  { id: 'admin_panel',      label: 'Admin Panel',         directUser: false, uniStudent: false, mentor: false },
]

const ACTIVITY = [
  { time: '2m ago',  user: 'Priya Singh (IITD)',     action: 'Completed DA Job Simulation', type: 'success' },
  { time: '8m ago',  user: 'Sarah Chen',              action: 'Earned Junior DA Certificate', type: 'cert' },
  { time: '15m ago', user: 'Rahul Sharma (IITD)',     action: 'Requested Python Sandbox unlock', type: 'request' },
  { time: '22m ago', user: 'VIT Admin',               action: 'Added 35 new students (Batch CSE-4A)', type: 'info' },
  { time: '1h ago',  user: 'Aisha Rahman',            action: 'Started Advanced System Design', type: 'info' },
  { time: '1h ago',  user: 'Prof. Ananya (IITD)',     action: 'Assigned DA Sim to CS-3A (24 students)', type: 'info' },
  { time: '2h ago',  user: 'SRM Admin',               action: 'Trial account — 30 days remaining', type: 'warn' },
  { time: '3h ago',  user: 'Yuki Tanaka',             action: 'Completed Task 4 — A/B Test Analysis', type: 'success' },
]

const STAT_CARDS = [
  { label: 'Total Users',         value: '4,684',  sub: '↑ 12% vs last month', color: 'text-primary',    bg: 'bg-primary/5' },
  { label: 'Partner Universities',value: '12',     sub: '2 in trial',           color: 'text-orange-600', bg: 'bg-orange-50' },
  { label: 'Active Today',        value: '341',    sub: '112 direct · 229 uni', color: 'text-green-600',  bg: 'bg-green-50' },
  { label: 'Certificates Issued', value: '1,892',  sub: '↑ 8% vs last month',  color: 'text-purple-600', bg: 'bg-purple-50' },
]

const SECTIONS = ['Overview', 'Universities', 'Direct Users', 'All Students', 'Feature Gates', 'Activity Log']
const ICONS    = ['📊', '🏛', '👤', '🎓', '🔒', '📋']

// ── FeatureGate toggle component ──────────────────────────────────────────────
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

export default function SuperAdmin() {
  const navigate          = useNavigate()
  const { user, logout }  = useAuth()
  const [section, setSection]       = useState('Overview')
  const [gates,   setGates]         = useState(FEATURE_GATES)
  const [uniSearch, setUniSearch]   = useState('')
  const [userSearch, setUserSearch] = useState('')

  const handleGateToggle = (id, role, val) => {
    setGates(prev => prev.map(g => g.id === id ? { ...g, [role]: val } : g))
  }

  const filteredUnis  = UNIVERSITIES.filter(u => u.name.toLowerCase().includes(uniSearch.toLowerCase()))
  const filteredUsers = DIRECT_USERS.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()))

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
            onClick={() => { logout(); navigate('/login') }}
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
          <div className="flex items-center gap-3">
            <button className="btn-secondary text-xs px-3 py-2">Export CSV</button>
            <button className="btn-primary text-xs px-3 py-2">+ Add University</button>
          </div>
        </div>

        {/* ── OVERVIEW ── */}
        {section === 'Overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              {STAT_CARDS.map(s => (
                <div key={s.label} className={`card ${s.bg}`}>
                  <p className={`text-2xl font-bold ${s.color} mb-0.5`}>{s.value}</p>
                  <p className="text-xs font-semibold text-gray-700">{s.label}</p>
                  <p className="text-[11px] text-gray-500 mt-1">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Split: university table + activity */}
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 card">
                <h3 className="font-bold text-sm text-gray-800 mb-4">Top Universities by Students</h3>
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-gray-100">
                    <th className="text-left pb-2 text-gray-500 font-semibold">Institution</th>
                    <th className="text-right pb-2 text-gray-500 font-semibold">Students</th>
                    <th className="text-right pb-2 text-gray-500 font-semibold">Plan</th>
                    <th className="text-right pb-2 text-gray-500 font-semibold">Status</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {UNIVERSITIES.slice(0, 6).map(u => (
                      <tr key={u.id}>
                        <td className="py-2.5 font-medium text-gray-800">{u.name}</td>
                        <td className="py-2.5 text-right text-gray-600">{u.students.toLocaleString()}</td>
                        <td className="py-2.5 text-right">
                          <span className={`chip text-[10px] ${u.plan === 'Enterprise' ? 'bg-purple-100 text-purple-700' : u.plan === 'Pro' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{u.plan}</span>
                        </td>
                        <td className="py-2.5 text-right">
                          <span className={`chip text-[10px] ${u.status === 'active' ? 'bg-green-100 text-green-700' : u.status === 'trial' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{u.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="card">
                <h3 className="font-bold text-sm text-gray-800 mb-4">Live Activity</h3>
                <div className="space-y-3">
                  {ACTIVITY.slice(0, 6).map((a, i) => (
                    <div key={i} className="flex gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${
                        a.type === 'success' ? 'bg-green-500' : a.type === 'cert' ? 'bg-purple-500' : a.type === 'request' ? 'bg-orange-500' : a.type === 'warn' ? 'bg-amber-500' : 'bg-blue-400'
                      }`} />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-800 leading-snug">{a.action}</p>
                        <p className="text-[10px] text-gray-400">{a.user} · {a.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stats breakdown */}
            <div className="grid grid-cols-2 gap-6">
              <div className="card">
                <h3 className="font-bold text-sm text-gray-800 mb-4">User Breakdown</h3>
                <div className="space-y-3">
                  {[
                    { label: 'University Students', val: 3450, color: 'bg-orange-500', pct: 74 },
                    { label: 'Direct Users',         val: 1234, color: 'bg-primary',    pct: 26 },
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
              </div>
              <div className="card">
                <h3 className="font-bold text-sm text-gray-800 mb-4">Monthly Growth</h3>
                <div className="flex items-end gap-2 h-24">
                  {[28, 42, 55, 48, 70, 89, 95].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full bg-primary/80 rounded-t" style={{ height: `${h}%` }} />
                      <span className="text-[9px] text-gray-400">{['Dec','Jan','Feb','Mar','Apr','May','Jun'][i]}</span>
                    </div>
                  ))}
                </div>
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
            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Institution', 'Code', 'Students', 'Mentors', 'Plan', 'Status', 'Since', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUnis.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{u.code}</td>
                      <td className="px-4 py-3 text-gray-700">{u.students}</td>
                      <td className="px-4 py-3 text-gray-700">{u.mentors}</td>
                      <td className="px-4 py-3">
                        <span className={`chip text-[10px] ${u.plan === 'Enterprise' ? 'bg-purple-100 text-purple-700' : u.plan === 'Pro' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{u.plan}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`chip text-[10px] ${u.status === 'active' ? 'bg-green-100 text-green-700' : u.status === 'trial' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{u.status}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{u.since}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <button className="text-xs text-primary hover:underline">Edit</button>
                          <button className={`text-xs hover:underline ${u.status === 'suspended' ? 'text-green-600' : 'text-red-500'}`}>
                            {u.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Name', 'Email', 'Joined', 'Plan', 'Simulations', 'Certs', 'Status', ''].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{u.email}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{u.joined}</td>
                      <td className="px-4 py-3"><span className={`chip text-[10px] ${u.plan === 'Pro' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{u.plan}</span></td>
                      <td className="px-4 py-3 text-gray-700">{u.sims}</td>
                      <td className="px-4 py-3 text-gray-700">{u.certs}</td>
                      <td className="px-4 py-3"><span className={`chip text-[10px] ${u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{u.status}</span></td>
                      <td className="px-4 py-3 text-xs text-primary hover:underline cursor-pointer">View</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── ALL STUDENTS ── */}
        {section === 'All Students' && (
          <div className="card">
            <p className="text-sm text-gray-600 mb-4">Showing university students across all {UNIVERSITIES.length} institutions.</p>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Total Students', value: '3,450' },
                { label: 'Active this week', value: '2,103' },
                { label: 'Simulations in progress', value: '891' },
              ].map(s => (
                <div key={s.label} className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400">Drill into a specific university in the Universities tab to see individual student records.</p>
          </div>
        )}

        {/* ── FEATURE GATES ── */}
        {section === 'Feature Gates' && (
          <div className="card">
            <p className="text-xs text-gray-500 mb-6">Control which features are available by default for each user role. Mentors can further unlock features for individual students.</p>
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
                    <td className="py-4 text-center"><Toggle on={g.directUser}   onChange={v => handleGateToggle(g.id, 'directUser', v)} /></td>
                    <td className="py-4 text-center"><Toggle on={g.uniStudent}   onChange={v => handleGateToggle(g.id, 'uniStudent', v)} /></td>
                    <td className="py-4 text-center"><Toggle on={g.mentor}       onChange={v => handleGateToggle(g.id, 'mentor', v)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[11px] text-gray-400 mt-4">Changes take effect immediately for new sessions. Existing sessions refresh on next login.</p>
          </div>
        )}

        {/* ── ACTIVITY LOG ── */}
        {section === 'Activity Log' && (
          <div className="card">
            <div className="space-y-0 divide-y divide-gray-50">
              {ACTIVITY.map((a, i) => (
                <div key={i} className="flex items-start gap-4 py-4">
                  <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${
                    a.type === 'success' ? 'bg-green-500' : a.type === 'cert' ? 'bg-purple-500' : a.type === 'request' ? 'bg-orange-500' : a.type === 'warn' ? 'bg-amber-500' : 'bg-blue-400'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">{a.action}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{a.user}</p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{a.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
