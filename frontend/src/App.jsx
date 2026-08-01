import { Suspense } from 'react'
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './features/auth/AuthContext'

// ── Shared layout ────────────────────────────────────────────────────────────
import Navbar from './shared/Navbar'
import Footer from './shared/Footer'

// ── (public) — reachable without being logged in, not part of the auth flow ──
import NotFoundPage from './app/(public)/NotFoundPage'

// ── (auth) — the login flow itself, one page per portal's entry point ───────
import LoginPage            from './app/(auth)/LoginPage'
import UniversityLoginPage  from './app/(auth)/UniversityLoginPage'
import MentorLoginPage      from './app/(auth)/MentorLoginPage'
import SuperAdminLoginPage  from './app/(auth)/SuperAdminLoginPage'
import AdminPortalLoginPage from './app/(auth)/AdminPortalLoginPage'

// ── (dashboard) — everything behind authentication. SuperAdminPortalPage/
// AdminPortalPage stay lazy internally (see those files) — a regular student
// never downloads either portal's bundle (shell + every page + shared admin
// components). The job-sim CMS editor and Sim Builder are regular imports —
// they're standalone full-screen tools re-hosted under /admin/*, not part of
// either portal's own code-split chunk. ──────────────────────────────────────
import SuperAdminPortalPage    from './app/(dashboard)/SuperAdminPortalPage'
import AdminPortalPage         from './app/(dashboard)/AdminPortalPage'
import SimulationBuilderPage   from './app/(dashboard)/SimulationBuilderPage'
import SimBuilderListPage      from './app/(dashboard)/SimBuilderListPage'
import SimBuilderEditorPage    from './app/(dashboard)/SimBuilderEditorPage'
import MentorPage              from './app/(dashboard)/MentorPage'
import OnboardingPage          from './app/(dashboard)/OnboardingPage'
import DashboardPage           from './app/(dashboard)/DashboardPage'
import SimulationsPage         from './app/(dashboard)/SimulationsPage'
import SimulationOverviewPage  from './app/(dashboard)/SimulationOverviewPage'
import SimulationShellPage     from './app/(dashboard)/SimulationShellPage'
import PortfolioPage           from './app/(dashboard)/PortfolioPage'
import AiMentorPage            from './app/(dashboard)/AiMentorPage'
import SkillGpsPage            from './app/(dashboard)/SkillGpsPage'
import AnalyticsPage           from './app/(dashboard)/AnalyticsPage'
import SettingsPage            from './app/(dashboard)/SettingsPage'
import EvaluationResultPage    from './app/(dashboard)/EvaluationResultPage'
import CommunityPage           from './app/(dashboard)/CommunityPage'

// MIRA (AI mock interviews) — own layout (MiraProvider), see MiraLayout below.
import { MiraProvider } from './features/mira/MiraContext'
import MiraHeroPage    from './app/(dashboard)/MiraHeroPage'
import MiraSetupPage   from './app/(dashboard)/MiraSetupPage'
import MiraSessionPage from './app/(dashboard)/MiraSessionPage'
import MiraResultsPage from './app/(dashboard)/MiraResultsPage'

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
  const location = useLocation()
  if (loading) return <PortalSpinner />
  if (!user) return <Navigate to="/login" replace />
  // Admins/SuperAdmins have no student profile — keep them in their own portal
  if (user.role === 'SUPER_ADMIN') return <Navigate to="/super-admin" replace />
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />
  // First-login onboarding wizard (features/onboarding/) — gated to the two
  // student-facing roles; CLASS_MENTOR never sees it (mentors aren't picking
  // a job-simulation domain). Existing accounts were backfilled to
  // onboarding_completed=true by migration 0005, so this only ever fires for
  // genuinely new sign-ups.
  const needsOnboarding = (user.role === 'DIRECT_USER' || user.role === 'UNIVERSITY_STUDENT') && !user.onboarding_completed
  if (needsOnboarding && location.pathname !== '/onboarding') return <Navigate to="/onboarding" replace />
  return <Outlet />
}

