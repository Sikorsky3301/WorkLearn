// Short blurbs for the domain-selection step — matched the same way
// shared/utils/domainIcons.js resolves icons (substring, not exact key), so
// a CMS-authored domain that doesn't match any rule still gets a sensible
// generic description instead of nothing.
const KNOWN = [
  { test: /data/i, description: 'Clean data, build reports, and turn numbers into decisions.' },
  { test: /engineer|frontend|backend|software|develop/i, description: 'Build interactive UIs, ship features, and work across the stack.' },
  { test: /sales|business\s*development/i, description: 'Qualify leads, run a full sales cycle, and close deals.' },
  { test: /\bit\b|system|infra/i, description: 'Design architectures, interfaces, and databases under real constraints.' },
]

export function domainDescription(domain) {
  const match = KNOWN.find((r) => r.test.test(domain))
  return match?.description ?? `Explore real-world ${domain} job simulations.`
}
