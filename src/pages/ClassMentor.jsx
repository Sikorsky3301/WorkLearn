import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

// ── Mock data ────────────────────────────────────────────────────────────────
const STUDENTS = [
  { id: 's1',  rollNo: '21CS001', name: 'Rahul Sharma',    section: 'A', year: '3rd', assignedTasks: 2, completed: 1, progress: 40,  unlocked: [],                              status: 'active'   },
  { id: 's2',  rollNo: '21CS002', name: 'Priya Singh',     section: 'A', year: '3rd', assignedTasks: 1, completed: 1, progress: 100, unlocked: ['python_sandbox'],              status: 'active'   },
  { id: 's3',  rollNo: '21CS003', name: 'Aman Verma',      section: 'A', year: '3rd', assignedTasks: 2, completed: 0, progress: 20,  unlocked: [],                              status: 'active'   },
  { id: 's4',  rollNo: '21CS004', name: 'Kavita Reddy',    section: 'A', year: '3rd', assignedTasks: 2, completed: 1, progress: 65,  unlocked: ['python_sandbox'],              status: 'active'   },
  { id: 's5',  rollNo: '21CS005', name: 'Suresh Kumar',    section: 'A', year: '3rd', assignedTasks: 2, completed: 0, progress: 5,   unlocked: [],                              status: 'inactive' },
  { id: 's6',  rollNo: '21CS006', name: 'Meera Pillai',    section: 'A', year: '3rd', assignedTasks: 1, completed: 1, progress: 100, unlocked: ['python_sandbox','model_solution'], status: 'active' },
  { id: 's7',  rollNo: '21CS007', name: 'Rohan Tiwari',    section: 'B', year: '3rd', assignedTasks: 2, completed: 0, progress: 10,  unlocked: [],                              status: 'active'   },
  { id: 's8',  rollNo: '21CS008', name: 'Shruti Jain',     section: 'B', year: '3rd', assignedTasks: 2, completed: 0, progress: 30,  unlocked: [],                              status: 'active'   },
  { id: 's9',  rollNo: '21CS009', name: 'Arjun Nair',      section: 'B', year: '3rd', assignedTasks: 1, completed: 0, progress: 0,   unlocked: [],                              status: 'inactive' },
  { id: 's10', rollNo: '21CS010', name: 'Divya Gupta',     section: 'B', year: '3rd', assignedTasks: 2, completed: 1, progress: 55,  unlocked: [],                              status: 'active'   },
]

const COURSES = [
  { id: 'da-job-sim',          type: 'simulation', title: 'Junior DA Job Simulation',    duration: '3–4 hrs', level: 'Beginner'     },
  { id: 'advanced-sys-design', type: 'course',     title: 'Advanced System Design',      duration: '8 hrs',   level: 'Advanced'     },
  { id: 'sql-masterclass',     type: 'course',     title: 'SQL Masterclass',             duration: '4 hrs',   level: 'Beginner'     },
  { id: 'python-for-data',     type: 'course',     title: 'Python for Data Analysis',    duration: '6 hrs',   level: 'Intermediate' },
  { id: 'ml-fundamentals',     type: 'course',     title: 'ML Fundamentals',             duration: '10 hrs',  level: 'Intermediate' },
]

const UNLOCK_REQUESTS_INIT = [
  { id: 'r1', studentId: 's3', studentName: 'Aman Verma',   rollNo: '21CS003', feature: 'python_sandbox', context: 'Task 2 — Sales Report',       requestedAt: '30m ago', status: 'pending'  },
  { id: 'r2', studentId: 's7', studentName: 'Rohan Tiwari', rollNo: '21CS007', feature: 'model_solution', context: 'Task 1 — Clean the Data',      requestedAt: '2h ago',  status: 'pending'  },
  { id: 'r3', studentId: 's8', studentName: 'Shruti Jain',  rollNo: '21CS008', feature: 'python_sandbox', context: 'Task 2 — Sales Report',       requestedAt: '4h ago',  status: 'pending'  },
  { id: 'r4', studentId: 's5', studentName: 'Suresh Kumar', rollNo: '21CS005', feature: 'python_sandbox', context: 'Onboarding — getting started', requestedAt: '1d ago',  status: 'approved' },
]

const FEATURE_LABELS = {
  python_sandbox:   'Python Sandbox',
  model_solution:   'Model Solution',
  certificate:      'Certificate',
  all_courses:      'All Courses',
  download_dataset: 'Dataset Download',
}

const TABS = ['My Class', 'Assignments', 'Unlock Requests', 'Reports']

function StudentAvatar({ name, small }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const sz = small ? 'w-6 h-6 text-[9px]' : 'w-8 h-8 text-xs'
  return (
    <div className={`${sz} rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0`}>
      {initials}
    </div>
  )
}

