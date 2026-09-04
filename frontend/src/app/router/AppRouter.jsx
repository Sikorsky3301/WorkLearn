import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'

// ── Shared layout ────────────────────────────────────────────────────────────
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import RouteTransitionLoader from '../../components/RouteTransitionLoader'

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
// Legacy university/mentor paths redirect here. Super Admin signs in here
// too — RequireSuperAdmin bounces an unauthenticated/wrong-role visitor to
// /login same as every other portal guard. ──────────────────────────────
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
import StudioHome          from '../../features/builder/studio/StudioHome'
import SimStudioPage        from '../../features/builder/studio/SimStudioPage'
import SimBuilderListPage   from '../../features/builder/sim-builder/SimBuilderListPage'
import SimBuilderEditor     from '../../features/builder/sim-builder/SimBuilderEditor'
import LegacyBuilderRedirect from './LegacyBuilderRedirect'
import SimulationsPage      from '../../features/admin/portal/pages/SimulationsPage'
import AdminCmsLayout       from '../../features/admin/portal/AdminCmsLayout'
import MentorCmsLayout      from '../../features/mentor/MentorCmsLayout'
import OnboardingWizard     from '../../features/onboarding/OnboardingWizard'
import Dashboard            from '../../features/dashboard/Dashboard'
import SimulationWorkspace  from '../../features/simulations/SimulationWorkspace'
import LearnHub              from '../../features/learn/LearnHub'
import GenericSimOverview   from '../../features/simulations/generic/GenericSimOverview'
import GenericSimShell      from '../../features/simulations/generic/GenericSimShell'
import { EngineeringRoadmapRoute, EngineeringTaskRoute } from '../../features/simulations/engineering/EngineeringRoutes'
import SandboxWorkbenchPage from '../../features/simulations/engineering/sandbox/SandboxWorkbenchPage'
import Portfolio            from '../../features/users/portfolio/Portfolio'
import CareerTwin           from '../../features/ai-mentor/CareerTwin'
import SkillGPS             from '../../features/skill-gps/SkillGPS'
import Analytics            from '../../features/analytics/Analytics'
import SandboxCatalogue    from '../../features/sandboxes/SandboxCatalogue'
import SandboxPlayground   from '../../features/sandboxes/SandboxPlayground'
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
// The engineering runtime adds two more work surfaces under the same slug —
// `/roadmap` and `/task/:n` — which are just as much "in the simulation" as
// the shell itself. Without them in the pattern the marketing footer renders
// underneath both.
//
// `/learn` (and everything under it) is footerless for a different reason: it
// has its own persistent left sidebar reaching the full height below the
// Navbar, and the marketing footer showing up beneath that sidebar's dark
// background reads as a rendering bug rather than the end of a page.
const FOOTERLESS_ROUTES = ['/mira/session']
const FOOTERLESS_PATTERN = /^\/simulations\/[^/]+(\/(roadmap|task\/\d+))?$|^\/learn(\/.*)?$/

