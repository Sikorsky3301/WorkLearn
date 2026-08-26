import { useMemo } from 'react'
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  GripVertical, Plus, Settings, UserSquare2, GraduationCap, ClipboardCheck,
  AlertTriangle, CircleAlert, Copy, Trash2,
} from 'lucide-react'
import { cn } from '../../../lib/cn'
import { taskTypeMeta, DEFAULT_TASK_TYPE_META } from '../cms/shared/taskTypeMeta'
import { groupIntoWeeks, isFinalAssessment } from './lib/simFormat'

// The simulation as a list of PAGES, which is the thing an author is actually
// building: a setup page, an onboarding page, three weeks of task pages, and a
// final assessment. The old builder showed a flat, unlabelled task list beside
// a palette of six types, and the week a task belonged to was a bare number
// input buried in its editor — so the structure the runtime renders was
// invisible in the tool that produced it.
//
// Dragging moves a task in two dimensions at once: `task_index` (the only real
// ordering key) and `week` (the grouping the roadmap renders). Dropping a task
// under a different week header does both, because being asked to reorder AND
// then re-type a week number is exactly the kind of bookkeeping a builder
// should absorb.

export const PAGE = {
  SETUP: 'setup',
  ONBOARDING: 'onboarding',
  REVIEW: 'review',
  task: (id) => `task:${id}`,
  week: (n) => `week:${n}`,
}

function IssueDot({ issues }) {
  if (!issues?.length) return null
  const blocking = issues.some((i) => i.level === 'blocker')
  const Icon = blocking ? CircleAlert : AlertTriangle
  return (
    <span
      title={issues.map((i) => i.label).join('\n')}
      className={cn('shrink-0', blocking ? 'text-red-500' : 'text-amber-500')}
    >
      <Icon className="h-3.5 w-3.5" />
    </span>
  )
}

function FixedRow({ id, active, icon: Icon, label, hint, issues, onSelect }) {
  return (
    <button
      onClick={() => onSelect(id)}
      className={cn(
        'group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors cursor-pointer',
        active ? 'bg-on-surface text-white' : 'text-on-surface-variant hover:bg-surface-low hover:text-on-surface'
      )}
    >
      <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-white/70' : 'text-outline')} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.82rem] font-semibold">{label}</span>
        {hint && (
          <span className={cn('block truncate text-[0.68rem]', active ? 'text-white/55' : 'text-outline')}>
            {hint}
          </span>
        )}
      </span>
      {!active && <IssueDot issues={issues} />}
    </button>
  )
}

function TaskRow({ task, active, issues, onSelect, onDuplicate, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })
  const meta = taskTypeMeta[task.type] || DEFAULT_TASK_TYPE_META
  const TypeIcon = meta.icon
  const final = isFinalAssessment(task)

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn('group relative', isDragging && 'opacity-40')}
    >
      <button
        onClick={() => onSelect(PAGE.task(task.id))}
        className={cn(
          'flex w-full items-center gap-2 rounded-lg py-2 pl-1.5 pr-14 text-left transition-colors cursor-pointer',
          active ? 'bg-on-surface text-white' : 'hover:bg-surface-low'
        )}
      >
        <span
          {...listeners}
          {...attributes}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'shrink-0 cursor-grab active:cursor-grabbing rounded p-0.5',
            active ? 'text-white/40 hover:text-white/80' : 'text-transparent group-hover:text-outline'
          )}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </span>
        <span
          className={cn(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded',
            active ? 'bg-white/15' : meta.badgeBg
          )}
        >
          <TypeIcon className={cn('h-3 w-3', active ? 'text-white' : meta.badgeText)} />
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn('block truncate text-[0.8rem] font-semibold', active ? 'text-white' : 'text-on-surface')}>
            {task.title || 'Untitled task'}
          </span>
          <span className={cn('block truncate text-[0.66rem]', active ? 'text-white/55' : 'text-outline')}>
            {final ? 'Final assessment' : `Task ${task.task_index}`}
            {!final && task.config?.assessment?.questions?.length
              ? ` · ${task.config.assessment.questions.length}q check`
              : ''}
          </span>
        </span>
        {!active && <IssueDot issues={issues} />}
      </button>

      {/* Row actions, revealed on hover the way a file tree does it — always
          visible, they turn a scannable list into a wall of icons. */}
      <span className="absolute right-1.5 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 group-hover:flex">
        <button
          onClick={(e) => { e.stopPropagation(); onDuplicate(task) }}
          title="Duplicate"
          className={cn('rounded p-1 cursor-pointer', active ? 'text-white/60 hover:text-white' : 'text-outline hover:text-on-surface')}
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(task) }}
          title="Delete"
          className={cn('rounded p-1 cursor-pointer', active ? 'text-white/60 hover:text-red-300' : 'text-outline hover:text-red-500')}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </span>
    </div>
  )
}

