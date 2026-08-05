import { ShieldCheck, BadgeCheck, Briefcase, Quote } from 'lucide-react'
import { SiCoursera, SiUdemy, SiEdx, SiKhanacademy, SiDuolingo, SiGooglescholar } from 'react-icons/si'
import { TRUST_PILLARS, EDUCATOR_QUOTES, PARTNER_INSTITUTIONS } from '../data/trustPlaceholders'

const PILLAR_ICONS = { graded: ShieldCheck, evidence: BadgeCheck, realwork: Briefcase }

// Generic academic/education glyphs standing in for institution crests —
// see data/trustPlaceholders.js: the institutions themselves are fictional,
// so these are decorative marks, not any real organisation's logo.
const CREST_MARKS = [SiCoursera, SiUdemy, SiEdx, SiKhanacademy, SiDuolingo, SiGooglescholar]

export default function TrustSection() {
  return (
    <section id="trust" className="bg-white py-20">
      <div className="max-w-container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Why it counts</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight mb-4">
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
        <div className="grid md:grid-cols-3 gap-5 mb-14">
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

        <div className="border-t border-border pt-10">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-7">
            Used by career teams at
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
            {PARTNER_INSTITUTIONS.map((name, i) => {
              const Mark = CREST_MARKS[i % CREST_MARKS.length]
              return (
                <div key={name} className="flex items-center gap-2.5 text-on-surface-variant/70">
                  <Mark className="h-5 w-5 shrink-0" />
                  <span className="text-sm font-semibold">{name}</span>
                </div>
              )
            })}
          </div>
          <p className="text-center text-[11px] text-on-surface-variant/60 mt-7">
            Illustrative institutions — partner names shown here are placeholders.
          </p>
        </div>
      </div>
    </section>
  )
}
