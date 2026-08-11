import { Check } from 'lucide-react'
import { CAREER_DOMAINS } from '../../../lib/careerDomains'

/** Career-interest picker, driven by the curated catalogue in
 * lib/careerDomains.js — deliberately not by whatever simulations happen to
 * be published. The old version derived its list from useSimulations(),
 * which showed only 3 options and, on a fresh database, showed none at all
 * while still requiring a selection (an unfinishable wizard). Finishing
 * onboarding auto-enrolls the student in tenant-visible published sims
 * whose domain matches this choice. */
export default function DomainStep({ selected, onSelect }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-on-surface-variant leading-relaxed">
        When you finish setup, you’ll be enrolled in published job simulations for this domain that are available to your university. You can browse more anytime from your dashboard.
      </p>
      <div className="grid sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1 -mr-1">
        {CAREER_DOMAINS.map(({ key, label, description, Icon }) => {
          const active = selected === label
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(label)}
              aria-pressed={active}
              className={`relative flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-colors cursor-pointer ${
                active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
              }`}
            >
              <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${active ? 'bg-primary text-white' : 'bg-surface-low text-primary'}`}>
                <Icon className="h-4.5 w-4.5" />
              </span>
              <span className="min-w-0 pr-4">
                <span className={`block text-sm font-bold ${active ? 'text-primary' : 'text-on-surface'}`}>{label}</span>
                <span className="block text-xs text-on-surface-variant mt-0.5 leading-snug">{description}</span>
              </span>
              {active && <Check className="h-4 w-4 text-primary absolute top-3 right-3 shrink-0" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
