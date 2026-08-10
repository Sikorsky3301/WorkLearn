import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Highlight } from '../../../components/ui/hero-highlight'
import { Reveal } from '../../../components/ui/reveal'
import { useMarketingLinks } from '../useMarketingLinks'

export default function FinalCtaSection() {
  const navigate = useNavigate()
  const { startPath, startLabel } = useMarketingLinks()

  return (
    <section className="bg-white pb-24 pt-8">
      <div className="max-w-container mx-auto px-6">
        <Reveal className="panel px-6 py-16 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-on-surface mb-4">
            Your <Highlight>first task</Highlight> is waiting.
          </h2>
          <p className="text-base text-on-surface-variant leading-relaxed max-w-xl mx-auto mb-8">
            Pick a role, meet your manager, and find out what the work actually feels like —
            before it counts.
          </p>
          <button onClick={() => navigate(startPath)} className="pill-btn-primary group">
            {startLabel ?? 'Get started free'}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </Reveal>
      </div>
    </section>
  )
}
