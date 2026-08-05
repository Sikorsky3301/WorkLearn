import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'

// ── Shared layout ────────────────────────────────────────────────────────────
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'

// ── guards ────────────────────────────────────────────────────────────────
import ProtectedRoute from './guards/ProtectedRoute'
import RequireAdmin from './guards/RequireAdmin'
import RequireSuperAdmin from './guards/RequireSuperAdmin'
import PublicOnlyRoute from './guards/PublicOnlyRoute'
import PortalSpinner from './guards/PortalSpinner'

// ── (public) — the marketing site ───────────────────────────────────────────
import LandingPage from '../../features/marketing/LandingPage'
import AboutPage from '../../features/marketing/AboutPage'
import ContactPage from '../../features/marketing/ContactPage'
import BlogPage from '../../features/marketing/BlogPage'

// ── (public) — reachable without being logged in, not part of the auth flow ──
import NotFoundPage from '../../components/NotFound'

// ── (auth) — the login flow itself, one page per portal's entry point ───────
import LoginPage            from '../../features/auth/global/Login'
import UniversityLoginPage  from '../../features/auth/university/UniversityLogin'
import MentorLoginPage      from '../../features/auth/university/MentorLogin'
import SuperAdminLoginPage  from '../../features/auth/global/SuperAdminLogin'

// ── (dashboard) — everything behind authentication. SuperAdminPortal/
// AdminPortal stay lazy — a regular student never downloads either portal's
// bundle (shell + every page + shared admin components). The job-sim CMS
// editor and Sim Builder are regular imports — they're standalone
// full-screen tools re-hosted under /admin/*, not part of either portal's
// own code-split chunk. ──────────────────────────────────────────────────────
const SuperAdminPortal = lazy(() => import('../../features/superadmin/SuperAdminPortal'))
const AdminPortal       = lazy(() => import('../../features/admin/portal/AdminPortal'))
import SimulationBuilder    from '../../features/builder/cms/SimulationBuilder'
import SimBuilderListPage   from '../../features/builder/sim-builder/SimBuilderListPage'
import SimBuilderEditor     from '../../features/builder/sim-builder/SimBuilderEditor'
import ClassMentor          from '../../features/mentor/ClassMentor'
import OnboardingWizard     from '../../features/onboarding/OnboardingWizard'
import Dashboard            from '../../features/dashboard/Dashboard'
import SimulationWorkspace  from '../../features/simulations/SimulationWorkspace'
import GenericSimOverview   from '../../features/simulations/generic/GenericSimOverview'
import GenericSimShell      from '../../features/simulations/generic/GenericSimShell'
import Portfolio            from '../../features/users/portfolio/Portfolio'
import CareerTwin           from '../../features/ai-mentor/CareerTwin'
import SkillGPS             from '../../features/skill-gps/SkillGPS'
import Analytics            from '../../features/analytics/Analytics'
import Settings             from '../../features/users/settings/Settings'
import EvaluationResult     from '../../features/simulations/EvaluationResult'
import Community            from '../../features/community/Community'

// MIRA (AI mock interviews) — own layout (MiraProvider), see MiraLayout below.
import { MiraProvider } from '../../features/mira/MiraContext'
import MiraHero    from '../../features/mira/MiraHero'
import MiraSetup   from '../../features/mira/MiraSetup'
import MiraSession from '../../features/mira/MiraSession'
import MiraResults from '../../features/mira/MiraResults'

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

export default function AppRouter() {
  return (
    <Routes>
      {/* (public) — marketing site, no login required. Wrapped in
          PublicOnlyRoute so a signed-in user still lands on /dashboard,
          preserving the behaviour `/` had before this page existed. These
          carry their own MarketingNav/Footer, NOT MainLayout — that renders
          the app Navbar, which depends on authenticated queries. */}
      <Route path="/"        element={<PublicOnlyRoute><LandingPage /></PublicOnlyRoute>} />
      <Route path="/about"   element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/blog"    element={<BlogPage />} />

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
              <SuperAdminPortal />
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

      {/* (dashboard) — require login */}
      <Route element={<ProtectedRoute />}>
        <Route path="/mentor"     element={<ClassMentor />} />
        {/* Full-screen — no Navbar/Footer, see OnboardingLayout */}
        <Route path="/onboarding" element={<OnboardingWizard />} />

        <Route element={<MainLayout />}>
          <Route path="/dashboard"               element={<Dashboard />} />
          <Route path="/simulations"                element={<SimulationWorkspace />} />
          <Route path="/simulations/:slug/overview" element={<GenericSimOverview />} />
          <Route path="/simulations/:slug"          element={<GenericSimShell />} />
          <Route path="/portfolio"               element={<Portfolio />} />
          <Route path="/ai-mentor"               element={<CareerTwin />} />
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

      {/* (public) — catch-all, any unmatched URL, logged in or not */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
