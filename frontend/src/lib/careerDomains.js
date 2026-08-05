import {
  BarChart3, Code2, TrendingUp, Server, Megaphone, Headphones, Landmark,
  Users, Stethoscope, ClipboardList, Palette, ShieldCheck, Scale, Boxes,
  GraduationCap, FlaskConical, Layers,
} from 'lucide-react'

/**
 * The curated catalogue of career domains a student can pick from.
 *
 * Deliberately NOT derived from published simulations. The onboarding
 * wizard used to build its list from `useSimulations()`, which meant the
 * picker only ever showed whatever happened to be published (3 options), and
 * on a fresh database it showed nothing at all while still requiring a
 * selection — leaving the wizard literally unfinishable.
 *
 * `preferred_domain` is stored as the free-text `label` (see backend's
 * User.preferred_domain, a plain nullable string — no migration needed).
 * Picking a domain with no simulations yet is fine: the only consumer is the
 * Dashboard's "Recommended for you" grouping, which simply finds no match
 * and renders normally.
 *
 * Seeded from the hand-curated list already in Navbar.jsx plus the domains
 * of the currently-published simulations, so the two stay consistent.
 */
export const CAREER_DOMAINS = [
  { key: 'data-analytics', label: 'Data Analytics', Icon: BarChart3, description: 'Clean data, build reports, and turn numbers into decisions.' },
  { key: 'engineering', label: 'Engineering', Icon: Code2, description: 'Build interactive UIs, ship features, and work across the stack.' },
  { key: 'sales', label: 'Sales', Icon: TrendingUp, description: 'Qualify leads, run a full sales cycle, and close deals.' },
  { key: 'product-management', label: 'Product Management', Icon: ClipboardList, description: 'Define what to build, prioritise ruthlessly, and ship outcomes.' },
  { key: 'marketing', label: 'Marketing', Icon: Megaphone, description: 'Position a product, run campaigns, and grow an audience.' },
  { key: 'customer-support', label: 'Customer Support', Icon: Headphones, description: 'Triage real tickets, calm hard conversations, and close the loop.' },
  { key: 'finance', label: 'Finance', Icon: Landmark, description: 'Reconcile the numbers, model scenarios, and brief the business.' },
  { key: 'hr-recruiting', label: 'HR & Recruiting', Icon: Users, description: 'Screen candidates, run a hiring loop, and shape the team.' },
  { key: 'healthcare-admin', label: 'Healthcare Administration', Icon: Stethoscope, description: 'Coordinate care, manage records, and keep operations moving.' },
  { key: 'it-support', label: 'IT & Systems', Icon: Server, description: 'Design architectures, interfaces, and databases under real constraints.' },
  { key: 'design', label: 'Design', Icon: Palette, description: 'Turn ambiguous problems into interfaces people can actually use.' },
  { key: 'cybersecurity', label: 'Cybersecurity', Icon: ShieldCheck, description: 'Spot threats, harden systems, and respond when something breaks.' },
  { key: 'legal', label: 'Legal & Compliance', Icon: Scale, description: 'Review agreements, flag risk, and keep the business on-side.' },
  { key: 'operations', label: 'Operations & Supply Chain', Icon: Boxes, description: 'Keep things flowing — plan capacity, unblock, and cut waste.' },
  { key: 'education', label: 'Education & Training', Icon: GraduationCap, description: 'Design learning that sticks and measure whether it worked.' },
  { key: 'research', label: 'Research & Science', Icon: FlaskConical, description: 'Frame a question, run the study, and defend the conclusion.' },
]

const BY_LABEL = new Map(CAREER_DOMAINS.map((d) => [d.label.toLowerCase(), d]))

/** Exact-label lookup against the catalogue. Returns undefined for the
 * free-text domains an admin can type into the CMS, which is why
 * resolveDomainIcon/domainDescription keep their substring fallbacks. */
export function findDomain(label) {
  return label ? BY_LABEL.get(String(label).toLowerCase()) : undefined
}
