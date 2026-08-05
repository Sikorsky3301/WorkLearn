import { Mail, GraduationCap, LifeBuoy } from 'lucide-react'
import MarketingPageShell from './components/MarketingPageShell'

// Real, working mailto destinations — no dead form that silently discards
// what someone types. A proper contact form needs a backend endpoint that
// doesn't exist yet; TODO(contact-form) when it does.
const CHANNELS = [
  {
    Icon: GraduationCap,
    title: 'Universities & career teams',
    body: 'Cohort licensing, mentor accounts, and placement reporting.',
    email: 'partnerships@worklearn.ai',
  },
  {
    Icon: LifeBuoy,
    title: 'Support',
    body: 'Something broken, or stuck on a task? Send details and we’ll dig in.',
    email: 'support@worklearn.ai',
  },
  {
    Icon: Mail,
    title: 'Everything else',
    body: 'Press, feedback, or just curious what we’re up to.',
    email: 'hello@worklearn.ai',
  },
]

export default function ContactPage() {
  return (
    <MarketingPageShell
      eyebrow="Contact"
      title="Talk to us"
      intro="We read everything that comes in and reply to most of it within a couple of working days."
    >
      <div className="grid md:grid-cols-3 gap-5">
        {CHANNELS.map(({ Icon, title, body, email }) => (
          <div key={email} className="rounded-xl border border-border p-6 flex flex-col">
            <span className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Icon className="h-5 w-5" />
            </span>
            <h2 className="text-base font-bold text-on-surface mb-2">{title}</h2>
            <p className="text-sm text-on-surface-variant leading-relaxed flex-1">{body}</p>
            <a
              href={`mailto:${email}`}
              className="text-sm font-semibold text-primary hover:underline mt-4 break-all"
            >
              {email}
            </a>
          </div>
        ))}
      </div>
    </MarketingPageShell>
  )
}
