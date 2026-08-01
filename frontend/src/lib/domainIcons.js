import { Code2, BarChart3, TrendingUp, Server, Layers } from 'lucide-react'

// Simulation.category/.domain and User.preferred_domain are all free text
// (see backend's models_cms.py) — substring rules (not an exact-match map)
// so "Data", "Data Analytics", "Frontend Developer", "Engineering" all
// resolve sensibly without needing a new mapping entry per CMS-authored
// variant. Falls back to a generic icon for anything unrecognized, so a
// brand-new domain never renders with a missing icon.
const RULES = [
  { test: /data/i, icon: BarChart3 },
  { test: /engineer|frontend|backend|software|develop/i, icon: Code2 },
  { test: /sales|business\s*development/i, icon: TrendingUp },
  { test: /\bit\b|system|infra/i, icon: Server },
]

export function resolveDomainIcon(label) {
  if (!label) return Layers
  const match = RULES.find((r) => r.test.test(label))
  return match?.icon ?? Layers
}
