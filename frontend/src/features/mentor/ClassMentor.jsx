import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useMentorStudents, useUnlockFeature, useRevokeFeature } from '../../hooks'

const COURSES = [
  { id: 'da-job-sim',          type: 'simulation', title: 'Junior DA Job Simulation',   duration: '3–4 hrs', level: 'Beginner'     },
  { id: 'advanced-sys-design', type: 'course',     title: 'Advanced System Design',     duration: '8 hrs',   level: 'Advanced'     },
  { id: 'sql-masterclass',     type: 'course',     title: 'SQL Masterclass',            duration: '4 hrs',   level: 'Beginner'     },
  { id: 'python-for-data',     type: 'course',     title: 'Python for Data Analysis',   duration: '6 hrs',   level: 'Intermediate' },
  { id: 'ml-fundamentals',     type: 'course',     title: 'ML Fundamentals',            duration: '10 hrs',  level: 'Intermediate' },
]

const FEATURE_LABELS = {
  python_sandbox:   'Python Sandbox',
  model_solution:   'Model Solution',
  certificate:      'Certificate',
  all_courses:      'All Courses',
  download_dataset: 'Dataset Download',
}

const GRANTABLE_FEATURES = ['python_sandbox', 'model_solution', 'certificate', 'download_dataset']

const TABS = ['Overview', 'My Students', 'Assignments', 'Feature Access']

function Avatar({ name, sm }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className={`${sm ? 'w-6 h-6 text-[9px]' : 'w-8 h-8 text-xs'} rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0`}>
      {initials}
    </div>
  )
}

