import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useNavigate } from 'react-router-dom'

// ── Data ─────────────────────────────────────────────────────────────────────
// taskProgress: { courseId → completion% }
const STUDENTS = [
  { id:'s1',  rollNo:'21CS001', name:'Rahul Sharma',   section:'A', dept:'CSE', year:'3rd', lastActive:'2h ago',   taskProgress:{'da-job-sim':40, 'sql-masterclass':0},   unlocked:[],                              status:'active'   },
  { id:'s2',  rollNo:'21CS002', name:'Priya Singh',    section:'A', dept:'CSE', year:'3rd', lastActive:'30m ago',  taskProgress:{'da-job-sim':100,'sql-masterclass':75},  unlocked:['python_sandbox'],              status:'active'   },
  { id:'s3',  rollNo:'21CS003', name:'Aman Verma',     section:'A', dept:'CSE', year:'3rd', lastActive:'1d ago',   taskProgress:{'da-job-sim':20, 'sql-masterclass':0},   unlocked:[],                              status:'active'   },
  { id:'s4',  rollNo:'21CS004', name:'Kavita Reddy',   section:'A', dept:'CSE', year:'3rd', lastActive:'5h ago',   taskProgress:{'da-job-sim':65, 'sql-masterclass':30},  unlocked:['python_sandbox'],              status:'active'   },
  { id:'s5',  rollNo:'21CS005', name:'Suresh Kumar',   section:'A', dept:'CSE', year:'3rd', lastActive:'5d ago',   taskProgress:{'da-job-sim':5,  'sql-masterclass':0},   unlocked:[],                              status:'inactive' },
  { id:'s6',  rollNo:'21CS006', name:'Meera Pillai',   section:'A', dept:'CSE', year:'3rd', lastActive:'1h ago',   taskProgress:{'da-job-sim':100,'sql-masterclass':100}, unlocked:['python_sandbox','model_solution'], status:'active' },
  { id:'s7',  rollNo:'21CS007', name:'Rohan Tiwari',   section:'B', dept:'CSE', year:'3rd', lastActive:'3h ago',   taskProgress:{'da-job-sim':10, 'sql-masterclass':15},  unlocked:[],                              status:'active'   },
  { id:'s8',  rollNo:'21CS008', name:'Shruti Jain',    section:'B', dept:'CSE', year:'3rd', lastActive:'1h ago',   taskProgress:{'da-job-sim':30, 'sql-masterclass':50},  unlocked:[],                              status:'active'   },
  { id:'s9',  rollNo:'21CS009', name:'Arjun Nair',     section:'B', dept:'CSE', year:'3rd', lastActive:'7d ago',   taskProgress:{'da-job-sim':0,  'sql-masterclass':0},   unlocked:[],                              status:'inactive' },
  { id:'s10', rollNo:'21CS010', name:'Divya Gupta',    section:'B', dept:'CSE', year:'3rd', lastActive:'4h ago',   taskProgress:{'da-job-sim':55, 'sql-masterclass':40},  unlocked:[],                              status:'active'   },
]

const COURSES = [
  { id:'da-job-sim',          type:'simulation', title:'Junior DA Job Simulation',    duration:'3–4 hrs', level:'Beginner'     },
  { id:'advanced-sys-design', type:'course',     title:'Advanced System Design',      duration:'8 hrs',   level:'Advanced'     },
  { id:'sql-masterclass',     type:'course',     title:'SQL Masterclass',             duration:'4 hrs',   level:'Beginner'     },
  { id:'python-for-data',     type:'course',     title:'Python for Data Analysis',    duration:'6 hrs',   level:'Intermediate' },
  { id:'ml-fundamentals',     type:'course',     title:'ML Fundamentals',             duration:'10 hrs',  level:'Intermediate' },
]

const ASSIGNMENTS_INIT = [
  { id:'a1', courseId:'da-job-sim',      title:'Junior DA Job Simulation', assignedTo:'all',       dueDate:'2025-08-15', createdAt:'Jul 1' },
  { id:'a2', courseId:'sql-masterclass', title:'SQL Masterclass',          assignedTo:'section-B', dueDate:'2025-08-30', createdAt:'Jul 15' },
]