export default function StudioOutline({
  sim, page, onSelect, issuesFor, simIssues,
  onAddTask, onAddWeek, onDuplicate, onDelete, onMove,
}) {
  const tasks = sim?.tasks ?? []
  const { weeks, unassigned } = useMemo(
    () => groupIntoWeeks(tasks, sim?.section_labels),
    [tasks, sim?.section_labels]
  )
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const ordered = useMemo(() => [...tasks].sort((a, b) => a.task_index - b.task_index), [tasks])

  function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return
    const from = ordered.findIndex((t) => t.id === active.id)
    const to = ordered.findIndex((t) => t.id === over.id)
    if (from === -1 || to === -1) return

    const next = arrayMove(ordered, from, to)
    // The week a task lands in is the week of whatever it landed next to. The
    // neighbour BELOW is checked first so dropping onto a week's first row
    // joins that week rather than the one above it.
    const moved = next[to]
    const week = next[to + 1]?.week ?? next[to - 1]?.week ?? moved.week
    onMove({ taskIds: next.map((t) => t.id), taskId: moved.id, week })
  }

  return (
    <nav className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 space-y-0.5 border-b border-border px-2.5 py-3">
        <p className="px-2.5 pb-1.5 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-outline">
          Before the work
        </p>
        <FixedRow
          id={PAGE.SETUP} active={page === PAGE.SETUP} icon={Settings}
          label="Setup" hint="Name, company, skills, thumbnail"
          issues={simIssues?.filter((i) => ['description', 'sim-skills'].includes(i.id))}
          onSelect={onSelect}
        />
        <FixedRow
          id={PAGE.ONBOARDING} active={page === PAGE.ONBOARDING} icon={UserSquare2}
          label="Onboarding" hint="Manager, offer letter, first scene"
          issues={simIssues?.filter((i) => ['manager', 'company'].includes(i.id))}
          onSelect={onSelect}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2.5 py-3">
        <div className="flex items-center justify-between px-2.5 pb-1.5">
          <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-outline">The work</p>
          <button
            onClick={onAddWeek}
            title="Add a week"
            className="rounded p-0.5 text-outline transition-colors hover:text-primary cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={ordered.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            {weeks.map((w) => (
              <div key={w.week} className="mb-3">
                <button
                  onClick={() => onSelect(PAGE.week(w.week))}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left transition-colors cursor-pointer',
                    page === PAGE.week(w.week) ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface-low'
                  )}
                >
                  {w.tasks.some(isFinalAssessment)
                    ? <ClipboardCheck className="h-3.5 w-3.5 shrink-0" />
                    : <GraduationCap className="h-3.5 w-3.5 shrink-0" />}
                  <span className="min-w-0 flex-1 truncate text-[0.7rem] font-bold uppercase tracking-wide">
                    {w.label}
                  </span>
                  <span className="shrink-0 text-[0.65rem] tabular-nums text-outline">{w.tasks.length}</span>
                </button>

                <div className="mt-0.5 space-y-0.5 pl-1">
                  {w.tasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      active={page === PAGE.task(task.id)}
                      issues={issuesFor(task)}
                      onSelect={onSelect}
                      onDuplicate={onDuplicate}
                      onDelete={onDelete}
                    />
                  ))}
                  <button
                    onClick={() => onAddTask(w.week)}
                    className="flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[0.72rem] font-semibold text-outline transition-colors hover:bg-surface-low hover:text-primary cursor-pointer"
                  >
                    <Plus className="h-3 w-3" /> Add a task
                  </button>
                </div>
              </div>
            ))}

            {unassigned.length > 0 && (
              <div className="mb-3 rounded-lg border border-dashed border-amber-300 bg-amber-50/60 p-1.5">
                <p className="px-1.5 pb-1 text-[0.62rem] font-bold uppercase tracking-wide text-amber-700">
                  Not in a week — drag into one
                </p>
                <div className="space-y-0.5">
                  {unassigned.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      active={page === PAGE.task(task.id)}
                      issues={issuesFor(task)}
                      onSelect={onSelect}
                      onDuplicate={onDuplicate}
                      onDelete={onDelete}
                    />
                  ))}
                </div>
              </div>
            )}
          </SortableContext>
          <DragOverlay />
        </DndContext>

        {weeks.length === 0 && unassigned.length === 0 && (
          <p className="px-2.5 py-6 text-[0.75rem] leading-relaxed text-outline">
            No weeks yet. Use <span className="font-semibold text-on-surface">Scaffold the format</span> on
            the Review page to lay out three weeks in one step.
          </p>
        )}
      </div>

      <div className="shrink-0 border-t border-border px-2.5 py-3">
        <FixedRow
          id={PAGE.REVIEW} active={page === PAGE.REVIEW} icon={ClipboardCheck}
          label="Review & publish" hint="What is still missing"
          onSelect={onSelect}
        />
      </div>
    </nav>
  )
}
