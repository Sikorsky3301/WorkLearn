import { useState } from 'react'
import { PlayCircle } from 'lucide-react'
import QuizPreviewTask from '../../../simulations/generic/QuizPreviewTask'
import StructuredFormTask from '../../../simulations/generic/StructuredFormTask'
import CrmWorkspaceTask from '../../../simulations/generic/CrmWorkspaceTask'
import TextRubricTask from '../../../simulations/generic/TextRubricTask'
import AiRoleplayChatTask from '../../../simulations/generic/AiRoleplayChatTask'
import CodeSandboxPreviewTask from '../../../simulations/generic/CodeSandboxPreviewTask'
import MermaidDiagramTask from '../../../simulations/generic/MermaidDiagramTask'

// Mounts the REAL student-facing component for structured_form/crm_workspace
// directly against the live (unsaved) draft — no server dependency, so
// there's nothing to round-trip. `quiz` uses a preview-only wrapper instead
// of the real QuizTask — see QuizPreviewTask's own comment for why (the real
// one has no way to dismiss the quiz dialog, which traps an admin who just
// wants to preview it while editing other fields).
const CLIENT_ONLY_RENDERERS = { quiz: QuizPreviewTask, structured_form: StructuredFormTask, crm_workspace: CrmWorkspaceTask }

function noop() {}

/** Live preview of the task currently open in the Stages tab split view.
 * Three tiers, matched to what each task type actually needs — see the
 * per-branch comments below. */
export default function TaskLivePreviewPane({ simId, draft, savedTask }) {
  const ClientOnlyRenderer = CLIENT_ONLY_RENDERERS[draft.type]

  if (ClientOnlyRenderer) {
    return (
      <div className="p-4">
        <ClientOnlyRenderer task={draft} onComplete={noop} />
      </div>
    )
  }

  if (draft.type === 'code_sandbox') {
    // The code itself is typed fresh in the preview editor every time (no
    // save needed for that part), but grading rules/static files come from
    // whatever is currently persisted server-side for this task.
    return (
      <div className="p-4">
        <CodeSandboxPreviewTask simId={simId} task={savedTask} />
      </div>
    )
  }

  if (draft.type === 'mermaid_diagram' && draft.config?.grading_mode !== 'llm') {
    return (
      <div className="p-4">
        <MermaidDiagramTask task={draft} onComplete={noop} />
      </div>
    )
  }

  if (draft.type === 'text_rubric' || draft.type === 'ai_roleplay_chat' || draft.type === 'mermaid_diagram') {
    return <SaveThenTestPane simId={simId} draft={draft} savedTask={savedTask} />
  }

  return <p className="p-4 text-sm text-on-surface-variant">No live preview available for this task type.</p>
}

// text_rubric (llm)/ai_roleplay_chat need a real LLM call — too slow/costly
// to fire on every keystroke, and the server reads config from the DB, not
// from the request — so these test against the last-SAVED task on an
// explicit click rather than the live draft.
function SaveThenTestPane({ simId, draft, savedTask }) {
  const [testing, setTesting] = useState(false)
  const isDirty = JSON.stringify(draft.config) !== JSON.stringify(savedTask.config)

  if (!testing) {
    return (
      <div className="p-4 space-y-3">
        {isDirty && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            You have unsaved changes — save the task first to test the latest version.
          </p>
        )}
        <button
          onClick={() => setTesting(true)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-primary hover:bg-primary-dark px-4 py-2 rounded-lg cursor-pointer"
        >
          <PlayCircle className="h-4 w-4" /> Test this {draft.type === 'ai_roleplay_chat' ? 'persona' : 'prompt'}
        </button>
      </div>
    )
  }

  const Component = draft.type === 'ai_roleplay_chat'
    ? AiRoleplayChatTask
    : draft.type === 'mermaid_diagram'
      ? MermaidDiagramTask
      : TextRubricTask
  return (
    <div className="p-4">
      <Component simId={simId} task={savedTask} onComplete={noop} />
    </div>
  )
}
