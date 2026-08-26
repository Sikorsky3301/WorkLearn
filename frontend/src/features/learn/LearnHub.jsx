import { Navigate, Route, Routes } from 'react-router-dom'
import { Trophy, BookOpen, ClipboardCheck, Swords } from 'lucide-react'
import LearnSidebar from './LearnSidebar'
import ComingSoon from './ComingSoon'
import ResourcesPage from './ResourcesPage'
import SimulationWorkspace from '../simulations/SimulationWorkspace'
import SandboxCatalogue from '../sandboxes/SandboxCatalogue'
import Analytics from '../analytics/Analytics'
import { useNavbarHeight } from '../simulations/generic/StickyOverviewBar'

// One home for everything a learner moves between on the platform.
//
// Job Simulations and Sandbox each already had a page — this does not
// reimplement either one, it MOUNTS the same components (SimulationWorkspace,
// SandboxCatalogue) under a new path, so there is exactly one place their
// data-fetching and rendering logic lives. My Activity does the same with the
// existing Analytics page. Leaderboard, Courses, Assessments and Competitions
// have no content behind them yet and say so plainly (see ComingSoon.jsx)
// rather than 404ing or linking nowhere.
//
// Nested `<Routes>` under `/learn/*`, the same shell pattern AdminPortal and
// MentorPortal already use — one URL per tab, so the browser's back button
// and a bookmark both behave the way they do everywhere else in the app.
//
// The app's own top Navbar stays mounted above this (AppRouter renders it
// inside MainLayout) — this is a page within that chrome, not a replacement
// for it, which is why the sidebar below only lists Learn-hub destinations
// and leaves Dashboard/Skill GPS/AI Mentor/etc. to the bar above.
export default function LearnHub() {
  const navbarHeight = useNavbarHeight()

  return (
    <div className="flex" style={{ minHeight: `calc(100vh - ${navbarHeight}px)` }}>
      <LearnSidebar />
      <div className="min-w-0 flex-1 bg-surface-low/40">
        <Routes>
          <Route index element={<Navigate to="simulations" replace />} />
          <Route path="activity" element={<Analytics />} />
          <Route
            path="leaderboard"
            element={
              <ComingSoon
                icon={Trophy}
                title="Leaderboard"
                description="See how your XP and completed simulations compare to other learners on the platform."
              />
            }
          />
          <Route
            path="courses"
            element={
              <ComingSoon
                icon={BookOpen}
                title="Courses"
                description="Short, structured lessons to complement the job simulations — the fundamentals before you apply them."
              />
            }
          />
          <Route path="simulations" element={<SimulationWorkspace />} />
          <Route
            path="assessments"
            element={
              <ComingSoon
                icon={ClipboardCheck}
                title="Assessments"
                description="Every assessment you've taken, across every simulation, in one place — with your scores and what to revisit."
              />
            }
          />
          <Route path="resources" element={<ResourcesPage />} />
          <Route path="sandbox" element={<SandboxCatalogue />} />
          <Route
            path="competitions"
            element={
              <ComingSoon
                icon={Swords}
                title="Competitions"
                description="Timed challenges against other learners, scored the same way the simulations are — with a live leaderboard."
              />
            }
          />
          <Route path="*" element={<Navigate to="simulations" replace />} />
        </Routes>
      </div>
    </div>
  )
}
