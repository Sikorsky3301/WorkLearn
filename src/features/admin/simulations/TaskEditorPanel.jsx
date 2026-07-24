import { useState } from 'react'
import { Loader2, Plus, Trash2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useUpdateTask } from '../../../shared/api/hooks'
import { Input } from '../../../shared/ui/shadcn/input'
import { Textarea } from '../../../shared/ui/shadcn/textarea'
import { Label } from '../../../shared/ui/shadcn/label'
import { Button } from '../../../shared/ui/shadcn/button'
import { cn } from '../../../shared/utils/cn'

const FIELD_TYPES = ['text', 'textarea', 'number', 'select', 'slider', 'checkbox']

function linesToList(v) { return v.split('\n').map((s) => s.trim()).filter(Boolean) }

/** Unified per-task editor — common fields (title/objective/briefing/hints/
 * success_criteria/xp/skills/rubric) plus a type-specific config section.
 * One file rather than 5 separate sub-editor components (RubricBuilder/
 * StructuredFormFieldsBuilder/AiPersonaEditor/CodeSandboxEditor/
 * CrmWorkspaceEditor) — a deliberate scope simplification given the number
 * of task types; the sections below are still fully separated internally. */
export default function TaskEditorPanel({ simId, task, onClose }) {
  const [draft, setDraft] = useState(task)
  const updateTask = useUpdateTask(simId)

  function set(key, value) { setDraft((d) => ({ ...d, [key]: value })) }
  function setConfig(key, value) { setDraft((d) => ({ ...d, config: { ...d.config, [key]: value } })) }

  function handleSave() {
    updateTask.mutate(
      { taskId: task.id, ...draft },
      { onSuccess: () => { toast.success('Task saved'); onClose() }, onError: (e) => toast.error(e.message || 'Could not save task') }
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
        <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant mb-3">Reference data (optional — a read-only case file shown next to the task)</p>
        <ReferenceDataEditor referenceData={draft.reference_data} onChange={(r) => set('reference_data', r)} />
      </div>

      <div className="border-t border-border pt-5">
        <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant mb-3">Model solution (optional — a click-to-reveal worked example)</p>
        <ModelSolutionEditor modelSolution={draft.model_solution} onChange={(m) => set('model_solution', m)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="mb-1.5 block">XP award</Label>
          <Input type="number" value={draft.xp_award ?? 0} onChange={(e) => set('xp_award', Number(e.target.value))} />
        </div>
        <div>
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
        <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant mb-3">
          {draft.type.replace('_', ' ')} configuration
        </p>
        {draft.type === 'structured_form' && <StructuredFormFieldsEditor fields={draft.config.fields || []} onChange={(f) => setConfig('fields', f)} />}
        {draft.type === 'text_rubric' && <TextRubricEditor config={draft.config} setConfig={setConfig} />}
        {draft.type === 'quiz' && <QuizEditor questions={draft.config.questions || []} onChange={(q) => setConfig('questions', q)} />}
        {draft.type === 'ai_roleplay_chat' && <PersonaEditor config={draft.config} setConfig={setConfig} />}
        {draft.type === 'crm_workspace' && <CrmWorkspaceEditor config={draft.config} setConfig={setConfig} />}
        {draft.type === 'code_sandbox' && <CodeSandboxEditor config={draft.config} setConfig={setConfig} />}
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={updateTask.isPending}>
          {updateTask.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Save Task
        </Button>
      </div>
    </div>
  )
}

// ── Rubric (shared by any type) ──────────────────────────────────────────────
function RubricEditor({ rubric, onChange }) {
  const rows = Object.entries(rubric || {})
  const sum = rows.reduce((s, [, w]) => s + w, 0)

  function updateRow(i, key, value) {
    const next = [...rows]
    next[i] = [key, value]
    onChange(Object.fromEntries(next))
  }
  function addRow() { onChange({ ...(rubric || {}), '': 0 }) }
  function removeRow(i) {
    const next = rows.filter((_, idx) => idx !== i)
    onChange(Object.fromEntries(next))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <Label>Rubric (optional — shown as "scored on" badges)</Label>
        <button type="button" onClick={addRow} className="text-xs text-primary font-semibold flex items-center gap-1"><Plus className="h-3 w-3" /> Add category</button>
      </div>
      {rows.map(([key, weight], i) => (
        <div key={i} className="flex items-center gap-2 mb-1.5">
          <Input value={key} placeholder="category" onChange={(e) => updateRow(i, e.target.value, weight)} className="flex-1" />
          <Input type="number" step="0.1" value={weight} onChange={(e) => updateRow(i, key, Number(e.target.value))} className="w-24" />
          <button onClick={() => removeRow(i)}><Trash2 className="h-4 w-4 text-red-400" /></button>
        </div>
      ))}
      {rows.length > 0 && (
        <p className={cn('text-xs', Math.abs(sum - 1) < 1e-6 ? 'text-emerald-600' : 'text-amber-600')}>
          Weights sum to {sum.toFixed(2)} {Math.abs(sum - 1) >= 1e-6 && '(must equal 1.0 to save)'}
        </p>
      )}
    </div>
  )
}

// ── Reference data (optional, any type) ──────────────────────────────────────
function ReferenceDataEditor({ referenceData, onChange }) {
  const title = referenceData?.title || ''
  const fields = referenceData?.fields || []
  const hasContent = referenceData != null

  function update(patch) { onChange({ title, fields, ...patch }) }
  function updateField(i, patch) {
    const next = [...fields]; next[i] = { ...next[i], ...patch }
    update({ fields: next })
  }
  function addField() { update({ fields: [...fields, { label: '', value: '' }] }) }
  function removeField(i) { update({ fields: fields.filter((_, idx) => idx !== i) }) }
  function clear() { onChange(null) }

  if (!hasContent) {
    return (
      <button type="button" onClick={() => update({})} className="text-xs text-primary font-semibold flex items-center gap-1">
        <Plus className="h-3 w-3" /> Add reference panel
      </button>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Input value={title} placeholder="Panel title, e.g. Lead File — Acme Corp" onChange={(e) => update({ title: e.target.value })} className="flex-1" />
        <button type="button" onClick={clear} className="text-xs text-red-500 shrink-0">Remove panel</button>
      </div>
      {fields.map((f, i) => {
        const isTags = Array.isArray(f.value)
        return (
          <div key={i} className="border border-border rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Input value={f.label} placeholder="Field label, e.g. Industry" onChange={(e) => updateField(i, { label: e.target.value })} className="flex-1" />
              <label className="flex items-center gap-1.5 text-xs text-on-surface-variant shrink-0">
                <input type="checkbox" checked={isTags} onChange={(e) => updateField(i, { value: e.target.checked ? [] : '' })} /> list
              </label>
              <button onClick={() => removeField(i)}><Trash2 className="h-4 w-4 text-red-400" /></button>
            </div>
            {isTags ? (
              <Textarea rows={2} value={(f.value || []).join('\n')} placeholder="One item per line" onChange={(e) => updateField(i, { value: linesToList(e.target.value) })} />
            ) : (
              <Textarea rows={2} value={f.value || ''} placeholder="Paragraph text" onChange={(e) => updateField(i, { value: e.target.value })} />
            )}
          </div>
        )
      })}
      <button type="button" onClick={addField} className="text-xs text-primary font-semibold flex items-center gap-1"><Plus className="h-3 w-3" /> Add field</button>
    </div>
  )
}

// ── Model solution (optional, any type) ──────────────────────────────────────
function ModelSolutionEditor({ modelSolution, onChange }) {
  const steps = modelSolution?.steps || []
  const keyPrinciple = modelSolution?.key_principle || ''
  const greatLooksLike = modelSolution?.great_looks_like || ''
  const exampleSolution = modelSolution?.example_solution || ''
  const hasContent = !!modelSolution

  function update(patch) {
    onChange({ steps, key_principle: keyPrinciple || null, great_looks_like: greatLooksLike || null, example_solution: exampleSolution || null, ...patch })
  }
  function updateStep(i, patch) {
    const next = [...steps]; next[i] = { ...next[i], ...patch }
    update({ steps: next })
  }
  function addStep() { update({ steps: [...steps, { title: '', detail: '', example: '' }] }) }
  function removeStep(i) { update({ steps: steps.filter((_, idx) => idx !== i) }) }
  function clear() { onChange(null) }

  if (!hasContent) {
    return (
      <button type="button" onClick={() => onChange({ steps: [], key_principle: null, great_looks_like: null, example_solution: null })} className="text-xs text-primary font-semibold flex items-center gap-1">
        <Plus className="h-3 w-3" /> Add model solution
      </button>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button type="button" onClick={clear} className="text-xs text-red-500">Remove model solution</button>
      </div>

      <div className="space-y-2">
        <Label>Walkthrough steps</Label>
        {steps.map((s, i) => (
          <div key={i} className="border border-border rounded-lg p-3 space-y-2">
            <Input value={s.title || ''} placeholder="Step title" onChange={(e) => updateStep(i, { title: e.target.value })} />
            <Textarea rows={2} value={s.detail || ''} placeholder="Why this step matters" onChange={(e) => updateStep(i, { detail: e.target.value })} />
            <Textarea rows={2} className="font-mono text-xs" value={s.example || ''} placeholder="Optional code/example snippet for this step" onChange={(e) => updateStep(i, { example: e.target.value })} />
            <button onClick={() => removeStep(i)} className="text-xs text-red-500 flex items-center gap-1"><Trash2 className="h-3.5 w-3.5" /> Remove step</button>
          </div>
        ))}
        <button type="button" onClick={addStep} className="text-xs text-primary font-semibold flex items-center gap-1"><Plus className="h-3 w-3" /> Add step</button>
      </div>

      <div>
        <Label className="mb-1.5 block">Key principle (optional)</Label>
        <Textarea rows={2} value={keyPrinciple} onChange={(e) => update({ key_principle: e.target.value || null })} />
      </div>
      <div>
        <Label className="mb-1.5 block">What great looks like (optional)</Label>
        <Textarea rows={2} value={greatLooksLike} onChange={(e) => update({ great_looks_like: e.target.value || null })} />
      </div>
      <div>
        <Label className="mb-1.5 block">Full example solution (optional — code or a complete worked example)</Label>
        <Textarea rows={6} className="font-mono text-xs" value={exampleSolution} onChange={(e) => update({ example_solution: e.target.value || null })} />
      </div>
    </div>
  )
}

// ── structured_form / text_rubric fields ─────────────────────────────────────
function FieldListEditor({ fields, onChange }) {
  function update(i, patch) {
    const next = [...fields]
    next[i] = { ...next[i], ...patch }
    onChange(next)
  }
  function add() { onChange([...fields, { key: `field_${fields.length + 1}`, label: 'New field', type: 'text', required: false }]) }
  function remove(i) { onChange(fields.filter((_, idx) => idx !== i)) }

  return (
    <div className="space-y-2">
      {fields.map((f, i) => (
        <div key={i} className="border border-border rounded-lg p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Input value={f.key} placeholder="key" onChange={(e) => update(i, { key: e.target.value })} />
            <Input value={f.label} placeholder="Label" onChange={(e) => update(i, { label: e.target.value })} />
          </div>
          <div className="flex items-center gap-2">
            <select value={f.type} onChange={(e) => update(i, { type: e.target.value })} className="text-sm border border-border rounded-md px-2 py-1.5">
              {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            {f.type === 'select' && (
              <Input
                value={(f.options || []).join(', ')}
                placeholder="options, comma separated"
                onChange={(e) => update(i, { options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                className="flex-1"
              />
            )}
            <label className="flex items-center gap-1.5 text-xs text-on-surface-variant shrink-0">
              <input type="checkbox" checked={!!f.required} onChange={(e) => update(i, { required: e.target.checked })} /> required
            </label>
            <button onClick={() => remove(i)} className="ml-auto"><Trash2 className="h-4 w-4 text-red-400" /></button>
          </div>
        </div>
      ))}
      <button type="button" onClick={add} className="text-xs text-primary font-semibold flex items-center gap-1"><Plus className="h-3 w-3" /> Add field</button>
    </div>
  )
}

function StructuredFormFieldsEditor({ fields, onChange }) {
  return <FieldListEditor fields={fields} onChange={onChange} />
}

function TextRubricEditor({ config, setConfig }) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-1.5 block">Grading mode</Label>
        <div className="flex gap-1.5">
          {['manual', 'llm'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setConfig('grading_mode', m)}
              className={cn('rounded-md border px-3 py-1.5 text-xs font-medium', config.grading_mode === m ? 'border-primary bg-primary/10 text-primary' : 'border-border text-on-surface-variant')}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      {config.grading_mode === 'llm' && (
        <div>
          <Label className="mb-1.5 block">LLM judge prompt (use {'{text}'} for the submission)</Label>
          <Textarea rows={6} value={config.llm_judge_prompt || ''} onChange={(e) => setConfig('llm_judge_prompt', e.target.value)} />
        </div>
      )}
      <div>
        <Label className="mb-1.5 block">Named fields (optional — leave empty for one free-text box)</Label>
        <FieldListEditor fields={config.fields || []} onChange={(f) => setConfig('fields', f)} />
      </div>
    </div>
  )
}

// ── quiz ──────────────────────────────────────────────────────────────────
function QuizEditor({ questions, onChange }) {
  function update(i, patch) {
    const next = [...questions]
    next[i] = { ...next[i], ...patch }
    onChange(next)
  }
  function add() { onChange([...questions, { question: '', options: ['', ''], correct: 0 }]) }
  function remove(i) { onChange(questions.filter((_, idx) => idx !== i)) }

  return (
    <div className="space-y-3">
      {questions.map((q, i) => (
        <div key={i} className="border border-border rounded-lg p-3 space-y-2">
          <Input value={q.question} placeholder="Question" onChange={(e) => update(i, { question: e.target.value })} />
          {(q.options || []).map((opt, oi) => (
            <div key={oi} className="flex items-center gap-2">
              <input type="radio" checked={q.correct === oi} onChange={() => update(i, { correct: oi })} />
              <Input
                value={opt}
                placeholder={`Option ${oi + 1}`}
                onChange={(e) => {
                  const opts = [...q.options]; opts[oi] = e.target.value
                  update(i, { options: opts })
                }}
              />
            </div>
          ))}
          <button type="button" onClick={() => update(i, { options: [...(q.options || []), ''] })} className="text-xs text-primary">+ option</button>
          <button onClick={() => remove(i)} className="text-xs text-red-500 ml-3">Remove question</button>
        </div>
      ))}
      <button type="button" onClick={add} className="text-xs text-primary font-semibold flex items-center gap-1"><Plus className="h-3 w-3" /> Add question</button>
    </div>
  )
}

// ── ai_roleplay_chat ─────────────────────────────────────────────────────────
function PersonaEditor({ config, setConfig }) {
  const persona = config.persona || {}
  function setPersona(key, value) { setConfig('persona', { ...persona, [key]: value }) }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><Label className="mb-1.5 block">Name</Label><Input value={persona.name || ''} onChange={(e) => setPersona('name', e.target.value)} /></div>
        <div><Label className="mb-1.5 block">Role</Label><Input value={persona.role || ''} onChange={(e) => setPersona('role', e.target.value)} /></div>
      </div>
      <div>
        <Label className="mb-1.5 block">Personality prompt</Label>
        <Textarea rows={5} value={persona.personality_prompt || ''} onChange={(e) => setPersona('personality_prompt', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="mb-1.5 block">Mode</Label>
          <select value={config.mode || 'custom'} onChange={(e) => setConfig('mode', e.target.value)} className="w-full text-sm border border-border rounded-md px-2 py-1.5">
            {['discovery', 'objection', 'custom'].map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <Label className="mb-1.5 block">Min. messages to complete</Label>
          <Input type="number" value={config.min_messages_for_completion ?? 4} onChange={(e) => setConfig('min_messages_for_completion', Number(e.target.value))} />
        </div>
      </div>
      <div>
        <Label className="mb-1.5 block">Context (key: value, one per line)</Label>
        <Textarea
          rows={2}
          value={Object.entries(config.context || {}).map(([k, v]) => `${k}: ${v}`).join('\n')}
          onChange={(e) => {
            const entries = linesToList(e.target.value).map((l) => l.split(':').map((s) => s.trim()))
            setConfig('context', Object.fromEntries(entries.filter(([k]) => k)))
          }}
        />
      </div>
    </div>
  )
}

// ── crm_workspace ─────────────────────────────────────────────────────────
function CrmWorkspaceEditor({ config, setConfig }) {
  const required = config.required_entities || {}
  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-1.5 block">Required entities (key:count, one per line)</Label>
        <Textarea
          rows={3}
          value={Object.entries(required).map(([k, v]) => `${k}:${v}`).join('\n')}
          onChange={(e) => {
            const entries = linesToList(e.target.value).map((l) => l.split(':'))
            setConfig('required_entities', Object.fromEntries(entries.map(([k, v]) => [k.trim(), Number(v) || 1])))
          }}
        />
      </div>
      <div>
        <Label className="mb-1.5 block">Pipeline stages (one per line)</Label>
        <Textarea rows={4} value={(config.pipeline_stages || []).join('\n')} onChange={(e) => setConfig('pipeline_stages', linesToList(e.target.value))} />
      </div>
    </div>
  )
}

// ── code_sandbox ─────────────────────────────────────────────────────────
function CodeSandboxEditor({ config, setConfig }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="mb-1.5 block">Language</Label>
          <select value={config.language || 'python'} onChange={(e) => setConfig('language', e.target.value)} className="w-full text-sm border border-border rounded-md px-2 py-1.5">
            {['python', 'javascript', 'jsx', 'html', 'text'].map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <Label className="mb-1.5 block">Grading strategy</Label>
          <select value={config.grading_strategy || 'declarative_rules'} onChange={(e) => setConfig('grading_strategy', e.target.value)} className="w-full text-sm border border-border rounded-md px-2 py-1.5">
            <option value="declarative_rules">Declarative rules (no-code)</option>
            <option value="registered_grader">Registered developer grader</option>
          </select>
        </div>
      </div>

      {config.grading_strategy === 'registered_grader' ? (
        <div>
          <Label className="mb-1.5 block">Grader key</Label>
          <Input value={config.grader_key || ''} onChange={(e) => setConfig('grader_key', e.target.value)} placeholder="e.g. da_job_sim.task1_cleaning" />
          <p className="text-xs text-on-surface-variant mt-1">Must match a key already registered in GRADER_REGISTRY — this is a developer-maintained list, not free text in production use.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              Declarative-rules tasks grade against static expected values shared by every candidate — not
              per-candidate randomized data like the built-in graders. Don't use this for high-stakes assessments
              where answer-sharing between candidates is a concern.
            </p>
          </div>
          <RulesEditor rules={config.rules || []} onChange={(r) => setConfig('rules', r)} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div><Label className="mb-1.5 block">Input filename</Label><Input value={config.input_filename || ''} onChange={(e) => setConfig('input_filename', e.target.value)} /></div>
        <div><Label className="mb-1.5 block">Output filename</Label><Input value={config.output_filename || ''} onChange={(e) => setConfig('output_filename', e.target.value)} /></div>
      </div>
      <div>
        <Label className="mb-1.5 block">Starter code</Label>
        <Textarea rows={8} className="font-mono text-xs" value={config.starter_code || ''} onChange={(e) => setConfig('starter_code', e.target.value)} />
      </div>
    </div>
  )
}

const RULE_OPS = ['equals', 'tolerance', 'range', 'regex', 'array_contains', 'row_count_min', 'row_count_range']

function RulesEditor({ rules, onChange }) {
  const sum = rules.reduce((s, r) => s + (r.points || 0), 0)
  function update(i, patch) {
    const next = [...rules]; next[i] = { ...next[i], ...patch }; onChange(next)
  }
  function add() { onChange([...rules, { id: `rule-${rules.length + 1}`, label: '', field: '', op: 'equals', points: 0 }]) }
  function remove(i) { onChange(rules.filter((_, idx) => idx !== i)) }

  return (
    <div className="space-y-2">
      <Label>Grading rules (points must sum to 100)</Label>
      {rules.map((r, i) => (
        <div key={i} className="border border-border rounded-lg p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Input value={r.label} placeholder="Label" onChange={(e) => update(i, { label: e.target.value })} />
            <Input value={r.field} placeholder="field path e.g. summary.total" onChange={(e) => update(i, { field: e.target.value })} />
          </div>
          <div className="flex items-center gap-2">
            <select value={r.op} onChange={(e) => update(i, { op: e.target.value })} className="text-sm border border-border rounded-md px-2 py-1.5">
              {RULE_OPS.map((op) => <option key={op} value={op}>{op}</option>)}
            </select>
            <Input value={r.expected ?? ''} placeholder="expected value" onChange={(e) => update(i, { expected: e.target.value })} className="flex-1" />
            <Input type="number" value={r.points || 0} onChange={(e) => update(i, { points: Number(e.target.value) })} className="w-20" placeholder="pts" />
            <button onClick={() => remove(i)}><Trash2 className="h-4 w-4 text-red-400" /></button>
          </div>
        </div>
      ))}
      <button type="button" onClick={add} className="text-xs text-primary font-semibold flex items-center gap-1"><Plus className="h-3 w-3" /> Add rule</button>
      {rules.length > 0 && (
        <p className={cn('text-xs', sum === 100 ? 'text-emerald-600' : 'text-amber-600')}>Points sum to {sum} {sum !== 100 && '(must equal 100 to save)'}</p>
      )}
    </div>
  )
}
