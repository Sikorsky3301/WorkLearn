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
 *
 * `image` is an optional photograph for the domain, served from
 * public/images/domains/ as a plain URL — not a bundled import, so a domain
 * can be added or re-shot by dropping a file in that folder. Only some
 * domains have one; every surface that uses it must keep working without it
 * (the parallax falls back to a designed icon tile, sim banners to their
 * accent-colour treatment), because healthcare-admin and research below have
 * no photograph, and any admin-typed free-text domain never will.
 */
export const CAREER_DOMAINS = [
  { key: 'data-analytics', label: 'Data Analytics', Icon: BarChart3, image: '/images/domains/data-analytics.jpg', description: 'Clean data, build reports, and turn numbers into decisions.' },
  { key: 'engineering', label: 'Engineering', Icon: Code2, image: '/images/domains/engineering.jpg', description: 'Build interactive UIs, ship features, and work across the stack.' },
  { key: 'sales', label: 'Sales', Icon: TrendingUp, image: '/images/domains/sales.jpg', description: 'Qualify leads, run a full sales cycle, and close deals.' },
  { key: 'product-management', label: 'Product Management', Icon: ClipboardList, image: '/images/domains/product-management.jpg', description: 'Define what to build, prioritise ruthlessly, and ship outcomes.' },
  { key: 'marketing', label: 'Marketing', Icon: Megaphone, image: '/images/domains/marketing.jpg', description: 'Position a product, run campaigns, and grow an audience.' },
  { key: 'customer-support', label: 'Customer Support', Icon: Headphones, image: '/images/domains/customer-support.jpg', description: 'Triage real tickets, calm hard conversations, and close the loop.' },
  { key: 'finance', label: 'Finance', Icon: Landmark, image: '/images/domains/finance.jpg', description: 'Reconcile the numbers, model scenarios, and brief the business.' },
  { key: 'hr-recruiting', label: 'HR & Recruiting', Icon: Users, image: '/images/domains/hr-recruiting.jpg', description: 'Screen candidates, run a hiring loop, and shape the team.' },
  { key: 'healthcare-admin', label: 'Healthcare Administration', Icon: Stethoscope, description: 'Coordinate care, manage records, and keep operations moving.' },
  { key: 'it-support', label: 'IT & Systems', Icon: Server, image: '/images/domains/it-support.jpg', description: 'Design architectures, interfaces, and databases under real constraints.' },
  { key: 'design', label: 'Design', Icon: Palette, image: '/images/domains/design.jpg', description: 'Turn ambiguous problems into interfaces people can actually use.' },
  { key: 'cybersecurity', label: 'Cybersecurity', Icon: ShieldCheck, image: '/images/domains/cybersecurity.jpg', description: 'Spot threats, harden systems, and respond when something breaks.' },
  { key: 'legal', label: 'Legal & Compliance', Icon: Scale, image: '/images/domains/legal.jpg', description: 'Review agreements, flag risk, and keep the business on-side.' },
  { key: 'operations', label: 'Operations & Supply Chain', Icon: Boxes, image: '/images/domains/operations.jpg', description: 'Keep things flowing — plan capacity, unblock, and cut waste.' },
  // .webp rather than .jpg — the extension is part of the URL, so the file
  // must be referenced as whatever it actually is.
  { key: 'education', label: 'Education & Training', Icon: GraduationCap, image: '/images/domains/education.webp', description: 'Design learning that sticks and measure whether it worked.' },
  { key: 'research', label: 'Research & Science', Icon: FlaskConical, description: 'Frame a question, run the study, and defend the conclusion.' },
]

const BY_LABEL = new Map(CAREER_DOMAINS.map((d) => [d.label.toLowerCase(), d]))

/** Exact-label lookup against the catalogue. Returns undefined for the
 * free-text domains an admin can type into the CMS, which is why
 * resolveDomainIcon/domainDescription keep their substring fallbacks. */
export function findDomain(label) {
  return label ? BY_LABEL.get(String(label).toLowerCase()) : undefined
}
