import { useCallback, useState } from 'react'

// Remembers which task briefings a student has already sat through.
//
// Deliberately NOT stored in useGenericSimStore: that store is shared by all
// three simulations and is `persist`ed, so adding a field to it means bumping
// its version and writing a migration — and any existing hydrated state that
// missed the migration would read `undefined` and throw on `.includes()`. This
// is engineering-only state; it gets its own key and can't break anyone else.
//
// Read-through on every call rather than cached in module scope, so two tabs
// on the same simulation don't disagree about what has been seen.

const KEY = 'wl-engineering-briefed'

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
}

/**
 * @returns {[boolean, () => void]} whether this task's briefing has been seen,
 *   and a function to mark it seen.
 */
export function useBriefingSeen(slug, taskIndex) {
  const id = `${slug}:${taskIndex}`
  const [seen, setSeen] = useState(() => Boolean(read()[id]))

  const markSeen = useCallback(() => {
    setSeen(true)
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...read(), [id]: true }))
    } catch {
      // Private mode — the briefing simply replays next visit. Harmless.
    }
  }, [id])

  // `replay` deliberately does not clear storage: it re-shows the scene for
  // this mount only, so "watch it again" never resurrects it on every future
  // page load.
  const replay = useCallback(() => setSeen(false), [])

  return [seen, markSeen, replay]
}