function MainLayout() {
  const location = useLocation()
  const showFooter = !FOOTERLESS_ROUTES.includes(location.pathname) && !FOOTERLESS_PATTERN.test(location.pathname)
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <RouteTransitionLoader />
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
          too, see RequireAdmin). The job-sim CMS editor and Sim Builder are
          standalone full-screen tools (own header, no sidebar chrome),
          siblings of the portal shell rather than nested in it. React Router
          ranks routes by specificity regardless of declaration order, so
          these always win over the portal's own `/*` wildcard for their
          exact paths — see AdminPortal.jsx's docblock. The catalogue below is
          the one CMS surface that stays inside the portal chrome — it's a
          list page, not an editor, so it wraps AdminCmsLayout for the same
          sidebar/theme as the rest of /admin. */}
      {/* The catalogue: publish, unpublish, unenrol, delete. BUILDING a
          simulation is a different job and lives under /content/sim-builder. */}
      <Route path="/admin/simulations" element={<RequireCmsAccess><RedirectTeacherAwayFromAdminCms><AdminCmsLayout><SimulationsPage /></AdminCmsLayout></RedirectTeacherAwayFromAdminCms></RequireCmsAccess>} />

      {/* Sim Builder — opened in its own tab from the Content nav. The static
          `projects` segment outranks `:id` regardless of declaration order. */}
      <Route path="/admin/content/sim-builder" element={<RequireCmsAccess><RedirectTeacherAwayFromAdminCms><StudioHome /></RedirectTeacherAwayFromAdminCms></RequireCmsAccess>} />
      <Route path="/admin/content/sim-builder/projects" element={<RequireCmsAccess><RedirectTeacherAwayFromAdminCms><SimBuilderListPage /></RedirectTeacherAwayFromAdminCms></RequireCmsAccess>} />
      <Route path="/admin/content/sim-builder/projects/:id" element={<RequireCmsAccess><RedirectTeacherAwayFromAdminCms><SimBuilderEditor /></RedirectTeacherAwayFromAdminCms></RequireCmsAccess>} />
      <Route path="/admin/content/sim-builder/:id" element={<RequireCmsAccess><RedirectTeacherAwayFromAdminCms><SimStudioPage /></RedirectTeacherAwayFromAdminCms></RequireCmsAccess>} />

      {/* Where the builder used to live. See LegacyBuilderRedirect.jsx. */}
      <Route path="/admin/simulations/:id" element={<LegacyBuilderRedirect to={(p) => `/admin/content/sim-builder/${p.id}`} />} />
      <Route path="/admin/sim-builder" element={<Navigate to="/admin/content/sim-builder" replace />} />
      <Route path="/admin/sim-builder/:id" element={<LegacyBuilderRedirect to={(p) => `/admin/content/sim-builder/projects/${p.id}`} />} />
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

      {/* Teacher CMS — mentor-prefixed (not /admin). Ranked above /mentor/*.
          Mirrors the admin block above: the catalogue wraps MentorCmsLayout,
          the Studio builder stays standalone, and the old sim-builder paths
          redirect into it. */}
      <Route path="/mentor/simulations" element={<RequireCmsAccess><MentorCmsLayout><SimulationsPage /></MentorCmsLayout></RequireCmsAccess>} />
      <Route path="/mentor/content/sim-builder" element={<RequireCmsAccess><StudioHome /></RequireCmsAccess>} />
      <Route path="/mentor/content/sim-builder/projects" element={<RequireCmsAccess><SimBuilderListPage /></RequireCmsAccess>} />
      <Route path="/mentor/content/sim-builder/projects/:id" element={<RequireCmsAccess><SimBuilderEditor /></RequireCmsAccess>} />
      <Route path="/mentor/content/sim-builder/:id" element={<RequireCmsAccess><SimStudioPage /></RequireCmsAccess>} />
      <Route path="/mentor/simulations/:id" element={<LegacyBuilderRedirect to={(p) => `/mentor/content/sim-builder/${p.id}`} />} />
      <Route path="/mentor/sim-builder" element={<Navigate to="/mentor/content/sim-builder" replace />} />
      <Route path="/mentor/sim-builder/:id" element={<LegacyBuilderRedirect to={(p) => `/mentor/content/sim-builder/projects/${p.id}`} />} />

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
        {/* Opened in its own browser tab from a task page. Declared out here,
            NOT inside MainLayout, because MainLayout always renders the
            Navbar — the workbench owns its whole viewport. */}
        <Route path="/sandbox/:slug/:taskIndex" element={<SandboxWorkbenchPage />} />

        <Route element={<MainLayout />}>
          <Route path="/dashboard"               element={<Dashboard />} />
          <Route path="/simulations"                element={<SimulationWorkspace />} />
          <Route path="/learn/*"                   element={<LearnHub />} />
          <Route path="/simulations/:slug/overview" element={<GenericSimOverview />} />
          {/* Workbench surfaces — see engineering/lib/hasWorkbenchExperience.
              Both redirect to the shell for any other simulation. */}
          <Route path="/simulations/:slug/roadmap"  element={<EngineeringRoadmapRoute />} />
          <Route path="/simulations/:slug/task/:taskIndex" element={<EngineeringTaskRoute />} />
          <Route path="/simulations/:slug"          element={<GenericSimShell />} />
          <Route path="/portfolio"               element={<Portfolio />} />
          <Route path="/ai-mentor"               element={<CareerTwin />} />
          <Route path="/ai-mentor/chat"          element={<Navigate to="/ai-mentor" replace />} />
          <Route path="/skill-gps"               element={<SkillGPS />} />
          <Route path="/analytics"               element={<Analytics />} />
          {/* Practice sandboxes — no task, no grading, nothing saved. The
              catalogue is served by the backend (playground.py) so it lists
              exactly the container images that are actually built. */}
          <Route path="/sandboxes"               element={<SandboxCatalogue />} />
          <Route path="/sandboxes/:key"          element={<SandboxPlayground />} />
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
