import { createContext, useContext, useState } from 'react'

export const ROLES = {
  DIRECT_USER:        'direct_user',
  UNIVERSITY_STUDENT: 'university_student',
  CLASS_MENTOR:       'class_mentor',
  SUPER_ADMIN:        'super_admin',
}

// Default feature access per role
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

// ── Mock credential store ──────────────────────────────────────────────────
const DIRECT_USERS = {
  'demo@worklearn.ai': {
    password: 'demo123', role: ROLES.DIRECT_USER,
    name: 'Alex Demo', email: 'demo@worklearn.ai', avatar: 'AD',
  },
  'admin@worklearn.ai': {
    password: 'admin123', role: ROLES.SUPER_ADMIN,
    name: 'Platform Admin', email: 'admin@worklearn.ai', avatar: 'SA',
  },
}

const UNIVERSITY_USERS = {
  '21CS001': {
    password: 'student123', role: ROLES.UNIVERSITY_STUDENT,
    name: 'Rahul Sharma', rollNo: '21CS001',
    department: 'CSE', section: 'A', year: '3rd Year',
    institution: 'IIT Delhi', institutionCode: 'IITD',
    unlockedFeatures: [],
    assignedTasks: [
      { id: 'a1', type: 'simulation', resourceId: 'da-job-sim', title: 'Junior DA Job Simulation', dueDate: '2025-08-15', status: 'in_progress', progress: 40 },
      { id: 'a2', type: 'course', resourceId: 'advanced-system-design', title: 'Advanced System Design', dueDate: '2025-08-30', status: 'pending', progress: 0 },
    ],
  },
  '21CS002': {
    password: 'student123', role: ROLES.UNIVERSITY_STUDENT,
    name: 'Priya Singh', rollNo: '21CS002',
    department: 'CSE', section: 'A', year: '3rd Year',
    institution: 'IIT Delhi', institutionCode: 'IITD',
    unlockedFeatures: ['python_sandbox'],
    assignedTasks: [
      { id: 'a1', type: 'simulation', resourceId: 'da-job-sim', title: 'Junior DA Job Simulation', dueDate: '2025-08-15', status: 'completed', progress: 100 },
    ],
  },
  'MENTOR001': {
    password: 'mentor123', role: ROLES.CLASS_MENTOR,
    name: 'Prof. Ananya Sharma', email: 'ananya@iitd.ac.in',
    department: 'CSE', section: 'CS-3A',
    institution: 'IIT Delhi', institutionCode: 'IITD',
    avatar: 'AS',
    studentCount: 24,
  },
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  const loginDirect = (email, password) => {
    const u = DIRECT_USERS[email.toLowerCase()]
    if (!u || u.password !== password) return { error: 'Invalid email or password.' }
    const { password: _pw, ...safe } = u
    setUser(safe)
    return { success: true, role: safe.role }
  }

  const loginUniversity = (rollNo, password) => {
    const u = UNIVERSITY_USERS[rollNo.toUpperCase()]
    if (!u || u.password !== password) return { error: 'Invalid Roll Number or password.' }
    if (u.role === ROLES.CLASS_MENTOR) return { error: 'Mentors must log in at the Mentor Login page.' }
    const { password: _pw, ...safe } = u
    setUser(safe)
    return { success: true, role: safe.role }
  }

  const loginMentor = (mentorId, password) => {
    const u = UNIVERSITY_USERS[mentorId.toUpperCase()]
    if (!u || u.password !== password) return { error: 'Invalid Mentor ID or password.' }
    if (u.role !== ROLES.CLASS_MENTOR) return { error: 'This portal is for mentors only. Students should use University Login.' }
    const { password: _pw, ...safe } = u
    setUser(safe)
    return { success: true, role: safe.role }
  }

  const logout = () => setUser(null)

  const hasFeature = (featureName) => {
    if (!user) return false
    const defaults = ROLE_FEATURES[user.role] || {}
    if (defaults[featureName]) return true
    if (user.unlockedFeatures?.includes(featureName)) return true
    return false
  }

  const unlockFeature = (featureName) => {
    if (!user) return
    setUser(prev => ({
      ...prev,
      unlockedFeatures: [...(prev.unlockedFeatures || []), featureName],
    }))
  }

  return (
    <AuthContext.Provider value={{ user, loginDirect, loginUniversity, loginMentor, logout, hasFeature, unlockFeature }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
