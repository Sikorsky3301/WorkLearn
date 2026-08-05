import { findDomain } from './careerDomains'

// Short blurbs per domain. The curated catalogue (careerDomains.js) is the
// primary source; these substring rules remain as a fallback for the
// free-text domains an admin can type into the CMS, matched the same way
// lib/domainIcons.js resolves icons.
const KNOWN = [
  { test: /data/i, description: 'Clean data, build reports, and turn numbers into decisions.' },
  { test: /engineer|frontend|backend|software|develop/i, description: 'Build interactive UIs, ship features, and work across the stack.' },
  { test: /sales|business\s*development/i, description: 'Qualify leads, run a full sales cycle, and close deals.' },
  { test: /\bit\b|system|infra/i, description: 'Design architectures, interfaces, and databases under real constraints.' },
]

export function domainDescription(domain) {
  const curated = findDomain(domain)
  if (curated) return curated.description
  const match = KNOWN.find((r) => r.test.test(domain))
  return match?.description ?? `Explore real-world ${domain} job simulations.`
}
