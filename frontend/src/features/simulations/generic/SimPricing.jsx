import { pricingFor, formatPrice, discountPercent } from './placeholderPricing'

/** Price block at the top of the enrollment card — headline price, struck
 * list price, and the saving. See placeholderPricing.js: these are mock
 * values for layout/demo, nothing charges yet. */
export default function SimPricing({ slug }) {
  const pricing = pricingFor(slug)
  const off = discountPercent(pricing)

  return (
    <div className="mb-4">
      <div className="flex items-baseline gap-2.5 flex-wrap">
        <span className="text-3xl font-extrabold text-on-surface leading-none">
          {formatPrice(pricing.price)}
        </span>
        {off > 0 && (
          <>
            <span className="text-sm text-on-surface-variant line-through">
              {formatPrice(pricing.listPrice)}
            </span>
            <span className="text-sm font-bold text-emerald-700">{off}% off</span>
          </>
        )}
      </div>
      {pricing.subscriptionFrom && (
        <p className="text-xs text-on-surface-variant mt-2">
          or from{' '}
          <span className="font-semibold text-on-surface">
            {formatPrice(pricing.subscriptionFrom)}/month
          </span>{' '}
          with an annual plan
        </p>
      )}
    </div>
  )
}