const UNLOCK_REQUESTS_INIT = [
  { id:'r1', studentId:'s3', studentName:'Aman Verma',   rollNo:'21CS003', feature:'python_sandbox', context:'Task 2 — Sales Report',       requestedAt:'30m ago', status:'pending'  },
  { id:'r2', studentId:'s7', studentName:'Rohan Tiwari', rollNo:'21CS007', feature:'model_solution', context:'Task 1 — Clean the Data',      requestedAt:'2h ago',  status:'pending'  },
  { id:'r3', studentId:'s8', studentName:'Shruti Jain',  rollNo:'21CS008', feature:'python_sandbox', context:'Task 2 — Sales Report',       requestedAt:'4h ago',  status:'pending'  },
  { id:'r4', studentId:'s5', studentName:'Suresh Kumar', rollNo:'21CS005', feature:'python_sandbox', context:'Onboarding — getting started', requestedAt:'1d ago',  status:'approved' },
]

const FEATURE_LABELS = {
  python_sandbox:   'Python Sandbox',
  model_solution:   'Model Solution',
  certificate:      'Certificate',
  all_courses:      'All Courses',
  download_dataset: 'Dataset Download',
}

const TABS = ['Overview', 'My Students', 'Assignments', 'Unlock Requests']

// ── Helpers ───────────────────────────────────────────────────────────────────
const overallProgress = (s) => {
  const vals = Object.values(s.taskProgress)
  if (!vals.length) return 0
  return Math.round(vals.reduce((a, v) => a + v, 0) / vals.length)
}

const progressColor = (pct) => {
  if (pct === 100) return 'bg-green-500'
  if (pct >= 60)   return 'bg-primary'
  if (pct >= 20)   return 'bg-amber-400'
  return 'bg-rose-400'
}

const progressBg = (pct) => {
  if (pct === 100) return 'bg-green-100'
  if (pct >= 60)   return 'bg-primary/10'
  if (pct >= 20)   return 'bg-amber-50'
  return 'bg-rose-50'
}

function Avatar({ name, sm }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className={`${sm ? 'w-6 h-6 text-[9px]' : 'w-8 h-8 text-xs'} rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0`}>
      {initials}
    </div>
  )
}

