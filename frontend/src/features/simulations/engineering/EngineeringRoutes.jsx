import { Navigate, useParams } from 'react-router-dom'
import { useSimulationFull } from '../../../hooks'
import { isEngineeringSim } from './lib/isEngineeringSim'
import RoadmapPage from './roadmap/RoadmapPage'
import EngineeringTaskPage from './task/EngineeringTaskPage'

// Route guards for the engineering-only surfaces.
//
// `/simulations/:slug/roadmap` and `/simulations/:slug/task/:n` exist for every
// slug as far as the router is concerned, so each one checks the gate and
// hands any other simulation back to the generic shell. Without this, pasting
// an engineering URL with a data-analytics slug would render a roadmap over a
// runtime that knows nothing about it.
//
// The gate needs the simulation record, so both wait for the fetch rather than
// guessing from the slug.

function EngineeringGate({ children }) {
  const { slug } = useParams()
  const { data, isLoading } = useSimulationFull(slug)

  if (isLoading) {
    return <div className="mx-auto max-w-4xl px-6 py-20 text-sm text-on-surface-variant">Loading…</div>
  }
  if (!data?.simulation) {
    return <div className="mx-auto max-w-4xl px-6 py-20 text-sm text-on-surface-variant">Simulation not found.</div>
  }
  if (!isEngineeringSim(data.simulation)) {
    return <Navigate to={`/simulations/${slug}`} replace />
  }
  return children
}

export function EngineeringRoadmapRoute() {
  return <EngineeringGate><RoadmapPage /></EngineeringGate>
}

export function EngineeringTaskRoute() {
  return <EngineeringGate><EngineeringTaskPage /></EngineeringGate>
}
