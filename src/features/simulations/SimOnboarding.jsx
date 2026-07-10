import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnboarding, useAcceptOnboarding } from '../../shared/api/hooks'
import lumenLogoImg from '../../assets/lumen-logo.png'

// Lumen Corporation brand mark (matches DASimulationWorkspace)
function LumenLogo({ size = 'md' }) {
  const h = { sm: 'h-5', md: 'h-7', lg: 'h-9' }[size]
  return <img src={lumenLogoImg} alt="Lumen Corporation" className={`${h} w-auto object-contain shrink-0`} />
}

export default function SimOnboarding({ sim = 'da-job-sim', onAccept }) {
  const navigate = useNavigate()
  const { data, isLoading } = useOnboarding(sim)
  const accept = useAcceptOnboarding(sim)
  const [celebrating, setCelebrating] = useState(false)

  async function handleAccept() {
    try {
      await accept.mutateAsync()
      setCelebrating(true)
    } catch { /* surfaced via accept.isError below */ }
  }

  if (isLoading || !data) {
    return (
      <div className="max-w-container mx-auto px-6 py-24 flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const { company, manager, intro, learn = [], projects = [], offer } = data

  // ── Badge celebration screen ────────────────────────────────────────────────
  if (celebrating) {
    return (
      <div className="max-w-container mx-auto px-6 py-10 flex flex-col items-center">
        <div className="card max-w-lg w-full text-center py-12 px-10">
          <div className="text-6xl mb-4 animate-bounce">🎖️</div>
          <p className="text-xs font-bold tracking-widest text-primary uppercase mb-2">Badge Earned</p>
          <h1 className="text-2xl font-bold text-on-surface mb-1">Simulation Journey</h1>
          <p className="text-sm text-on-surface-variant mb-6">{company?.name} · {offer?.role}</p>
          <div className="w-16 h-px bg-border mx-auto mb-6" />
          <p className="text-sm text-on-surface leading-relaxed mb-8">
            Offer accepted — welcome to the team! Your <strong>Simulation Journey</strong> badge is now on your
            profile. {manager?.name} has your first assignment ready. Let's get into Week 1.
          </p>
          <button className="btn-primary px-6 py-2.5 w-full" onClick={() => onAccept?.()}>
            Start Week 1 →
          </button>
          <button
            onClick={() => navigate('/portfolio')}
            className="mt-3 text-xs text-on-surface-variant hover:text-primary transition-colors"
          >
            View badge on my profile
          </button>
        </div>
      </div>
    )
  }

  // ── Onboarding experience ───────────────────────────────────────────────────
  return (
    <div className="max-w-container mx-auto px-6 py-6">

      {/* Company header */}
      <div className="flex items-center gap-3 mb-6 pb-5 border-b border-border">
        <LumenLogo size="lg" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-on-surface text-lg leading-tight">{company?.name}</span>
            <span className="chip bg-orange-100 text-orange-700 text-[10px]">{company?.industry}</span>
          </div>
          <p className="text-xs text-on-surface-variant">Growth &amp; Analytics · {offer?.title}</p>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-xs text-on-surface-variant">
          <span>📍 {company?.location}</span>
          <span>👥 {company?.size}</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── Left: narrative ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Manager intro */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
              <div className="w-11 h-11 bg-orange-500 rounded-full flex items-center justify-center shrink-0">
                <span className="text-white text-sm font-bold">{manager?.avatar}</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-on-surface">{manager?.name}</p>
                  <span className="chip bg-orange-100 text-orange-700 text-[10px] shrink-0">{manager?.role}</span>
                </div>
                <p className="text-xs text-on-surface-variant">Your manager for this simulation</p>
              </div>
            </div>
            <p className="text-sm text-on-surface leading-relaxed whitespace-pre-line">{intro}</p>
          </div>

          {/* About the company */}
          {company?.about && (
            <div className="card">
              <span className="section-label">About {company.name}</span>
              <p className="text-sm text-on-surface-variant leading-relaxed mt-2">{company.about}</p>
            </div>
          )}

          {/* Projects you'll do */}
          <div className="card">
            <span className="section-label">Projects you'll do</span>
            <div className="mt-3 space-y-2">
              {projects.map((p, i) => (
                <div key={p.id ?? i} className="flex items-start gap-3 border border-border rounded-lg p-3">
                  <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-on-surface">{p.name}</p>
                    <p className="text-xs text-on-surface-variant leading-relaxed">{p.brief}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: what you'll learn + offer ── */}
        <div className="space-y-5">

          {/* What you'll learn */}
          <div className="card">
            <span className="section-label">What you'll learn</span>
            <div className="mt-3 space-y-2">
              {learn.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-primary text-sm mt-0.5">✓</span>
                  <p className="text-xs text-on-surface leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Offer letter */}
          <div className="card border-2 border-primary/20 bg-primary/[0.02]">
            <div className="text-center pb-4 mb-4 border-b border-border">
              <p className="text-[10px] font-bold tracking-widest text-primary uppercase mb-1">Offer Letter</p>
              <p className="font-bold text-on-surface text-sm">{offer?.title}</p>
              <p className="text-xs text-on-surface-variant">{offer?.team} · {offer?.company}</p>
            </div>
            <p className="text-xs text-on-surface leading-relaxed mb-4">{offer?.body}</p>

            {accept.isError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
                {accept.error?.message || 'Could not accept the offer. Please try again.'}
              </p>
            )}

            <button
              onClick={handleAccept}
              disabled={accept.isPending}
              className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {accept.isPending && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {accept.isPending ? 'Accepting…' : 'Accept Offer & Start →'}
            </button>
            <p className="text-[11px] text-on-surface-variant text-center mt-2">
              Accepting earns your Simulation Journey badge and begins Week 1.
            </p>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full text-xs text-on-surface-variant hover:text-primary transition-colors"
          >
            ← Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}
