// Opening an authenticated page in a NEW BROWSER TAB, as the account that
// just clicked — even if the tab that opens is not actually empty.
//
// Sessions are per-tab (see getToken() in ./client.js): each tab keeps its own
// sessionStorage copy, and only adopts the shared localStorage one when its
// own is empty. That is what lets an admin and a student stay signed in in
// two tabs at once. It has one sharp edge: a tab is not guaranteed to be
// EMPTY just because it is new. Chrome can restore a closed tab's
// sessionStorage from disk, and a target[='_blank'] window can be reused by
// the OS/browser in ways that leave old sessionStorage sitting in it. If that
// old value belongs to a DIFFERENT account than whoever just clicked "open in
// a new tab" — a student session tested minutes earlier, say — the stale
// tab's own session used to win, silently. An admin clicking "Sim Builder"
// landed in a tab that still thought it was a student, RequireCmsAccess
// bounced it to /login, and GuestOnlyRoute bounced an already-authenticated
// student straight back to the dashboard — which is indistinguishable from
// "clicking Sim Builder just opens the app".
//
// So a HANDOFF, written by the opener in the same click, is checked FIRST and
// wins over anything already in the new tab. It is unambiguous evidence of
// what just happened, seconds ago, in a way a tab's pre-existing storage is
// not.
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
  // Read (and clear — single-use regardless of outcome) the handoff BEFORE
  // asking whether this tab already has a session. A fresh handoff overrides
  // whatever this tab already believes about itself; only fall back to "does
  // this tab already have a session" when there is no fresh handoff to apply.
  let raw = null
  try {
    raw = localStorage.getItem(HANDOFF_KEY)
    localStorage.removeItem(HANDOFF_KEY)
  } catch {
    raw = null
  }

  if (raw) {
    try {
      const { token, ts } = JSON.parse(raw)
      if (token && Date.now() - ts <= HANDOFF_TTL_MS) {
        setToken(token)
        return true
      }
    } catch {
      // Malformed entry — fall through to the ordinary check below.
    }
  }

  return Boolean(getToken())
}
