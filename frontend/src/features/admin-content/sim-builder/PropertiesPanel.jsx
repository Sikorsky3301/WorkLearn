import { Loader2, X } from 'lucide-react'
import { blockTypeRegistry } from './blockTypeRegistry'
import { Button } from '../../../shared/ui/shadcn/button'

/** Context-aware right panel — dispatches to the selected block's config
 * editor by type, mirroring the job-sim builder's TaskEditorPanel dispatch
 * pattern exactly. Edits are local (`draftConfig`, lifted into
 * SimBuilderEditor) until Save is clicked, matching that same builder's
 * draft/save split. */
export default function PropertiesPanel({ block, draftConfig, onDraftChange, onSave, saving, onClose }) {
  if (!block) {
    return (
      <aside className="w-80 shrink-0 border-l border-border bg-white flex items-center justify-center p-6">
        <p className="text-xs text-on-surface-variant text-center">Select a block to edit its properties.</p>
      </aside>
    )
  }

  const entry = blockTypeRegistry[block.block_type]
  const Editor = entry?.Editor
  const Icon = entry?.meta.icon

  return (
    <aside className="w-80 shrink-0 border-l border-border bg-white flex flex-col">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        {Icon && <Icon className="h-4 w-4 text-primary shrink-0" />}
        <p className="text-sm font-bold text-on-surface flex-1 truncate">{entry?.meta.label || 'Block'}</p>
        <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface cursor-pointer shrink-0">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {Editor ? (
          <Editor config={draftConfig || block.config} onChange={onDraftChange} />
        ) : (
          <p className="text-xs text-on-surface-variant">No editor available for this block type.</p>
        )}
      </div>
      <div className="p-4 border-t border-border">
        <Button onClick={onSave} disabled={saving} className="w-full">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
        </Button>
      </div>
    </aside>
  )
}
