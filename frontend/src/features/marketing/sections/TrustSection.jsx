import { ShieldCheck, BadgeCheck, Briefcase, Quote } from 'lucide-react'
import { AnimatedTooltip } from '../../../components/ui/animated-tooltip'
import { TRUST_PILLARS, EDUCATOR_QUOTES } from '../data/trustPlaceholders'

const PILLAR_ICONS = { graded: ShieldCheck, evidence: BadgeCheck, realwork: Briefcase }

// The institution logo strip now lives in the hero (HeroSection.jsx) so it
// reads as the "featured on" band directly under the fold — it was showing
// twice on the same page.

export default function TrustSection() {
  return (
    <section id="trust" className="bg-white py-20">
      <div className="max-w-container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Why it counts</p>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight mb-4">
            Built for integrity, proven by educators
          </h2>
          <p className="text-base text-on-surface-variant leading-relaxed">
            A credential is only worth what stands behind it. Everything here is graded against
            real criteria and traceable back to the work that earned it.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mb-16">
          {TRUST_PILLARS.map((pillar) => {
            const Icon = PILLAR_ICONS[pillar.key] ?? ShieldCheck
            return (
              <div key={pillar.key} className="rounded-xl border border-border p-6 hover:border-primary/40 transition-colors">
                <span className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="text-base font-bold text-on-surface mb-2">{pillar.title}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{pillar.body}</p>
              </div>
            )
          })}
        </div>

        {/* Educator voices */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <AnimatedTooltip
            items={EDUCATOR_QUOTES.map((q) => ({
              name: q.name,
              designation: `${q.role} · ${q.institution}`,
            }))}
          />
          <p className="text-xs text-on-surface-variant">Educators using WorkLearn with their cohorts</p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {EDUCATOR_QUOTES.map((q) => (
            <figure key={q.name} className="rounded-xl bg-surface-low border border-border p-6 flex flex-col">
              <Quote className="h-5 w-5 text-primary/40 mb-3 shrink-0" />
              <blockquote className="text-sm text-on-surface leading-relaxed flex-1">{q.quote}</blockquote>
              <figcaption className="mt-5 pt-4 border-t border-border">
                <p className="text-sm font-bold text-on-surface">{q.name}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">{q.role}</p>
                <p className="text-xs text-on-surface-variant">{q.institution}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
