import { useState } from 'react'
import { X, AlertTriangle, Loader2 } from 'lucide-react'
import { usePreviewFullSimulation } from '../../../shared/api/hooks'
import { resolveMediaUrl } from '../../../shared/api/client'
import { cn } from '../../../shared/utils/cn'
import GenericStageRenderer from './GenericStageRenderer'
import { GenericTaskHeader, GenericTaskFooterNav } from './GenericStageChrome'
import ReferenceDataPanel from './ReferenceDataPanel'
import ModelSolutionPanel from './ModelSolutionPanel'
import CodeSandboxPreviewTask from './CodeSandboxPreviewTask'
import QuizPreviewTask from './QuizPreviewTask'

/** Admin-only, full-screen interactive run-through of a DRAFT (or published)
 * simulation — lets an admin click through every stage exactly as a student
 * would before publishing. Deliberately NOT a reuse of GenericSimShell: that
 * component auto-enrolls the current user on mount, which would create a
 * real Enrollment against a draft simulation (and then block its deletion).
 * Keeps all progress in local component state only — nothing persists, and
 * closing/reopening this always starts over. */
export default function InteractiveSimPreview({ simId, onClose }) {
  const { data: full, isLoading } = usePreviewFullSimulation(simId)
  const [currentTaskIndex, setCurrentTaskIndex] = useState(1)
  const [completedTasks, setCompletedTasks] = useState([])

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-surface-low flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!full) {
    return (
      <div className="fixed inset-0 z-50 bg-surface-low flex flex-col items-center justify-center gap-4">
        <p className="text-sm text-on-surface-variant">Could not load this simulation.</p>
        <button onClick={onClose} className="btn-primary px-4 py-2">Close</button>
      </div>
    )
  }

  const { simulation, tasks } = full
  const task = tasks.find((t) => t.task_index === currentTaskIndex) || tasks[0]
  const isLast = currentTaskIndex >= Math.max(...tasks.map((t) => t.task_index))

  function jump(idx) {
    setCurrentTaskIndex(idx)
  }

  function handleTaskComplete() {
    setCompletedTasks((prev) => (prev.includes(task.task_index) ? prev : [...prev, task.task_index]))
    const next = tasks.find((t) => t.task_index > task.task_index)
    if (next) setCurrentTaskIndex(next.task_index)
  }

  return (
    <div className="fixed inset-0 z-50 bg-surface-low flex flex-col">
      <div className="shrink-0 bg-amber-50 border-b border-amber-300 text-amber-800 text-xs font-semibold px-4 py-1.5 flex items-center gap-2">
        <AlertTriangle className="h-3.5 w-3.5" /> PREVIEW MODE — nothing here is saved, no enrollment or XP is created
      </div>

      <header className="shrink-0 bg-white border-b border-border">
        <div className="max-w-container mx-auto px-6 h-14 flex items-center gap-4">
          <button onClick={onClose} className="flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface transition-colors text-sm font-medium shrink-0">
            <X className="h-4 w-4" /> Close preview
          </button>
          <div className="h-6 w-px bg-border shrink-0" />
          <div className="flex items-center gap-2 min-w-0 shrink-0">
            {simulation.logo_url && (
              <img src={resolveMediaUrl(simulation.logo_url)} alt={simulation.company} className="h-6 w-auto max-w-[90px] object-contain shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-bold text-on-surface leading-tight truncate">{simulation.company}</p>
              <p className="text-[11px] text-on-surface-variant leading-tight truncate">{simulation.title}</p>
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-1">
              {tasks.map((t) => {
                const done = completedTasks.includes(t.task_index)
                const active = t.task_index === currentTaskIndex
                return (
                  <button
                    key={t.id}
                    onClick={() => jump(t.task_index)}
                    title={t.title}
                    className={cn(
                      'h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors shrink-0 cursor-pointer',
                      done && 'bg-emerald-500 text-white',
                      !done && active && 'bg-primary text-white ring-2 ring-primary/25',
                      !done && !active && 'bg-surface-high text-on-surface-variant hover:bg-surface-container'
                    )}
                  >
                    {done ? '✓' : t.task_index}
                  </button>
                )
              })}
            </div>
          </div>
          <span className="text-xs font-semibold text-on-surface-variant shrink-0">
            {completedTasks.length}/{tasks.length} complete
          </span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-container mx-auto px-6 py-8">
          {task && (
            task.type === 'code_sandbox' || task.type === 'quiz' ? (
              // Both bypass GenericStageRenderer's real-runtime dispatch: the
              // real CodeSandboxTask is enrollment-bound, and the real
              // QuizTask hardcodes its dialog open with no way to dismiss it
              // (by design for a real student — nothing to back out of when
              // the quiz IS the task). Neither is safe to drop into an admin
              // preview as-is, so both get a manual Continue button instead
              // of relying on the type's own completion signal.
              <div>
                <GenericTaskHeader task={task} taskCount={tasks.length} />
                <ReferenceDataPanel referenceData={task.reference_data} />
                {task.type === 'code_sandbox' ? (
                  <CodeSandboxPreviewTask simId={simId} task={task} />
                ) : (
                  <QuizPreviewTask task={task} />
                )}
                <ModelSolutionPanel modelSolution={task.model_solution} />
                <GenericTaskFooterNav
                  task={task}
                  criteriaMet={(task.success_criteria || []).map(() => true)}
                  isLast={isLast}
                  alreadyCompleted={completedTasks.includes(task.task_index)}
                  onContinue={handleTaskComplete}
                />
              </div>
            ) : (
              <GenericStageRenderer
                simId={simId}
                enrollmentId={null}
                task={task}
                taskCount={tasks.length}
                onTaskComplete={handleTaskComplete}
              />
            )
          )}
        </div>
      </main>
    </div>
  )
}
