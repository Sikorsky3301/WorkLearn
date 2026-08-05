// Placeholder pricing — frontend-only, mock values.
// TODO(billing): nothing charges today. There is no price column on any
// model and the SuperAdmin Configuration Center's Billing Provider section
// stores settings without processing transactions. Mirrors the per-simulation
// mock in features/simulations/generic/placeholderPricing.js — keep the two
// consistent if either changes.

export const PRICING_TIERS = [
  {
    key: 'free',
    name: 'Explore',
    price: '₹0',
    cadence: 'forever',
    blurb: 'See how it works before you commit to anything.',
    features: [
      'Browse every job simulation',
      'Complete your first task free',
      'Personal skill profile',
    ],
    cta: 'Start free',
    highlighted: false,
  },
  {
    key: 'pro',
    name: 'Career',
    price: '₹375',
    cadence: 'per month, billed annually',
    blurb: 'Full access while you build a portfolio worth showing.',
    features: [
      'Every simulation, start to finish',
      'Verified completion certificates',
      'AI Mentor and Skill GPS',
      'MIRA mock interviews',
      'Shareable public portfolio',
    ],
    cta: 'Get started',
    highlighted: true,
  },
  {
    key: 'campus',
    name: 'Campus',
    price: 'Custom',
    cadence: 'per institution',
    blurb: 'For universities placing whole cohorts.',
    features: [
      'Everything in Career',
      'Cohort dashboards for faculty',
      'Mentor accounts and assignments',
      'Placement reporting',
      'Dedicated onboarding support',
    ],
    cta: 'Talk to us',
    highlighted: false,
  },
]
