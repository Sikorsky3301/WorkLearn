import { useNavigate } from 'react-router-dom'
import { useMira } from './MiraContext'
import { CardContainer, CardBody, CardItem } from '../../components/ui/three-d-card'
import MiraGeminiSection from './MiraGeminiSection'
import MiraToolsMarquee from './MiraToolsMarquee'
import MiraWobbleSection from './MiraWobbleSection'

export default function MiraHero() {
  const navigate = useNavigate()
  const { results } = useMira()

  return (
    <div className="max-w-container mx-auto px-6 py-10">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-white px-6 sm:px-12 py-14 sm:py-16 mb-10">
        {/* Soft brand-tinted glow — replaces the flat color block, stays subtle on white */}
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute -bottom-32 -right-16 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute inset-0 opacity-[0.4] pointer-events-none -z-10" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #e5e1e9 1px, transparent 0)',
          backgroundSize: '28px 28px',
          maskImage: 'linear-gradient(to bottom, black, transparent 85%)',
        }} />

        <div className="relative grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
          {/* Left: copy + CTAs */}
          <div>
            <span className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase mb-5">
              AI Mock Interviews
            </span>
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-4 text-on-surface">MIRA</h1>
            <p className="text-lg sm:text-xl font-semibold text-on-surface mb-3">
              AI-powered mock interviews for smarter placement preparation.
            </p>
            <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed mb-8 max-w-xl">
              Practice technical, HR, and behavioral interviews with realistic AI-driven questions and instant performance feedback.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigate('/mira/setup')}
                className="btn-primary px-6 py-3 text-sm font-bold cursor-pointer"
              >
                Start Mock Interview →
              </button>
              {results ? (
                <button
                  onClick={() => navigate('/mira/results')}
                  className="btn-secondary px-5 py-3 text-sm font-semibold cursor-pointer"
                >
                  View Last Results
                </button>
              ) : (
                <button
                  onClick={() => document.getElementById('mira-how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                  className="btn-secondary px-5 py-3 text-sm font-semibold cursor-pointer"
                >
                  How It Works
                </button>
              )}
            </div>
          </div>

          {/* Right: interview preview mock — Aceternity 3D Card Effect, already tilted on load */}
          <div className="mira-preview-wrap hidden lg:block relative" aria-hidden="true">
            <CardContainer containerClassName="py-0" defaultActive>
              <CardBody className="card shadow-sm relative w-full mira-3d-glow">
                <CardItem translateZ={30} className="w-full">
                  <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-white text-xs font-bold">AI</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-on-surface">MIRA · Technical Round</p>
                      <p className="text-[11px] text-on-surface-variant">Question 3 of 7</p>
                    </div>
                    <span className="ml-auto chip">Live</span>
                  </div>
                </CardItem>

                <CardItem translateZ={50} className="w-full">
                  <p className="text-sm font-semibold text-on-surface leading-relaxed mb-4">
                    "How does gradient descent work, and what role does the learning rate play?"
                  </p>
                </CardItem>

                <CardItem translateZ={40} className="w-full">
                  <div className="p-3 bg-surface-low border border-border rounded-lg text-xs text-on-surface-variant leading-relaxed mb-4">
                    Gradient descent updates parameters opposite the loss gradient. A learning rate that's too high can overshoot…
                  </div>
                </CardItem>

                <CardItem translateZ={60} className="w-full">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Technical', v: 82 },
                      { label: 'Communication', v: 74 },
                      { label: 'Confidence', v: 88 },
                    ].map(m => (
                      <div key={m.label} className="p-2 rounded-lg text-center border border-border bg-white">
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide">{m.label}</p>
                        <p className="text-sm mt-0.5 text-primary font-bold">{m.v}%</p>
                      </div>
                    ))}
                  </div>
                </CardItem>
              </CardBody>
            </CardContainer>
          </div>
        </div>
      </div>

      {/* Tools ecosystem — Aceternity Infinite Moving Cards */}
      <MiraToolsMarquee />

      {/* Why MIRA — Aceternity Wobble Card */}
      <MiraWobbleSection />

      {/* How MIRA works — Aceternity Google Gemini Effect, scroll-driven */}
      <div id="mira-how-it-works">
        <MiraGeminiSection />
      </div>
    </div>
  )
}
