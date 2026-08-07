import { UserCheck, FileText, Code2, Award } from 'lucide-react'

const STEPS = [
  {
    Icon: UserCheck,
    title: 'Get hired into a role',
    body: 'Accept an offer letter from a company, meet your manager, and see what the team expects of you.',
  },
  {
    Icon: FileText,
    title: 'Take a real brief',
    body: 'Tasks arrive the way work does — some context, a deadline, and enough ambiguity that you have to make calls.',
  },
  {
    Icon: Code2,
    title: 'Do the work',
    body: 'Write the code, build the report, run the call. Everything happens in the browser, nothing to install.',
  },
  {
    Icon: Award,
    title: 'Get graded, get proof',
    body: 'Your submission is assessed against real criteria, and finishing earns a certificate you can actually share.',
  },
]

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-surface-low py-20">
      <div className="max-w-container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">How it works</p>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight mb-4">
            Four steps from curious to credentialed
          </h2>
          <p className="text-base text-on-surface-variant leading-relaxed">
            No lectures to sit through. You start working on day one.
          </p>
        </div>

        <ol className="grid md:grid-cols-4 gap-5">
          {STEPS.map(({ Icon, title, body }, i) => (
            <li key={title} className="relative rounded-xl bg-white border border-border p-6">
              <span className="absolute -top-3 left-6 h-6 w-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <Icon className="h-5 w-5 text-primary mt-2 mb-3" />
              <h3 className="text-base font-bold text-on-surface mb-2">{title}</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
