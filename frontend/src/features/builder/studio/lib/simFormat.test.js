import { describe, it, expect } from 'vitest'
import {
  checkQuestions, checkSandbox, checkSimulation, checkTask,
  groupIntoWeeks, isFinalAssessment, nextTaskIndex, readiness, DEFAULT_FORMAT,
} from './simFormat'
import { planScaffold, blankConfigFor } from './scaffold'

// The readiness panel is the only thing standing between an author and a
// student meeting a half-written task, so it has to be right in both
// directions. A missed problem is obvious. A FALSE problem is worse: it trains
// an author to scroll past the list, and the next real blocker goes with it.
//
// The Executive Brief case below is not hypothetical — the first version of
// checkSandbox required an output filename unconditionally and flagged a
// published, working, LLM-judged task as broken. That is what this file is
// mostly here to stop happening again.

const question = (over = {}) => ({
  question: 'What does errors="coerce" do?',
  options: ['Deletes bad rows', 'Turns unreadable dates into NaT', 'Guesses the date', 'Stops the script'],
  correct: 1,
  explanation: 'Bad values become NaT and the script keeps running.',
  ...over,
})

const explainer = (over = {}) => ({
  situation: 'The extract comes out of three systems that disagree.',
  outcome: 'One cleaned CSV, output.csv.',
  steps: [{ title: 'Parse the dates', plain: 'Turn every date column into a real date.' }],
  concepts: [], contract: [], mistakes: [], further: [],
  ...over,
})

const codeTask = (over = {}) => ({
  id: 1, task_index: 1, week: 1, title: 'Clean the Data', type: 'code_sandbox',
  objective: 'Make the file trustworthy.',
  briefing: 'Nobody has reconciled these systems.',
  xp_award: 50, skill_awards: { data_cleaning: 20 },
  config: {
    language: 'python', submission_mode: 'code', grading_strategy: 'registered_grader',
    grader_key: 'da_job_sim.task1_cleaning', input_filename: 'dataset.csv',
    output_filename: 'output.csv', starter_code: 'import pandas as pd',
    explainer: explainer(),
    assessment: { title: 'Cleaning', pass_mark: 80, questions: Array.from({ length: 5 }, () => question()) },
  },
  ...over,
})

const ids = (issues) => issues.map((i) => i.id)

describe('checkTask', () => {
  it('passes a fully authored code task with nothing to say', () => {
    expect(checkTask(codeTask(), DEFAULT_FORMAT)).toEqual([])
  })

  it('blocks a task that is not in a week', () => {
    const issues = checkTask(codeTask({ week: null }), DEFAULT_FORMAT)
    expect(ids(issues)).toContain('week')
    expect(issues.find((i) => i.id === 'week').level).toBe('blocker')
  })

  it('treats a missing explainer as unfinished, not broken', () => {
    const task = codeTask()
    delete task.config.explainer
    const issue = checkTask(task, DEFAULT_FORMAT).find((i) => i.id === 'explainer')
    expect(issue.level).toBe('warning')
  })

  it('blocks a briefing that was never written', () => {
    const issue = checkTask(codeTask({ briefing: '  ' }), DEFAULT_FORMAT).find((i) => i.id === 'briefing')
    expect(issue.level).toBe('blocker')
  })

  it('rejects the placeholder title the Add-task flow creates', () => {
    expect(ids(checkTask(codeTask({ title: 'Untitled task' }), DEFAULT_FORMAT))).toContain('title')
  })
})

describe('checkQuestions', () => {
  it('accepts a well-formed question', () => {
    expect(checkQuestions([question()])).toEqual([])
  })

  it('blocks an answer index pointing outside the options', () => {
    const issue = checkQuestions([question({ correct: 7 })])[0]
    expect(issue.id).toBe('q0-correct')
    expect(issue.level).toBe('blocker')
  })

  it('blocks two options that read the same', () => {
    const q = question({ options: ['Yes', 'yes ', 'No', 'Maybe'] })
    expect(ids(checkQuestions([q]))).toContain('q0-dupe')
  })

  it('treats a missing explanation as a warning — the question still works', () => {
    const issue = checkQuestions([question({ explanation: '' })])[0]
    expect(issue.level).toBe('warning')
  })
})

