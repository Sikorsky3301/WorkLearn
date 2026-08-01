import { createContext, useContext, useState, useEffect } from 'react'
import { api, setToken, clearToken } from '../../lib/client'

// Values match the backend Role enum (uppercase)
export const ROLES = {
  DIRECT_USER:        'DIRECT_USER',
  UNIVERSITY_STUDENT: 'UNIVERSITY_STUDENT',
  CLASS_MENTOR:       'CLASS_MENTOR',
  SUPER_ADMIN:        'SUPER_ADMIN',
  // Fine-grained-permission admin tier, distinct from SUPER_ADMIN — see
  // backend's app/models_rbac.py. Real enforcement is always server-side
  // (require_permission); `hasPermission` below is a UI-nav convenience only.
  ADMIN:              'ADMIN',
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session from stored token on mount
  useEffect(() => {
    // One-time cleanup: a short-lived "Remember me" feature used to also
    // write the token to localStorage, which — being shared across every
    // tab, unlike sessionStorage — silently overrode per-tab role
    // isolation (a fresh /super-admin tab would inherit whatever role was
    // "remembered" and get redirected). That feature's been reverted; this
    // just clears out any token it may have left behind on this machine.
    localStorage.removeItem('wl_token')

    const token = sessionStorage.getItem('wl_token')
    if (!token) { setLoading(false); return }

    // 5-second safety timeout — if backend is unreachable, don't hang forever
    const timeout = setTimeout(() => { clearToken(); setLoading(false) }, 5000)

    api.get('/api/auth/me')
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => { clearTimeout(timeout); setLoading(false) })
  }, [])

  const register = async (name, email, password) => {
    try {
      const { token, user: u } = await api.post('/api/auth/register', { name, email, password })
      setToken(token)
      setUser(u)
      return { success: true, role: u.role }
    } catch (e) {
      return { error: e.message }
    }
  }

  const loginDirect = async (email, password) => {
    try {
      const { token, user: u } = await api.post('/api/auth/login/direct', { email, password })
      setToken(token)
      setUser(u)
      return { success: true, role: u.role }
    } catch (e) {
      return { error: e.message }
    }
  }

  const loginSuperAdmin = async (email, password) => {
    try {
      const { token, user: u } = await api.post('/api/auth/login/superadmin', { email, password })
      setToken(token)
      setUser(u)
      return { success: true, role: u.role }
    } catch (e) {
      return { error: e.message }
    }
  }

  const loginAdmin = async (email, password) => {
    try {
      const { token, user: u } = await api.post('/api/auth/login/admin', { email, password })
      setToken(token)
      setUser(u)
      return { success: true, role: u.role }
    } catch (e) {
      return { error: e.message }
    }
  }

  const loginUniversity = async (rollNo, password) => {
    try {
      const { token, user: u } = await api.post('/api/auth/login/university', { roll_no: rollNo, password })
      setToken(token)
      setUser(u)
      return { success: true, role: u.role }
    } catch (e) {
      return { error: e.message }
    }
  }

  const loginMentor = async (mentorId, password) => {
    try {
      const { token, user: u } = await api.post('/api/auth/login/mentor', { mentor_id: mentorId, password })
      setToken(token)
      setUser(u)
      return { success: true, role: u.role }
    } catch (e) {
      return { error: e.message }
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
  // Admin-tier endpoint re-checks permissions server-side on every request
  // (see backend's require_permission), so this can only ever hide/show nav,
  // not actually grant/deny access.
  const hasPermission = (key) => {
    if (!user) return false
    if (user.role === ROLES.SUPER_ADMIN) return true
    return Boolean(user.permissions?.includes(key))
  }

  return (
    <AuthContext.Provider value={{
      user, loading, register, loginDirect, loginSuperAdmin, loginAdmin, loginUniversity, loginMentor,
      logout, hasFeature, unlockFeature, hasPermission, refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
