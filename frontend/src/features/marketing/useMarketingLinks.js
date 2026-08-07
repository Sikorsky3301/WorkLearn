import { useAuth } from '../auth/AuthContext'

/** Destinations that differ depending on whether the visitor is signed in.
 *
 * The marketing site is reachable while logged in (the app Navbar's logo
 * points at `/home` — see app/router/AppRouter.jsx), so its links can't
 * assume a logged-out visitor:
 *
 * - `homePath` — `/` is wrapped in PublicOnlyRoute and bounces a signed-in
 *   user to /dashboard, so linking there would make the marketing site
 *   unreachable for them. `/home` is the unguarded twin.
 * - `startPath` / `startLabel` — `/login` does not redirect an already
 *   authenticated user, so a "Start free" button would drop them on a login
 *   form they don't need.
 *
 * `useAuth` is safe on public pages (plain context, resolves to `null` when
 * logged out) in a way `useSimulations`/`useMyAssignments` are not.
 */
export function useMarketingLinks() {
  const { user } = useAuth()
  const signedIn = Boolean(user)
  return {
    signedIn,
    homePath: signedIn ? '/home' : '/',
    startPath: signedIn ? '/dashboard' : '/login',
    // `null` when logged out so callers keep their own copy ("Start free",
    // "Get started free", …) and only share the signed-in wording.
    startLabel: signedIn ? 'Go to dashboard' : null,
  }
}
