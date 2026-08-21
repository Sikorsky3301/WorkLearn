import { createContext, useContext, useState, useEffect } from 'react'
import { api, setToken, clearToken, getToken } from '../../lib/client'
import { ROLES } from '../../rbac/roles'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session from stored token on mount
  useEffect(() => {
    // One-time migration: the token used to live in sessionStorage (per-tab).
    // Clear any left over there so it can't shadow the localStorage one.
    sessionStorage.removeItem('wl_token')

    const token = getToken()
    if (!token) { setLoading(false); return }

    // 5-second safety timeout — if backend is unreachable, don't hang forever
    const timeout = setTimeout(() => { clearToken(); setLoading(false) }, 5000)

    api.get('/api/auth/me')
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => { clearTimeout(timeout); setLoading(false) })
  }, [])

  // Other tabs share localStorage. Login/logout there should update this tab
  // without a full reload (`storage` only fires in tabs that did not write).
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== 'wl_token') return
      if (!e.newValue) {
        setUser(null)
        return
      }
      api.get('/api/auth/me').then(setUser).catch(() => {
        clearToken()
        setUser(null)
      })
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

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
      logout, hasFeature, unlockFeature, hasPermission, refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
