import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import CourseCatalog from './pages/CourseCatalog'
import CourseDetails from './pages/CourseDetails'
import SimulationWorkspace from './pages/SimulationWorkspace'
import Portfolio from './pages/Portfolio'
import AIMentor from './pages/CareerTwin'
import SkillGPS from './pages/SkillGPS'
import Analytics from './pages/Analytics'
import InterviewPrep from './pages/InterviewPrep'
import Settings from './pages/Settings'
import EvaluationResult from './pages/EvaluationResult'
import Community from './pages/Community'
import DASimulationWorkspace from './pages/DASimulationWorkspace'

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/courses" element={<CourseCatalog />} />
          <Route path="/courses/:id" element={<CourseDetails />} />
          <Route path="/simulations" element={<SimulationWorkspace />} />
          <Route path="/simulations/da-job-sim" element={<DASimulationWorkspace />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/ai-mentor" element={<AIMentor />} />
          <Route path="/skill-gps" element={<SkillGPS />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/interview-prep" element={<InterviewPrep />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/evaluations/:id" element={<EvaluationResult />} />
          <Route path="/community" element={<Community />} />
        </Routes>
      </main>
    </div>
  )
}
