import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'

// ── Shared layout ────────────────────────────────────────────────────────────
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'

// ── guards ────────────────────────────────────────────────────────────────
import ScrollToHash from './ScrollToHash'
import ProtectedRoute from './guards/ProtectedRoute'
import RequireAdmin from './guards/RequireAdmin'
import RequireSuperAdmin from './guards/RequireSuperAdmin'
import RequireUniversityAdmin from './guards/RequireUniversityAdmin'
import RequireTeacher from './guards/RequireTeacher'
import RequireCmsAccess from './guards/RequireCmsAccess'
import RedirectTeacherAwayFromAdminCms from './guards/RedirectTeacherAwayFromAdminCms'
import PublicOnlyRoute from './guards/PublicOnlyRoute'
import GuestOnlyRoute from './guards/GuestOnlyRoute'
import PortalSpinner from './guards/PortalSpinner'

// ── (public) — the marketing site ───────────────────────────────────────────
import LandingPage from '../../features/marketing/LandingPage'
import AboutPage from '../../features/marketing/AboutPage'
import InstitutionsPage from '../../features/marketing/InstitutionsPage'
import ContactPage from '../../features/marketing/ContactPage'
import BlogPage from '../../features/marketing/BlogPage'

// ── (public) — reachable without being logged in, not part of the auth flow ──
import NotFoundPage from '../../components/NotFound'

// ── (auth) — unified /login (tenant from host, portal from role).
// Legacy university/mentor paths redirect here. Super Admin stays on
// /super-admin via RequireSuperAdmin → SuperAdminLogin. ─────────────────────
import LoginPage from '../../features/auth/global/Login'

// ── (dashboard) — everything behind authentication. SuperAdminPortal/
// AdminPortal stay lazy — a regular student never downloads either portal's
// bundle (shell + every page + shared admin components). The job-sim CMS
// editor and Sim Builder are regular imports on AppRouter sibling routes,
// wrapped in AdminCmsLayout / MentorCmsLayout for portal sidebar + theme. ───
const SuperAdminPortal = lazy(() => import('../../features/superadmin/SuperAdminPortal'))
const AdminPortal       = lazy(() => import('../../features/admin/portal/AdminPortal'))
const UniversityAdminPortal = lazy(() => import('../../features/university-admin/UniversityAdminPortal'))
const MentorPortal = lazy(() => import('../../features/mentor/MentorPortal'))
import SimulationBuilder    from '../../features/builder/cms/SimulationBuilder'
import SimBuilderListPage   from '../../features/builder/sim-builder/SimBuilderListPage'
import SimBuilderEditor     from '../../features/builder/sim-builder/SimBuilderEditor'
import SimulationsPage      from '../../features/admin/portal/pages/SimulationsPage'
import AdminCmsLayout       from '../../features/admin/portal/AdminCmsLayout'
import MentorCmsLayout      from '../../features/mentor/MentorCmsLayout'
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
    <>
    <ScrollToHash />
    <Routes>
      {/* (public) — marketing site, no login required. These carry their own
          MarketingNav/Footer, NOT MainLayout — that renders the app Navbar,
          which depends on authenticated queries.

          Two paths reach the landing page, deliberately:
          - `/` is guarded by PublicOnlyRoute, so a signed-in user opening the
            bare domain still lands on /dashboard, preserving the behaviour `/`
            had before this page existed.
          - `/home` is the landing page's own unguarded route. Without it a
            signed-in user has no way *back* to the marketing site — every link
            to `/` would bounce straight to /dashboard. */}
      <Route path="/"        element={<PublicOnlyRoute><LandingPage /></PublicOnlyRoute>} />
      <Route path="/home"    element={<LandingPage />} />
      <Route path="/about"        element={<AboutPage />} />
      <Route path="/institutions" element={<InstitutionsPage />} />
      <Route path="/contact"      element={<ContactPage />} />
      <Route path="/blog"         element={<BlogPage />} />

      {/* (auth) — single public entry; old role-specific URLs redirect */}
      <Route path="/login" element={<GuestOnlyRoute><LoginPage /></GuestOnlyRoute>} />
      <Route path="/university/login" element={<Navigate to="/login" replace />} />
      <Route path="/mentor/login"     element={<Navigate to="/login" replace />} />

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
          too, see RequireAdmin). CMS list/editor routes stay AppRouter siblings
          (win over /admin/*) but wrap AdminCmsLayout so sidebar + theme match
          the rest of the portal. */}
      <Route path="/admin/simulations" element={<RequireCmsAccess><RedirectTeacherAwayFromAdminCms><AdminCmsLayout><SimulationsPage /></AdminCmsLayout></RedirectTeacherAwayFromAdminCms></RequireCmsAccess>} />
      <Route path="/admin/simulations/:id" element={<RequireCmsAccess><RedirectTeacherAwayFromAdminCms><AdminCmsLayout><SimulationBuilder /></AdminCmsLayout></RedirectTeacherAwayFromAdminCms></RequireCmsAccess>} />
      <Route path="/admin/sim-builder" element={<RequireCmsAccess><RedirectTeacherAwayFromAdminCms><AdminCmsLayout><SimBuilderListPage /></AdminCmsLayout></RedirectTeacherAwayFromAdminCms></RequireCmsAccess>} />
      <Route path="/admin/sim-builder/:id" element={<RequireCmsAccess><RedirectTeacherAwayFromAdminCms><AdminCmsLayout><SimBuilderEditor /></AdminCmsLayout></RedirectTeacherAwayFromAdminCms></RequireCmsAccess>} />
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

      {/* University Admin — partner-tenant org users only (not platform Admin). */}
      <Route
        path="/university-admin/*"
        element={
          <RequireUniversityAdmin>
            <Suspense fallback={<PortalSpinner />}>
              <UniversityAdminPortal />
            </Suspense>
          </RequireUniversityAdmin>
        }
      />

      {/* Teacher CMS — mentor-prefixed (not /admin). Ranked above /mentor/*. */}
      <Route path="/mentor/simulations" element={<RequireCmsAccess><MentorCmsLayout><SimulationsPage /></MentorCmsLayout></RequireCmsAccess>} />
      <Route path="/mentor/simulations/:id" element={<RequireCmsAccess><MentorCmsLayout><SimulationBuilder /></MentorCmsLayout></RequireCmsAccess>} />
      <Route path="/mentor/sim-builder" element={<RequireCmsAccess><MentorCmsLayout><SimBuilderListPage /></MentorCmsLayout></RequireCmsAccess>} />
      <Route path="/mentor/sim-builder/:id" element={<RequireCmsAccess><MentorCmsLayout><SimBuilderEditor /></MentorCmsLayout></RequireCmsAccess>} />

      {/* Mentor (teacher) portal */}
      <Route
        path="/mentor/*"
        element={
          <RequireTeacher>
            <Suspense fallback={<PortalSpinner />}>
              <MentorPortal />
            </Suspense>
          </RequireTeacher>
        }
      />

      {/* (dashboard) — require login */}
      <Route element={<ProtectedRoute />}>
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
    </>
  )
}
