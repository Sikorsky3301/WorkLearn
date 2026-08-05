import { useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Play } from 'lucide-react'
import { CardContainer, CardBody, CardItem } from '../../../components/ui/three-d-card'
import daJobSimBanner from '../../../assets/da-job-sim-banner.jpg'

const PROOF_POINTS = [
  'Real tasks, reviewed like real work',
  'Verified certificates with a checkable number',
  'No setup — everything runs in your browser',
]

export default function HeroSection() {
  const navigate = useNavigate()

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#151046] via-primary-dark to-[#0f0d2e] text-white">
      {/* Decorative layers — cosmetic only. */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)',
          backgroundSize: '26px 26px',
        }}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute -top-40 -right-24 h-[480px] w-[480px] rounded-full bg-secondary/25 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-52 -left-32 h-[420px] w-[420px] rounded-full bg-primary-light/20 blur-3xl" aria-hidden="true" />

      <div className="relative max-w-container mx-auto px-6 pt-20 pb-24 grid lg:grid-cols-[1.05fr_1fr] gap-14 items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Built for integrity, proven by educators
          </span>

          <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.05] tracking-tight mb-5">
            Do the job before
            <br />
            you get the job.
          </h1>

          <p className="text-base sm:text-lg text-white/75 leading-relaxed max-w-xl mb-8">
            Step into a real role at a real company. Take briefs from your manager, do the
            actual work, get it graded — and walk away with proof you can show a recruiter.
          </p>

          <ul className="space-y-2.5 mb-9">
            {PROOF_POINTS.map((point) => (
              <li key={point} className="flex items-start gap-2.5 text-sm text-white/80">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                {point}
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2 bg-white text-primary-dark hover:bg-white/90 active:scale-[0.98] font-bold text-sm px-6 py-3 rounded-lg shadow-lg transition-all cursor-pointer"
            >
              Start free <ArrowRight className="h-4 w-4" />
            </button>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 border border-white/25 hover:bg-white/10 text-white font-semibold text-sm px-5 py-3 rounded-lg transition-colors"
            >
              <Play className="h-3.5 w-3.5" fill="currentColor" /> See how it works
            </a>
          </div>
        </div>

        {/* Reuses the Aceternity 3D card already in the design system (see
            features/mira/MiraHero.jsx for the same pattern). */}
        <div className="hidden lg:block">
          <CardContainer defaultActive containerClassName="py-0">
            <CardBody className="relative w-full h-auto rounded-2xl border border-white/15 bg-white/[0.06] p-5 backdrop-blur-sm">
              <CardItem translateZ={60} className="w-full">
                <img
                  src={daJobSimBanner}
                  alt="A WorkLearn job simulation workspace"
                  className="w-full h-52 object-cover rounded-xl"
                />
              </CardItem>
              <CardItem translateZ={40} className="mt-4">
                <p className="text-xs font-bold uppercase tracking-widest text-white/50">Task 3 of 5</p>
                <p className="text-lg font-bold text-white mt-1">Segment the customer base</p>
              </CardItem>
              <CardItem translateZ={30} className="mt-3">
                <p className="text-sm text-white/65 leading-relaxed">
                  “Pull the last 12 months of orders and tell me which customers we should
                  actually be spending on. I need it before Thursday.”
                </p>
                <p className="text-xs text-white/45 mt-3">— Priya Sharma, your manager</p>
              </CardItem>
            </CardBody>
          </CardContainer>
        </div>
      </div>
    </section>
  )
}
