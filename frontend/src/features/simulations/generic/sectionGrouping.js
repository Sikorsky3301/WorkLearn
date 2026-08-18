// Sections, derived.
//
// There is no Section table. A "section" is the nullable `week` int on each
// task, labelled by `Simulation.section_labels` — a `{"1": "Week 1 label"}`
// dict. Both the overview curriculum list and the roadmap need the same
// grouping, so it lives here rather than being written twice.

/**
 * Group tasks into consecutive same-week runs.
 *
 * Tasks arrive from the API already ordered by `task_index`, and a simulation
 * is authored in sequential week blocks (week 1's tasks, then week 2's), so
 * grouping consecutive runs is both correct and preserves the authored order —
 * unlike a bucket-by-key that would need a re-sort and would silently merge a
 * week that legitimately appears twice.
 *
 * `week` is nullable: a sim that doesn't use weeks falls out as one group with
 * `week: null`.
 */
export function groupByWeek(tasks) {
  const groups = []
  for (const t of tasks) {
    const week = t.week ?? null
    const last = groups[groups.length - 1]
    if (last && last.week === week) last.tasks.push(t)
    else groups.push({ week, tasks: [t] })
  }
  return groups
}

/**
 * Human label for a section.
 *
 * `section_labels` is authored in the CMS and is frequently `{}` — the seeded
 * simulations never set it — so the fallbacks are the common path, not an edge
 * case.
 */
export function sectionLabel(sectionLabels, week, groupIndex) {
  const authored = sectionLabels?.[String(week)]
  if (authored) return authored
  return week != null ? `Week ${week}` : `Section ${groupIndex + 1}`
}
