import { UserCircle2 } from 'lucide-react'
import DataTable from '../../../components/design-system/DataTable'
import { FEATURE_LABELS, overallProgress, initials } from './mentorUtils'

function ProgressBar({ pct }) {
  const color = pct === 100 ? 'bg-emerald-500' : pct >= 60 ? 'bg-primary' : pct >= 20 ? 'bg-amber-400' : 'bg-rose-400'
  return (
    <div className="flex items-center gap-1.5 min-w-[5rem]">
      <div className="flex-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-500 w-8 text-right shrink-0">{pct === 100 ? '✓' : `${pct}%`}</span>
    </div>
  )
}

export default function StudentsTable({ rows, loading, onManageFeatures, resetKey }) {
  const columns = [
    {
      key: 'name',
      header: 'Student',
      render: (s) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
            {initials(s.name)}
          </div>
          <span className="font-medium text-slate-900 dark:text-slate-100">{s.name}</span>
        </div>
      ),
    },
    { key: 'roll_no', header: 'Roll No', render: (s) => <span className="font-mono text-xs">{s.roll_no}</span> },
    { key: 'section', header: 'Sec' },
    { key: 'last_active', header: 'Last Active' },
    { key: 'tasks_done', header: 'Tasks', render: (s) => <span className="font-semibold">{s.tasks_done}/5</span> },
    {
      key: 'progress',
      header: 'Progress',
      render: (s) => <ProgressBar pct={overallProgress(s)} />,
    },
    {
      key: 'unlocked',
      header: 'Unlocked',
      render: (s) => (
        (s.unlocked || []).length > 0 ? (
          <div className="flex gap-1 flex-wrap">
            {(s.unlocked || []).map((f) => (
              <span key={f} className="text-[10px] bg-primary/10 text-primary font-semibold px-1.5 py-0.5 rounded-full">
                {FEATURE_LABELS[f] ?? f}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (s) => (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.enrolled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
          {s.enrolled ? 'enrolled' : 'not enrolled'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (s) => (
        <button
          type="button"
          onClick={() => onManageFeatures?.(s)}
          className="text-xs font-semibold text-primary hover:underline cursor-pointer"
        >
          Manage features
        </button>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      rows={rows}
      loading={loading}
      emptyIcon={UserCircle2}
      emptyTitle="No students found"
      emptyDescription="Students in your university will appear here once provisioned."
      resetKey={resetKey}
    />
  )
}