// Gates every /super-admin* route — SuperAdmin-exclusive surface (Admin
// Management, Roles & Permissions, Config Center, Audit Log, etc.). Shows a
// spinner while auth resolves, SuperAdminLoginPage if not a signed-in
// SUPER_ADMIN, or the requested page otherwise.
//
// An Admin session does NOT bounce back to /admin here — it shows the
// SuperAdmin login form instead, same as anyone else without a SUPER_ADMIN
// session. That used to auto-redirect, which meant typing /super-admin into
// the address bar while signed in as Admin just landed back on /admin with
// no way to actually sign in as a super admin from there. The real
// authorization boundary is server-side anyway (an Admin's token can't call
// any SuperAdmin-only endpoint regardless of what page the SPA shows), so
// there's nothing this redirect was protecting — successfully logging in
// here just replaces the session token/user for this tab, same as any login.
function RequireSuperAdmin({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <PortalSpinner />
  if (!user || user.role !== 'SUPER_ADMIN') return <SuperAdminLoginPage />
  return children
}

// Gates every /admin* route (the Admin portal, plus the job-sim CMS editor
// and Sim Builder re-hosted under it). SUPER_ADMIN is allowed straight
// through — the root role can always reach anything a lower tier can, it
// just isn't part of SuperAdmin's own portal nav.
function RequireAdmin({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <PortalSpinner />
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) return <AdminPortalLoginPage />
  return children
}

export default function App() {
  return (
    <Routes>
      {/* (auth) — no login required */}
      <Route path="/login"            element={<LoginPage />} />
      <Route path="/university/login" element={<UniversityLoginPage />} />
      <Route path="/mentor/login"     element={<MentorLoginPage />} />

      {/* (dashboard) — SuperAdmin: everything SuperAdmin-exclusive lives in
          its own portal shell. */}
      <Route
        path="/super-admin/*"
        element={
          <RequireSuperAdmin>
            <Suspense fallback={<PortalSpinner />}>
              <SuperAdminPortalPage />
            </Suspense>
          </RequireSuperAdmin>
        }
      />

      {/* (dashboard) — Admin: the lower RBAC tier (SUPER_ADMIN can reach this
          too, see RequireAdmin). The job-sim CMS editor and Sim Builder are
          standalone full-screen tools (own header, no sidebar chrome),
          siblings of the portal shell rather than nested in it. React Router
          ranks routes by specificity regardless of declaration order, so
          these always win over the portal's own `/*` wildcard for their
          exact paths — see AdminPortal.jsx's docblock. */}
      <Route path="/admin/simulations/:id" element={<RequireAdmin><SimulationBuilderPage /></RequireAdmin>} />
      <Route path="/admin/sim-builder" element={<RequireAdmin><SimBuilderListPage /></RequireAdmin>} />
      <Route path="/admin/sim-builder/:id" element={<RequireAdmin><SimBuilderEditorPage /></RequireAdmin>} />
      <Route
        path="/admin/*"
        element={
          <RequireAdmin>
            <Suspense fallback={<PortalSpinner />}>
              <AdminPortalPage />
            </Suspense>
          </RequireAdmin>
        }
      />

      {/* (dashboard) — require login */}
      <Route element={<ProtectedRoute />}>
        <Route path="/mentor"     element={<MentorPage />} />
        {/* Full-screen — no Navbar/Footer, see OnboardingLayout */}
        <Route path="/onboarding" element={<OnboardingPage />} />

        <Route element={<MainLayout />}>
          <Route path="/"                        element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"               element={<DashboardPage />} />
          <Route path="/simulations"                element={<SimulationsPage />} />
          <Route path="/simulations/:slug/overview" element={<SimulationOverviewPage />} />
          <Route path="/simulations/:slug"          element={<SimulationShellPage />} />
          <Route path="/portfolio"               element={<PortfolioPage />} />
          <Route path="/ai-mentor"               element={<AiMentorPage />} />
          <Route path="/ai-mentor/chat"          element={<Navigate to="/ai-mentor" replace />} />
          <Route path="/skill-gps"               element={<SkillGpsPage />} />
          <Route path="/analytics"               element={<AnalyticsPage />} />
          <Route element={<MiraLayout />}>
            <Route path="/mira"                  element={<MiraHeroPage />} />
            <Route path="/mira/setup"            element={<MiraSetupPage />} />
            <Route path="/mira/session"          element={<MiraSessionPage />} />
            <Route path="/mira/results"          element={<MiraResultsPage />} />
          </Route>
          <Route path="/settings"                element={<SettingsPage />} />
          <Route path="/evaluations/:id"         element={<EvaluationResultPage />} />
          <Route path="/community"               element={<CommunityPage />} />
        </Route>
      </Route>

      {/* (public) — catch-all, any unmatched URL, logged in or not */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
