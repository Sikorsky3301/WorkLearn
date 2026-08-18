// Opening an authenticated page in a NEW BROWSER TAB.
//
// The auth token lives in `sessionStorage`, deliberately — see the long note
// in lib/client.js about per-tab role isolation. `sessionStorage` is scoped to
// one tab, so a new tab is not guaranteed to have a session:
//
//   - `window.open()` from the same origin DOES clone sessionStorage into the
//     new tab in current Chrome/Firefox/Safari... but only without
//     `noopener`, and it is a spec corner not worth betting a feature on.
//   - A URL that is bookmarked, pasted, or restored by the browser gets
//     nothing at all.
//
// So we hand the token over explicitly and briefly. `localStorage` is the only
// storage both tabs can see; the entry is written immediately before the open,
// is stamped, and is deleted by the first reader. A stale entry expires after
// HANDOFF_TTL_MS.
//
// Why not the URL: a token in a query string lands in browser history, in the
// Referer header, and in any access log along the way. Never do that.
//
// Accepted trade-off: for a few seconds the token is readable from
// `localStorage` on this origin. An attacker who can run script on this origin
// can already read the sessionStorage token directly, so this does not widen
// the blast radius — but the clean long-term fix is a single-use exchange code
// minted by the backend. TODO(auth): do that when there's a reason to.
import { getToken, setToken } from './client'

const HANDOFF_KEY = 'wl_tab_handoff'
const HANDOFF_TTL_MS = 30_000

/**
 * Open `path` in a new tab, carrying this tab's session with it.
 *
 * MUST be called synchronously from a user gesture (a click handler) — any
 * `await` before `window.open` and the popup blocker eats it.
 */
export function openAuthedTab(path) {
  const token = getToken()
  if (token) {
    try {
      localStorage.setItem(HANDOFF_KEY, JSON.stringify({ token, ts: Date.now() }))
    } catch {
      // Private mode / quota. The sessionStorage clone is still likely to
      // work, and the target renders a recovery screen if it doesn't.
    }
  }
  // No `noopener`: it suppresses the sessionStorage clone that is our primary
  // path. Same-origin, so the usual reverse-tabnabbing argument doesn't apply.
  return window.open(path, '_blank')
}

/**
 * Adopt a handed-off token, if this tab arrived without one.
 *
 * Call before the first authenticated request — a `useState` initializer at
 * the top of the route component, so it runs during render rather than in an
 * effect that fires after the first fetch.
 *
 * Returns true if this tab now has a session.
 */
export function adoptHandoffToken() {
  if (getToken()) return true

  let raw = null
  try {
    raw = localStorage.getItem(HANDOFF_KEY)
    // Always clear, even on a miss — a handoff is single-use by construction.
    localStorage.removeItem(HANDOFF_KEY)
  } catch {
    return false
  }
  if (!raw) return false

  try {
    const { token, ts } = JSON.parse(raw)
    if (!token || Date.now() - ts > HANDOFF_TTL_MS) return false
    setToken(token)
    return true
  } catch {
    return false
  }
}
