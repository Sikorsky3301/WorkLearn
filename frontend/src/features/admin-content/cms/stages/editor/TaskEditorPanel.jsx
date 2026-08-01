import { Loader2, FileText, Lightbulb, Plus, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import { useUpdateTask } from '../../../../../hooks'
import { Input } from '../../../../../shared/ui/shadcn/input'
import { Textarea } from '../../../../../shared/ui/shadcn/textarea'
import { Label } from '../../../../../shared/ui/shadcn/label'
import { Button } from '../../../../../shared/ui/shadcn/button'
import { linesToList } from '../../shared/textListUtils'
import RubricEditor from './fields/RubricEditor'
import ReferenceDataEditor from './fields/ReferenceDataEditor'
import ModelSolutionEditor from './fields/ModelSolutionEditor'
import StructuredFormFieldsEditor from './type-editors/StructuredFormFieldsEditor'
import TextRubricEditor from './type-editors/TextRubricEditor'
import QuizEditor from './type-editors/QuizEditor'
import PersonaEditor from './type-editors/PersonaEditor'
import CrmWorkspaceEditor from './type-editors/CrmWorkspaceEditor'
import CodeSandboxEditor from './type-editors/CodeSandboxEditor'

/** Unified per-task editor — common fields (title/objective/briefing/hints/
 * success_criteria/xp/skills/rubric) plus a type-specific config section
 * dispatched to one of the `type-editors/` components below.
 *
 * `draft`/`onDraftChange` are lifted into the parent (TaskEditorWithPreview)
 * so a sibling live-preview pane can render against the same in-progress,
 * unsaved edits without a round trip. Saving no longer closes the editor —
 * it stays open so the live preview keeps working after a save. */
export default function TaskEditorPanel({ simId, draft, onDraftChange, onSaved, onClose }) {
  const updateTask = useUpdateTask(simId)

  function set(key, value) { onDraftChange({ ...draft, [key]: value }) }
  function setConfig(key, value) { onDraftChange({ ...draft, config: { ...draft.config, [key]: value } }) }

  function handleSave() {
    updateTask.mutate(
      { taskId: draft.id, ...draft },
      { onSuccess: (updated) => { toast.success('Task saved'); onSaved?.(updated) }, onError: (e) => toast.error(e.message || 'Could not save task') }
    )
  }

  return (
    <div className="py-4 space-y-6">
      <div>
        <Label className="mb-1.5 block">Title</Label>
        <Input value={draft.title} onChange={(e) => set('title', e.target.value)} />
      </div>
      <div>
        <Label className="mb-1.5 block">Objective (short)</Label>
        <Input value={draft.objective || ''} onChange={(e) => set('objective', e.target.value)} />
      </div>
      <div>
        <Label className="mb-1.5 block">Briefing (the manager's brief — shown in full to the student)</Label>
        <Textarea rows={4} value={draft.briefing || ''} onChange={(e) => set('briefing', e.target.value)} />
      </div>
      <div>
        <Label className="mb-1.5 block">What to do (one step per line)</Label>
        <Textarea rows={4} value={(draft.what_to_do || []).join('\n')} onChange={(e) => set('what_to_do', linesToList(e.target.value))} />
      </div>
      <div>
        <Label className="mb-1.5 block">What to submit (one deliverable per line)</Label>
        <Textarea rows={3} value={(draft.what_to_submit || []).join('\n')} onChange={(e) => set('what_to_submit', linesToList(e.target.value))} />
      </div>
      <div>
        <Label className="mb-1.5 block">Hints (one per line)</Label>
        <Textarea rows={3} value={(draft.hints || []).join('\n')} onChange={(e) => set('hints', linesToList(e.target.value))} />
      </div>
      <div>
        <Label className="mb-1.5 block">Success criteria (one per line)</Label>
        <Textarea rows={3} value={(draft.success_criteria || []).join('\n')} onChange={(e) => set('success_criteria', linesToList(e.target.value))} />
      </div>

      <div className="border-t border-border pt-5">
        <div className="flex items-center justify-between mb-3">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-on-surface-variant">
            <FileText className="h-3.5 w-3.5" /> Reference data
          </p>
          {!draft.reference_data && (
            <Button
              variant="ghost" size="icon" title="Add reference panel"
              onClick={() => set('reference_data', { title: '', fields: [] })}
              className="h-6 w-6 text-primary hover:text-primary-dark cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <p className="text-xs text-on-surface-variant/70 -mt-2 mb-3">Optional — a read-only case file shown next to the task.</p>
        <ReferenceDataEditor referenceData={draft.reference_data} onChange={(r) => set('reference_data', r)} />
      </div>

      <div className="border-t border-border pt-5">
        <div className="flex items-center justify-between mb-3">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-on-surface-variant">
            <Lightbulb className="h-3.5 w-3.5" /> Model solution
          </p>
          {!draft.model_solution && (
            <Button
              variant="ghost" size="icon" title="Add model solution"
              onClick={() => set('model_solution', { steps: [], key_principle: null, great_looks_like: null, example_solution: null })}
              className="h-6 w-6 text-primary hover:text-primary-dark cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <p className="text-xs text-on-surface-variant/70 -mt-2 mb-3">Optional — a click-to-reveal worked example.</p>
        <ModelSolutionEditor modelSolution={draft.model_solution} onChange={(m) => set('model_solution', m)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="mb-1.5 block">XP award</Label>
          <Input type="number" value={draft.xp_award ?? 0} onChange={(e) => set('xp_award', Number(e.target.value))} />
        </div>
        <div>
          <Label className="mb-1.5 block">Section / Week (optional — leave blank for no grouping)</Label>
          <Input
            type="number"
            value={draft.week ?? ''}
            onChange={(e) => set('week', e.target.value === '' ? null : Number(e.target.value))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label className="mb-1.5 block">Skill awards (key:points, one per line)</Label>
          <Textarea
            rows={2}
            value={Object.entries(draft.skill_awards || {}).map(([k, v]) => `${k}:${v}`).join('\n')}
            onChange={(e) => {
              const entries = linesToList(e.target.value).map((l) => l.split(':'))
              set('skill_awards', Object.fromEntries(entries.map(([k, v]) => [k.trim(), Number(v) || 0])))
            }}
          />
        </div>
      </div>

      <RubricEditor rubric={draft.rubric} onChange={(r) => set('rubric', r)} />

      <div className="border-t border-border pt-5">
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-on-surface-variant mb-3">
          <Settings2 className="h-3.5 w-3.5" /> {draft.type.replace('_', ' ')} configuration
        </p>
        {draft.type === 'structured_form' && <StructuredFormFieldsEditor fields={draft.config.fields || []} onChange={(f) => setConfig('fields', f)} />}
        {draft.type === 'text_rubric' && <TextRubricEditor config={draft.config} setConfig={setConfig} />}
        {draft.type === 'quiz' && <QuizEditor questions={draft.config.questions || []} onChange={(q) => setConfig('questions', q)} />}
        {draft.type === 'ai_roleplay_chat' && <PersonaEditor config={draft.config} setConfig={setConfig} />}
        {draft.type === 'crm_workspace' && <CrmWorkspaceEditor config={draft.config} setConfig={setConfig} />}
        {draft.type === 'code_sandbox' && <CodeSandboxEditor config={draft.config} setConfig={setConfig} />}
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <Button variant="outline" onClick={onClose}>Close</Button>
        <Button onClick={handleSave} disabled={updateTask.isPending}>
          {updateTask.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Save Task
        </Button>
      </div>
    </div>
  )
}
