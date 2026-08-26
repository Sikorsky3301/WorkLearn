import { createContext, useContext, useState, useEffect } from 'react'
import { api, setToken, clearToken, getToken } from '../../lib/client'
import { ROLES } from '../../rbac/roles'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // True while an auth page is running its own post-login transition.
  //
  // GuestOnlyRoute bounces a signed-in user off /login, which is right for
  // someone hitting Back onto a live session and wrong for the person who
  // just signed in ON that form: setUser() lands, the guard redirects on the
  // same commit, and the login page unmounts before its own loader has drawn
  // a single frame. The loader was there the whole time and had no chance to
  // render.
  //
  // While this is set the guard stands down and lets the page navigate when
  // it is ready. It lives here rather than in the page because the two
  // components do not nest — the guard renders the page, so props cannot
  // carry it upward.
  const [authTransition, setAuthTransition] = useState(false)

  // Restore session from stored token on mount
  useEffect(() => {
    const token = getToken()
    if (!token) { setLoading(false); return }

    // 5-second safety timeout — if backend is unreachable, don't hang forever
    const timeout = setTimeout(() => { clearToken(); setLoading(false) }, 5000)

    api.get('/api/auth/me')
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => { clearTimeout(timeout); setLoading(false) })
  }, [])

  // NO cross-tab session sync, deliberately.
  //
  // This used to listen for `storage` on the token key and re-fetch /me
  // whenever another tab wrote one — so signing in as an admin in a second tab
  // silently reassigned THIS tab to the admin account, mid-session, with no
  // interaction. That is the other half of why two accounts could not be open
  // at once, and it is the more surprising half: the tab you were not touching
  // changed identity underneath you.
  //
  // Each tab now owns its session (see getToken in lib/client.js). A login or
  // logout elsewhere leaves this tab exactly as it was; its own token stays
  // valid until it expires or this tab signs out.

  // Flattening the thrown error to a bare `{ error: message }` lost the two
  // things the form needs to give useful advice: whether the server answered
  // at all, and what it said if it did. "Couldn't reach the server" and
  // "wrong password" call for completely different next steps.
  const failure = (e) => ({
    error: e.message,
    isNetworkError: Boolean(e.isNetworkError),
    status: e.status,
  })

  const register = async (name, email, password) => {
    try {
      const { token, user: u } = await api.post('/api/auth/register', { name, email, password })
      setToken(token)
      setUser(u)
      return { success: true, role: u.role }
    } catch (e) {
      return failure(e)
    }
  }

  // Unified tenant-aware sign-in (POST /api/auth/login). Host selects the
  // university; account role selects the portal. Super Admin stays on
  // loginSuperAdmin. Legacy loginAdmin / loginUniversity / loginMentor /
  // loginDirect names remain as aliases so older call sites keep working.
  const login = async (email, password) => {
    try {
      const { token, user: u } = await api.post('/api/auth/login', { email, password })
      setToken(token)
      setUser(u)
      return { success: true, role: u.role }
    } catch (e) {
      return failure(e)
    }
  }

  const loginDirect = login
  const loginAdmin = login
  const loginUniversity = login
  const loginMentor = login

  const loginSuperAdmin = async (email, password) => {
    try {
      const { token, user: u } = await api.post('/api/auth/login/superadmin', { email, password })
      setToken(token)
      setUser(u)
      return { success: true, role: u.role }
    } catch (e) {
      return failure(e)
    }
  }

  const logout = () => {
    clearToken()
    setUser(null)
    // Clear it here too: a login that errored after the flag was set
    // would otherwise leave the guard permanently stood down.
    setAuthTransition(false)
  }

  // Re-fetches /me — used after profile/photo/resume/education edits so the
  // rest of the app (Navbar avatar, Portfolio, etc.) sees the change without
  // a full page reload. Silently no-ops on failure; callers already have the
  // mutation's own success/error state to react to.
  const refreshUser = async () => {
    try {
      const u = await api.get('/api/auth/me')
      setUser(u)
    } catch { /* keep stale user rather than wiping the session */ }
  }

  // Real, DB-backed feature flags (see backend's app/services/feature_flags.py)
  // resolved server-side and returned on every login/`/me` response as
  // `user.feature_flags` — replaces the old hardcoded ROLE_FEATURES map.
  // `unlocked_features` is a separate, per-user mechanism (mentors granting
  // one-off unlocks to a specific student) layered on top.
  const hasFeature = (featureName) => {
    if (!user) return false
    if (user.role === ROLES.SUPER_ADMIN) return true
    if (user.feature_flags?.[featureName]) return true
    if (user.unlocked_features?.includes(featureName)) return true
    return false
  }

  const unlockFeature = (featureName) => {
    if (!user) return
    setUser(prev => ({
      ...prev,
      unlocked_features: [...(prev.unlocked_features || []), featureName],
    }))
  }

  // UI-nav convenience only — never the actual authorization boundary. Every
  // Admin-tier endpoint re-checks this server-side. Platform Admin (+ Super Admin)
  // only — University Admin has a separate portal and must not see platform nav.
  const hasPermission = (_key) => {
    if (!user) return false
    return user.role === ROLES.SUPER_ADMIN || user.role === ROLES.ADMIN
  }

  return (
    <AuthContext.Provider value={{
      user, loading, register, login, loginDirect, loginSuperAdmin, loginAdmin, loginUniversity, loginMentor,
      authTransition, setAuthTransition,
      logout, hasFeature, unlockFeature, hasPermission, refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
