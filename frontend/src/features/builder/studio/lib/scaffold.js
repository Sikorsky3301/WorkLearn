// One click that lays out the whole three-week shape.
//
// Before this, matching the format meant creating ten tasks by hand, setting
// `week` on each from a bare number input, naming three sections, and
// remembering that the final assessment is a quiz with `is_final_assessment`
// set — a flag with no UI at all, which is why no simulation built in the
// builder had ever had one.
//
// The scaffold writes STRUCTURE, never content. Every task lands with a real
// title, a week, an XP award and an empty explainer and assessment block ready
// to fill. Nothing here invents a briefing or a question: placeholder prose
// that reads like content is worse than an obvious blank, because it survives
// to publish.

import { DEFAULT_FORMAT } from './simFormat'

/** The arc the two reference simulations both follow, as week names. */
export const WEEK_THEMES = [
  { label: 'Week 1 · Get the fundamentals right', hint: 'The groundwork every later task depends on.' },
  { label: 'Week 2 · Build the real thing', hint: 'Where the substantial work happens.' },
  { label: 'Week 3 · Decide, then communicate it', hint: 'Judgement, and saying it to somebody senior.' },
]

const XP_BY_WEEK = [50, 60, 75]

/**
 * The task rows a scaffold would create, given what already exists.
 *
 * Pure — returns descriptions, issues nothing. The caller creates them, so a
 * partial failure leaves a partial scaffold rather than a silent no-op, and
 * the preview in the confirm dialog is built from exactly what will be sent.
 */
export function planScaffold({ existing = [], type = 'code_sandbox', format = DEFAULT_FORMAT } = {}) {
  const taken = new Set(existing.map((t) => t.task_index))
  const filledWeeks = new Map()
  for (const t of existing) {
    if (t.week != null) filledWeeks.set(t.week, (filledWeeks.get(t.week) ?? 0) + 1)
  }

  let index = 1
  const nextIndex = () => {
    while (taken.has(index)) index += 1
    taken.add(index)
    return index
  }

  const tasks = []
  for (let w = 1; w <= format.weeks; w += 1) {
    const already = filledWeeks.get(w) ?? 0
    for (let n = already; n < format.tasks_per_week; n += 1) {
      tasks.push({
        task_index: nextIndex(),
        week: w,
        title: `Week ${w} · Task ${n + 1}`,
        type,
        objective: '',
        briefing: '',
        what_to_do: [],
        what_to_submit: [],
        hints: [],
        success_criteria: [],
        xp_award: XP_BY_WEEK[w - 1] ?? 50,
        skill_awards: {},
        config: blankConfigFor(type, format),
      })
    }
  }

  const finalWeek = format.weeks + 1
  const needsFinal = !existing.some((t) => t.type === 'quiz' && t.config?.is_final_assessment)
  if (needsFinal) {
    tasks.push({
      task_index: nextIndex(),
      week: finalWeek,
      title: 'Final Assessment',
      type: 'quiz',
      objective: 'Everything from the last three weeks, in one sitting.',
      briefing: '',
      what_to_do: [],
      what_to_submit: [],
      hints: [],
      success_criteria: [],
      xp_award: 200,
      skill_awards: {},
      config: {
        is_final_assessment: true,
        pass_mark: format.final_pass_mark,
        question_count: 0,
        assessment: { title: 'Final Assessment', pass_mark: format.final_pass_mark, questions: [] },
      },
    })
  }

  const sectionLabels = {}
  WEEK_THEMES.slice(0, format.weeks).forEach((theme, i) => {
    sectionLabels[String(i + 1)] = theme.label
  })
  sectionLabels[String(finalWeek)] = 'Final Assessment'

  return { tasks, sectionLabels, finalWeek }
}

/** A config with the new-format blocks present but empty, so every tab in the
 *  task editor has something to open rather than an "add this" button. */
export function blankConfigFor(type, format = DEFAULT_FORMAT) {
  const base = {
    explainer: {
      situation: '', outcome: '', preview: null,
      concepts: [], steps: [], contract: [], mistakes: [], further: [],
    },
    assessment: { title: '', pass_mark: format.mini_pass_mark, questions: [] },
  }

  switch (type) {
    case 'code_sandbox':
      return {
        ...base,
        language: 'python',
        submission_mode: 'code',
        grading_strategy: 'declarative_rules',
        input_filename: 'submission.py',
        output_filename: 'output.json',
        starter_code: '',
        rules: [],
      }
    case 'quiz':
      return { ...base, questions: [], pass_mark: format.mini_pass_mark }
    case 'structured_form':
      return { ...base, fields: [] }
    case 'text_rubric':
      return { ...base, grading_mode: 'manual', min_words: 0, required_keywords: [] }
    case 'ai_roleplay_chat':
      return {
        ...base,
        persona: {
          name: 'Contact Name', role: 'Role',
          personality_prompt: '', mood_options: ['neutral'], opening_mood: 'neutral',
        },
        context: {}, mode: 'custom', min_messages_for_completion: 4,
      }
    case 'crm_workspace':
      return {
        ...base,
        required_entities: { accounts: 1, contacts: 1, opportunities: 1 },
        pipeline_stages: ['Qualification', 'Proposal', 'Closed Won', 'Closed Lost'],
      }
    default:
      return base
  }
}
