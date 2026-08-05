import { Code2, BarChart3, TrendingUp, Server, Layers } from 'lucide-react'
import { findDomain } from './careerDomains'

// Simulation.category/.domain are free text (see backend's models/cms.py), so
// after the curated catalogue (careerDomains.js) is consulted for an exact
// match, these substring rules still handle admin-typed variants — "Data",
// "Data Analytics", "Frontend Developer", "Engineering" all resolve sensibly
// without needing a catalogue entry per wording. Falls back to a generic icon
// for anything unrecognized, so a brand-new domain never renders iconless.
const RULES = [
  { test: /data/i, icon: BarChart3 },
  { test: /engineer|frontend|backend|software|develop/i, icon: Code2 },
  { test: /sales|business\s*development/i, icon: TrendingUp },
  { test: /\bit\b|system|infra/i, icon: Server },
]

export function resolveDomainIcon(label) {
  if (!label) return Layers
  const curated = findDomain(label)
  if (curated) return curated.Icon
  const match = RULES.find((r) => r.test.test(label))
  return match?.icon ?? Layers
}
