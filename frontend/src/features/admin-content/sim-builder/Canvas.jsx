import { useState } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, GripVertical, Trash2 } from 'lucide-react'
import { blockTypeRegistry, BLOCK_GROUPS } from './blockTypeRegistry'
import { cn } from '../../../lib/cn'

/** The structured block-stack editing surface for the active page — a
 * vertical, drag-to-reorder list (not a true freeform x/y canvas; see the
 * plan's "explicitly deferred" section for why). Renders the currently
 * selected block's live `draftConfig` in place of its saved config so edits
 * in the properties panel show up here immediately (WYSIWYG). */
export default function Canvas({ page, selectedBlockId, draftConfig, onSelectBlock, onAddBlock, onDeleteBlock, onReorderBlocks }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const [pickerOpen, setPickerOpen] = useState(false)

  if (!page) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-on-surface-variant">
        Select or create a page to start building.
      </div>
    )
  }

  const blocks = page.blocks

  function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = blocks.findIndex((b) => b.id === active.id)
    const newIndex = blocks.findIndex((b) => b.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    onReorderBlocks(arrayMove(blocks, oldIndex, newIndex).map((b) => b.id))
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-8 py-10">
        <h2 className="text-xl font-bold text-on-surface mb-6">{page.title}</h2>

        {blocks.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-border p-12 text-center text-sm text-on-surface-variant mb-4">
            This page has no blocks yet.
          </div>
        ) : (
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {blocks.map((block) => (
                  <BlockRow
                    key={block.id}
                    block={block}
                    active={block.id === selectedBlockId}
                    effectiveConfig={block.id === selectedBlockId && draftConfig ? draftConfig : block.config}
                    onSelect={() => onSelectBlock(block)}
                    onDelete={() => onDeleteBlock(block)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        <div className="relative mt-4">
          <button
            onClick={() => setPickerOpen((v) => !v)}
            className="w-full flex items-center justify-center gap-1.5 text-sm font-semibold text-primary border-2 border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 rounded-xl py-3 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Add block
          </button>
          {pickerOpen && (
            <BlockPicker
              onPick={(type) => { onAddBlock(type); setPickerOpen(false) }}
              onClose={() => setPickerOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function BlockRow({ block, active, effectiveConfig, onSelect, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }
  const entry = blockTypeRegistry[block.block_type]
  const Icon = entry?.meta.icon
  const Preview = entry?.Preview

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={cn(
        'group relative rounded-xl border-2 bg-white p-4 cursor-pointer transition-colors',
        active ? 'border-primary ring-2 ring-primary/15' : 'border-transparent hover:border-border'
      )}
    >
      <div className="flex items-center gap-2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button {...attributes} {...listeners} onClick={(e) => e.stopPropagation()} className="cursor-grab active:cursor-grabbing text-on-surface-variant/50 hover:text-on-surface-variant">
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        {Icon && <Icon className="h-3 w-3 text-on-surface-variant/60" />}
        <span className="text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant/60">{entry?.meta.label}</span>
        <button onClick={(e) => { e.stopPropagation(); onDelete() }} className="ml-auto cursor-pointer">
          <Trash2 className="h-3.5 w-3.5 text-red-400" />
        </button>
      </div>
      {Preview ? <Preview config={effectiveConfig} /> : <p className="text-xs text-on-surface-variant">Unknown block type</p>}
    </div>
  )
}

function BlockPicker({ onPick, onClose }) {
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="absolute left-0 right-0 top-full mt-2 z-20 rounded-xl border border-border bg-white shadow-lg p-2">
        {BLOCK_GROUPS.map((group) => (
          <div key={group.name} className="mb-2 last:mb-0">
            <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">{group.name}</p>
            {group.types.map((type) => {
              const entry = blockTypeRegistry[type]
              const Icon = entry.meta.icon
              return (
                <button
                  key={type}
                  onClick={() => onPick(type)}
                  className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm text-on-surface hover:bg-surface-low transition-colors cursor-pointer text-left"
                >
                  <Icon className="h-4 w-4 text-on-surface-variant" />
                  {entry.meta.label}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </>
  )
}
