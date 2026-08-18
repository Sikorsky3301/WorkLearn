// Placeholder pricing — frontend-only, mock values.
// TODO(billing): replace with real per-simulation pricing once a billing
// provider is actually integrated. Today nothing charges: the Simulation
// model has no price column (see backend app/models/cms.py), and the
// SuperAdmin Configuration Center's Billing Provider section stores
// settings without processing transactions. These numbers exist so the
// enrollment card has a realistic price block for demos — the CTA still
// just starts the simulation, it never takes payment.

const DEFAULT_PRICING = { price: 499, listPrice: 3199, subscriptionFrom: 375 }

const PRICING_BY_SLUG = {
  'da-job-sim': { price: 499, listPrice: 3199, subscriptionFrom: 375 },
  'frontend-dev-sim': { price: 499, listPrice: 3980, subscriptionFrom: 375 },
  'sales-crm-sim': { price: 449, listPrice: 2899, subscriptionFrom: 375 },
}

/** Any simulation not listed above (e.g. a newly CMS-authored one) still
 * renders a price rather than an empty gap. */
export function pricingFor(slug) {
  return PRICING_BY_SLUG[slug] || DEFAULT_PRICING
}

// Indian numbering (₹1,23,456) — matches the locale the rest of the seeded
// demo data assumes.
export function formatPrice(amount) {
  return `₹${amount.toLocaleString('en-IN')}`
}

export function discountPercent({ price, listPrice }) {
  if (!listPrice || listPrice <= price) return 0
  return Math.round(((listPrice - price) / listPrice) * 100)
}
