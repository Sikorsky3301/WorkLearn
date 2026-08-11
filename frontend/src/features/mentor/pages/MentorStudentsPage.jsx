import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useMentorStudents } from '../../../hooks'
import StudentsTable from '../shared/StudentsTable'
import UnlockFeaturesModal from '../shared/UnlockFeaturesModal'
import { needsAttention } from '../shared/mentorUtils'

export default function MentorStudentsPage() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const attentionOnly = searchParams.get('attention') === '1'
  const [secFilter, setSecFilter] = useState('All')
  const [manageStudent, setManageStudent] = useState(null)

  const { data: students = [], isLoading } = useMentorStudents()
  const uniName = user?.university?.name || user?.institution || 'your university'

  // Keep modal student in sync with query refreshes after unlock/revoke
  const liveManaged = manageStudent
    ? students.find((s) => s.id === manageStudent.id) || manageStudent
    : null

  const sections = useMemo(
    () => [...new Set(students.map((s) => s.section).filter(Boolean))],
    [students],
  )

  const filtered = useMemo(() => {
    let list = students
    if (attentionOnly) list = list.filter(needsAttention)
    if (secFilter !== 'All') list = list.filter((s) => s.section === secFilter)
    return list
  }, [students, secFilter, attentionOnly])

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Students</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          {isLoading ? '…' : filtered.length} student{filtered.length === 1 ? '' : 's'} at {uniName}
          {attentionOnly ? ' · needs attention' : ''}
          {' · '}
          {students.length} in university total
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {['All', ...sections].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSecFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              secFilter === s
                ? 'bg-primary text-white'
                : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {s === 'All' ? 'All sections' : `Section ${s}`}
          </button>
        ))}
      </div>

      <StudentsTable
        rows={filtered}
        loading={isLoading}
        onManageFeatures={setManageStudent}
      />

      {liveManaged && (
        <UnlockFeaturesModal student={liveManaged} onClose={() => setManageStudent(null)} />
      )}
    </div>
  )
}
