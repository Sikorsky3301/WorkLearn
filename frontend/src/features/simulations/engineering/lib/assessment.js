// Passing the mini assessment is what unlocks the next task.
//
// Its own module, not a constant exported from a page: the task page and the
// sandbox workbench both enforce this rule, and importing it from the
// workbench would drag Monaco into the task page's bundle for the sake of one
// number.
//
// Set here rather than read from a task's own `pass_mark`, which is only
// authored on the final exam. Every mini assessment shares this bar, so
// "what do I need to score?" has one answer everywhere.
export const ASSESSMENT_PASS_MARK = 80

/** Whether a task's assessment has been passed.
 *
 * `live` is a score from an attempt made in the current tab; it wins over the
 * stored value so the gate opens the moment the student passes, without
 * waiting for the enrollment query to refetch. `stored` is
 * TaskCompletion.quiz_score, which is what makes a pass survive a reload. */
export function hasPassedAssessment(live, stored) {
  return (live ?? stored ?? -1) >= ASSESSMENT_PASS_MARK
}

/**
 * The week a task belongs to, and whether finishing that task finishes the week.
 *
 * "Finished" means every task in the section is complete AND has passed its
 * assessment — passing the last ticket's quiz is the actual final act of a
 * week, which is why this is checked after an assessment rather than after a
 * submission.
 *
 * `liveScore` is the score from an attempt just made, which the enrollment
 * query hasn't caught up with yet; without it the celebration would only
 * appear on the next page load, by which point the moment has passed.
 *
 * Returns null when the task isn't the last of its section, or the section
 * isn't finished, or the section can't be found.
 */
export function weekCompletion(roadmap, taskIndex, liveScore) {
  const section = roadmap?.sections?.find(
    (s) => s.tasks.some((t) => t.task_index === taskIndex),
  )
  if (!section) return null

  // Only the LAST task of the week triggers it — finishing task 2 of 3 out of
  // order shouldn't declare the week done just because 1 and 3 were already in.
  const last = section.tasks[section.tasks.length - 1]
  if (last?.task_index !== taskIndex) return null

  const done = section.tasks.every((t) => {
    const passed = t.task_index === taskIndex
      ? hasPassedAssessment(liveScore, t.quizScore)
      : hasPassedAssessment(null, t.quizScore)
    return t.score != null && passed
  })
  if (!done) return null

  const scores = section.tasks.map((t) => t.score).filter((s) => s != null)
  const sectionIndex = roadmap.sections.indexOf(section)

  return {
    section,
    weekNumber: section.week ?? sectionIndex + 1,
    weekLabel: section.label,
    tasksCompleted: section.tasks.length,
    xpEarned: section.tasks.reduce((sum, t) => sum + (t.xp_award || 0), 0),
    avgScore: scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null,
    nextSection: roadmap.sections[sectionIndex + 1] ?? null,
  }
}
