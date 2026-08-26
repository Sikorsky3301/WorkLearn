// The shape every simulation on this platform now follows, expressed as code
// the builder can measure a draft against.
//
// The Frontend Developer and Junior Data Analyst simulations were both
// restructured into three weeks of three tasks, a five-question check after
// each task, and one final assessment alone in the last week. Nothing in the
// builder knew that. An author could produce a simulation with eleven tasks in
// one week, no explainers and no checks, publish it, and the runtime would
// render it — badly, because the task page is built for the new shape and
// degrades into a bare bullet list without it.
//
// So the rules live here, once, and three things read them: the outline (which
// groups pages into weeks), the readiness panel (which says what is missing
// before publish), and the scaffold action (which lays the whole shape out in
// one click). Server-side defaults arrive from /api/admin/builder-catalog and
// override the constants below, so the two cannot drift.

export const DEFAULT_FORMAT = {
  weeks: 3,
  tasks_per_week: 3,
  mini_assessment_questions: 5,
  mini_pass_mark: 80,
  final_pass_mark: 70,
  final_question_count: 40,
}

/** Types that carry graded work, as opposed to a check on work already done. */
export const WORK_TASK_TYPES = new Set([
  'code_sandbox', 'text_rubric', 'structured_form', 'ai_roleplay_chat', 'crm_workspace',
])

export function isFinalAssessment(task) {
  return task?.type === 'quiz' && !!task?.config?.is_final_assessment
}

/**
 * Group a task list into the week structure the runtime renders.
 *
 * Tasks with no `week` are not an error — they are the old shape — so they
 * come back in their own bucket the outline can show and offer to fix, rather
 * than being hidden or silently assigned somewhere.
 */
export function groupIntoWeeks(tasks = [], sectionLabels = {}) {
  const weeks = new Map()
  const unassigned = []

  for (const task of [...tasks].sort((a, b) => a.task_index - b.task_index)) {
    if (task.week == null) { unassigned.push(task); continue }
    if (!weeks.has(task.week)) {
      weeks.set(task.week, {
        week: task.week,
        label: sectionLabels?.[String(task.week)] || `Week ${task.week}`,
        named: !!sectionLabels?.[String(task.week)],
        tasks: [],
      })
    }
    weeks.get(task.week).tasks.push(task)
  }

  return {
    weeks: [...weeks.values()].sort((a, b) => a.week - b.week),
    unassigned,
  }
}

/** The next free task_index — task_index is the only real ordering key. */
export function nextTaskIndex(tasks = []) {
  return tasks.length ? Math.max(...tasks.map((t) => t.task_index)) + 1 : 1
}

// ── Readiness ──────────────────────────────────────────────────────────────
//
// Each check answers one question an author would otherwise only discover from
// a student. `level` is the difference between "this will not work" and "this
// is not the house style yet": `blocker` means the runtime cannot render or
// grade it, `warning` means it will work but reads as unfinished.

const S = (level, id, label, detail = '') => ({ level, id, label, detail })

