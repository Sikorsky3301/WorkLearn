// Pure derivation of the roadmap from the two things the server gives us:
// the simulation's tasks, and the student's completions. No React, no
// fetching — so the interesting logic (which task is current, what counts as
// locked, how averages are taken) is unit-testable on its own.
import { groupByWeek, sectionLabel } from '../../generic/sectionGrouping'

export const TASK_STATUS = {
  COMPLETE: 'complete',
  CURRENT: 'current',
  LOCKED: 'locked',
}

/**
 * Index completions by task.
 *
 * TRAP: `TaskCompletion.task_id` holds the task's **`task_index`**, not
 * `SimulationTask.id`. Confirmed in the backend — `award_task_completion`
 * looks the task up with `SimulationTask.task_index == task_id`, and the
 * sandbox submit route passes the index straight through from the URL.
 * Keying this map on `task.id` would look correct and silently mis-map every
 * score on the page.
 */
function completionsByTaskIndex(completions) {
  return new Map((completions ?? []).map((c) => [c.task_id, c]))
}

/**
 * Build the roadmap view model.
 *
 * @param tasks         from useSimulationFull → ordered by task_index
 * @param sectionLabels simulation.section_labels — usually `{}` in practice
 * @param completions   enrollment.task_completions
 */
export function buildRoadmap({ tasks = [], sectionLabels = {}, completions = [] } = {}) {
  const byIndex = completionsByTaskIndex(completions)

  // The current task is the first one with no completion. Derived rather than
  // read from `enrollment.current_task_idx` because that field is advanced to
  // `task_id + 1` on every award — including a re-submit of an already-done
  // task, which would push it past work the student hasn't reached.
  const currentTaskIndex = tasks.find((t) => !byIndex.has(t.task_index))?.task_index ?? null

  const decorate = (task) => {
    const completion = byIndex.get(task.task_index)
    const status = completion
      ? TASK_STATUS.COMPLETE
      : task.task_index === currentTaskIndex
        ? TASK_STATUS.CURRENT
        : TASK_STATUS.LOCKED
    return {
      ...task,
      status,
      // Two independent nullable columns on one row: a task can legitimately
      // have a grader score and no quiz, which is the norm here — only the
      // last task of frontend-dev-sim carries a post-task quiz at all.
      score: completion?.score ?? null,
      quizScore: completion?.quiz_score ?? null,
      completedAt: completion?.completed_at ?? null,
    }
  }

  const sections = groupByWeek(tasks).map((group, i) => {
    const decorated = group.tasks.map(decorate)
    const completed = decorated.filter((t) => t.status === TASK_STATUS.COMPLETE)
    return {
      key: group.week ?? `section-${i}`,
      week: group.week,
      label: sectionLabel(sectionLabels, group.week, i),
      tasks: decorated,
      completedCount: completed.length,
      total: decorated.length,
      avgScore: average(completed.map((t) => t.score)),
    }
  })

  const all = sections.flatMap((s) => s.tasks)
  const done = all.filter((t) => t.status === TASK_STATUS.COMPLETE)

  return {
    sections,
    currentTaskIndex,
    currentTask: all.find((t) => t.task_index === currentTaskIndex) ?? null,
    overall: {
      completed: done.length,
      total: all.length,
      pct: all.length ? Math.round((done.length / all.length) * 100) : 0,
      avgScore: average(done.map((t) => t.score)),
      // Averaged over the tasks that actually have a quiz, not over all
      // completed tasks — otherwise one quiz among five tasks reads as a
      // catastrophic 20%.
      avgQuiz: average(done.map((t) => t.quizScore)),
      quizCount: done.filter((t) => t.quizScore != null).length,
    },
  }
}

/** Mean of the non-null values, or null when there are none. */
function average(values) {
  const present = values.filter((v) => v != null)
  if (!present.length) return null
  return Math.round(present.reduce((a, b) => a + b, 0) / present.length)
}

/**
 * Normalise a grader result into rows for the score breakdown.
 *
 * `rubric_rating` holds whatever the grader returned. For the registered
 * graders it is `{score, checks: [{id, label, points, pass}], details: {...}}`;
 * declarative-rules sandboxes and the LLM-graded types put other shapes there,
 * and older rows may have nothing at all — so every access is defensive and
 * an unrecognised shape yields no rows rather than throwing.
 */
export function breakdownRows(rubricRating) {
  const checks = rubricRating?.checks
  if (!Array.isArray(checks)) return []
  return checks.map((c, i) => ({
    id: c.id ?? `check-${i}`,
    label: c.label ?? c.id ?? `Check ${i + 1}`,
    points: typeof c.points === 'number' ? c.points : null,
    passed: Boolean(c.pass),
  }))
}
