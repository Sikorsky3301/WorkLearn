import { StickyScroll } from '../../../components/ui/sticky-scroll-reveal'
import SimulationScreen from '../components/screens/SimulationScreen'
import MentorScreen from '../components/screens/MentorScreen'
import SkillGpsScreen from '../components/screens/SkillGpsScreen'
import AnalyticsScreen from '../components/screens/AnalyticsScreen'

/* The four surfaces a learner actually lives in, in the order they meet them.
   Each `content` is a hand-built mockup rather than a screenshot — see
   components/screens/AppWindow.jsx. All figures in them are illustrative. */
const TOUR = [
  {
    id: 'simulations',
    title: 'Job simulations',
    description:
      'You get hired into a role, not enrolled on a course. Briefs land from a manager with a deadline and just enough ambiguity that you have to make a call and defend it.',
    content: <SimulationScreen />,
  },
  {
    id: 'mentor',
    title: 'AI mentor',
    description:
      "It has read every task you've submitted, so the feedback is about your work — not a generic explanation of the topic you happened to ask about.",
    content: <MentorScreen />,
  },
  {
    id: 'skill-gps',
    title: 'Skill GPS',
    description:
      'Your assessed level against the benchmark for the role you actually want, updated from graded work. The gap is the plan.',
    content: <SkillGpsScreen />,
  },
  {
    id: 'analytics',
    title: 'Analytics',
    description:
      'Hours, scores, rework rate and streak in one place — so progress is something you can point at rather than something you feel.',
    content: <AnalyticsScreen />,
  },
]

export default function ProductTourSection() {
  return (
    <section id="product-tour" className="bg-surface-low pt-20">
      <div className="max-w-container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-orange-600 mb-3">A look inside</p>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
            What it actually feels like
          </h2>
        </div>
      </div>

      <StickyScroll content={TOUR} />
    </section>
  )
}
