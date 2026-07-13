import { useNavigate } from 'react-router-dom'
import { useMira } from './MiraContext'

const SKILL_ICONS = ['js', 'html', 'css', 'wasm']

const FEATURES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v1a7 7 0 0 1-14 0v-1" /><line x1="12" y1="18" x2="12" y2="22" /><line x1="8" y1="22" x2="16" y2="22" />
      </svg>
    ),
    title: 'Type or speak your answers',
    body: 'Respond naturally — switch between typing and voice input during the session.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
      </svg>
    ),
    title: 'Instant, structured feedback',
    body: 'Get scored on communication, technical accuracy, and confidence right after your session.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
      </svg>
    ),
    title: 'Track your progress',
    body: 'Revisit past sessions to see how your interview skills improve over time.',
  },
]

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

            {/* Skill stack */}
            <div className="mt-10">
              <p className="section-label mb-3">
                Practice across real tech stacks
              </p>
              <a
                href="https://skillicons.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-wrap items-center gap-3 w-max"
              >
                {SKILL_ICONS.map((icon, i) => (
                  <span
                    key={icon}
                    className="mira-skill-icon w-12 h-12 sm:w-14 sm:h-14 bg-surface-low border border-border rounded-xl flex items-center justify-center cursor-pointer"
                    style={{ animationDelay: `${i * 0.12}s, ${i * 0.12 + 0.5}s` }}
                  >
                    <img
                      src={`https://skillicons.dev/icons?i=${icon}`}
                      alt={icon}
                      className="w-7 h-7 sm:w-8 sm:h-8"
                    />
                  </span>
                ))}
              </a>
            </div>
          </div>

          {/* Right: interview preview mock */}
          <div className="hidden lg:block" aria-hidden="true">
            <div className="card shadow-sm relative">
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

              <p className="text-sm font-semibold text-on-surface leading-relaxed mb-4">
                "How does gradient descent work, and what role does the learning rate play?"
              </p>

              <div className="p-3 bg-surface-low border border-border rounded-lg text-xs text-on-surface-variant leading-relaxed mb-4">
                Gradient descent updates parameters opposite the loss gradient. A learning rate that's too high can overshoot…
              </div>

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
            </div>
          </div>
        </div>
      </div>

      {/* Feature cards */}
      <div id="mira-how-it-works" className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {FEATURES.map(f => (
          <div key={f.title} className="card">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
              {f.icon}
            </div>
            <p className="font-bold text-on-surface text-sm mb-1">{f.title}</p>
            <p className="text-xs text-on-surface-variant leading-relaxed">{f.body}</p>
          </div>
        ))}
      </div>

      {/* How it works steps */}
      <div className="card">
        <p className="section-label mb-4">How it works</p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { step: '1', label: 'Customize', body: 'Pick interview type, role, difficulty, and duration.' },
            { step: '2', label: 'Interview', body: 'Answer one AI question at a time, at your own pace.' },
            { step: '3', label: 'Get feedback', body: 'Receive scores across communication, technical, and confidence.' },
            { step: '4', label: 'Improve', body: 'Review suggestions and practice again to level up.' },
          ].map(s => (
            <div key={s.step} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">
                {s.step}
              </div>
              <div>
                <p className="text-sm font-semibold text-on-surface">{s.label}</p>
                <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