function ProgressBar({ pct, h = 'h-1.5' }) {
  return (
    <div className={`w-full ${h} bg-surface-high rounded-full overflow-hidden`}>
      <div className={`h-full rounded-full transition-all ${progressColor(pct)}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ClassMentor() {
  const { user, logout }   = useAuth()
  const navigate           = useNavigate()

  const [tab,         setTab]         = useState('Overview')
  const [requests,    setRequests]    = useState(UNLOCK_REQUESTS_INIT)
  const [assignments, setAssignments] = useState(ASSIGNMENTS_INIT)
  const [secFilter,   setSecFilter]   = useState('All')
  const [showForm,    setShowForm]    = useState(false)
  const [newAsgn,     setNewAsgn]     = useState({ courseId:'', assignedTo:'all', dueDate:'', note:'' })

  const pendingCount = requests.filter(r => r.status === 'pending').length
  const atRisk       = STUDENTS.filter(s => s.status === 'inactive' || overallProgress(s) < 15)
  const activeToday  = STUDENTS.filter(s => s.lastActive.includes('m ago') || s.lastActive === '1h ago' || s.lastActive.includes('h ago') && parseInt(s.lastActive) <= 5).length
  const avgProg      = Math.round(STUDENTS.reduce((a, s) => a + overallProgress(s), 0) / STUDENTS.length)

  const filteredStudents = secFilter === 'All' ? STUDENTS : STUDENTS.filter(s => s.section === secFilter)

  const handleCreateAssignment = (e) => {
    e.preventDefault()
    const course = COURSES.find(c => c.id === newAsgn.courseId)
    if (!course) return
    setAssignments(prev => [{
      id: `a${Date.now()}`, courseId: newAsgn.courseId, title: course.title,
      assignedTo: newAsgn.assignedTo, dueDate: newAsgn.dueDate, createdAt: 'Just now',
    }, ...prev])
    setShowForm(false)
    setNewAsgn({ courseId:'', assignedTo:'all', dueDate:'', note:'' })
  }

  const handleRequest = (id, approved) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: approved ? 'approved' : 'denied' } : r))
  }

  // Completion rate per assignment across eligible students
  const assignmentStats = (a) => {
    const eligible = a.assignedTo === 'all' ? STUDENTS
      : a.assignedTo === 'section-A' ? STUDENTS.filter(s => s.section === 'A')
      : a.assignedTo === 'section-B' ? STUDENTS.filter(s => s.section === 'B')
      : STUDENTS.filter(s => s.rollNo === a.assignedTo)
    const done = eligible.filter(s => (s.taskProgress[a.courseId] || 0) === 100).length
    const avg  = eligible.length ? Math.round(eligible.reduce((acc, s) => acc + (s.taskProgress[a.courseId] || 0), 0) / eligible.length) : 0
    return { total: eligible.length, done, avg }
  }

  return (
    <div className="max-w-container mx-auto px-6 py-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-on-surface">Mentor Dashboard</h1>
            <span className="section-label bg-surface-low border border-border px-2.5 py-1 rounded-full">
              Class Mentor
            </span>
          </div>
          <p className="text-on-surface-variant text-sm">
            {user?.name} · {user?.institution} · {user?.department} · Section {user?.section}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {tab === 'Assignments' && (
            <button onClick={() => setShowForm(true)} className="btn-primary text-xs px-3 py-1.5">+ Assign Task</button>
          )}
          <button
            onClick={() => { logout(); navigate('/mentor/login') }}
            className="btn-secondary text-xs px-3 py-1.5"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-border mb-7">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium -mb-px border-b-2 transition-colors relative ${
              tab === t ? 'border-primary text-primary font-semibold' : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {t}
            {t === 'Unlock Requests' && pendingCount > 0 && (
              <span className="ml-1.5 bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full align-middle">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════ OVERVIEW ═══════════════════════════════════ */}
      {tab === 'Overview' && (
        <div className="space-y-6">

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total Students',   value: STUDENTS.length,     color: 'text-primary'    },
              { label: 'Active Today',      value: activeToday,          color: 'text-green-600'  },
              { label: 'Class Avg Progress',value: avgProg + '%',        color: 'text-amber-600'  },
              { label: 'Pending Unlocks',   value: pendingCount,
                color: pendingCount > 0 ? 'text-rose-600' : 'text-on-surface',
                action: pendingCount > 0 ? () => setTab('Unlock Requests') : null },
            ].map(s => (
              <div
                key={s.label}
                className={`card p-4 text-center ${s.action ? 'cursor-pointer hover:border-primary transition-colors' : ''}`}
                onClick={s.action}
              >
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">{s.label}</p>
                {s.action && <p className="text-[10px] text-primary mt-1">Review →</p>}
              </div>
            ))}
          </div>

          {/* Task Completion Matrix + At Risk */}
          <div className="grid grid-cols-3 gap-6">

            {/* Matrix */}
            <div className="col-span-2 card p-0 overflow-hidden">
              <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                <h3 className="font-bold text-sm text-on-surface">Task Completion Matrix</h3>
                <span className="text-xs text-on-surface-variant">{assignments.length} active assignments</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-surface-low">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-semibold text-on-surface-variant min-w-36">Student</th>
                      {assignments.map(a => (
                        <th key={a.id} className="text-center px-3 py-2.5 font-semibold text-on-surface-variant min-w-28">
                          <p className="truncate max-w-28">{a.title.split(' ').slice(0, 3).join(' ')}</p>
                          <p className="text-[10px] font-normal text-on-surface-variant/70 mt-0.5">Due {a.dueDate.slice(5)}</p>
                        </th>
                      ))}
                      <th className="text-center px-3 py-2.5 font-semibold text-on-surface-variant min-w-20">Overall</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {STUDENTS.map(s => {
                      const overall = overallProgress(s)
                      return (
                        <tr key={s.id} className="hover:bg-surface-low transition-colors">
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <Avatar name={s.name} sm />
                              <div>
                                <p className="font-medium text-on-surface">{s.name.split(' ')[0]}</p>
                                <p className="text-[10px] text-on-surface-variant">{s.rollNo} · {s.lastActive}</p>
                              </div>
                            </div>
                          </td>
                          {assignments.map(a => {
                            const pct = s.taskProgress[a.courseId] ?? null
                            return (
                              <td key={a.id} className="px-3 py-2.5 text-center">
                                {pct === null ? (
                                  <span className="text-[10px] text-on-surface-variant/40">—</span>
                                ) : (
                                  <div className={`inline-flex flex-col items-center gap-1 px-2 py-1 rounded-lg ${progressBg(pct)}`}>
                                    <span className={`text-xs font-bold ${pct === 100 ? 'text-green-700' : pct >= 60 ? 'text-primary' : pct >= 20 ? 'text-amber-700' : 'text-rose-600'}`}>
                                      {pct === 100 ? '✓' : pct + '%'}
                                    </span>
                                    <div className="w-16 h-1 bg-white/60 rounded-full overflow-hidden">
                                      <div className={`h-full rounded-full ${progressColor(pct)}`} style={{ width: `${pct}%` }} />
                                    </div>
                                  </div>
                                )}
                              </td>
                            )
                          })}
                          <td className="px-3 py-2.5 text-center">
                            <span className={`text-xs font-bold ${overall === 100 ? 'text-green-600' : overall >= 50 ? 'text-primary' : 'text-on-surface-variant'}`}>
                              {overall}%
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  {/* Footer: per-assignment avg */}
                  <tfoot className="bg-surface-low border-t border-border">
                    <tr>
                      <td className="px-4 py-2.5 text-xs font-semibold text-on-surface-variant">Class avg</td>
                      {assignments.map(a => {
                        const { avg } = assignmentStats(a)
                        return (
                          <td key={a.id} className="px-3 py-2.5 text-center">
                            <span className="text-xs font-bold text-on-surface">{avg}%</span>
                          </td>
                        )
                      })}
                      <td className="px-3 py-2.5 text-center">
                        <span className="text-xs font-bold text-primary">{avgProg}%</span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* At-risk + pending requests sidebar */}
            <div className="space-y-4">
              {/* At-risk students */}
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm text-on-surface">Needs Attention</h3>
                  <span className="text-xs bg-rose-50 text-rose-600 font-semibold px-2 py-0.5 rounded-full border border-rose-200">{atRisk.length} students</span>
                </div>
                {atRisk.length === 0 ? (
                  <p className="text-xs text-on-surface-variant">All students on track.</p>
                ) : (
                  <div className="space-y-2.5">
                    {atRisk.map(s => (
                      <div key={s.id} className="flex items-center gap-2.5">
                        <Avatar name={s.name} sm />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-on-surface truncate">{s.name}</p>
                          <p className="text-[10px] text-on-surface-variant">
                            {s.status === 'inactive' ? `Inactive · ${s.lastActive}` : `${overallProgress(s)}% done`}
                          </p>
                        </div>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                          s.status === 'inactive' ? 'bg-surface-high text-on-surface-variant' : 'bg-rose-50 text-rose-600'
                        }`}>
                          {s.status === 'inactive' ? 'Inactive' : 'At risk'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pending unlock requests */}
              {pendingCount > 0 && (
                <div className="card border-amber-200 bg-amber-50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-sm text-amber-900">Unlock Requests</h3>
                    <span className="text-xs bg-amber-200 text-amber-800 font-bold px-2 py-0.5 rounded-full">{pendingCount} pending</span>
                  </div>
                  <div className="space-y-2 mb-3">
                    {requests.filter(r => r.status === 'pending').slice(0, 3).map(r => (
                      <div key={r.id} className="flex items-center gap-2">
                        <Avatar name={r.studentName} sm />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium text-amber-900 truncate">{r.studentName}</p>
                          <p className="text-[10px] text-amber-700">{FEATURE_LABELS[r.feature]} · {r.requestedAt}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setTab('Unlock Requests')} className="w-full text-xs font-semibold text-amber-800 hover:text-amber-900 text-center">
                    Review all →
                  </button>
                </div>
              )}

              {/* Assignment completion summary */}
              <div className="card">
                <h3 className="font-bold text-sm text-on-surface mb-3">Assignment Progress</h3>
                <div className="space-y-3">
                  {assignments.map(a => {
                    const { total, done, avg } = assignmentStats(a)
                    return (
                      <div key={a.id}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-on-surface font-medium truncate mr-2">{a.title.split(' ').slice(0, 3).join(' ')}</span>
                          <span className="text-on-surface-variant shrink-0">{done}/{total} done</span>
                        </div>
                        <ProgressBar pct={avg} />
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════ MY STUDENTS ════════════════════════════════════ */}
      {tab === 'My Students' && (
        <div>
          {/* Filters */}
          <div className="flex items-center gap-2 mb-4">
            {['All', 'A', 'B'].map(s => (
              <button
                key={s}
                onClick={() => setSecFilter(s)}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${secFilter === s ? 'bg-primary text-white' : 'btn-secondary'}`}
              >
                {s === 'All' ? 'All Sections' : `Section ${s}`}
              </button>
            ))}
            <span className="ml-2 text-xs text-on-surface-variant">{filteredStudents.length} students</span>
          </div>

          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-low border-b border-border">
                <tr>
                  {['Student', 'Roll No', 'Sec', 'Last Active', ...assignments.map(a => a.title.split(' ').slice(0,3).join(' ')), 'Overall', 'Unlocked', 'Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredStudents.map(s => {
                  const overall = overallProgress(s)
                  return (
                    <tr key={s.id} className="hover:bg-surface-low transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={s.name} />
                          <span className="font-medium text-on-surface">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-on-surface-variant">{s.rollNo}</td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant">{s.section}</td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant whitespace-nowrap">{s.lastActive}</td>
                      {assignments.map(a => {
                        const pct = s.taskProgress[a.courseId] ?? null
                        return (
                          <td key={a.id} className="px-4 py-3 w-32">
                            {pct === null ? <span className="text-on-surface-variant/30 text-xs">—</span> : (
                              <div className="flex items-center gap-1.5">
                                <ProgressBar pct={pct} h="h-1" />
                                <span className="text-xs text-on-surface-variant w-8 text-right shrink-0">
                                  {pct === 100 ? '✓' : pct + '%'}
                                </span>
                              </div>
                            )}
                          </td>
                        )
                      })}
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold ${overall === 100 ? 'text-green-600' : overall >= 50 ? 'text-primary' : 'text-on-surface-variant'}`}>
                          {overall}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {s.unlocked.length > 0
                          ? <div className="flex gap-1 flex-wrap">
                              {s.unlocked.map(f => (
                                <span key={f} className="text-[10px] bg-primary/8 text-primary font-semibold px-1.5 py-0.5 rounded-full">{FEATURE_LABELS[f]}</span>
                              ))}
                            </div>
                          : <span className="text-[11px] text-on-surface-variant">—</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <span className={`chip text-[10px] ${s.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-surface-high text-on-surface-variant'}`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════════════════════════════ ASSIGNMENTS ════════════════════════════════════ */}
      {tab === 'Assignments' && (
        <div className="space-y-4">
          {showForm && (
            <div className="card border-primary/30 bg-primary/3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-on-surface">New Assignment</h3>
                <button onClick={() => setShowForm(false)} className="text-xl text-on-surface-variant hover:text-on-surface leading-none">×</button>
              </div>
              <form onSubmit={handleCreateAssignment} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-on-surface block mb-1.5">Course / Simulation</label>
                  <select
                    value={newAsgn.courseId}
                    onChange={e => setNewAsgn(p => ({ ...p, courseId: e.target.value }))}
                    required className="input w-full"
                  >
                    <option value="">Select…</option>
                    {COURSES.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.type === 'simulation' ? '🎮' : '📖'} {c.title} ({c.level} · {c.duration})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-on-surface block mb-1.5">Assign To</label>
                    <select
                      value={newAsgn.assignedTo}
                      onChange={e => setNewAsgn(p => ({ ...p, assignedTo: e.target.value }))}
                      className="input w-full"
                    >
                      <option value="all">Entire Class</option>
                      <option value="section-A">Section A only</option>
                      <option value="section-B">Section B only</option>
                      {STUDENTS.map(s => <option key={s.id} value={s.rollNo}>{s.name} ({s.rollNo})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-on-surface block mb-1.5">Due Date</label>
                    <input type="date" value={newAsgn.dueDate} onChange={e => setNewAsgn(p => ({ ...p, dueDate: e.target.value }))} required className="input w-full" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface block mb-1.5">Note to Students (optional)</label>
                  <textarea value={newAsgn.note} onChange={e => setNewAsgn(p => ({ ...p, note: e.target.value }))} placeholder="Focus on the EDA section…" rows={2} className="input w-full resize-none text-xs" />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary text-xs px-4 py-2">Assign</button>
                  <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-xs px-4 py-2">Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-3">
            {assignments.map(a => {
              const course = COURSES.find(c => c.id === a.courseId)
              const { total, done, avg } = assignmentStats(a)
              return (
                <div key={a.id} className="card p-0 overflow-hidden hover:border-primary transition-colors">
                  <div className="flex items-center gap-4 p-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-xl shrink-0">
                      {course?.type === 'simulation' ? '🎮' : '📖'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-on-surface text-sm">{a.title}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {a.assignedTo === 'all' ? 'Entire Class' : a.assignedTo === 'section-A' ? 'Section A' : a.assignedTo === 'section-B' ? 'Section B' : a.assignedTo}
                        {a.dueDate && <> · Due <span className="font-medium">{a.dueDate}</span></>}
                        {' · '}Assigned {a.createdAt}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <ProgressBar pct={avg} />
                        <span className="text-xs text-on-surface-variant shrink-0">{avg}% avg</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-lg font-bold text-on-surface">{done}<span className="text-sm text-on-surface-variant font-normal">/{total}</span></p>
                      <p className="text-[10px] text-on-surface-variant">completed</p>
                    </div>
                    <button
                      onClick={() => setAssignments(prev => prev.filter(x => x.id !== a.id))}
                      className="text-xs text-rose-500 hover:underline shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )
            })}
            {assignments.length === 0 && (
              <div className="card text-center py-10">
                <p className="text-sm text-on-surface-variant">No assignments yet. Click <strong>+ Assign Task</strong> to create one.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════ UNLOCK REQUESTS ═════════════════════════════════ */}
      {tab === 'Unlock Requests' && (
        <div className="space-y-3">
          {pendingCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-xs text-amber-800 font-medium">
              {pendingCount} request{pendingCount > 1 ? 's' : ''} need your review.
            </div>
          )}
          {requests.map(r => (
            <div key={r.id} className="card">
              <div className="flex items-start gap-4">
                <Avatar name={r.studentName} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-on-surface text-sm">{r.studentName}</span>
                    <span className="font-mono text-[11px] text-on-surface-variant">{r.rollNo}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant mb-1">
                    Requesting <span className="font-semibold text-on-surface">{FEATURE_LABELS[r.feature] || r.feature}</span>
                    {' — '}<span className="italic">{r.context}</span>
                  </p>
                  <p className="text-[11px] text-on-surface-variant">{r.requestedAt}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {r.status === 'pending' ? (
                    <>
                      <button onClick={() => handleRequest(r.id, true)}  className="btn-primary text-xs px-3 py-1.5">✓ Approve</button>
                      <button onClick={() => handleRequest(r.id, false)} className="btn-secondary text-xs px-3 py-1.5 text-rose-600 border-rose-200 hover:border-rose-400">✗ Deny</button>
                    </>
                  ) : (
                    <span className={`chip text-xs ${r.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-600'}`}>
                      {r.status === 'approved' ? '✓ Approved' : '✗ Denied'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
