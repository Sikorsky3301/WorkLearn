import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  FileText, BookOpen, ClipboardCheck, Terminal, Scale, Award, Loader2, Check,
  Eye, EyeOff,
} from 'lucide-react'
import { cn } from '../../../../lib/cn'
import { useUpdateTask } from '../../../../hooks'
import { Field, TextInput, TextArea, LineList, Section, Note } from '../editors/Fields'
import ExplainerEditor from '../editors/ExplainerEditor'
import AssessmentEditor from '../editors/AssessmentEditor'
import SandboxEditor from '../editors/SandboxEditor'
import GradingEditor from '../editors/GradingEditor'
import PersonaEditor from '../../cms/stages/editor/type-editors/PersonaEditor'
import CrmWorkspaceEditor from '../../cms/stages/editor/type-editors/CrmWorkspaceEditor'
import TextRubricEditor from '../../cms/stages/editor/type-editors/TextRubricEditor'
import StructuredFormFieldsEditor from '../../cms/stages/editor/type-editors/StructuredFormFieldsEditor'
import ModelSolutionEditor from '../../cms/stages/editor/fields/ModelSolutionEditor'
import TaskLivePreviewPane from '../../cms/stages/TaskLivePreviewPane'
import { isFinalAssessment } from '../lib/simFormat'

// One task, as a page with tabs — which is the shape of the thing being
// authored, not a compromise.
//
// The old editor was ONE scrolling column holding every field a task can have:
// title, objective, briefing, four one-per-line lists, reference data, model
// solution, XP, week, skills, rubric, then the type config. Roughly forty
// controls with no order and no grouping, in a resizable side panel.
//
// The tabs below are the actual stages of writing a task, and they are the
// same stages the student meets in reverse: the brief they read, the explainer
// they follow, the check that gates them, the machine they work on, and how it
// is scored. A tab only appears when it means something for this task's type,
// so a quiz never shows a sandbox tab and a roleplay never shows grading rules.

const TABS = [
  { key: 'brief', label: 'Brief', icon: FileText },
  { key: 'explainer', label: 'Explainer', icon: BookOpen },
  { key: 'check', label: 'Check', icon: ClipboardCheck },
  { key: 'sandbox', label: 'Sandbox', icon: Terminal },
  { key: 'grading', label: 'Grading', icon: Scale },
  { key: 'rewards', label: 'Rewards', icon: Award },
]

function tabsFor(task) {
  if (isFinalAssessment(task)) return ['brief', 'check', 'rewards']
  const tabs = ['brief', 'explainer', 'check']
  if (task.type === 'code_sandbox') tabs.push('sandbox', 'grading')
  if (['text_rubric', 'structured_form', 'ai_roleplay_chat', 'crm_workspace'].includes(task.type)) {
    tabs.push('grading')
  }
  tabs.push('rewards')
  return tabs
}

/** A dot on a tab means "there is something here", so an author can see at a
 *  glance which parts of a task have been written without opening each one. */
function filledness(task, tab) {
  const c = task.config || {}
  switch (tab) {
    case 'brief': return !!task.briefing?.trim()
    case 'explainer': return !!(c.explainer?.situation?.trim() || c.explainer?.steps?.length)
    case 'check': return (c.assessment?.questions?.length ?? 0) > 0
    case 'sandbox': return !!(c.output_filename && (c.starter_code || c.submission_mode === 'text'))
    case 'grading':
      return c.grading_strategy === 'registered_grader' ? !!c.grader_key : (c.rules?.length ?? 0) > 0
    case 'rewards': return !!task.xp_award
    default: return false
  }
}

