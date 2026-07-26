import { useState } from 'react'
import TaskEditorPanel from './editor/TaskEditorPanel'
import TaskLivePreviewPane from './TaskLivePreviewPane'

/** Editor + live-preview split, rendered as the 3rd column of the Stages tab
 * once a task is selected — replaces the old disconnected Sheet overlay.
 * Owns `draft` (in-progress, unsaved edits) and `savedTask` (last-persisted
 * copy, used by the two AI task types' "test" affordance) so both halves
 * stay in sync without extra plumbing in the parent. Render with
 * `key={task.id}` from the caller so switching tasks resets this state
 * instead of carrying over the previous task's draft. */
export default function TaskEditorWithPreview({ simId, task, onClose }) {
  const [draft, setDraft] = useState(task)
  const [savedTask, setSavedTask] = useState(task)

  return (
    <div className="grid grid-cols-2 h-full min-h-0">
      <div className="overflow-y-auto px-5 border-r border-border">
        <TaskEditorPanel
          simId={simId}
          draft={draft}
          onDraftChange={setDraft}
          onSaved={(updated) => { setSavedTask(updated); setDraft(updated) }}
          onClose={onClose}
        />
      </div>
      <div className="overflow-y-auto bg-surface-low">
        <p className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant px-4 pt-4">
          Live preview — what a student sees
        </p>
        <TaskLivePreviewPane simId={simId} draft={draft} savedTask={savedTask} />
      </div>
    </div>
  )
}