export default function ClassMentor() {
  const { user } = useAuth()
  const navigate  = useNavigate()

  const [tab,         setTab]         = useState('My Class')
  const [requests,    setRequests]    = useState(UNLOCK_REQUESTS_INIT)
  const [secFilter,   setSecFilter]   = useState('All')
  const [assignments, setAssignments] = useState([
    { id: 'a1', courseId: 'da-job-sim',          title: 'Junior DA Job Simulation', assignedTo: 'section-A', dueDate: '2025-08-15', submissions: 6  },
    { id: 'a2', courseId: 'sql-masterclass',      title: 'SQL Masterclass',          assignedTo: 'section-B', dueDate: '2025-08-30', submissions: 3  },
  ])
  const [showForm,  setShowForm]  = useState(false)
  const [newAsgn,   setNewAsgn]   = useState({ courseId: '', assignedTo: 'class', dueDate: '', note: '' })

  const pendingCount    = requests.filter(r => r.status === 'pending').length
  const filteredStudents = secFilter === 'All' ? STUDENTS : STUDENTS.filter(s => s.section === secFilter)

  const handleCreateAssignment = (e) => {
    e.preventDefault()
    const course = COURSES.find(c => c.id === newAsgn.courseId)
    if (!course) return
    setAssignments(prev => [{
      id: `a${Date.now()}`, courseId: newAsgn.courseId, title: course.title,
      assignedTo: newAsgn.assignedTo, dueDate: newAsgn.dueDate, submissions: 0,
    }, ...prev])
    setShowForm(false)
    setNewAsgn({ courseId: '', assignedTo: 'class', dueDate: '', note: '' })
  }

  const handleRequest = (id, approved) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: approved ? 'approved' : 'denied' } : r))
  }

  return (
    <div className="max-w-container mx-auto px-6 py-8">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-on-surface">My Class</h1>
            <span className="section-label bg-surface-low border border-border px-2.5 py-1 rounded-full">
              Class Mentor
            </span>
          </div>
          <p className="text-on-surface-variant text-sm">
            {user?.institution} · {user?.department} · Section {user?.section} · {STUDENTS.length} students
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/dashboard')} className="btn-secondary text-xs px-3 py-1.5">Dashboard</button>
          {tab === 'Assignments' && (
            <button onClick={() => setShowForm(true)} className="btn-primary text-xs px-3 py-1.5">+ Assign Task</button>
          )}
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-4 gap-4 mb-7">
        {[
          { label: 'Total Students',   value: STUDENTS.length,                                                                           color: 'text-primary'    },
          { label: 'Active',           value: STUDENTS.filter(s => s.status === 'active').length,                                         color: 'text-green-600'  },
          { label: 'Avg Progress',     value: Math.round(STUDENTS.reduce((a, s) => a + s.progress, 0) / STUDENTS.length) + '%',           color: 'text-amber-600'  },
          { label: 'Pending Requests', value: pendingCount,                                                                               color: pendingCount > 0 ? 'text-rose-600' : 'text-on-surface' },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-on-surface-variant mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-0 border-b border-border mb-6">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative px-4 py-2.5 text-sm font-medium transition-colors -mb-px border-b-2 ${
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

      {/* ── MY CLASS ── */}
      {tab === 'My Class' && (
        <div>
          {/* Section filter */}
          <div className="flex gap-2 mb-4">
            {['All', 'A', 'B'].map(s => (
              <button
                key={s}
                onClick={() => setSecFilter(s)}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${secFilter === s ? 'bg-primary text-white' : 'btn-secondary'}`}
              >
                {s === 'All' ? 'All Sections' : `Section ${s}`}
              </button>
            ))}
          </div>

          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-low border-b border-border">
                <tr>
                  {['Student', 'Roll No', 'Sec', 'Progress', 'Tasks', 'Unlocked Features', 'Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredStudents.map(s => (
                  <tr key={s.id} className="hover:bg-surface-low transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <StudentAvatar name={s.name} />
                        <span className="font-medium text-on-surface text-sm">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-on-surface-variant">{s.rollNo}</td>
                    <td className="px-4 py-3 text-xs text-on-surface-variant">{s.section}</td>
                    <td className="px-4 py-3 w-36">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-surface-high rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${s.progress === 100 ? 'bg-green-500' : 'bg-primary'}`}
                            style={{ width: `${s.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-on-surface-variant w-8 text-right">{s.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-on-surface-variant">{s.completed}/{s.assignedTasks}</td>
                    <td className="px-4 py-3">
                      {s.unlocked.length > 0
                        ? <div className="flex gap-1 flex-wrap">
                            {s.unlocked.map(f => (
                              <span key={f} className="text-[10px] bg-primary/8 text-primary font-semibold px-2 py-0.5 rounded-full">{FEATURE_LABELS[f]}</span>
                            ))}
                          </div>
                        : <span className="text-[11px] text-on-surface-variant">None</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <span className={`chip text-[10px] ${s.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-surface-high text-on-surface-variant'}`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ASSIGNMENTS ── */}
      {tab === 'Assignments' && (
        <div className="space-y-4">
          {/* Create form */}
          {showForm && (
            <div className="card border-primary/30 bg-primary/3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-on-surface">New Assignment</h3>
                <button onClick={() => setShowForm(false)} className="text-on-surface-variant hover:text-on-surface text-lg leading-none">×</button>
              </div>
              <form onSubmit={handleCreateAssignment} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-on-surface block mb-1.5">Course / Simulation</label>
                  <select
                    value={newAsgn.courseId}
                    onChange={e => setNewAsgn(p => ({ ...p, courseId: e.target.value }))}
                    required className="input w-full"
                  >
                    <option value="">Select course or simulation…</option>
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
                      <option value="class">Entire Class</option>
                      <option value="section-A">Section A only</option>
                      <option value="section-B">Section B only</option>
                      {STUDENTS.map(s => <option key={s.id} value={s.rollNo}>{s.name} ({s.rollNo})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-on-surface block mb-1.5">Due Date</label>
                    <input
                      type="date"
                      value={newAsgn.dueDate}
                      onChange={e => setNewAsgn(p => ({ ...p, dueDate: e.target.value }))}
                      required className="input w-full"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface block mb-1.5">Note to Students (optional)</label>
                  <textarea
                    value={newAsgn.note}
                    onChange={e => setNewAsgn(p => ({ ...p, note: e.target.value }))}
                    placeholder="Focus on the EDA and data quality sections…"
                    rows={2} className="input w-full resize-none text-xs"
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary text-xs px-4 py-2">Assign</button>
                  <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-xs px-4 py-2">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Assignment list */}
          <div className="space-y-3">
            {assignments.map(a => {
              const course = COURSES.find(c => c.id === a.courseId)
              return (
                <div key={a.id} className="card p-0 overflow-hidden hover:border-primary transition-colors">
                  <div className="flex items-center gap-4 p-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-xl shrink-0">
                      {course?.type === 'simulation' ? '🎮' : '📖'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-on-surface text-sm">{a.title}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        Assigned to: <span className="font-medium">
                          {a.assignedTo === 'class' ? 'Entire Class' : a.assignedTo === 'section-A' ? 'Section A' : a.assignedTo === 'section-B' ? 'Section B' : a.assignedTo}
                        </span>
                        {a.dueDate && <> · Due: <span className="font-medium">{a.dueDate}</span></>}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-on-surface">{a.submissions}</p>
                      <p className="text-[10px] text-on-surface-variant">submitted</p>
                    </div>
                    <button className="text-xs text-rose-500 hover:underline shrink-0">Remove</button>
                  </div>
                </div>
              )
            })}
            {assignments.length === 0 && (
              <div className="card text-center py-10">
                <p className="text-on-surface-variant text-sm">No assignments yet. Click "+ Assign Task" to create one.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── UNLOCK REQUESTS ── */}
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
                <StudentAvatar name={r.studentName} />
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

      {/* ── REPORTS ── */}
      {tab === 'Reports' && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 card">
            <h3 className="font-bold text-sm text-on-surface mb-4">Progress by Student</h3>
            <div className="space-y-3">
              {[...STUDENTS].sort((a, b) => b.progress - a.progress).map(s => (
                <div key={s.id} className="flex items-center gap-3">
                  <StudentAvatar name={s.name} small />
                  <span className="text-xs text-on-surface w-32 truncate">{s.name}</span>
                  <div className="flex-1 h-2 bg-surface-high rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${s.progress === 100 ? 'bg-green-500' : s.progress >= 50 ? 'bg-primary' : 'bg-amber-400'}`}
                      style={{ width: `${s.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-on-surface-variant w-8 text-right">{s.progress}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="card p-4">
              <p className="text-2xl font-bold text-primary">{Math.round(STUDENTS.reduce((a, s) => a + s.progress, 0) / STUDENTS.length)}%</p>
              <p className="text-xs text-on-surface-variant mt-0.5">Class average progress</p>
            </div>
            <div className="card p-4">
              <p className="text-2xl font-bold text-green-600">{STUDENTS.reduce((a, s) => a + s.completed, 0)}</p>
              <p className="text-xs text-on-surface-variant mt-0.5">Tasks completed</p>
            </div>
            <div className="card p-4">
              <p className="text-2xl font-bold text-amber-600">{STUDENTS.filter(s => s.status === 'inactive').length}</p>
              <p className="text-xs text-on-surface-variant mt-0.5">Inactive students</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