export default function TaskPage({ simId, task, catalog, format, onDirtyChange }) {
  const [draft, setDraft] = useState(task)
  const [tab, setTab] = useState('brief')
  // The preview mounts the REAL student component against the unsaved
  // draft, so it is a preview of what is being typed, not of what was last
  // saved. Off by default: it halves the writing column, and most of the
  // time an author is writing prose rather than checking a render.
  const [preview, setPreview] = useState(false)
  const updateTask = useUpdateTask(simId)
  const final = isFinalAssessment(draft)
  const available = useMemo(() => tabsFor(draft), [draft])

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(task), [draft, task])
  useEffect(() => { onDirtyChange?.(dirty) }, [dirty, onDirtyChange])

  // Switching tasks remounts via key, so this only fires when the SERVER copy
  // changes under an open editor (a refetch after a save elsewhere). Taking
  // the server's version would throw away whatever is being typed, so an
  // edited draft wins and the save button stays the way back to agreement.
  useEffect(() => {
    setDraft((d) => (dirty ? d : task))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task])

  useEffect(() => {
    if (!available.includes(tab)) setTab(available[0])
  }, [available, tab])

  function set(key, value) { setDraft((d) => ({ ...d, [key]: value })) }
  function setConfig(key, value) {
    setDraft((d) => ({ ...d, config: { ...(d.config || {}), [key]: value } }))
  }

  function save() {
    updateTask.mutate(
      { taskId: draft.id, ...draft },
      {
        onSuccess: (updated) => { setDraft(updated); toast.success('Saved') },
        onError: (e) => toast.error(e.message || 'Could not save this task'),
      }
    )
  }

  // Ctrl/Cmd-S, because this is a long editing session and the save button is
  // at the top of a page that scrolls.
  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        if (dirty) save()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* ── Page head: what this is, and the save state ─────────────────── */}
      <div className="shrink-0 border-b border-border bg-white px-8 pt-6">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-outline">
              {final ? 'Final assessment' : `Task ${draft.task_index}`}
              {draft.week != null && ` · Week ${draft.week}`}
            </p>
            <input
              value={draft.title || ''}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Untitled task"
              className="mt-1 w-full border-0 bg-transparent p-0 font-display text-[1.6rem] font-extrabold leading-tight tracking-tight text-on-surface outline-none placeholder:text-outline/50"
            />
          </div>
          <div className="mt-4 flex shrink-0 items-center gap-2">
          <button
            onClick={() => setPreview((v) => !v)}
            title={preview ? 'Hide the student preview' : 'Show what a student sees'}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[0.78rem] font-bold transition-colors cursor-pointer',
              preview
                ? 'border-on-surface bg-on-surface text-white'
                : 'border-border text-on-surface-variant hover:border-on-surface/30 hover:text-on-surface'
            )}
          >
            {preview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            Preview
          </button>
          <button
            onClick={save}
            disabled={!dirty || updateTask.isPending}
            className={cn(
              'inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-[0.82rem] font-bold transition-colors',
              dirty
                ? 'bg-on-surface text-white hover:bg-primary cursor-pointer'
                : 'bg-surface-low text-outline cursor-default'
            )}
          >
            {updateTask.isPending
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : dirty ? null : <Check className="h-3.5 w-3.5" />}
            {updateTask.isPending ? 'Saving' : dirty ? 'Save changes' : 'Saved'}
          </button>
          </div>
        </div>

        <div className="mt-5 flex gap-1 overflow-x-auto">
          {TABS.filter((t) => available.includes(t.key)).map((t) => {
            const active = tab === t.key
            const filled = filledness(draft, t.key)
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  'relative flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-[0.8rem] font-bold transition-colors cursor-pointer',
                  active
                    ? 'border-on-surface text-on-surface'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                )}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    filled ? 'bg-emerald-500' : 'bg-outline/25'
                  )}
                  title={filled ? 'Has content' : 'Empty'}
                />
              </button>
            )
          })}
        </div>
      </div>

      {/* ── The tab ─────────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1">
      <div className="min-h-0 flex-1 overflow-y-auto px-8 py-7">
        <div className={cn('space-y-8', preview ? 'max-w-none' : 'max-w-3xl')}>
          {tab === 'brief' && <BriefTab draft={draft} set={set} final={final} catalog={catalog} />}

          {tab === 'explainer' && (
            <ExplainerEditor
              explainer={draft.config?.explainer}
              onChange={(v) => setConfig('explainer', v)}
              taskType={draft.type}
            />
          )}

          {tab === 'check' && (
            <AssessmentEditor
              assessment={draft.config?.assessment}
              onChange={(v) => {
                setDraft((d) => ({
                  ...d,
                  config: {
                    ...(d.config || {}),
                    assessment: v,
                    // The final exam mirrors two of the bank's values onto the
                    // task config, because the roadmap reads them from there
                    // without loading the (stripped) bank.
                    ...(final ? { pass_mark: v.pass_mark, question_count: v.questions?.length ?? 0 } : {}),
                  },
                }))
              }}
              isFinal={final}
              targetCount={final ? format.final_question_count : format.mini_assessment_questions}
              defaultPassMark={final ? format.final_pass_mark : format.mini_pass_mark}
            />
          )}

          {tab === 'sandbox' && (
            <SandboxEditor config={draft.config || {}} setConfig={setConfig} catalog={catalog} />
          )}

          {tab === 'grading' && (
            <GradingTab draft={draft} setConfig={setConfig} set={set} catalog={catalog} />
          )}

          {tab === 'rewards' && <RewardsTab draft={draft} set={set} catalog={catalog} />}
        </div>
      </div>

      {preview && (
        <aside className="hidden w-[26rem] shrink-0 flex-col border-l border-border bg-surface-low xl:flex">
          <p className="shrink-0 border-b border-border px-4 py-2.5 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
            What a student sees
          </p>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <TaskLivePreviewPane simId={simId} draft={draft} savedTask={task} />
          </div>
        </aside>
      )}
      </div>
    </div>
  )
}

function BriefTab({ draft, set, final, catalog }) {
  const typeMeta = catalog?.task_types?.find((t) => t.type === draft.type)

  return (
    <>
      <Section
        title="What the student is asked to do"
        hint={typeMeta?.summary}
      >
        <div className="space-y-4">
          <Field
            label="Objective"
            help="One line, shown as the standfirst under the task headline. Say the outcome, not the activity."
          >
            <TextInput
              value={draft.objective || ''}
              onChange={(e) => set('objective', e.target.value)}
              placeholder="Put a number on everything that was wrong with the extract."
            />
          </Field>

          <Field
            label="The manager's briefing"
            required
            help="Written in the manager's voice, to the student, about work that matters to somebody. This is the first thing they read and the reason they care."
          >
            <TextArea
              rows={7}
              value={draft.briefing || ''}
              onChange={(e) => set('briefing', e.target.value)}
              placeholder="Finance are going to ask why last quarter's revenue moved when we re-ran it, and “we cleaned the data” is not an answer anyone accepts…"
            />
          </Field>
        </div>
      </Section>

      {!final && (
        <>
          <Section
            title="The short version"
            hint="Shown as compact lists beside the brief. Keep each line to one action."
          >
            <div className="space-y-4">
              <Field label="What to do" help="One step per line.">
                <LineList value={draft.what_to_do || []} onChange={(v) => set('what_to_do', v)} />
              </Field>
              <Field label="What to submit" help="One deliverable per line. Name the file.">
                <LineList rows={3} value={draft.what_to_submit || []} onChange={(v) => set('what_to_submit', v)} />
              </Field>
              <Field label="Hints" help="One per line. Written for a student who is stuck, not for one who has not started.">
                <LineList rows={4} value={draft.hints || []} onChange={(v) => set('hints', v)} />
              </Field>
              <Field label="Success criteria" help="One per line — what “done” means, in the student's own terms.">
                <LineList rows={3} value={draft.success_criteria || []} onChange={(v) => set('success_criteria', v)} />
              </Field>
            </div>
          </Section>

          <Section
            title="Worked example"
            hint="Optional, revealed on click after a student has attempted the task."
            collapsible
            defaultOpen={!!draft.model_solution}
          >
            <ModelSolutionEditor
              modelSolution={draft.model_solution}
              onChange={(m) => set('model_solution', m)}
            />
            {!draft.model_solution && (
              <button
                onClick={() => set('model_solution', { steps: [], key_principle: null, great_looks_like: null, example_solution: null })}
                className="mt-2 rounded-lg border border-dashed border-border px-3 py-2 text-[0.78rem] font-semibold text-on-surface-variant transition-colors hover:border-primary hover:text-primary cursor-pointer"
              >
                Add a worked example
              </button>
            )}
          </Section>
        </>
      )}
    </>
  )
}

function GradingTab({ draft, setConfig, set, catalog }) {
  if (draft.type === 'code_sandbox') {
    return <GradingEditor config={draft.config || {}} setConfig={setConfig} catalog={catalog} />
  }

  return (
    <Section
      title="How this is scored"
      hint="This task type is scored by its own configuration rather than by a grader or a rule list."
    >
      <div className="space-y-4">
        {draft.type === 'text_rubric' && (
          <TextRubricEditor config={draft.config || {}} setConfig={setConfig} />
        )}
        {draft.type === 'structured_form' && (
          <StructuredFormFieldsEditor
            fields={draft.config?.fields || []}
            onChange={(f) => setConfig('fields', f)}
          />
        )}
        {draft.type === 'ai_roleplay_chat' && (
          <PersonaEditor config={draft.config || {}} setConfig={setConfig} />
        )}
        {draft.type === 'crm_workspace' && (
          <CrmWorkspaceEditor config={draft.config || {}} setConfig={setConfig} />
        )}

        <Field
          label="Rubric weights"
          help="Optional. Named criteria and their weights, which must total 1.0. Leave empty for a single overall score."
        >
          <TextArea
            rows={3}
            value={Object.entries(draft.rubric || {}).map(([k, v]) => `${k}:${v}`).join('\n')}
            onChange={(e) => {
              const entries = e.target.value.split('\n').map((l) => l.trim()).filter(Boolean)
                .map((l) => l.split(':'))
              const rubric = Object.fromEntries(entries.map(([k, v]) => [k.trim(), Number(v) || 0]))
              set('rubric', Object.keys(rubric).length ? rubric : null)
            }}
            placeholder={'clarity:0.4\nevidence:0.35\nrecommendation:0.25'}
          />
        </Field>
      </div>
    </Section>
  )
}

function RewardsTab({ draft, set, catalog }) {
  const skills = catalog?.skills ?? []
  const awards = draft.skill_awards || {}
  const total = Object.values(awards).reduce((s, v) => s + (Number(v) || 0), 0)

  function setSkill(key, points) {
    const next = { ...awards }
    if (!points) delete next[key]
    else next[key] = points
    set('skill_awards', next)
  }

  return (
    <>
      <Section
        title="XP"
        hint="Paid once, the first time this task is completed. Re-submitting a task never pays again."
      >
        <Field label="XP award" help="The reference simulations run 50 in week 1, rising to about 75 by week 3, and 200 for the final assessment.">
          <TextInput
            type="number" min={0}
            value={draft.xp_award ?? 0}
            onChange={(e) => set('xp_award', Number(e.target.value) || 0)}
            className="max-w-[10rem]"
          />
        </Field>
      </Section>

      <Section
        title="Skills"
        hint="Points added to the student's Skill GPS when this task is completed. Only skills the platform knows about are listed — a made-up key awards points into a skill nothing can display."
        action={
          <span className="rounded-full bg-surface-low px-2.5 py-1 text-[0.7rem] font-bold tabular-nums text-on-surface-variant">
            {total} pts across {Object.keys(awards).length}
          </span>
        }
      >
        {skills.length === 0 ? (
          <Note tone="warn">The skill list could not be loaded, so this cannot be edited safely right now.</Note>
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border bg-white">
            {skills.map((s) => {
              const points = awards[s.key] ?? 0
              return (
                <div key={s.key} className="flex items-center gap-3 px-3 py-2">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.82rem] font-semibold text-on-surface">{s.label}</span>
                    <span className="block truncate text-[0.68rem] text-outline">{s.category} · {s.key}</span>
                  </span>
                  <input
                    type="number" min={0} max={100}
                    value={points || ''}
                    placeholder="0"
                    onChange={(e) => setSkill(s.key, Number(e.target.value) || 0)}
                    className={cn(
                      'w-20 shrink-0 rounded-lg border px-2 py-1.5 text-right text-[0.82rem] tabular-nums outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15',
                      points ? 'border-primary/40 bg-primary/5 font-bold text-on-surface' : 'border-border text-on-surface-variant'
                    )}
                  />
                </div>
              )
            })}
          </div>
        )}
      </Section>
    </>
  )
}
