import { Check } from 'lucide-react'
import { resolveDomainIcon } from '../../../shared/utils/domainIcons'
import { domainDescription } from '../../../shared/utils/domainMeta'

/** Domains come from whatever's actually published (see useSimulations —
 * same source SimulationWorkspace's DomainFilterBar uses), never a
 * hardcoded list, so a new CMS-authored domain shows up here automatically. */
export default function DomainStep({ domains, selected, onSelect }) {
  if (domains.length === 0) {
    return <p className="text-sm text-on-surface-variant">No job simulations are published yet — you can pick a domain later from your Portfolio.</p>
  }

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {domains.map((domain) => {
        const Icon = resolveDomainIcon(domain)
        const active = selected === domain
        return (
          <button
            key={domain}
            type="button"
            onClick={() => onSelect(domain)}
            className={`relative flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-colors cursor-pointer ${
              active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${active ? 'bg-primary text-white' : 'bg-surface-low text-primary'}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className={`text-sm font-bold ${active ? 'text-primary' : 'text-on-surface'}`}>{domain}</p>
              <p className="text-xs text-on-surface-variant mt-0.5 leading-snug">{domainDescription(domain)}</p>
            </div>
            {active && <Check className="h-4 w-4 text-primary absolute top-3 right-3 shrink-0" />}
          </button>
        )
      })}
    </div>
  )
}
