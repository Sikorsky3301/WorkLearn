import { useState } from 'react'
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { Loader2, X, LayoutList, Workflow } from 'lucide-react'
import { toast } from 'sonner'
import { useAdminSimulation, useCreateTask, useDeleteTask, useDuplicateTask, useReorderTasks, useUpdateSimulation } from '../../../../hooks'
import { taskTypeRegistry } from '../../../simulations/generic/taskTypeRegistry'
import { cn } from '../../../../lib/cn'
import { useResizableWidth } from '../shared/useResizableWidth'
import ResizeHandle from '../shared/ResizeHandle'
import StagePalette from '../stages/StagePalette'
import StageListView from '../stages/StageListView'
import StageFlowOverview from '../stages/StageFlowOverview'
import TaskEditorWithPreview from '../stages/TaskEditorWithPreview'
import WeekPillStrip from '../stages/WeekPillStrip'

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
export default function StagesTab({ simId }) {
  const { data: sim, isLoading } = useAdminSimulation(simId)
  const createTask = useCreateTask(simId)
  const deleteTask = useDeleteTask(simId)
  const duplicateTask = useDuplicateTask(simId)
  const reorderTasks = useReorderTasks(simId)
  const updateSimulation = useUpdateSimulation(simId)
  const [activeDrag, setActiveDrag] = useState(null)
  const [openTaskId, setOpenTaskId] = useState(null)
  const [localTasks, setLocalTasks] = useState(null)
  const [collapsedWeeks, setCollapsedWeeks] = useState(() => new Set())
  const [viewMode, setViewMode] = useState('list')
  const [paletteWidth, startPaletteResize] = useResizableWidth({ initial: 220, min: 160, max: 320 })
  // This panel splits internally into two columns (form fields | live
  // preview, see TaskEditorWithPreview.jsx's grid-cols-2) — needs real room
  // on each side, not just a "sidebar" width, or both halves crush into
  // unreadable single-word-wrapped columns.
  const [editorWidth, startEditorResize] = useResizableWidth({ initial: 640, min: 480, max: 900, reverse: true })

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

  function toggleWeek(week) {
    setCollapsedWeeks((prev) => {
      const next = new Set(prev)
      next.has(week) ? next.delete(week) : next.add(week)
      return next
    })
  }

  function expandWeek(week) {
    setCollapsedWeeks((prev) => {
      if (!prev.has(week)) return prev
      const next = new Set(prev)
      next.delete(week)
      return next
    })
  }

  function renameSection(week, label) {
    updateSimulation.mutate({ section_labels: { ...(sim.section_labels || {}), [String(week)]: label } })
  }

  function handleDeleteTask(task) {
    deleteTask.mutate(task.id, { onSuccess: () => toast.success('Task removed') })
  }

  function handleDuplicateTask(task) {
    duplicateTask.mutate(task.id, {
      onSuccess: (copy) => { toast.success(`Duplicated "${task.title}"`); setOpenTaskId(copy.id) },
      onError: (e) => toast.error(e.message || 'Could not duplicate task'),
    })
  }

  if (isLoading) return <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div id="cms-stages-top" />
      <div className="flex items-start justify-between gap-3 mb-1">
        <WeekPillStrip tasks={tasks} sim={sim} collapsedWeeks={collapsedWeeks} onSelectWeek={expandWeek} />
        <div className="flex items-center gap-0.5 rounded-lg border border-border bg-white p-0.5 shrink-0">
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
              viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:text-on-surface'
            )}
          >
            <LayoutList className="h-3.5 w-3.5" /> List
          </button>
          <button
            onClick={() => setViewMode('flow')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
              viewMode === 'flow' ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:text-on-surface'
            )}
          >
            <Workflow className="h-3.5 w-3.5" /> Flow
          </button>
        </div>
      </div>

      <div
        className="grid items-start"
        style={{
          gridTemplateColumns: openTask
            ? `${paletteWidth}px 16px minmax(0,1fr) 16px ${editorWidth}px`
            : `${paletteWidth}px 16px minmax(0,1fr)`,
        }}
      >
        <StagePalette />
        <ResizeHandle onMouseDown={startPaletteResize} />

        {viewMode === 'flow' ? (
          <div className="rounded-xl border border-border bg-white p-3">
            <StageFlowOverview tasks={tasks} sim={sim} openTaskId={openTaskId} onOpen={(task) => setOpenTaskId(task.id)} />
          </div>
        ) : (
          <StageListView
            tasks={tasks}
            sim={sim}
            openTaskId={openTaskId}
            collapsedWeeks={collapsedWeeks}
            onOpen={(task) => setOpenTaskId(task.id)}
            onDelete={handleDeleteTask}
            onDuplicate={handleDuplicateTask}
            onToggleWeek={toggleWeek}
            onRenameSection={renameSection}
          />
        )}

        {openTask && (
          <>
            <ResizeHandle onMouseDown={startEditorResize} />
            <div className="sticky top-24 h-[75vh] rounded-xl border border-border bg-white overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border shrink-0">
                <p className="text-sm font-bold text-on-surface truncate">{openTask.title}</p>
                <button onClick={() => setOpenTaskId(null)} className="text-on-surface-variant hover:text-on-surface shrink-0 cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 min-h-0">
                <TaskEditorWithPreview key={openTask.id} simId={simId} task={openTask} onClose={() => setOpenTaskId(null)} />
              </div>
            </div>
          </>
        )}
      </div>

      <DragOverlay>
        {activeDrag?.source === 'palette' ? (
          <div className="rounded-lg border border-primary bg-white shadow-lg px-3 py-2 text-xs font-semibold text-primary">
            {taskTypeRegistry[activeDrag.taskType]?.label}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