describe('checkSandbox', () => {
  it('does not demand filenames from a text-submission task', () => {
    // The Data Analyst's Executive Brief: LLM-judged prose, no container, no
    // input or output file. sandbox.py returns before it reads either name.
    const brief = {
      config: {
        submission_mode: 'text',
        grading_strategy: 'registered_grader',
        grader_key: 'da_job_sim.task5_brief',
      },
    }
    expect(checkSandbox(brief)).toEqual([])
  })

  it('blocks a code task with no output filename', () => {
    const task = codeTask()
    delete task.config.output_filename
    expect(ids(checkSandbox(task))).toContain('output')
  })

  it('blocks a registered-grader task with no grader chosen', () => {
    const task = codeTask()
    delete task.config.grader_key
    expect(ids(checkSandbox(task))).toContain('grader')
  })

  it('blocks rule points that do not total 100', () => {
    const task = codeTask()
    task.config.grading_strategy = 'declarative_rules'
    task.config.rules = [
      { id: 'a', label: 'Revenue', field: 'summary.total', op: 'equals', points: 40 },
      { id: 'b', label: 'Rows', field: 'summary.rows', op: 'equals', points: 30 },
    ]
    const issue = checkSandbox(task).find((i) => i.id === 'rules-sum')
    expect(issue.level).toBe('blocker')
    expect(issue.label).toContain('70')
  })

  it('accepts rules that total exactly 100', () => {
    const task = codeTask()
    task.config.grading_strategy = 'declarative_rules'
    task.config.rules = [
      { id: 'a', label: 'Revenue', field: 'summary.total', op: 'equals', points: 60 },
      { id: 'b', label: 'Rows', field: 'summary.rows', op: 'equals', points: 40 },
    ]
    expect(ids(checkSandbox(task))).not.toContain('rules-sum')
  })
})

describe('groupIntoWeeks', () => {
  const tasks = [
    { id: 3, task_index: 3, week: 2, title: 'C' },
    { id: 1, task_index: 1, week: 1, title: 'A' },
    { id: 2, task_index: 2, week: 1, title: 'B' },
    { id: 4, task_index: 4, week: null, title: 'Stray' },
  ]

  it('orders weeks and the tasks inside them by task_index', () => {
    const { weeks } = groupIntoWeeks(tasks, { 1: 'Week one' })
    expect(weeks.map((w) => w.week)).toEqual([1, 2])
    expect(weeks[0].tasks.map((t) => t.title)).toEqual(['A', 'B'])
  })

  it('surfaces week-less tasks rather than hiding or reassigning them', () => {
    const { unassigned } = groupIntoWeeks(tasks)
    expect(unassigned.map((t) => t.title)).toEqual(['Stray'])
  })

  it('reports whether a week was actually named', () => {
    const { weeks } = groupIntoWeeks(tasks, { 1: 'Week one' })
    expect(weeks[0].named).toBe(true)
    expect(weeks[1].named).toBe(false)
    expect(weeks[1].label).toBe('Week 2')
  })
})

describe('checkSimulation', () => {
  const sim = (over = {}) => ({
    description: 'Clean, analyse and report on a real order file.',
    manager: { name: 'Priya', role: 'Head of Analytics' },
    onboarding: { company: { name: 'Lumen' } },
    skills: ['analytics'],
    section_labels: { 1: 'Week 1', 2: 'Week 2', 3: 'Week 3', 4: 'Final' },
    tasks: [],
    ...over,
  })

  const nine = Array.from({ length: 9 }, (_, i) => ({
    id: i + 1, task_index: i + 1, week: Math.floor(i / 3) + 1, title: `T${i + 1}`,
  }))

  it('warns when the week count does not match the house format', () => {
    const issues = checkSimulation(sim({ tasks: nine.slice(0, 3) }), DEFAULT_FORMAT)
    expect(ids(issues)).toContain('week-count')
  })

  it('is quiet about the shape when it is three weeks of three', () => {
    const issues = checkSimulation(sim({ tasks: nine }), DEFAULT_FORMAT)
    expect(ids(issues)).not.toContain('week-count')
    expect(ids(issues)).not.toContain('week-1-size')
  })

  it('blocks tasks that never got a week', () => {
    const tasks = [...nine, { id: 99, task_index: 10, week: null, title: 'Stray' }]
    const issue = checkSimulation(sim({ tasks }), DEFAULT_FORMAT).find((i) => i.id === 'unassigned')
    expect(issue.level).toBe('blocker')
  })

  it('notices a simulation with no closing exam', () => {
    expect(ids(checkSimulation(sim({ tasks: nine }), DEFAULT_FORMAT))).toContain('no-final')
  })
})

