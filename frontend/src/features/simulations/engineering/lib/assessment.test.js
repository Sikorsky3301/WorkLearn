import { describe, it, expect } from 'vitest'
import { ASSESSMENT_PASS_MARK, hasPassedAssessment, weekCompletion } from './assessment'

// This function decides whether a student can move on, so its edge cases are
// worth pinning: an off-by-one at the boundary either blocks someone who
// passed or waves through someone who didn't.

describe('hasPassedAssessment', () => {
  it('blocks a task that has never been assessed', () => {
    expect(hasPassedAssessment(null, null)).toBe(false)
    expect(hasPassedAssessment(undefined, undefined)).toBe(false)
  })

  it('passes exactly at the mark, not one below', () => {
    expect(hasPassedAssessment(null, ASSESSMENT_PASS_MARK)).toBe(true)
    expect(hasPassedAssessment(null, ASSESSMENT_PASS_MARK - 1)).toBe(false)
  })

  it('honours a pass stored from an earlier visit', () => {
    // Reloading the page must not make someone retake a quiz they passed.
    expect(hasPassedAssessment(null, 100)).toBe(true)
  })

  it('lets a fresh attempt override the stored score immediately', () => {
    // The enrollment query hasn't refetched yet, so the stored value is still
    // the old failure — the gate has to open on the live result.
    expect(hasPassedAssessment(90, 40)).toBe(true)
  })

  it('lets a fresh failure override a stored pass', () => {
    // A retake that went worse is still the current answer; not doing this
    // would let one good attempt permanently mask later ones.
    expect(hasPassedAssessment(20, 100)).toBe(false)
  })

  it('treats 0 as a real score rather than a missing one', () => {
    // `??` not `||` — scoring 0 must not fall through to the stored value.
    expect(hasPassedAssessment(0, 100)).toBe(false)
  })
})

describe('weekCompletion', () => {
  const section = (label, week, tasks) => ({
    label, week, tasks, total: tasks.length,
    completedCount: tasks.filter((t) => t.score != null).length,
  })
  const task = (i, score, quizScore, xp = 50) => ({
    task_index: i, title: `Task ${i}`, score, quizScore, xp_award: xp,
  })

  const roadmap = (sections) => ({ sections })

  it('returns null until the last task of the week is the one just finished', () => {
    const r = roadmap([section('Week 1', 1, [
      task(1, 100, 100), task(2, 100, 100), task(3, 100, null),
    ])])
    // Task 2 passed, but task 3 is still outstanding.
    expect(weekCompletion(r, 2, 100)).toBeNull()
  })

  it('fires on the last task once every task in the week has passed', () => {
    const r = roadmap([section('Week 1 — Structure', 1, [
      task(1, 100, 100), task(2, 80, 100), task(3, 90, null),
    ])])
    const result = weekCompletion(r, 3, 100)
    expect(result).not.toBeNull()
    expect(result.weekNumber).toBe(1)
    expect(result.weekLabel).toBe('Week 1 — Structure')
    expect(result.tasksCompleted).toBe(3)
    expect(result.xpEarned).toBe(150)
    expect(result.avgScore).toBe(90)
  })

  it('does not fire when an earlier task in the week failed its quiz', () => {
    const r = roadmap([section('Week 1', 1, [
      task(1, 100, 40), task(2, 100, 100), task(3, 100, null),
    ])])
    expect(weekCompletion(r, 3, 100)).toBeNull()
  })

  it('does not fire when the live score itself is a fail', () => {
    const r = roadmap([section('Week 1', 1, [
      task(1, 100, 100), task(2, 100, 100), task(3, 100, null),
    ])])
    expect(weekCompletion(r, 3, 60)).toBeNull()
  })

  it('reports the next section so the button can name it', () => {
    const r = roadmap([
      section('Week 1', 1, [task(1, 100, 100)]),
      section('Week 2 — Data', 2, [task(2, null, null)]),
    ])
    expect(weekCompletion(r, 1, 100).nextSection.label).toBe('Week 2 — Data')
  })

  it('reports no next section on the final week', () => {
    const r = roadmap([section('Week 3', 3, [task(9, 100, null)])])
    expect(weekCompletion(r, 9, 100).nextSection).toBeNull()
  })

  it('survives an unknown task index', () => {
    expect(weekCompletion(roadmap([]), 99, 100)).toBeNull()
    expect(weekCompletion(undefined, 1, 100)).toBeNull()
  })
})
