import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ChevronDown, ChevronRight, Pencil } from 'lucide-react'
import { cn } from '../../../../shared/utils/cn'
import StageCard from './StageCard'

/** List view of the Stages canvas — week-grouped, collapsible sections of
 * StageCards inside a single SortableContext. Palette-drag-to-insert and
 * reorder are both handled by StagesTab's shared DndContext; this component
 * only renders and reports open/delete/duplicate/toggle/rename intents. */
export default function StageListView({ tasks, sim, openTaskId, collapsedWeeks, onOpen, onDelete, onDuplicate, onToggleWeek, onRenameSection }) {
  return (
    <CanvasDroppable empty={tasks.length === 0}>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {tasks.map((task, i) => {
            // A section header is inserted whenever `week` changes from the
            // previous (sorted-by-task_index) task — purely a display
            // grouping, task_index stays the only real ordering mechanism.
            // Tasks with no `week` render exactly as before, with no header.
            const showHeader = task.week != null && task.week !== tasks[i - 1]?.week
            const collapsed = task.week != null && collapsedWeeks.has(task.week)
            return (
              <div key={task.id}>
                {showHeader && (
                  <SectionHeader
                    week={task.week}
                    label={sim.section_labels?.[String(task.week)]}
                    collapsed={collapsed}
                    onToggle={() => onToggleWeek(task.week)}
                    onRename={(label) => onRenameSection(task.week, label)}
                  />
                )}
                <div className={cn(collapsed && 'hidden')}>
                  <StageCard
                    task={task}
                    active={task.id === openTaskId}
                    onOpen={() => onOpen(task)}
                    onDelete={() => onDelete(task)}
                    onDuplicate={() => onDuplicate(task)}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </SortableContext>
    </CanvasDroppable>
  )
}

/** The whole stage-list region (empty-state placeholder or populated list)
 * is one droppable — dropping anywhere in it that isn't over a more specific
 * per-row `insert-before-<id>` target (see StageCard) appends to the end. */
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

function SectionHeader({ week, label, collapsed, onToggle, onRename }) {
  const [editing, setEditing] = useState(false)
  const [draftLabel, setDraftLabel] = useState(label || `Week ${week}`)

  function commit() {
    setEditing(false)
    if (draftLabel.trim() && draftLabel.trim() !== (label || `Week ${week}`)) onRename(draftLabel.trim())
  }

  return (
    <div id={`week-section-${week}`} className="flex items-center gap-2 mt-4 mb-1.5 first:mt-0">
      <button onClick={onToggle} className="text-on-surface-variant hover:text-on-surface cursor-pointer shrink-0">
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {editing ? (
        <input
          autoFocus
          value={draftLabel}
          onChange={(e) => setDraftLabel(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
          className="input py-1 px-2 text-xs font-bold uppercase tracking-wide w-56"
        />
      ) : (
        <button onClick={() => { setDraftLabel(label || `Week ${week}`); setEditing(true) }} className="flex items-center gap-1.5 group/rename cursor-pointer">
          <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">{label || `Week ${week}`}</p>
          <Pencil className="h-3 w-3 text-on-surface-variant/0 group-hover/rename:text-on-surface-variant/60 transition-colors" />
        </button>
      )}
    </div>
  )
}
