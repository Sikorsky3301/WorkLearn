import { Routes, Route, Navigate, Outlet } from 'react-router-dom'

// ── Shared ────────────────────────────────────────────────────────────────────
import Navbar from './shared/Navbar'

// ── Auth ──────────────────────────────────────────────────────────────────────
import Login            from './features/auth/Login'
import UniversityLogin  from './features/auth/UniversityLogin'
import MentorLogin      from './features/auth/MentorLogin'

// ── Admin ─────────────────────────────────────────────────────────────────────
import SuperAdmin from './features/admin/SuperAdmin'

// ── Mentor ────────────────────────────────────────────────────────────────────
import ClassMentor from './features/mentor/ClassMentor'

// ── Dashboard ─────────────────────────────────────────────────────────────────
import Dashboard from './features/dashboard/Dashboard'

// ── Courses ───────────────────────────────────────────────────────────────────
import CourseCatalog from './features/courses/CourseCatalog'
import CourseDetails from './features/courses/CourseDetails'

// ── Simulations ───────────────────────────────────────────────────────────────
import SimulationWorkspace   from './features/simulations/SimulationWorkspace'
import DASimulationWorkspace from './features/simulations/DASimulationWorkspace'
import EvaluationResult      from './features/simulations/EvaluationResult'

// ── Other platform features ───────────────────────────────────────────────────
import Portfolio    from './features/portfolio/Portfolio'
import AIMentor     from './features/ai-mentor/CareerTwin'
import SkillGPS     from './features/skill-gps/SkillGPS'
import Analytics    from './features/analytics/Analytics'
import InterviewPrep from './features/interview-prep/InterviewPrep'
import Community    from './features/community/Community'
import Settings     from './features/settings/Settings'

function MainLayout() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main><Outlet /></main>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      {/* Fullscreen — no Navbar */}
      <Route path="/login"            element={<Login />} />
      <Route path="/university/login" element={<UniversityLogin />} />
      <Route path="/mentor/login"     element={<MentorLogin />} />
      <Route path="/mentor"           element={<ClassMentor />} />
      <Route path="/superadmin"       element={<SuperAdmin />} />

      {/* Main platform — Navbar included */}
      <Route element={<MainLayout />}>
        <Route path="/"                        element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"               element={<Dashboard />} />
        <Route path="/courses"                 element={<CourseCatalog />} />
        <Route path="/courses/:id"             element={<CourseDetails />} />
        <Route path="/simulations"             element={<SimulationWorkspace />} />
        <Route path="/simulations/da-job-sim"  element={<DASimulationWorkspace />} />
        <Route path="/portfolio"               element={<Portfolio />} />
        <Route path="/ai-mentor"               element={<AIMentor />} />
        <Route path="/skill-gps"               element={<SkillGPS />} />
        <Route path="/analytics"               element={<Analytics />} />
        <Route path="/interview-prep"          element={<InterviewPrep />} />
        <Route path="/settings"                element={<Settings />} />
        <Route path="/evaluations/:id"         element={<EvaluationResult />} />
        <Route path="/community"               element={<Community />} />
      </Route>
    </Routes>
  )
}
