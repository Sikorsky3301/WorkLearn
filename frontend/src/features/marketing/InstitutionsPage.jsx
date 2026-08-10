import { Link, useNavigate } from 'react-router-dom'
import {
  Users, ClipboardList, BarChart3, ShieldCheck, GraduationCap, UserCog, ArrowRight,
} from 'lucide-react'
import MarketingPageShell from './components/MarketingPageShell'
import { Highlight } from '../../components/ui/hero-highlight'
import { PRICING_TIERS } from './data/pricingTiers'
import { useMarketingLinks } from './useMarketingLinks'

/* Everything described here maps to something that exists in the product —
   the university and mentor login routes, the mentor's cohort view, the admin
   portal's analytics, and verifiable certificates. Deliberately no student
   numbers, placement rates or named partner institutions: there are none to
   quote yet, and inventing them is exactly the kind of claim a career office
   would check. Pricing is still mock (see data/pricingTiers.js). */

const CAPABILITIES = [
  {
    Icon: Users,
    title: 'Cohort accounts',
    body: 'Students sign in with their roll number through your institution\'s own login route, so accounts map to your records rather than to personal email addresses.',
  },
  {
    Icon: UserCog,
    title: 'Mentor access',
    body: 'Faculty get their own sign-in and a view of the students assigned to them — what they are working on and what they have submitted.',
  },
  {
    Icon: ClipboardList,
    title: 'Assign simulations',
    body: 'Point a cohort at a specific role rather than leaving the catalogue open, so a class works through the same brief at the same time.',
  },
  {
    Icon: BarChart3,
    title: 'Progress reporting',
    body: 'Completion, scores and time-on-task across a cohort, so a career office can see who is stuck before the placement window closes.',
  },
  {
    Icon: ShieldCheck,
    title: 'Credentials that verify',
    body: 'Every certificate carries a number that resolves back to the tasks and rubric scores that earned it — auditable, not decorative.',
  },
  {
    Icon: GraduationCap,
    title: 'Onboarding support',
    body: 'We help set up your cohorts, mentor accounts and the first assignment rather than handing over a login and wishing you luck.',
  },
]

const STEPS = [
  { n: 1, title: 'Tell us about the cohort', body: 'Programme, year, size, and the roles your students are actually interviewing for.' },
  { n: 2, title: 'We set up your instance', body: 'Institution login, mentor accounts, and the simulations that match those roles.' },
  { n: 3, title: 'Students start working', body: 'They sign in with their roll number and take their first brief the same day.' },
  { n: 4, title: 'You watch it land', body: 'Cohort reporting shows completion and scores as the work comes in.' },
]

export default function InstitutionsPage() {
  const navigate = useNavigate()
  const { homePath } = useMarketingLinks()
  const campus = PRICING_TIERS.find((t) => t.key === 'campus')

  return (
    <MarketingPageShell
      eyebrow="For institutions"
      title="Give a whole cohort something to show"
      intro="Universities, colleges and training providers use WorkLearn to put students through real job simulations — and to see, in one place, who actually finished."
    >
      {/* What you get */}
      <div className="grid md:grid-cols-3 gap-5 mb-20">
        {CAPABILITIES.map(({ Icon, title, body }) => (
          <div key={title} className="panel p-6">
            <span className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Icon className="h-4 w-4" />
            </span>
            <h2 className="text-base font-bold text-on-surface mb-2">{title}</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">{body}</p>
          </div>
        ))}
      </div>

      {/* How rollout works */}
      <div className="mb-20">
        <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight mb-3">
          From first call to <Highlight>first submission</Highlight>
        </h2>
        <p className="text-base text-on-surface-variant leading-relaxed max-w-2xl mb-10">
          There is no procurement marathon here. Most of the setup is us, not you.
        </p>

        <ol className="grid md:grid-cols-4 gap-5">
          {STEPS.map(({ n, title, body }) => (
            <li key={n} className="panel relative p-6 pt-8">
              <span className="absolute -top-3.5 left-6 h-7 w-7 rounded-full border border-border bg-white text-xs font-bold text-on-surface flex items-center justify-center">
                {n}
              </span>
              <h3 className="text-sm font-bold text-on-surface mb-2">{title}</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">{body}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* Campus plan + contact */}
      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-5 mb-16">
        <div className="panel p-8">
          <p className="eyebrow mb-3">{campus?.name ?? 'Campus'} plan</p>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-extrabold text-on-surface">{campus?.price ?? 'Custom'}</span>
            <span className="text-sm text-on-surface-variant">{campus?.cadence ?? 'per institution'}</span>
          </div>
          <p className="text-sm text-on-surface-variant mb-6">{campus?.blurb}</p>

          <ul className="space-y-2.5 mb-8">
            {(campus?.features ?? []).map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-on-surface-variant">
                <span className="mt-[7px] h-1 w-1 rounded-full bg-primary shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => navigate('/contact')} className="pill-btn-primary group">
              Talk to us
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <Link to={`${homePath}#pricing`} className="pill-btn">
              Compare all plans
            </Link>
          </div>

          <p className="text-[11px] text-on-surface-variant/60 mt-5">
            Pricing shown across the site is indicative — nothing is charged today.
          </p>
        </div>

        <div className="panel p-8">
          <h2 className="text-base font-bold text-on-surface mb-2">Already set up?</h2>
          <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
            If your institution is already running WorkLearn, sign in through your own entry
            point rather than the general login.
          </p>
          <div className="space-y-2.5">
            <Link
              to="/university/login"
              className="flex items-center justify-between rounded-xl border border-border px-4 py-3.5 transition-colors hover:border-on-surface/30"
            >
              <span>
                <span className="block text-sm font-semibold text-on-surface">Student login</span>
                <span className="block text-xs text-on-surface-variant">Sign in with your roll number</span>
              </span>
              <ArrowRight className="h-4 w-4 text-on-surface-variant shrink-0" />
            </Link>
            <Link
              to="/mentor/login"
              className="flex items-center justify-between rounded-xl border border-border px-4 py-3.5 transition-colors hover:border-on-surface/30"
            >
              <span>
                <span className="block text-sm font-semibold text-on-surface">Mentor login</span>
                <span className="block text-xs text-on-surface-variant">Faculty and cohort mentors</span>
              </span>
              <ArrowRight className="h-4 w-4 text-on-surface-variant shrink-0" />
            </Link>
          </div>
        </div>
      </div>
    </MarketingPageShell>
  )
}
