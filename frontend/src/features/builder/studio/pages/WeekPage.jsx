import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, ArrowRight, Loader2 } from 'lucide-react'
import { cn } from '../../../../lib/cn'
import { useUpdateSimulation } from '../../../../hooks'
import { Field, TextInput, Section, Note } from '../editors/Fields'
import { taskTypeMeta, DEFAULT_TASK_TYPE_META } from '../../cms/shared/taskTypeMeta'
import { isFinalAssessment } from '../lib/simFormat'
import { WEEK_THEMES } from '../lib/scaffold'

// A week, as a page of its own.
//
// The week label used to be an inline rename on a section header in a task
// list — discoverable only by hovering the right six pixels, and the only
// week-level setting that existed. But a week IS a unit of authoring: it has a
// name that tells a student what the week is FOR, it has a target size, and it
// has an arc across its tasks. Giving it a page is what makes "three weeks of
// three tasks" something you can see rather than something you have to count.

export default function WeekPage({ sim, simId, week, format, onOpenTask, onAddTask }) {
  const stored = sim.section_labels?.[String(week)] || ''
  const [label, setLabel] = useState(stored)
  const update = useUpdateSimulation(simId)

  useEffect(() => { setLabel(stored) }, [stored, week])

  const tasks = (sim.tasks ?? [])
    .filter((t) => t.week === week)
    .sort((a, b) => a.task_index - b.task_index)
  const workTasks = tasks.filter((t) => !isFinalAssessment(t))
  const isFinalWeek = tasks.length > 0 && tasks.every(isFinalAssessment)
  const dirty = label.trim() !== stored
  const suggestion = WEEK_THEMES[week - 1]?.label

  function save() {
    update.mutate(
      { section_labels: { ...(sim.section_labels || {}), [String(week)]: label.trim() } },
      { onSuccess: () => toast.success('Week renamed'), onError: (e) => toast.error(e.message) }
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border bg-white px-8 py-6">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-outline">Week {week}</p>
        <div className="mt-1 flex items-start justify-between gap-6">
          <h2 className="font-display text-[1.6rem] font-extrabold leading-tight tracking-tight text-on-surface">
            {stored || `Week ${week}`}
          </h2>
          <button
            onClick={save}
            disabled={!dirty || update.isPending}
            className={cn(
              'inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-[0.82rem] font-bold transition-colors',
              dirty ? 'bg-on-surface text-white hover:bg-primary cursor-pointer' : 'bg-surface-low text-outline cursor-default'
            )}
          >
            {update.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {dirty ? 'Save name' : 'Saved'}
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-8 py-7">
        <div className="max-w-3xl space-y-8">
          <Section
            title="What this week is for"
            hint="Shown as the section heading on the roadmap and above the task title. A name that states the point of the week beats “Week 2”."
          >
            <Field
              label="Week name"
              help={suggestion ? `The reference simulations use something like “${suggestion}”.` : undefined}
            >
              <TextInput
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && dirty && save()}
                placeholder={suggestion || `Week ${week}`}
              />
            </Field>
            {!stored && suggestion && (
              <button
                onClick={() => setLabel(suggestion)}
                className="mt-2 rounded-lg border border-dashed border-border px-3 py-1.5 text-[0.75rem] font-semibold text-on-surface-variant transition-colors hover:border-primary hover:text-primary cursor-pointer"
              >
                Use “{suggestion}”
              </button>
            )}
          </Section>

          <Section
            title="Tasks in this week"
            hint={
              isFinalWeek
                ? 'The closing week holds the final assessment on its own.'
                : `${workTasks.length} of ${format.tasks_per_week}. Drag in the outline to reorder or move a task between weeks.`
            }
            action={
              <button
                onClick={() => onAddTask(week)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[0.78rem] font-bold text-on-surface transition-colors hover:border-primary hover:text-primary cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Add a task
              </button>
            }
          >
            {tasks.length === 0 ? (
              <Note>This week is empty. A week with no tasks is skipped entirely on the roadmap.</Note>
            ) : (
              <div className="divide-y divide-border rounded-xl border border-border bg-white">
                {tasks.map((task) => {
                  const meta = taskTypeMeta[task.type] || DEFAULT_TASK_TYPE_META
                  const Icon = meta.icon
                  const questions = task.config?.assessment?.questions?.length ?? 0
                  return (
                    <button
                      key={task.id}
                      onClick={() => onOpenTask(task)}
                      className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-low cursor-pointer"
                    >
                      <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', meta.badgeBg)}>
                        <Icon className={cn('h-3.5 w-3.5', meta.badgeText)} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[0.86rem] font-semibold text-on-surface">
                          {task.title || 'Untitled task'}
                        </span>
                        <span className="block truncate text-[0.7rem] text-outline">
                          Task {task.task_index} · {task.xp_award || 0} XP ·{' '}
                          {questions ? `${questions}-question check` : 'no check'}
                        </span>
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-transparent transition-colors group-hover:text-on-surface-variant" />
                    </button>
                  )
                })}
              </div>
            )}

            {!isFinalWeek && workTasks.length !== format.tasks_per_week && (
              <div className="mt-3">
                <Note tone="warn">
                  Every other simulation runs {format.tasks_per_week} tasks a week. This one has{' '}
                  {workTasks.length}, which will read as a shorter or longer week to a student moving
                  between simulations.
                </Note>
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  )
}
