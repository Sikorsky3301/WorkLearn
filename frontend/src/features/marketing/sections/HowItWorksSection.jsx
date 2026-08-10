import { UserCheck, FileText, Code2, Award } from 'lucide-react'
import { Highlight } from '../../../components/ui/hero-highlight'
import { Reveal, RevealGroup, RevealItem } from '../../../components/ui/reveal'

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
    <section id="how-it-works" className="bg-white py-20">
      <div className="max-w-container mx-auto px-6">
        <Reveal className="text-center max-w-2xl mx-auto mb-14">
          <p className="eyebrow mb-3">How it works</p>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight mb-4">
            Four steps from curious to <Highlight>credentialed</Highlight>
          </h2>
          <p className="text-base text-on-surface-variant leading-relaxed">
            No lectures to sit through. You start working on day one.
          </p>
        </Reveal>

        <RevealGroup as="ol" className="grid md:grid-cols-4 gap-5">
          {STEPS.map(({ Icon, title, body }, i) => (
            <RevealItem as="li" key={title} className="panel panel-interactive relative p-6 pt-8">
              <span className="absolute -top-3.5 left-6 h-7 w-7 rounded-full border border-border bg-white text-xs font-bold text-on-surface flex items-center justify-center">
                {i + 1}
              </span>
              <span className="mt-2 mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-surface-low"><Icon className="h-4 w-4 text-primary" /></span>
              <h3 className="text-base font-bold text-on-surface mb-2">{title}</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">{body}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}