function ProgressBar({ pct, h = 'h-1.5' }) {
  const color = pct === 100 ? 'bg-green-500' : pct >= 60 ? 'bg-primary' : pct >= 20 ? 'bg-amber-400' : 'bg-rose-400'
  return (
    <div className={`w-full ${h} bg-surface-high rounded-full overflow-hidden`}>
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function ClassMentor() {
  const { user, logout }  = useAuth()
  const navigate          = useNavigate()

  const [tab,         setTab]         = useState('Overview')
  const [secFilter,   setSecFilter]   = useState('All')
  const [showForm,    setShowForm]    = useState(false)
  const [assignments, setAssignments] = useState([])
  const [newAsgn,     setNewAsgn]     = useState({ courseId: '', assignedTo: 'all', dueDate: '', note: '' })

  const { data: students = [], isLoading } = useMentorStudents()
  const { mutate: grantFeature, isPending: granting } = useUnlockFeature()
  const { mutate: revokeFeature } = useRevokeFeature()

  const overallProgress = (s) => s.tasks_done > 0 ? Math.round((s.tasks_done / 5) * 100) : 0
  const progressColor   = (pct) => pct === 100 ? 'bg-green-500' : pct >= 60 ? 'bg-primary' : pct >= 20 ? 'bg-amber-400' : 'bg-rose-400'
  const progressBg      = (pct) => pct === 100 ? 'bg-green-100' : pct >= 60 ? 'bg-primary/10' : pct >= 20 ? 'bg-amber-50' : 'bg-rose-50'

  const atRisk      = students.filter(s => !s.enrolled || s.tasks_done === 0)
  const activeToday = students.filter(s => s.last_active.includes('m ago') || s.last_active === '1h ago' || (s.last_active.includes('h ago') && parseInt(s.last_active) <= 5)).length
  const avgProg     = students.length ? Math.round(students.reduce((a, s) => a + overallProgress(s), 0) / students.length) : 0

  const sections        = [...new Set(students.map(s => s.section).filter(Boolean))]
  const filteredStudents = secFilter === 'All' ? students : students.filter(s => s.section === secFilter)

  const handleCreateAssignment = (e) => {
    e.preventDefault()
    const course = COURSES.find(c => c.id === newAsgn.courseId)
    if (!course) return
    setAssignments(prev => [{
      id: `a${Date.now()}`, courseId: newAsgn.courseId, title: course.title,
      assignedTo: newAsgn.assignedTo, dueDate: newAsgn.dueDate, createdAt: 'Just now',
    }, ...prev])
    setShowForm(false)
    setNewAsgn({ courseId: '', assignedTo: 'all', dueDate: '', note: '' })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-container mx-auto px-6 py-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-on-surface">Mentor Dashboard</h1>
            <span className="section-label bg-surface-low border border-border px-2.5 py-1 rounded-full">Class Mentor</span>
          </div>
          <p className="text-on-surface-variant text-sm">
            {user?.name} · {user?.institution} · {user?.department} · Section {user?.section}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {tab === 'Assignments' && (
            <button onClick={() => setShowForm(true)} className="btn-primary text-xs px-3 py-1.5">+ Assign Task</button>
          )}
          <button onClick={() => { logout(); navigate('/mentor/login') }} className="btn-secondary text-xs px-3 py-1.5">
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
            className={`px-4 py-2.5 text-sm font-medium -mb-px border-b-2 transition-colors ${
              tab === t ? 'border-primary text-primary font-semibold' : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════ OVERVIEW ═══════════════════════════════════ */}
      {tab === 'Overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total Students',    value: students.length,    color: 'text-primary'   },
              { label: 'Active Today',       value: activeToday,         color: 'text-green-600' },
              { label: 'Class Avg Progress', value: avgProg + '%',       color: 'text-amber-600' },
              { label: 'Needs Attention',    value: atRisk.length,
                color: atRisk.length > 0 ? 'text-rose-600' : 'text-on-surface',
                action: atRisk.length > 0 ? () => setTab('My Students') : null },
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

          <div className="grid grid-cols-3 gap-6">
            {/* Matrix / progress table */}
            <div className="col-span-2 card p-0 overflow-hidden">
              <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                <h3 className="font-bold text-sm text-on-surface">Student Progress</h3>
                <span className="text-xs text-on-surface-variant">{students.length} students</span>
              </div>
              {students.length === 0 ? (
                <div className="text-center py-10 text-sm text-on-surface-variant">No students in your class yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-surface-low">
                      <tr>
                        <th className="text-left px-4 py-2.5 font-semibold text-on-surface-variant">Student</th>
                        <th className="text-center px-3 py-2.5 font-semibold text-on-surface-variant">Tasks Done</th>
                        <th className="text-center px-3 py-2.5 font-semibold text-on-surface-variant">Progress</th>
                        <th className="text-center px-3 py-2.5 font-semibold text-on-surface-variant">Enrolled</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {students.map(s => {
                        const pct = overallProgress(s)
                        return (
                          <tr key={s.id} className="hover:bg-surface-low transition-colors">
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <Avatar name={s.name} sm />
                                <div>
                                  <p className="font-medium text-on-surface">{s.name.split(' ')[0]}</p>
                                  <p className="text-[10px] text-on-surface-variant">{s.roll_no} · {s.last_active}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-center font-semibold text-on-surface">{s.tasks_done}/5</td>
                            <td className="px-3 py-2.5">
                              <div className={`inline-flex flex-col items-center gap-1 px-2 py-1 rounded-lg w-full ${progressBg(pct)}`}>
                                <span className={`text-xs font-bold ${pct === 100 ? 'text-green-700' : pct >= 60 ? 'text-primary' : pct >= 20 ? 'text-amber-700' : 'text-rose-600'}`}>
                                  {pct === 100 ? '✓ Done' : pct + '%'}
                                </span>
                                <div className="w-16 h-1 bg-white/60 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${progressColor(pct)}`} style={{ width: `${pct}%` }} />
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <span className={`chip text-[10px] ${s.enrolled ? 'bg-green-100 text-green-700' : 'bg-surface-high text-on-surface-variant'}`}>
                                {s.enrolled ? 'Enrolled' : 'Not enrolled'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* At-risk sidebar */}
            <div className="space-y-4">
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
                            {!s.enrolled ? 'Not enrolled' : `${s.tasks_done}/5 tasks · ${s.last_active}`}
                          </p>
                        </div>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600">
                          {!s.enrolled ? 'Not enrolled' : 'At risk'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════ MY STUDENTS ════════════════════════════════════ */}
      {tab === 'My Students' && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            {['All', ...sections].map(s => (
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

          {filteredStudents.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-sm text-on-surface-variant">No students found.</p>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface-low border-b border-border">
                  <tr>
                    {['Student', 'Roll No', 'Sec', 'Last Active', 'Tasks', 'Progress', 'Unlocked', 'Status'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredStudents.map(s => {
                    const pct = overallProgress(s)
                    return (
                      <tr key={s.id} className="hover:bg-surface-low transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={s.name} />
                            <span className="font-medium text-on-surface">{s.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-on-surface-variant">{s.roll_no}</td>
                        <td className="px-4 py-3 text-xs text-on-surface-variant">{s.section}</td>
                        <td className="px-4 py-3 text-xs text-on-surface-variant whitespace-nowrap">{s.last_active}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-on-surface">{s.tasks_done}/5</td>
                        <td className="px-4 py-3 w-32">
                          <div className="flex items-center gap-1.5">
                            <ProgressBar pct={pct} h="h-1" />
                            <span className="text-xs text-on-surface-variant w-8 text-right shrink-0">
                              {pct === 100 ? '✓' : pct + '%'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {s.unlocked.length > 0 ? (
                            <div className="flex gap-1 flex-wrap">
                              {s.unlocked.map(f => (
                                <span key={f} className="text-[10px] bg-primary/8 text-primary font-semibold px-1.5 py-0.5 rounded-full">
                                  {FEATURE_LABELS[f] ?? f}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[11px] text-on-surface-variant">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`chip text-[10px] ${s.enrolled ? 'bg-green-50 text-green-700' : 'bg-surface-high text-on-surface-variant'}`}>
                            {s.enrolled ? 'enrolled' : 'not enrolled'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════ ASSIGNMENTS ════════════════════════════════════ */}
      {tab === 'Assignments' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-xs text-amber-800">
            Assignments are tracked locally in this session. Persistent assignment management is coming soon.
          </div>

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
                      {sections.map(s => <option key={s} value={s}>Section {s} only</option>)}
                      {students.map(s => <option key={s.id} value={s.roll_no}>{s.name} ({s.roll_no})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-on-surface block mb-1.5">Due Date</label>
                    <input type="date" value={newAsgn.dueDate} onChange={e => setNewAsgn(p => ({ ...p, dueDate: e.target.value }))} required className="input w-full" />
                  </div>
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
              return (
                <div key={a.id} className="card p-0 overflow-hidden hover:border-primary transition-colors">
                  <div className="flex items-center gap-4 p-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-xl shrink-0">
                      {course?.type === 'simulation' ? '🎮' : '📖'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-on-surface text-sm">{a.title}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {a.assignedTo === 'all' ? 'Entire Class' : a.assignedTo}
                        {a.dueDate && <> · Due <span className="font-medium">{a.dueDate}</span></>}
                        {' · '}Assigned {a.createdAt}
                      </p>
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

      {/* ════════════════════════════ FEATURE ACCESS ═════════════════════════════════════ */}
      {tab === 'Feature Access' && (
        <div className="space-y-3">
          <p className="text-xs text-on-surface-variant mb-2">Grant or revoke feature access for individual students. University students start with limited features by default.</p>
          {students.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-sm text-on-surface-variant">No students in your class yet.</p>
            </div>
          ) : (
            students.map(s => (
              <div key={s.id} className="card">
                <div className="flex items-start gap-4">
                  <Avatar name={s.name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-on-surface text-sm">{s.name}</span>
                      <span className="font-mono text-[11px] text-on-surface-variant">{s.roll_no}</span>
                      <span className="text-[10px] text-on-surface-variant">· {s.last_active}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {GRANTABLE_FEATURES.map(f => {
                        const has = s.unlocked.includes(f)
                        return (
                          <button
                            key={f}
                            disabled={granting}
                            onClick={() => {
                              if (has) {
                                revokeFeature({ studentId: s.id, feature: f })
                              } else {
                                grantFeature({ studentId: s.id, feature: f })
                              }
                            }}
                            className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                              has
                                ? 'bg-green-50 border-green-200 text-green-700 hover:bg-red-50 hover:border-red-200 hover:text-red-600'
                                : 'bg-surface-high border-border text-on-surface-variant hover:bg-primary/5 hover:border-primary hover:text-primary'
                            }`}
                          >
                            {has ? '✓ ' : '+ '}{FEATURE_LABELS[f]}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
