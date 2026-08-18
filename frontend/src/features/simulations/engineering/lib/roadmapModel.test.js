import { describe, it, expect } from 'vitest'
import { buildRoadmap, breakdownRows, TASK_STATUS } from './roadmapModel'

const task = (task_index, week, extra = {}) => ({
  id: task_index * 100, // deliberately NOT equal to task_index — see below
  task_index,
  week,
  title: `Task ${task_index}`,
  type: 'code_sandbox',
  ...extra,
})

const tasks = [
  task(1, 1), task(2, 1),
  task(3, 2), task(4, 2),
  task(5, 3),
]

describe('buildRoadmap', () => {
  it('groups tasks into sections by week', () => {
    const { sections } = buildRoadmap({ tasks })
    expect(sections.map((s) => s.week)).toEqual([1, 2, 3])
    expect(sections.map((s) => s.total)).toEqual([2, 2, 1])
  })

  it('falls back to "Week n" when section_labels is empty', () => {
    // The seeded simulations never set section_labels, so this is the common
    // path rather than an edge case.
    const { sections } = buildRoadmap({ tasks, sectionLabels: {} })
    expect(sections.map((s) => s.label)).toEqual(['Week 1', 'Week 2', 'Week 3'])
  })

  it('uses authored section labels when present', () => {
    const { sections } = buildRoadmap({
      tasks,
      sectionLabels: { 1: 'Markup & Interaction', 3: 'Shipping' },
    })
    expect(sections.map((s) => s.label)).toEqual([
      'Markup & Interaction', 'Week 2', 'Shipping',
    ])
  })

  it('keys completions on task_index, not task id', () => {
    // The regression this guards: TaskCompletion.task_id holds the
    // task_index. Keying on `task.id` (100, 200, ...) would match nothing
    // and silently show every task as incomplete.
    const { sections } = buildRoadmap({
      tasks,
      completions: [{ task_id: 1, score: 90, quiz_score: null }],
    })
    expect(sections[0].tasks[0].status).toBe(TASK_STATUS.COMPLETE)
    expect(sections[0].tasks[0].score).toBe(90)
  })

  it('marks the first task without a completion as current, rest locked', () => {
    const { currentTaskIndex, sections } = buildRoadmap({
      tasks,
      completions: [{ task_id: 1, score: 90 }, { task_id: 2, score: 80 }],
    })
    expect(currentTaskIndex).toBe(3)
    const statuses = sections.flatMap((s) => s.tasks).map((t) => t.status)
    expect(statuses).toEqual([
      TASK_STATUS.COMPLETE, TASK_STATUS.COMPLETE,
      TASK_STATUS.CURRENT, TASK_STATUS.LOCKED, TASK_STATUS.LOCKED,
    ])
  })

  it('reports no current task once everything is complete', () => {
    const completions = tasks.map((t) => ({ task_id: t.task_index, score: 100 }))
    const { currentTaskIndex, currentTask, overall } = buildRoadmap({ tasks, completions })
    expect(currentTaskIndex).toBeNull()
    expect(currentTask).toBeNull()
    expect(overall.pct).toBe(100)
  })

  it('keeps sandbox and quiz scores separate and averages them independently', () => {
    const { overall } = buildRoadmap({
      tasks,
      completions: [
        { task_id: 1, score: 80, quiz_score: null },
        { task_id: 2, score: 90, quiz_score: null },
        { task_id: 3, score: 70, quiz_score: 100 },
      ],
    })
    expect(overall.avgScore).toBe(80)
    // Averaged over the one task that HAS a quiz — not diluted by the two
    // that don't.
    expect(overall.avgQuiz).toBe(100)
    expect(overall.quizCount).toBe(1)
  })

  it('returns null averages rather than NaN when nothing is completed', () => {
    const { overall } = buildRoadmap({ tasks })
    expect(overall.avgScore).toBeNull()
    expect(overall.avgQuiz).toBeNull()
    expect(overall.pct).toBe(0)
  })

  it('treats a sim with no weeks as a single section', () => {
    const { sections } = buildRoadmap({ tasks: [task(1, null), task(2, null)] })
    expect(sections).toHaveLength(1)
    expect(sections[0].label).toBe('Section 1')
  })

  it('survives being called with nothing', () => {
    const { sections, overall, currentTask } = buildRoadmap()
    expect(sections).toEqual([])
    expect(currentTask).toBeNull()
    expect(overall.total).toBe(0)
  })
})

describe('breakdownRows', () => {
  it('maps grader checks to rows', () => {
    const rows = breakdownRows({
      checks: [
        { id: 'semantic', label: 'Semantic header', points: 20, pass: true },
        { id: 'responsive', label: 'Responsive breakpoint', points: 20, pass: false },
      ],
    })
    expect(rows).toEqual([
      { id: 'semantic', label: 'Semantic header', points: 20, passed: true },
      { id: 'responsive', label: 'Responsive breakpoint', points: 20, passed: false },
    ])
  })

  it('yields no rows for shapes it does not recognise', () => {
    // Declarative-rules sandboxes, LLM-graded tasks and pre-existing rows all
    // put other things in rubric_rating; the drawer must degrade, not throw.
    expect(breakdownRows(null)).toEqual([])
    expect(breakdownRows({})).toEqual([])
    expect(breakdownRows({ checks: 'not an array' })).toEqual([])
  })
})
