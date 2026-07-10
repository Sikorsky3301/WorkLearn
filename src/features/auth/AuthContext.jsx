import { createContext, useContext, useState, useEffect } from 'react'
import { api, setToken, clearToken } from '../../shared/api/client'

// Values match the backend Role enum (uppercase)
export const ROLES = {
  DIRECT_USER:        'DIRECT_USER',
  UNIVERSITY_STUDENT: 'UNIVERSITY_STUDENT',
  CLASS_MENTOR:       'CLASS_MENTOR',
  SUPER_ADMIN:        'SUPER_ADMIN',
}

const ROLE_FEATURES = {
  [ROLES.DIRECT_USER]: {
    python_sandbox: true, download_dataset: true, model_solution: true,
    certificate: true, all_courses: true, assign_tasks: false, admin_panel: false,
  },
  [ROLES.UNIVERSITY_STUDENT]: {
    python_sandbox: false, download_dataset: true, model_solution: false,
    certificate: false, all_courses: false, assign_tasks: false, admin_panel: false,
  },
  [ROLES.CLASS_MENTOR]: {
    python_sandbox: true, download_dataset: true, model_solution: true,
    certificate: true, all_courses: true, assign_tasks: true, admin_panel: false,
  },
  [ROLES.SUPER_ADMIN]: {
    python_sandbox: true, download_dataset: true, model_solution: true,
    certificate: true, all_courses: true, assign_tasks: true, admin_panel: true,
  },
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session from stored token on mount
  useEffect(() => {
    const token = localStorage.getItem('wl_token')
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

  const hasFeature = (featureName) => {
    if (!user) return false
    const defaults = ROLE_FEATURES[user.role] || {}
    if (defaults[featureName]) return true
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

  return (
    <AuthContext.Provider value={{ user, loading, register, loginDirect, loginSuperAdmin, loginUniversity, loginMentor, logout, hasFeature, unlockFeature }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
