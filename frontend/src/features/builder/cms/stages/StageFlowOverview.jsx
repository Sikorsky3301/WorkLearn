import { useDroppable } from '@dnd-kit/core'
import { SortableContext, useSortable, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { taskTypeMeta, DEFAULT_TASK_TYPE_META } from '../shared/taskTypeMeta'
import { cn } from '../../../../lib/cn'

/** Alternate, toggleable view of the whole simulation as a connected
 * horizontal roadmap — Onboarding/Completion end-caps, one background-tinted
 * lane per week (captioned via sim.section_labels), one compact FlowNode per
 * task. Reuses the exact same useSortable/useDroppable('insert-before-<id>')
 * primitives as StageListView, just laid out horizontally — only the
 * SortableContext strategy changes and the drop highlight flips from a top
 * border to a left border. Palette-drag-to-insert and reorder both work
 * identically since StagesTab's shared onDragEnd reads `over.id` the same
 * way regardless of which view rendered the droppable. Ignores
 * collapsedWeeks — a roadmap always shows every stage. */
export default function StageFlowOverview({ tasks, sim, openTaskId, onOpen }) {
  const { setNodeRef: setCanvasRef } = useDroppable({ id: 'flow-canvas' })

  const lanes = []
  let currentWeek
  tasks.forEach((task, i) => {
    if (i === 0 || task.week !== currentWeek) {
      currentWeek = task.week
      lanes.push({ week: task.week, tasks: [] })
    }
    lanes[lanes.length - 1].tasks.push(task)
  })

  return (
    <div ref={setCanvasRef} className="overflow-x-auto pb-4">
      <SortableContext items={tasks.map((t) => t.id)} strategy={horizontalListSortingStrategy}>
        <div className="flex items-center min-w-max py-2 px-1">
          <EndCap label="Onboarding" />
          <Connector />
          {lanes.map((lane, li) => (
            <div key={li} className="flex items-center">
              <FlowLane
                label={lane.week != null ? (sim.section_labels?.[String(lane.week)] || `Week ${lane.week}`) : null}
              >
                {lane.tasks.map((task, ti) => (
                  <div key={task.id} className="flex items-center">
                    {ti > 0 && <Connector small />}
                    <FlowNode task={task} active={task.id === openTaskId} onOpen={() => onOpen(task)} />
                  </div>
                ))}
              </FlowLane>
              <Connector />
            </div>
          ))}
          <EndCap label="Completion" />
        </div>
      </SortableContext>
    </div>
  )
}

function EndCap({ label }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 w-20 h-20 rounded-full border-2 border-dashed border-border text-on-surface-variant shrink-0">
      <p className="text-[10px] font-bold uppercase tracking-wide text-center px-1 leading-tight">{label}</p>
    </div>
  )
}

function Connector({ small }) {
  return <div className={cn('h-0.5 bg-border shrink-0', small ? 'w-3' : 'w-6')} />
}

function FlowLane({ label, children }) {
  if (label == null) {
    return <div className="flex items-center gap-0">{children}</div>
  }
  return (
    <div className="flex flex-col shrink-0 rounded-xl bg-surface-low/60 border border-border/60 px-3 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-on-surface-variant mb-2 text-center">{label}</p>
      <div className="flex items-center gap-0">{children}</div>
    </div>
  )
}

function FlowNode({ task, active, onOpen }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: `insert-before-${task.id}` })
  const meta = taskTypeMeta[task.type] || DEFAULT_TASK_TYPE_META
  const TypeIcon = meta.icon

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

  return (
    <div ref={setDropRef} className={cn('flex items-center shrink-0', isOver && 'border-l-2 border-primary')}>
      <button
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        style={style}
        onClick={onOpen}
        title={task.title}
        className={cn(
          'flex flex-col items-center justify-center gap-1.5 w-24 h-20 rounded-lg border-2 bg-white px-2 py-2 shrink-0 cursor-pointer transition-colors',
          meta.solidBorder,
          active ? 'ring-2 ring-primary/30' : 'hover:shadow-sm'
        )}
      >
        <span className={cn('h-6 w-6 rounded-md flex items-center justify-center', meta.badgeBg)}>
          <TypeIcon className={cn('h-3.5 w-3.5', meta.badgeText)} />
        </span>
        <p className="text-[10px] font-semibold text-on-surface text-center leading-tight line-clamp-2">{task.title}</p>
      </button>
    </div>
  )
}
