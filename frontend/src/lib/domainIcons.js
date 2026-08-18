import { Code2, BarChart3, TrendingUp, Server, Layers } from 'lucide-react'
import { findDomain } from './careerDomains'

// Simulation.category/.domain are free text (see backend's models/cms.py), so
// after the curated catalogue (careerDomains.js) is consulted for an exact
// match, these substring rules still handle admin-typed variants — "Data",
// "Data Analytics", "Frontend Developer", "Engineering" all resolve sensibly
// without needing a catalogue entry per wording. Falls back to a generic icon
// for anything unrecognized, so a brand-new domain never renders iconless.
// `domain` names the catalogue entry each rule stands in for, so a matched
// variant can borrow that entry's artwork too — not just its icon.
const RULES = [
  { test: /data/i, icon: BarChart3, domain: 'Data Analytics' },
  { test: /engineer|frontend|backend|software|develop/i, icon: Code2, domain: 'Engineering' },
  { test: /sales|business\s*development/i, icon: TrendingUp, domain: 'Sales' },
  { test: /\bit\b|system|infra/i, icon: Server, domain: 'IT & Systems' },
]

export function resolveDomainIcon(label) {
  if (!label) return Layers
  const curated = findDomain(label)
  if (curated) return curated.Icon
  const match = RULES.find((r) => r.test.test(label))
  return match?.icon ?? Layers
}

/** The domain's photograph, or undefined. Resolves the same two ways as the
 * icon above — exact catalogue match, then the substring rules for
 * admin-typed wording — but unlike the icon there is deliberately no generic
 * fallback image: a domain with no photograph must render its designed
 * treatment rather than a stand-in that means nothing. Callers therefore have
 * to handle undefined. */
export function resolveDomainImage(label) {
  if (!label) return undefined
  const curated = findDomain(label)
  if (curated) return curated.image
  const match = RULES.find((r) => r.test.test(label))
  return match ? findDomain(match.domain)?.image : undefined
}
