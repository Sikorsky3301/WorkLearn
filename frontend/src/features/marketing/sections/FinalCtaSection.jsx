import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function FinalCtaSection() {
  const navigate = useNavigate()

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#151046] via-primary-dark to-[#0f0d2e] text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[380px] w-[620px] rounded-full bg-secondary/20 blur-3xl" aria-hidden="true" />

      <div className="relative max-w-container mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
          Your first task is waiting.
        </h2>
        <p className="text-base text-white/70 leading-relaxed max-w-xl mx-auto mb-8">
          Pick a role, meet your manager, and find out what the work actually feels like —
          before it counts.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="inline-flex items-center gap-2 bg-white text-primary-dark hover:bg-white/90 active:scale-[0.98] font-bold text-sm px-7 py-3 rounded-lg shadow-lg transition-all cursor-pointer"
        >
          Get started free <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  )
}