/** Everything wrong with ONE task, in the order an author would fix it. */
export function checkTask(task, format = DEFAULT_FORMAT) {
  const issues = []
  const config = task.config || {}
  const final = isFinalAssessment(task)

  if (!task.title?.trim() || /^untitled/i.test(task.title)) {
    issues.push(S('blocker', 'title', 'Needs a title', 'The roadmap and the task page both lead with it.'))
  }
  if (task.week == null) {
    issues.push(S('blocker', 'week', 'Not in a week', 'Ungrouped tasks have nowhere to appear on the roadmap.'))
  }

  if (final) {
    const count = config.assessment?.questions?.length ?? 0
    if (count === 0) {
      issues.push(S('blocker', 'final-empty', 'Final assessment has no questions', 'There is nothing to sit.'))
    } else if (count < format.final_question_count) {
      issues.push(S('warning', 'final-short', `Only ${count} of ${format.final_question_count} questions`,
        'The other simulations close on a full-length paper.'))
    }
    if (!config.pass_mark) {
      issues.push(S('blocker', 'final-pass', 'No pass mark', 'Without one, every attempt passes.'))
    }
    issues.push(...checkQuestions(config.assessment?.questions ?? []))
    return issues
  }

  if (!task.objective?.trim()) {
    issues.push(S('warning', 'objective', 'No objective', 'This is the one-line standfirst under the task headline.'))
  }
  if (!task.briefing?.trim()) {
    issues.push(S('blocker', 'briefing', 'No briefing', 'The manager’s brief is the first thing a student reads.'))
  }

  const explainer = config.explainer
  if (!explainer) {
    issues.push(S('warning', 'explainer', 'No explainer',
      'The task page falls back to a bare bullet list without one.'))
  } else {
    if (!explainer.situation?.trim()) {
      issues.push(S('warning', 'explainer-situation', 'Explainer has no situation',
        'This is the paragraph that makes the rest make sense.'))
    }
    if (!explainer.outcome?.trim()) {
      issues.push(S('warning', 'explainer-outcome', 'No "what finished looks like"',
        'Students cannot aim at an unstated target.'))
    }
    if (!explainer.steps?.length) {
      issues.push(S('warning', 'explainer-steps', 'Explainer has no steps', 'The steps are the spine of the task page.'))
    }
  }

  const bank = config.assessment
  const questions = bank?.questions ?? []
  if (questions.length === 0) {
    issues.push(S('warning', 'assessment', 'No mini assessment',
      `Every other task gates the next one on ${format.mini_assessment_questions} questions.`))
  } else {
    if (questions.length < format.mini_assessment_questions) {
      issues.push(S('warning', 'assessment-short',
        `Mini assessment has ${questions.length} of ${format.mini_assessment_questions} questions`))
    }
    issues.push(...checkQuestions(questions))
    if (!bank.pass_mark) {
      issues.push(S('warning', 'assessment-pass', 'Mini assessment has no pass mark',
        `The rest of the platform gates on ${format.mini_pass_mark}%.`))
    }
  }

  if (task.type === 'code_sandbox') issues.push(...checkSandbox(task))

  if (!task.xp_award) {
    issues.push(S('warning', 'xp', 'Awards no XP', 'Finishing it changes nothing on the student’s profile.'))
  }
  if (!Object.keys(task.skill_awards || {}).length) {
    issues.push(S('warning', 'skills', 'Awards no skills', 'Skill GPS will not move when this is completed.'))
  }

  return issues
}

/** The four ways a multiple-choice question can be unanswerable. */
export function checkQuestions(questions) {
  const issues = []
  questions.forEach((q, i) => {
    const n = i + 1
    if (!q.question?.trim()) issues.push(S('blocker', `q${i}-empty`, `Question ${n} is blank`))
    const options = q.options ?? []
    if (options.length < 2) {
      issues.push(S('blocker', `q${i}-options`, `Question ${n} needs at least two options`))
    } else if (new Set(options.map((o) => (o || '').trim().toLowerCase())).size !== options.length) {
      issues.push(S('blocker', `q${i}-dupe`, `Question ${n} repeats an option`,
        'Two identical options make one of them impossible to mark wrong.'))
    }
    if (q.correct == null || q.correct < 0 || q.correct >= options.length) {
      issues.push(S('blocker', `q${i}-correct`, `Question ${n} has no valid answer`,
        'The correct index points outside the options.'))
    }
    if (!q.explanation?.trim()) {
      issues.push(S('warning', `q${i}-why`, `Question ${n} has no explanation`,
        'The explanation is the part that teaches.'))
    }
  })
  return issues
}

