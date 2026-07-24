import { useState } from 'react'
import {
  DndContext, useDraggable, useDroppable, DragOverlay, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Plus, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAdminSimulation, useCreateTask, useDeleteTask, useReorderTasks } from '../../../shared/api/hooks'
import { taskTypeRegistry } from '../../simulations/generic/taskTypeRegistry'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../../shared/ui/shadcn/sheet'
import { Button } from '../../../shared/ui/shadcn/button'
import { cn } from '../../../shared/utils/cn'
import TaskEditorPanel from './TaskEditorPanel'

const TASK_TYPES = Object.entries(taskTypeRegistry).map(([type, entry]) => ({ type, label: entry.label }))

function defaultConfigFor(type) {
  switch (type) {
    case 'structured_form': return { fields: [] }
    case 'quiz': return { questions: [] }
    case 'ai_roleplay_chat': return { persona: { name: 'Contact Name', role: 'Role', personality_prompt: 'Describe the persona here.', mood_options: ['neutral'], opening_mood: 'neutral' }, context: {}, mode: 'custom', min_messages_for_completion: 4 }
    case 'crm_workspace': return { required_entities: { accounts: 1, contacts: 1, opportunities: 1 }, pipeline_stages: ['Qualification', 'Proposal', 'Closed Won', 'Closed Lost'] }
    case 'code_sandbox': return { language: 'python', grading_strategy: 'declarative_rules', submission_mode: 'code', starter_code: '', input_filename: 'submission.py', output_filename: 'output.json', rules: [] }
    default: return {}
  }
}

/** Drag-and-drop stage builder — two independent interactions in ONE
 * DndContext (dnd-kit supports mixing free draggables + a SortableContext in
 * a single context; nesting two separate DndContexts is not well-supported):
 * (1) reordering existing tasks via @dnd-kit/sortable, (2) dragging a
 * palette entry onto the list to insert a new task of that type at the drop
 * position — same DndContext/useDraggable/useDroppable/DragOverlay pattern
 * already established in sales-crm-sim/stages/Stage5Crm/CrmPipeline.jsx. */
export default function StagesBuilderTab({ simId }) {
  const { data: sim, isLoading } = useAdminSimulation(simId)
  const createTask = useCreateTask(simId)
  const deleteTask = useDeleteTask(simId)
  const reorderTasks = useReorderTasks(simId)
  const [activeDrag, setActiveDrag] = useState(null)
  const [openTaskId, setOpenTaskId] = useState(null)
  const [localTasks, setLocalTasks] = useState(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const tasks = localTasks || sim?.tasks || []
  const openTask = tasks.find((t) => t.id === openTaskId)

  function handleDragStart(event) {
    setActiveDrag(event.active.data.current)
  }

  function handleDragEnd(event) {
    const { active, over } = event
    setActiveDrag(null)
    if (!over) return

    if (active.data.current?.source === 'palette') {
      const taskType = active.data.current.taskType
      let insertIndex = tasks.length
      if (typeof over.id === 'string' && over.id.startsWith('insert-before-')) {
        const beforeId = over.id.replace('insert-before-', '')
        insertIndex = tasks.findIndex((t) => t.id === beforeId)
        if (insertIndex === -1) insertIndex = tasks.length
      }
      const nextIndex = tasks.length ? Math.max(...tasks.map((t) => t.task_index)) + 1 : 1
      createTask.mutate(
        {
          task_index: nextIndex, title: `Untitled ${taskTypeRegistry[taskType].label}`, type: taskType,
          config: defaultConfigFor(taskType),
        },
        {
          onSuccess: (created) => {
            toast.success(`Added "${created.title}"`)
            setOpenTaskId(created.id)
            // Reflect the requested drop position locally; a real index
            // renumber happens via reorderTasks below if it's not already last.
            if (insertIndex < tasks.length) {
              const ids = [...tasks.map((t) => t.id)]
              ids.splice(insertIndex, 0, created.id)
              reorderTasks.mutate(ids)
            }
          },
          onError: (e) => toast.error(e.message || 'Could not add task'),
        }
      )
      return
    }

    // Reorder existing tasks
    if (active.id !== over.id) {
      const oldIndex = tasks.findIndex((t) => t.id === active.id)
      const newIndex = tasks.findIndex((t) => t.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return
      const reordered = arrayMove(tasks, oldIndex, newIndex)
      setLocalTasks(reordered)
      reorderTasks.mutate(reordered.map((t) => t.id), {
        onError: () => { setLocalTasks(null); toast.error('Could not reorder tasks') },
        onSuccess: () => setLocalTasks(null),
      })
    }
  }

  if (isLoading) return <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-[220px_1fr] gap-6 items-start">
        <div className="sticky top-24 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant mb-2">Drag to add a stage</p>
          {TASK_TYPES.map((t) => <PaletteItem key={t.type} type={t.type} label={t.label} />)}
        </div>

        <CanvasDroppable empty={tasks.length === 0}>
          <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onOpen={() => setOpenTaskId(task.id)}
                  onDelete={() => deleteTask.mutate(task.id, { onSuccess: () => toast.success('Task removed') })}
                />
              ))}
            </div>
          </SortableContext>
        </CanvasDroppable>
      </div>

      <DragOverlay>
        {activeDrag?.source === 'palette' ? (
          <div className="rounded-lg border border-primary bg-white shadow-lg px-3 py-2 text-xs font-semibold text-primary">
            {taskTypeRegistry[activeDrag.taskType]?.label}
          </div>
        ) : null}
      </DragOverlay>

      <Sheet open={!!openTask} onOpenChange={(open) => !open && setOpenTaskId(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{openTask?.title}</SheetTitle>
          </SheetHeader>
          {openTask && <TaskEditorPanel simId={simId} task={openTask} onClose={() => setOpenTaskId(null)} />}
        </SheetContent>
      </Sheet>
    </DndContext>
  )
}

/** The whole stage-list region (empty-state placeholder or populated list)
 * is one droppable — dropping anywhere in it that isn't over a more specific
 * per-row `insert-before-<id>` target (see TaskRow) appends to the end. */
function CanvasDroppable({ empty, children }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'stage-canvas' })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-xl transition-colors',
        empty && 'border-2 border-dashed border-border p-10 text-center text-sm text-on-surface-variant',
        empty && isOver && 'border-primary bg-primary/5',
        !empty && isOver && 'ring-2 ring-primary/30 ring-offset-2'
      )}
    >
      {empty ? 'Drag a task type from the left to add your first stage.' : children}
    </div>
  )
}

function PaletteItem({ type, label }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `palette-${type}`, data: { source: 'palette', taskType: type },
  })
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ transform: CSS.Translate.toString(transform) }}
      className="cursor-grab active:cursor-grabbing rounded-lg border border-border bg-white px-3 py-2.5 text-xs font-semibold text-on-surface hover:border-primary/50 transition-colors select-none"
    >
      {label}
    </div>
  )
}

function TaskRow({ task, onOpen, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: `insert-before-${task.id}` })

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

  return (
    <div ref={setDropRef} className={cn(isOver && 'border-t-2 border-primary')}>
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-center gap-3 rounded-lg border border-border bg-white px-3 py-3 group"
      >
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-on-surface-variant/50 hover:text-on-surface-variant">
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-bold shrink-0">
          {task.task_index}
        </span>
        <button onClick={onOpen} className="flex-1 text-left min-w-0">
          <p className="text-sm font-semibold text-on-surface truncate">{task.title}</p>
          <p className="text-xs text-on-surface-variant">{taskTypeRegistry[task.type]?.label || task.type}</p>
        </button>
        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    </div>
  )
}
