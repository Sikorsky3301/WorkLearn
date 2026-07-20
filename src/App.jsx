import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './features/auth/AuthContext'

// ── Shared ────────────────────────────────────────────────────────────────────
import Navbar from './shared/Navbar'
import Footer from './shared/Footer'

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
// Shared across every simulation (browse/enroll, offer-letter onboarding,
// evaluation results) live at features/simulations/ root; each simulation's
// own files live in its own features/simulations/{sim-id}/ folder.
import SimulationWorkspace   from './features/simulations/SimulationWorkspace'
import EvaluationResult      from './features/simulations/EvaluationResult'
import SimulationOverview    from './features/simulations/da-job-sim/SimulationOverview'
import DASimulationWorkspace from './features/simulations/da-job-sim/DASimulationWorkspace'
import FrontendSimulationOverview  from './features/simulations/frontend-dev-sim/FrontendSimulationOverview'
import FrontendSimulationWorkspace from './features/simulations/frontend-dev-sim/FrontendSimulationWorkspace'
import CrmSimOverview from './features/simulations/sales-crm-sim/CrmSimOverview'
import CrmSimShell    from './features/simulations/sales-crm-sim/CrmSimShell'

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

// Routes that are an active, focused work session — an immersive
// simulation workspace or a live MIRA interview — skip the global footer so
// nothing competes for attention. (The simulation workspaces render their
// own in-character branded footer instead; see DASimulationWorkspace /
// FrontendSimulationWorkspace.)
const FOOTERLESS_ROUTES = ['/mira/session', '/simulations/da-job-sim', '/simulations/frontend-dev-sim', '/simulations/sales-crm-sim']

function MainLayout() {
  const location = useLocation()
  const showFooter = !FOOTERLESS_ROUTES.includes(location.pathname)
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1"><Outlet /></main>
      {showFooter && <Footer />}
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
          <Route path="/simulations/sales-crm-sim/overview"    element={<CrmSimOverview />} />
          <Route path="/simulations/sales-crm-sim"              element={<CrmSimShell />} />
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
