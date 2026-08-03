import { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Search, ChevronDown, ChevronRight } from 'lucide-react'
import { taskTypeRegistry } from '../../../simulations/generic/taskTypeRegistry'
import { taskTypeMeta, DEFAULT_TASK_TYPE_META } from '../shared/taskTypeMeta'

export const TASK_TYPES = Object.entries(taskTypeRegistry).map(([type, entry]) => ({ type, label: entry.label }))

// Steers non-sales genres away from a type that only makes sense for them.
export const PALETTE_HINTS = {
  crm_workspace: 'Renders the built-in sales CRM app — best for sales/account-management simulations. For other genres, consider Structured Form or AI Roleplay Chat instead.',
}

// Purely a sidebar grouping aid — doesn't touch taskTypeRegistry or the data
// model, just organizes the palette the way a builder tool groups its
// component library into labeled, collapsible sections.
const GROUPS = [
  { name: 'Content', types: ['text_rubric', 'structured_form', 'quiz'] },
  { name: 'Interactive', types: ['ai_roleplay_chat', 'crm_workspace', 'code_sandbox'] },
]

/** The "drag a task type onto the canvas" palette column — a `useDraggable`
 * source per task type, read by StagesTab's single shared DndContext.
 * Searchable + grouped into collapsible sections, mirroring a component
 * library sidebar rather than a flat list of chips. */
export default function StagePalette() {
  const [search, setSearch] = useState('')
  const [collapsedGroups, setCollapsedGroups] = useState(() => new Set())

  const query = search.trim().toLowerCase()
  const byType = Object.fromEntries(TASK_TYPES.map((t) => [t.type, t]))

  function toggleGroup(name) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  return (
    <div className="sticky top-24 space-y-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-outline pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search stage types…"
          className="w-full bg-white border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs placeholder-outline/70 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
      </div>

      <div className="space-y-4">
        {GROUPS.map((group) => {
          const items = group.types
            .map((type) => byType[type])
            .filter(Boolean)
            .filter((t) => !query || t.label.toLowerCase().includes(query))
          if (items.length === 0) return null
          const collapsed = !query && collapsedGroups.has(group.name)

          return (
            <div key={group.name}>
              <button
                onClick={() => toggleGroup(group.name)}
                className="w-full flex items-center gap-1.5 px-1 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              >
                {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {group.name}
              </button>
              {!collapsed && (
                <div className="space-y-1.5">
                  {items.map((t) => (
                    <PaletteItem key={t.type} type={t.type} label={t.label} hint={PALETTE_HINTS[t.type]} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PaletteItem({ type, label, hint }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `palette-${type}`, data: { source: 'palette', taskType: type },
  })
  const meta = taskTypeMeta[type] || DEFAULT_TASK_TYPE_META
  const TypeIcon = meta.icon

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      title={hint}
      style={{ transform: CSS.Translate.toString(transform) }}
      className="flex items-center gap-2.5 cursor-grab active:cursor-grabbing rounded-lg border border-border bg-white px-2.5 py-2 text-xs font-semibold text-on-surface hover:border-primary/50 hover:shadow-sm transition-all select-none"
    >
      <span className={`h-6 w-6 rounded-md flex items-center justify-center shrink-0 ${meta.badgeBg}`}>
        <TypeIcon className={`h-3.5 w-3.5 ${meta.badgeText}`} />
      </span>
      {label}
    </div>
  )
}
