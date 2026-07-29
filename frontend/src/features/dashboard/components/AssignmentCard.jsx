import { SIM_BRANDING } from './simBranding'

/** One manager/task summary for a single enrolled simulation — Dashboard
 * renders one of these per entry in useMyAssignments() so a student running
 * several job simulations at once sees every manager, not just the latest. */
export default function AssignmentCard({ assignment, onGo }) {
  const branding = SIM_BRANDING[assignment.simulation_id]

  const simChip = (
    <div className="inline-flex items-center gap-1.5 mb-3 px-2 py-1 rounded-md bg-primary/5 border border-primary/15">
      {branding?.logo ? (
        <img src={branding.logo} alt={assignment.simulation_title} className="h-3.5 w-auto object-contain" />
      ) : (
        <span className="text-[10px]">💼</span>
      )}
      <span className="text-[11px] font-semibold text-primary truncate">{assignment.simulation_title}</span>
    </div>
  )

  if (assignment.has_assignment) {
    return (
      <div className="card">
        {simChip}
        <div className="flex items-center gap-2.5 mb-3">
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

        <div className="border border-border rounded-xl p-3.5 bg-surface-low">
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${assignment.in_progress ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
              {assignment.in_progress ? 'In progress' : 'New assignment'}
            </span>
            <span className="text-[11px] text-on-surface-variant">
              {assignment.completed_count}/{assignment.total_tasks} done
            </span>
          </div>
          <p className="font-bold text-on-surface text-sm mb-1">{assignment.task_name}</p>
          {assignment.brief && (
            <p className="text-xs text-on-surface-variant leading-relaxed mb-3">"{assignment.brief}"</p>
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
      <div className="card flex flex-col items-center justify-center py-8 text-center">
        {simChip}
        <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-3 text-lg">✓</div>
        <p className="text-sm font-medium text-on-surface mb-1">All tasks completed!</p>
        <p className="text-xs text-on-surface-variant leading-relaxed">
          You've finished every task {assignment.manager?.name} assigned. Your Skill GPS is updated.
        </p>
      </div>
    )
  }

  if (assignment.reason === 'onboarding_pending') {
    return (
      <div className="card flex flex-col items-center justify-center py-8 text-center">
        {simChip}
        <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-3 text-lg">📩</div>
        <p className="text-sm font-medium text-on-surface mb-1">You have an offer to accept</p>
        <p className="text-xs text-on-surface-variant leading-relaxed mb-3">
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
