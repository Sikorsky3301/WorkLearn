import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { PRICING_TIERS } from '../data/pricingTiers'

export default function PricingSection() {
  const navigate = useNavigate()

  return (
    <section id="pricing" className="bg-surface-low py-20 scroll-mt-16">
      <div className="max-w-container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Pricing</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight mb-4">
            Start free. Upgrade when it's paying off.
          </h2>
          <p className="text-base text-on-surface-variant leading-relaxed">
            Try a full task before you decide anything.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 items-start">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.key}
              className={`rounded-2xl border bg-white p-7 ${
                tier.highlighted ? 'border-primary shadow-xl md:-mt-3 md:pb-10' : 'border-border'
              }`}
            >
              {tier.highlighted && (
                <span className="inline-block text-[10px] font-bold uppercase tracking-wide bg-primary text-white rounded-full px-2.5 py-1 mb-3">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-bold text-on-surface">{tier.name}</h3>
              <p className="text-sm text-on-surface-variant mt-1 mb-5">{tier.blurb}</p>

              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="text-3xl font-extrabold text-on-surface">{tier.price}</span>
              </div>
              <p className="text-xs text-on-surface-variant mb-6">{tier.cadence}</p>

              <button
                onClick={() => navigate(tier.key === 'campus' ? '/contact' : '/login')}
                className={`w-full text-sm py-2.5 cursor-pointer ${tier.highlighted ? 'btn-primary' : 'btn-secondary'}`}
              >
                {tier.cta}
              </button>

              <ul className="space-y-2.5 mt-6 pt-6 border-t border-border">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-on-surface-variant">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="text-center text-[11px] text-on-surface-variant/70 mt-8">
          Indicative pricing — billing isn't live yet, and nothing on this page takes payment.
        </p>
      </div>
    </section>
  )
}
