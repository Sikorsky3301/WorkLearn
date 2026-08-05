import { Target, Users, ShieldCheck } from 'lucide-react'
import MarketingPageShell from './components/MarketingPageShell'

const VALUES = [
  {
    Icon: Target,
    title: 'Practice should look like the job',
    body: 'Courses teach concepts. Work asks you to make decisions with incomplete information and defend them. We build the second thing.',
  },
  {
    Icon: ShieldCheck,
    title: 'A credential should mean something',
    body: "If everyone passes, passing tells a recruiter nothing. Work here is graded against real criteria, and the certificate points back at what earned it.",
  },
  {
    Icon: Users,
    title: 'Built with educators, not around them',
    body: 'Career teams see what their students submitted and how it was assessed. Nothing about the outcome is a black box.',
  },
]

export default function AboutPage() {
  return (
    <MarketingPageShell
      eyebrow="About us"
      title="We think the gap is experience, not information"
      intro="Everything you need to learn a skill is already free online. What's missing is the chance to do the work — and something honest to show for it."
    >
      <div className="grid md:grid-cols-3 gap-5 mb-16">
        {VALUES.map(({ Icon, title, body }) => (
          <div key={title} className="rounded-xl border border-border p-6">
            <span className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Icon className="h-5 w-5" />
            </span>
            <h2 className="text-base font-bold text-on-surface mb-2">{title}</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">{body}</p>
          </div>
        ))}
      </div>

      <div className="max-w-2xl">
        <h2 className="text-xl font-bold text-on-surface mb-3">What we're building</h2>
        <div className="space-y-4 text-sm text-on-surface-variant leading-relaxed">
          <p>
            WorkLearn is a job-simulation platform. You're hired into a role at a fictional
            company, given briefs by a manager, and asked to do the actual work — clean the
            dataset, ship the component, run the discovery call. Your submission is graded,
            and finishing earns a verifiable certificate.
          </p>
          <p>
            Under the hood there's an AI mentor that knows what task you're on, a skill
            tracker that shows the gap between where you are and the role you want, and a
            portfolio that assembles itself from work you've genuinely completed.
          </p>
          <p>
            We're early. The catalogue is small and growing, and we'd rather add a simulation
            slowly and have it be worth finishing than fill a menu with things that aren't.
          </p>
        </div>
      </div>
    </MarketingPageShell>
  )
}
