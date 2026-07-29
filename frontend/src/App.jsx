import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './features/auth/AuthContext'

// ── Shared ────────────────────────────────────────────────────────────────────
import Navbar from './shared/Navbar'
import Footer from './shared/Footer'
import NotFound from './shared/NotFound'

// ── Auth: global (direct/individual users + super admin + admin) ───────────────
import Login            from './features/auth/global/Login'
import SuperAdminLogin  from './features/auth/global/SuperAdminLogin'
import AdminPortalLogin from './features/auth/global/AdminPortalLogin'

// ── Auth: university (institution-scoped students + class mentors) ─────────────
import UniversityLogin  from './features/auth/university/UniversityLogin'
import MentorLogin      from './features/auth/university/MentorLogin'

// ── Admin — the two RBAC portals are lazy-loaded: a regular student never
// downloads either bundle (shell + every page + shared admin components).
// The job-sim CMS editor and Sim Builder stay as regular imports — they're
// standalone full-screen tools re-hosted under /admin/*, not part of
// either portal's own code-split chunk. ──────────────────────────────────────
const SuperAdminPortal = lazy(() => import('./features/super-admin-portal/SuperAdminPortal'))
const AdminPortal      = lazy(() => import('./features/admin-portal/AdminPortal'))
import SimulationBuilder from './features/admin-content/cms/SimulationBuilder'
import SimBuilderListPage from './features/admin-content/sim-builder/SimBuilderListPage'
import SimBuilderEditor from './features/admin-content/sim-builder/SimBuilderEditor'

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

function PortalSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-low">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function ProtectedRoute() {
  const { user, loading } = useAuth()
  if (loading) return <PortalSpinner />
  if (!user) return <Navigate to="/login" replace />
  // Admins/SuperAdmins have no student profile — keep them in their own portal
  if (user.role === 'SUPER_ADMIN') return <Navigate to="/super-admin" replace />
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />
  return <Outlet />
}

// Gates every /super-admin* route — SuperAdmin-exclusive surface (Admin
// Management, Roles & Permissions, Config Center, Audit Log, etc.). Shows a
// spinner while auth resolves, SuperAdminLogin if not a signed-in
// SUPER_ADMIN, or the requested page otherwise. An authenticated ADMIN is
// bounced to their own portal root — there's nothing here they're allowed to see.
function RequireSuperAdmin({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <PortalSpinner />
  if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />
  if (!user || user.role !== 'SUPER_ADMIN') return <SuperAdminLogin />
  return children
}

// Gates every /admin* route (the Admin portal, plus the job-sim CMS editor
// and Sim Builder re-hosted under it). SUPER_ADMIN is allowed straight
// through — the root role can always reach anything a lower tier can, it
// just isn't part of SuperAdmin's own portal nav.
function RequireAdmin({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <PortalSpinner />
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) return <AdminPortalLogin />
  return children
}

export default function App() {
  return (
    <Routes>
      {/* Public — no auth required */}
      <Route path="/login"            element={<Login />} />
      <Route path="/university/login" element={<UniversityLogin />} />
      <Route path="/mentor/login"     element={<MentorLogin />} />

      {/* SuperAdmin — everything SuperAdmin-exclusive lives in its own
          portal shell. */}
      <Route
        path="/super-admin/*"
        element={
          <RequireSuperAdmin>
            <Suspense fallback={<PortalSpinner />}>
              <SuperAdminPortal />
            </Suspense>
          </RequireSuperAdmin>
        }
      />

      {/* Admin — the lower RBAC tier (SUPER_ADMIN can reach this too, see
          RequireAdmin). The job-sim CMS editor and Sim Builder are standalone
          full-screen tools (own header, no sidebar chrome), siblings of the
          portal shell rather than nested in it. React Router ranks routes
          by specificity regardless of declaration order, so these always
          win over the portal's own `/*` wildcard for their exact paths —
          see AdminPortal.jsx's docblock. */}
      <Route path="/admin/simulations/:id" element={<RequireAdmin><SimulationBuilder /></RequireAdmin>} />
      <Route path="/admin/sim-builder" element={<RequireAdmin><SimBuilderListPage /></RequireAdmin>} />
      <Route path="/admin/sim-builder/:id" element={<RequireAdmin><SimBuilderEditor /></RequireAdmin>} />
      <Route
        path="/admin/*"
        element={
          <RequireAdmin>
            <Suspense fallback={<PortalSpinner />}>
              <AdminPortal />
            </Suspense>
          </RequireAdmin>
        }
      />

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
          <Route path="/ai-mentor/chat"          element={<Navigate to="/ai-mentor" replace />} />
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

      {/* Catch-all — any unmatched URL, logged in or not */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
