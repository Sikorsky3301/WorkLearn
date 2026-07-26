import { useSortable } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2, Copy } from 'lucide-react'
import { taskTypeRegistry } from '../../../simulations/generic/taskTypeRegistry'
import { taskTypeMeta, DEFAULT_TASK_TYPE_META } from '../shared/taskTypeMeta'
import { Button } from '../../../../shared/ui/shadcn/button'
import { cn } from '../../../../shared/utils/cn'

/** One task row in the List view — drag handle (sortable reorder), an
 * `insert-before-<id>` droppable for palette-drag-to-insert, open/duplicate/
 * delete actions, plus a type accent border + icon badge (taskTypeMeta) so
 * the task's type reads at a glance without parsing the label text. */
export default function StageCard({ task, active, onOpen, onDelete, onDuplicate }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: `insert-before-${task.id}` })
  const meta = taskTypeMeta[task.type] || DEFAULT_TASK_TYPE_META
  const TypeIcon = meta.icon

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

  return (
    <div ref={setDropRef} className={cn(isOver && 'border-t-2 border-primary')}>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'flex items-center gap-3 rounded-lg border border-l-4 bg-white px-3 py-3 group',
          meta.border,
          active ? 'border-primary ring-1 ring-primary/20' : 'border-border'
        )}
      >
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-on-surface-variant/50 hover:text-on-surface-variant">
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-bold shrink-0">
          {task.task_index}
        </span>
        <span className={cn('h-7 w-7 rounded-md flex items-center justify-center shrink-0', meta.badgeBg)}>
          <TypeIcon className={cn('h-3.5 w-3.5', meta.badgeText)} />
        </span>
        <button onClick={onOpen} className="flex-1 text-left min-w-0">
          <p className="text-sm font-semibold text-on-surface truncate">{task.title}</p>
          <p className="text-xs text-on-surface-variant">{taskTypeRegistry[task.type]?.label || task.type}</p>
        </button>
        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100" title="Duplicate task" onClick={onDuplicate}>
          <Copy className="h-4 w-4 text-on-surface-variant" />
        </Button>
        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100" title="Delete task" onClick={onDelete}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    </div>
  )
}
