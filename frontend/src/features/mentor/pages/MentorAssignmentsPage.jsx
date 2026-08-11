import { useState } from 'react'
import { useMentorStudents } from '../../../hooks'
import { COURSES } from '../shared/mentorUtils'

export default function MentorAssignmentsPage() {
  const { data: students = [] } = useMentorStudents()
  const [showForm, setShowForm] = useState(false)
  const [assignments, setAssignments] = useState([])
  const [newAsgn, setNewAsgn] = useState({ courseId: '', assignedTo: 'all', dueDate: '', note: '' })

  const sections = [...new Set(students.map((s) => s.section).filter(Boolean))]

  const handleCreate = (e) => {
    e.preventDefault()
    const course = COURSES.find((c) => c.id === newAsgn.courseId)
    if (!course) return
    setAssignments((prev) => [{
      id: `a${Date.now()}`,
      courseId: newAsgn.courseId,
      title: course.title,
      assignedTo: newAsgn.assignedTo,
      dueDate: newAsgn.dueDate,
      createdAt: 'Just now',
    }, ...prev])
    setShowForm(false)
    setNewAsgn({ courseId: '', assignedTo: 'all', dueDate: '', note: '' })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Assignments</h3>
          <p className="text-xs text-slate-500 mt-0.5">Session-local only until persistent assignment APIs ship.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="btn-primary text-xs px-3 py-2"
        >
          + Assign task
        </button>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2.5 text-xs text-amber-800 dark:text-amber-200">
        Assignments are tracked locally in this session. Persistent assignment management is coming soon.
      </div>

      {showForm && (
        <div className="border border-primary/30 bg-primary/5 dark:bg-primary/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">New assignment</h4>
            <button type="button" onClick={() => setShowForm(false)} className="text-xl text-slate-400 hover:text-slate-700 cursor-pointer leading-none">×</button>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Course / Simulation</label>
              <select
                value={newAsgn.courseId}
                onChange={(e) => setNewAsgn((p) => ({ ...p, courseId: e.target.value }))}
                required
                className="input w-full"
              >
                <option value="">Select…</option>
                {COURSES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.type === 'simulation' ? '🎮' : '📖'} {c.title} ({c.level} · {c.duration})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Assign to</label>
                <select
                  value={newAsgn.assignedTo}
                  onChange={(e) => setNewAsgn((p) => ({ ...p, assignedTo: e.target.value }))}
                  className="input w-full"
                >
                  <option value="all">Entire class</option>
                  {sections.map((s) => <option key={s} value={s}>Section {s} only</option>)}
                  {students.map((s) => (
                    <option key={s.id} value={s.roll_no}>{s.name} ({s.roll_no})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Due date</label>
                <input
                  type="date"
                  value={newAsgn.dueDate}
                  onChange={(e) => setNewAsgn((p) => ({ ...p, dueDate: e.target.value }))}
                  required
                  className="input w-full"
                />
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
        {assignments.map((a) => {
          const course = COURSES.find((c) => c.id === a.courseId)
          return (
            <div key={a.id} className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900 flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-xl shrink-0">
                {course?.type === 'simulation' ? '🎮' : '📖'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{a.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {a.assignedTo === 'all' ? 'Entire class' : a.assignedTo}
                  {a.dueDate && <> · Due <span className="font-medium">{a.dueDate}</span></>}
                  {' · '}Assigned {a.createdAt}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssignments((prev) => prev.filter((x) => x.id !== a.id))}
                className="text-xs text-rose-500 hover:underline shrink-0 cursor-pointer"
              >
                Remove
              </button>
            </div>
          )
        })}
        {assignments.length === 0 && (
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl py-10 text-center">
            <p className="text-sm text-slate-500">No assignments yet. Click <strong>+ Assign task</strong> to create one.</p>
          </div>
        )}
      </div>
    </div>
  )
}
