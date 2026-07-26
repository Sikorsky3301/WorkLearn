import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { taskTypeRegistry } from '../../../simulations/generic/taskTypeRegistry'

export const TASK_TYPES = Object.entries(taskTypeRegistry).map(([type, entry]) => ({ type, label: entry.label }))

// Steers non-sales genres away from a type that only makes sense for them.
export const PALETTE_HINTS = {
  crm_workspace: 'Renders the built-in sales CRM app — best for sales/account-management simulations. For other genres, consider Structured Form or AI Roleplay Chat instead.',
}

/** The "drag a task type onto the canvas" palette column — a `useDraggable`
 * source per task type, read by StagesTab's single shared DndContext. */
export default function StagePalette() {
  return (
    <div className="sticky top-24 space-y-2">
      <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant mb-2">Drag to add a stage</p>
      {TASK_TYPES.map((t) => <PaletteItem key={t.type} type={t.type} label={t.label} hint={PALETTE_HINTS[t.type]} />)}
    </div>
  )
}

function PaletteItem({ type, label, hint }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `palette-${type}`, data: { source: 'palette', taskType: type },
  })
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      title={hint}
      style={{ transform: CSS.Translate.toString(transform) }}
      className="cursor-grab active:cursor-grabbing rounded-lg border border-border bg-white px-3 py-2.5 text-xs font-semibold text-on-surface hover:border-primary/50 transition-colors select-none"
    >
      {label}
    </div>
  )
}