/** The sandbox and grading wiring — the part that fails silently at submit. */
export function checkSandbox(task) {
  const issues = []
  const config = task.config || {}
  const textOnly = config.submission_mode === 'text'

  // A text task never runs a container: sandbox.py returns to the LLM-judge
  // path before it reads either filename (see the `submission_mode == "text"`
  // branch). Requiring them here flagged the Data Analyst's Executive Brief —
  // a task that is correct, published, and graded fine — as broken. A check
  // that cries wolf on working content is worse than no check, because the
  // next real blocker is read as noise too.
  if (!textOnly) {
    if (!config.input_filename?.trim()) {
      issues.push(S('blocker', 'input', 'No input filename',
        'The container needs to know what to call the student’s file.'))
    }
    if (!config.output_filename?.trim()) {
      issues.push(S('blocker', 'output', 'No output filename',
        'The grader reads this file. Without it there is nothing to grade.'))
    }
  }
  if (!textOnly && !config.starter_code?.trim()) {
    issues.push(S('warning', 'starter', 'No starter code',
      'Students open an empty editor with no idea of the expected shape.'))
  }

  if (config.grading_strategy === 'registered_grader') {
    if (!config.grader_key) {
      issues.push(S('blocker', 'grader', 'No grader selected', 'Submitting will fail for every student.'))
    }
  } else {
    const rules = config.rules ?? []
    if (rules.length === 0) {
      issues.push(S('blocker', 'rules', 'No grading rules', 'Nothing is being checked.'))
    } else {
      const sum = rules.reduce((s, r) => s + (Number(r.points) || 0), 0)
      if (sum !== 100) {
        issues.push(S('blocker', 'rules-sum', `Rule points total ${sum}, not 100`,
          'Publishing is refused until they do.'))
      }
      rules.forEach((r, i) => {
        if (!r.field?.trim()) issues.push(S('blocker', `rule${i}-field`, `Rule ${i + 1} has no field path`))
        if (!r.label?.trim()) {
          issues.push(S('warning', `rule${i}-label`, `Rule ${i + 1} has no label`,
            'The label is what the student sees next to their score.'))
        }
      })
    }
  }

  return issues
}

/** Simulation-level checks: the shape, not the contents of any one task. */
export function checkSimulation(sim, format = DEFAULT_FORMAT) {
  const issues = []
  if (!sim) return issues

  const tasks = sim.tasks ?? []
  if (!sim.description?.trim()) issues.push(S('blocker', 'description', 'No description', 'It is the card copy on the simulations page.'))
  if (!sim.manager?.name?.trim()) issues.push(S('warning', 'manager', 'No manager persona', 'The briefing scene has nobody to deliver it.'))
  if (!sim.onboarding?.company?.name?.trim()) issues.push(S('warning', 'company', 'Onboarding has no company', 'The offer letter reads as a placeholder.'))
  if (!(sim.skills ?? []).length) issues.push(S('warning', 'sim-skills', 'No skills listed', 'The overview page shows an empty "what you’ll learn".'))

  if (tasks.length === 0) {
    issues.push(S('blocker', 'no-tasks', 'No tasks yet', 'Add the first week to start.'))
    return issues
  }

  const { weeks, unassigned } = groupIntoWeeks(tasks, sim.section_labels)
  const workWeeks = weeks.filter((w) => w.tasks.some((t) => !isFinalAssessment(t)))

  if (unassigned.length) {
    issues.push(S('blocker', 'unassigned', `${unassigned.length} task${unassigned.length === 1 ? '' : 's'} not in a week`,
      'The roadmap groups by week — these have nowhere to appear.'))
  }
  if (workWeeks.length !== format.weeks) {
    issues.push(S('warning', 'week-count', `${workWeeks.length} weeks of work, not ${format.weeks}`,
      'The other simulations run three.'))
  }
  for (const w of workWeeks) {
    const count = w.tasks.filter((t) => !isFinalAssessment(t)).length
    if (count !== format.tasks_per_week) {
      issues.push(S('warning', `week-${w.week}-size`, `${w.label} has ${count} tasks, not ${format.tasks_per_week}`))
    }
    if (!w.named) {
      issues.push(S('warning', `week-${w.week}-label`, `${w.label} has no name`,
        'A named week tells a student what the week is FOR.'))
    }
  }
  if (!tasks.some(isFinalAssessment)) {
    issues.push(S('warning', 'no-final', 'No final assessment', 'Every other simulation closes on one.'))
  }

  return issues
}

/** Roll a draft up into the single number the top bar shows. */
export function readiness(sim, format = DEFAULT_FORMAT) {
  const simIssues = checkSimulation(sim, format)
  const perTask = (sim?.tasks ?? []).map((task) => ({ task, issues: checkTask(task, format) }))
  const all = [...simIssues, ...perTask.flatMap((t) => t.issues)]
  const blockers = all.filter((i) => i.level === 'blocker')
  const warnings = all.filter((i) => i.level === 'warning')

  // Weighted so a blocker costs more than a rough edge — the bar reads as "how
  // close is this to publishable", not "how many notes are open".
  const penalty = blockers.length * 8 + warnings.length * 2
  return {
    simIssues,
    perTask,
    blockers,
    warnings,
    score: Math.max(0, 100 - penalty),
    publishable: blockers.length === 0,
  }
}
