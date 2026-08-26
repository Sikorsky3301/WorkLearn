import { useCallback, useState } from 'react'

// Whether this task's briefing has already been shown on THIS visit.
//
// ── WHY THIS NO LONGER PERSISTS ────────────────────────────────────────────
//
// It used to write `{"<slug>:<index>": true}` into localStorage and honour it
// forever. Two things came out of that, and both were bad:
//
//   1. The briefing was a once-in-a-lifetime event per task per device. Once
//      you had dismissed it there was no way back to it, and the most common
//      report was simply "the manager animation doesn't show" — because for
//      anyone who had opened the task before, it never would again.
//   2. It made the scene invisible during development and demos for exactly
//      the same reason, which is how it stayed broken.
//
// It is now per-MOUNT state: starting a task plays the briefing, every time.
// Dismissing it hides it for as long as you stay on that task, and moving to
// another task plays that task's brief. It costs a second and a half, it is
// skippable with a click or Escape, and it is the thing that makes work feel
// like it came from a person rather than from a page.
//
// ── WHY THE STATE CARRIES ITS OWN ID ───────────────────────────────────────
//
// `seen` was plain `useState(...)`. A lazy initializer runs ONCE PER MOUNT and
// never again — and EngineeringTaskPage is not remounted when the task
// changes. The route is `/simulations/:slug/task/:taskIndex` with no `key`, so
// finishing a task and pressing "Next" is a param change on the same instance,
// and `seen` stayed `true` from the task before for every task after it.
//
// The fix is the standard "adjust state when a prop changes" pattern: keep the
// id the state belongs to inside the state, and re-derive during render when
// they disagree. Not an effect — an effect would render one frame with the
// previous task's answer first, which shows as a flash of the wrong briefing.

/**
 * @param {string} slug
 * @param {number|string} taskIndex
 * @returns {[boolean, () => void, () => void]} whether this task's briefing has
 *   been dismissed on this visit, a function to dismiss it, and one to replay.
 */
export function useBriefingSeen(slug, taskIndex) {
  const id = `${slug}:${taskIndex}`
  const [state, setState] = useState({ id, seen: false })

  // Re-derive during render, not in an effect. React discards this pass and
  // re-renders immediately, so nothing is ever painted with the stale answer.
  if (state.id !== id) setState({ id, seen: false })

  const markSeen = useCallback(() => setState({ id, seen: true }), [id])
  const replay = useCallback(() => setState({ id, seen: false }), [id])

  // While the id is being corrected, report the incoming task's answer rather
  // than the outgoing one's.
  const seen = state.id === id ? state.seen : false

  return [seen, markSeen, replay]
}
