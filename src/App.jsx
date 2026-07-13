import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './features/auth/AuthContext'

// ── Shared ────────────────────────────────────────────────────────────────────
import Navbar from './shared/Navbar'

// ── Auth: global (direct/individual users + super admin) ───────────────────────
import Login            from './features/auth/global/Login'
import AdminLogin       from './features/auth/global/AdminLogin'

// ── Auth: university (institution-scoped students + class mentors) ─────────────
import UniversityLogin  from './features/auth/university/UniversityLogin'
import MentorLogin      from './features/auth/university/MentorLogin'

// ── Admin ─────────────────────────────────────────────────────────────────────
import SuperAdmin from './features/admin/SuperAdmin'

// ── Mentor ────────────────────────────────────────────────────────────────────
import ClassMentor from './features/mentor/ClassMentor'

// ── Dashboard ─────────────────────────────────────────────────────────────────
import Dashboard from './features/dashboard/Dashboard'

// ── Simulations ───────────────────────────────────────────────────────────────
import SimulationWorkspace   from './features/simulations/SimulationWorkspace'
import SimulationOverview    from './features/simulations/SimulationOverview'
import DASimulationWorkspace from './features/simulations/DASimulationWorkspace'
import FrontendSimulationOverview  from './features/simulations/FrontendSimulationOverview'
import FrontendSimulationWorkspace from './features/simulations/FrontendSimulationWorkspace'
import EvaluationResult      from './features/simulations/EvaluationResult'

// ── Other platform features ───────────────────────────────────────────────────
import Portfolio    from './features/portfolio/Portfolio'
import AIMentor     from './features/ai-mentor/CareerTwin'
import SkillGPS     from './features/skill-gps/SkillGPS'
import Analytics    from './features/analytics/Analytics'
import Community    from './features/community/Community'
import Settings     from './features/settings/Settings'

// ── MIRA (AI mock interviews) ─────────────────────────────────────────────────
import { MiraProvider } from './features/mira/MiraContext'
import MiraHero    from './features/mira/MiraHero'
import MiraSetup   from './features/mira/MiraSetup'
import MiraSession from './features/mira/MiraSession'
import MiraResults from './features/mira/MiraResults'

function MainLayout() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main><Outlet /></main>
    </div>
  )
}

function MiraLayout() {
  return (
    <MiraProvider>
      <Outlet />
    </MiraProvider>
  )
}

function ProtectedRoute() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  // Admins have no student profile — keep them inside the admin panel
  if (user.role === 'SUPER_ADMIN') return <Navigate to="/admin" replace />
  return <Outlet />
}

function AdminRoute() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (!user || user.role !== 'SUPER_ADMIN') return <AdminLogin />
  return <SuperAdmin />
}

export default function App() {
  return (
    <Routes>
      {/* Public — no auth required */}
      <Route path="/login"            element={<Login />} />
      <Route path="/university/login" element={<UniversityLogin />} />
      <Route path="/mentor/login"     element={<MentorLogin />} />
      {/* Admin route — shows login if not authenticated, panel if SUPER_ADMIN */}
      <Route path="/admin" element={<AdminRoute />} />

      {/* Protected — require login */}
      <Route element={<ProtectedRoute />}>
        <Route path="/mentor"     element={<ClassMentor />} />

        <Route element={<MainLayout />}>
          <Route path="/"                        element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"               element={<Dashboard />} />
          <Route path="/simulations"                       element={<SimulationWorkspace />} />
          <Route path="/simulations/da-job-sim/overview"   element={<SimulationOverview />} />
          <Route path="/simulations/da-job-sim"            element={<DASimulationWorkspace />} />
          <Route path="/simulations/frontend-dev-sim/overview" element={<FrontendSimulationOverview />} />
          <Route path="/simulations/frontend-dev-sim"           element={<FrontendSimulationWorkspace />} />
          <Route path="/portfolio"               element={<Portfolio />} />
          <Route path="/ai-mentor"               element={<AIMentor />} />
          <Route path="/skill-gps"               element={<SkillGPS />} />
          <Route path="/analytics"               element={<Analytics />} />
          <Route element={<MiraLayout />}>
            <Route path="/mira"                  element={<MiraHero />} />
            <Route path="/mira/setup"            element={<MiraSetup />} />
            <Route path="/mira/session"          element={<MiraSession />} />
            <Route path="/mira/results"          element={<MiraResults />} />
          </Route>
          <Route path="/settings"                element={<Settings />} />
          <Route path="/evaluations/:id"         element={<EvaluationResult />} />
          <Route path="/community"               element={<Community />} />
        </Route>
      </Route>
    </Routes>
  )
}
