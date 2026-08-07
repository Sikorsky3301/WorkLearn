import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useMarketingLinks } from '../useMarketingLinks'

export default function FinalCtaSection() {
  const navigate = useNavigate()
  const { startPath, startLabel } = useMarketingLinks()

  return (
    <section className="bg-white pb-24 pt-4">
      <div className="max-w-container mx-auto px-6">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-surface-low px-6 py-16 text-center">
          {/* Same confetti language as the hero — keeps the page light rather
              than closing on a dark band. Decorative only. */}
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <span className="absolute left-[8%] top-[18%] h-5 w-5 rounded-full bg-rose-500" />
            <span className="absolute left-[16%] bottom-[20%] h-3 w-3 rounded-full bg-amber-400" />
            <span className="absolute right-[10%] top-[22%] h-7 w-7 rounded-full bg-orange-500" />
            <span className="absolute right-[18%] bottom-[16%] h-4 w-4 rounded-full bg-emerald-500" />
            <span className="absolute right-[4%] bottom-[42%] h-9 w-9 rounded-xl bg-amber-300/80 rotate-12" />
            <span className="absolute left-[3%] top-[52%] h-7 w-7 rounded-full border-4 border-violet-500" />
          </div>

          <div className="relative">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-on-surface mb-4">
              Your first task is waiting.
            </h2>
            <p className="text-base text-on-surface-variant leading-relaxed max-w-xl mx-auto mb-8">
              Pick a role, meet your manager, and find out what the work actually feels like —
              before it counts.
            </p>
            <button
              onClick={() => navigate(startPath)}
              className="group inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold text-sm px-7 py-3.5 rounded-full shadow-lg shadow-primary/25 transition-all active:scale-[0.98] cursor-pointer"
            >
              {startLabel ?? 'Get started free'}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
