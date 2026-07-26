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
import SimulationBuilder from './features/admin/cms/SimulationBuilder'

// ── Mentor ────────────────────────────────────────────────────────────────────
import ClassMentor from './features/mentor/ClassMentor'

// ── Dashboard ─────────────────────────────────────────────────────────────────
import Dashboard from './features/dashboard/Dashboard'

// ── Simulations ───────────────────────────────────────────────────────────────
// Shared across every simulation (browse/enroll, offer-letter onboarding,
// evaluation results) live at features/simulations/ root. All 3 simulations
// (da-job-sim, frontend-dev-sim, sales-crm-sim) are now DB-backed and render
// through the generic engine below — their old hardcoded workspace/overview
// components (features/simulations/{da-job-sim,frontend-dev-sim,sales-crm-sim}/)
// are no longer routed but left on disk for reference; several of their
// sub-components (Stage5Crm, AiCustomerChat, StageQuiz, JupyterPlayground,
// FrontendPlayground) are still imported directly by the generic task-type
// renderers in features/simulations/generic/.
import SimulationWorkspace from './features/simulations/SimulationWorkspace'
import EvaluationResult    from './features/simulations/EvaluationResult'
import GenericSimOverview  from './features/simulations/generic/GenericSimOverview'
import GenericSimShell     from './features/simulations/generic/GenericSimShell'

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
// nothing competes for attention. (GenericSimShell renders its own
// in-character branded footer instead — see GenericSimShell.jsx.) Any
// `/simulations/<slug>` with no further path segment is a running
// simulation; `/simulations` (the picker) and `/simulations/<slug>/overview`
// still show the normal footer.
const FOOTERLESS_ROUTES = ['/mira/session']
const FOOTERLESS_PATTERN = /^\/simulations\/[^/]+$/

function MainLayout() {
  const location = useLocation()
  const showFooter = !FOOTERLESS_ROUTES.includes(location.pathname) && !FOOTERLESS_PATTERN.test(location.pathname)
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
      <div className="min-h-screen flex items-center justify-center bg-surface-low">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (!user || user.role !== 'SUPER_ADMIN') return <AdminLogin />
  return <SuperAdmin />
}

// The simulation builder is a standalone page (its own header, full width,
// no sidebar chrome) rather than nested inside SuperAdmin.jsx's tab-swap
// model — a long-lived multi-tab editing session benefits from a real,
// shareable/refreshable URL. Same auth gate as AdminRoute above.
function AdminBuilderRoute() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-low">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (!user || user.role !== 'SUPER_ADMIN') return <AdminLogin />
  return <SimulationBuilder />
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
      <Route path="/admin/simulations/:id" element={<AdminBuilderRoute />} />

      {/* Protected — require login */}
      <Route element={<ProtectedRoute />}>
        <Route path="/mentor"     element={<ClassMentor />} />

        <Route element={<MainLayout />}>
          <Route path="/"                        element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"               element={<Dashboard />} />
          <Route path="/simulations"                element={<SimulationWorkspace />} />
          <Route path="/simulations/:slug/overview" element={<GenericSimOverview />} />
          <Route path="/simulations/:slug"          element={<GenericSimShell />} />
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
