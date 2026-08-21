// Opening an authenticated page in a NEW BROWSER TAB.
//
// The token now lives in `localStorage`, which every tab on the origin can
// already read — so a new tab normally arrives with a session and
// `adoptHandoffToken()` returns immediately on its `getToken()` check. This
// module is the fallback for the cases where it does not:
//
//   - the token is written and the tab opened in the same turn, so the new
//     tab can read `localStorage` before the write has been observed;
//   - anything that clears storage for the new tab.
//
// (It was load-bearing when the token was per-tab `sessionStorage`, which a
// new tab did not reliably inherit. The storage model changed; the guard is
// cheap and covers the residual races, so it stays.)
//
// Why not the URL: a token in a query string lands in browser history, in the
// Referer header, and in any access log along the way. Never do that.
//
// The handoff entry is stamped, single-use — deleted by the first reader —
// and expires after HANDOFF_TTL_MS. The clean long-term fix is a single-use
// exchange code minted by the backend. TODO(auth): do that when there's a
// reason to.
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
      // Private mode / quota. The new tab reads the same localStorage anyway,
      // and the target renders a recovery screen if it somehow doesn't.
    }
  }
  // No `noopener`: kept from when it suppressed the sessionStorage clone this
  // relied on. Same-origin, so the usual reverse-tabnabbing argument doesn't
  // apply either way.
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
