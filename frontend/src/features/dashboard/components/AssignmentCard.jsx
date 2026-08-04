import { Briefcase, Check, Mail } from 'lucide-react'
import { SIM_BRANDING } from '../../../lib/simBranding'

/** One manager/task summary for a single enrolled simulation — Dashboard
 * renders one of these per entry in useMyAssignments() so a student running
 * several job simulations at once sees every manager, not just the latest. */
export default function AssignmentCard({ assignment, onGo }) {
  const branding = SIM_BRANDING[assignment.simulation_slug]

  const simChip = (
    <div className="inline-flex items-center gap-1.5 mb-3 px-2 py-1 rounded-md bg-primary/[0.06] border border-primary/10">
      {branding?.logo ? (
        <img src={branding.logo} alt={assignment.simulation_title} className="h-3.5 w-auto object-contain" />
      ) : (
        <Briefcase className="h-3 w-3 text-primary" />
      )}
      <span className="text-[11px] font-semibold text-primary truncate">{assignment.simulation_title}</span>
    </div>
  )

  const shell = 'rounded-xl border border-border bg-white shadow-sm p-5'

  if (assignment.has_assignment) {
    const pct = assignment.total_tasks
      ? Math.round((assignment.completed_count / assignment.total_tasks) * 100)
      : 0

    return (
      <div className={shell}>
        {simChip}
        <div className="flex items-center gap-2.5 mb-4">
          {branding?.managerPhoto ? (
            <img src={branding.managerPhoto} alt={assignment.manager.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
              {assignment.manager.avatar}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-on-surface leading-tight truncate">{assignment.manager.name}</p>
            <p className="text-xs text-on-surface-variant truncate">
              {assignment.manager.role}{assignment.manager.company ? ` · ${assignment.manager.company}` : ''}
            </p>
          </div>
        </div>

        {/* Progress rail — replaces the old bare "0/5 done" text so the
            card carries a sense of momentum at a glance. */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex-1 h-1.5 bg-surface-high rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[11px] text-on-surface-variant shrink-0 tabular-nums">
            {assignment.completed_count}/{assignment.total_tasks}
          </span>
        </div>

        <div className="border-t border-border pt-4">
          <span
            className={`inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mb-2 ${
              assignment.in_progress ? 'bg-primary/10 text-primary' : 'bg-surface-container text-on-surface-variant'
            }`}
          >
            {assignment.in_progress ? 'In progress' : 'New assignment'}
          </span>
          <p className="font-bold text-on-surface text-sm mb-1">{assignment.task_name}</p>
          {assignment.brief && (
            <p className="text-xs text-on-surface-variant leading-relaxed mb-4">{assignment.brief}</p>
          )}
          <button className="btn-primary w-full text-xs py-2" onClick={onGo}>
            Complete this task →
          </button>
        </div>
      </div>
    )
  }

  if (assignment.reason === 'completed') {
    return (
      <div className={`${shell} flex flex-col items-center justify-center py-8 text-center`}>
        {simChip}
        <span className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
          <Check className="h-5 w-5" />
        </span>
        <p className="text-sm font-semibold text-on-surface mb-1">All tasks completed</p>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          You've finished every task {assignment.manager?.name} assigned. Your Skill GPS is updated.
        </p>
      </div>
    )
  }

  if (assignment.reason === 'onboarding_pending') {
    return (
      <div className={`${shell} flex flex-col items-center justify-center py-8 text-center`}>
        {simChip}
        <span className="w-11 h-11 rounded-full bg-primary/[0.07] text-primary flex items-center justify-center mb-3">
          <Mail className="h-5 w-5" />
        </span>
        <p className="text-sm font-semibold text-on-surface mb-1">You have an offer to accept</p>
        <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
          {assignment.manager?.name} is waiting — accept your offer to begin and earn your Journey badge.
        </p>
        <button className="btn-primary text-xs px-4 py-2" onClick={onGo}>
          Review offer →
        </button>
      </div>
    )
  }

  return null
}