describe('isFinalAssessment', () => {
  it('is the flag, not the title — a quiz called "Final" is still just a quiz', () => {
    expect(isFinalAssessment({ type: 'quiz', title: 'Final', config: {} })).toBe(false)
    expect(isFinalAssessment({ type: 'quiz', config: { is_final_assessment: true } })).toBe(true)
  })
})

describe('nextTaskIndex', () => {
  it('starts at 1 and never reuses an index', () => {
    expect(nextTaskIndex([])).toBe(1)
    expect(nextTaskIndex([{ task_index: 1 }, { task_index: 7 }])).toBe(8)
  })
})

describe('readiness', () => {
  it('is publishable only when nothing is blocking', () => {
    const clean = readiness({
      description: 'x', manager: { name: 'A', role: 'B' },
      onboarding: { company: { name: 'C' } }, skills: ['s'],
      section_labels: { 1: 'One' }, tasks: [codeTask()],
    }, DEFAULT_FORMAT)
    expect(clean.blockers.filter((i) => i.id !== 'no-final').length).toBe(0)

    const broken = readiness({ tasks: [codeTask({ briefing: '' })] }, DEFAULT_FORMAT)
    expect(broken.publishable).toBe(false)
  })

  it('never scores below zero, however bad the draft', () => {
    const awful = readiness({ tasks: Array.from({ length: 30 }, () => ({ title: '', config: {} })) })
    expect(awful.score).toBe(0)
  })
})

describe('planScaffold', () => {
  it('lays out three weeks of three plus a final assessment', () => {
    const { tasks, sectionLabels, finalWeek } = planScaffold({ existing: [], format: DEFAULT_FORMAT })
    expect(tasks.length).toBe(10)
    expect(tasks.filter((t) => t.week === 1).length).toBe(3)
    expect(tasks.filter((t) => t.week === 3).length).toBe(3)
    expect(finalWeek).toBe(4)
    const final = tasks.find((t) => t.week === 4)
    expect(final.type).toBe('quiz')
    expect(final.config.is_final_assessment).toBe(true)
    expect(Object.keys(sectionLabels)).toEqual(['1', '2', '3', '4'])
  })

  it('never reuses a task_index that already exists', () => {
    const existing = [{ task_index: 1, week: 1 }, { task_index: 5, week: 1 }]
    const { tasks } = planScaffold({ existing, format: DEFAULT_FORMAT })
    const indexes = tasks.map((t) => t.task_index)
    expect(new Set(indexes).size).toBe(indexes.length)
    expect(indexes).not.toContain(1)
    expect(indexes).not.toContain(5)
  })

  it('fills the gaps in a partly built simulation rather than duplicating it', () => {
    const existing = [{ task_index: 1, week: 1 }, { task_index: 2, week: 1 }]
    const { tasks } = planScaffold({ existing, format: DEFAULT_FORMAT })
    expect(tasks.filter((t) => t.week === 1).length).toBe(1)
    expect(tasks.filter((t) => t.week === 2).length).toBe(3)
  })

  it('does not add a second final assessment', () => {
    const existing = [{ task_index: 1, week: 4, type: 'quiz', config: { is_final_assessment: true } }]
    const { tasks } = planScaffold({ existing, format: DEFAULT_FORMAT })
    expect(tasks.filter((t) => t.config?.is_final_assessment).length).toBe(0)
  })

  it('gives every scaffolded task the new-format blocks, empty and ready', () => {
    const { tasks } = planScaffold({ existing: [], format: DEFAULT_FORMAT })
    for (const task of tasks.filter((t) => !t.config.is_final_assessment)) {
      expect(task.config.explainer).toBeTruthy()
      expect(task.config.assessment.questions).toEqual([])
      expect(task.config.assessment.pass_mark).toBe(DEFAULT_FORMAT.mini_pass_mark)
    }
  })

  it('writes no placeholder prose — a blank brief must stay blank', () => {
    const { tasks } = planScaffold({ existing: [], format: DEFAULT_FORMAT })
    for (const task of tasks) {
      expect(task.briefing).toBe('')
      expect(task.config.explainer?.situation ?? '').toBe('')
    }
  })
})

describe('blankConfigFor', () => {
  it('gives every task type both new-format blocks', () => {
    for (const type of ['code_sandbox', 'quiz', 'structured_form', 'text_rubric', 'ai_roleplay_chat', 'crm_workspace']) {
      const config = blankConfigFor(type, DEFAULT_FORMAT)
      expect(config.explainer, type).toBeTruthy()
      expect(config.assessment, type).toBeTruthy()
    }
  })
})
