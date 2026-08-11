import { Link } from 'react-router-dom'
import { Users, Activity, TrendingUp, AlertTriangle } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { useMentorStudents } from '../../../hooks'
import StatCard from '../../../components/design-system/StatCard'
import DataTable from '../../../components/design-system/DataTable'
import { overallProgress, initials, isActiveToday, needsAttention } from '../shared/mentorUtils'

export default function MentorOverviewPage() {
  const { user } = useAuth()
  const { data: students = [], isLoading } = useMentorStudents()
  const uniName = user?.university?.name || user?.institution || 'your university'

  const atRisk = students.filter(needsAttention)
  const activeToday = students.filter((s) => isActiveToday(s.last_active)).length
  const avgProg = students.length
    ? Math.round(students.reduce((a, s) => a + overallProgress(s), 0) / students.length)
    : 0

  const progressColumns = [
    {
      key: 'name',
      header: 'Student',
      render: (s) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold">
            {initials(s.name)}
          </div>
          <div>
            <p className="font-medium text-slate-900 dark:text-slate-100">{s.name.split(' ')[0]}</p>
            <p className="text-[10px] text-slate-400">{s.roll_no} · {s.last_active}</p>
          </div>
        </div>
      ),
    },
    { key: 'tasks_done', header: 'Tasks', render: (s) => <span className="font-semibold">{s.tasks_done}/5</span> },
    {
      key: 'progress',
      header: 'Progress',
      render: (s) => {
        const pct = overallProgress(s)
        return (
          <span className={`text-xs font-bold ${pct === 100 ? 'text-emerald-600' : pct >= 60 ? 'text-primary' : pct >= 20 ? 'text-amber-600' : 'text-rose-600'}`}>
            {pct === 100 ? '✓ Done' : `${pct}%`}
          </span>
        )
      },
    },
    {
      key: 'enrolled',
      header: 'Enrolled',
      render: (s) => (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.enrolled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
          {s.enrolled ? 'Enrolled' : 'Not enrolled'}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Welcome, {user?.name?.split(' ')[0] || 'Mentor'}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Students at <strong>{uniName}</strong>
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Students in university" value={isLoading ? '—' : students.length} icon={Users} />
        <StatCard label="Active today" value={isLoading ? '—' : activeToday} icon={Activity} />
        <StatCard label="Avg progress" value={isLoading ? '—' : `${avgProg}%`} icon={TrendingUp} />
        <Link
          to={atRisk.length ? '/mentor/students?attention=1' : '/mentor/students'}
          className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <StatCard label="Needs attention" value={isLoading ? '—' : atRisk.length} icon={AlertTriangle} />
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Student progress</h3>
            <span className="text-xs text-slate-500">{students.length} students</span>
          </div>
          <DataTable
            columns={progressColumns}
            rows={students}
            loading={isLoading}
            emptyTitle="No students in your university yet"
          />
        </div>

        <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900 h-fit">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Needs attention</h3>
            <span className="text-xs bg-rose-50 text-rose-600 font-semibold px-2 py-0.5 rounded-full border border-rose-200">
              {atRisk.length}
            </span>
          </div>
          {atRisk.length === 0 ? (
            <p className="text-xs text-slate-500">All students on track.</p>
          ) : (
            <div className="space-y-2.5">
              {atRisk.slice(0, 8).map((s) => (
                <div key={s.id} className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold shrink-0">
                    {initials(s.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">{s.name}</p>
                    <p className="text-[10px] text-slate-500">
                      {!s.enrolled ? 'Not enrolled' : `${s.tasks_done}/5 tasks · ${s.last_active}`}
                    </p>
                  </div>
                </div>
              ))}
              {atRisk.length > 8 && (
                <Link to="/mentor/students?attention=1" className="text-xs font-semibold text-primary hover:underline">
                  View all →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
