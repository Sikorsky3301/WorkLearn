import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MapPin, Users, Building2, Quote, CheckCircle2, ArrowRight,
  FileText, Sparkles, Briefcase, AlertTriangle,
} from 'lucide-react'
import { useOnboarding, useAcceptOnboarding } from '../../hooks'
import { resolveMediaUrl } from '../../lib/client'
import Avatar from '../../components/ui/Avatar'

// Day one at the company.
//
// This is the first thing a student sees after choosing a simulation, and it
// has one job: make accepting feel like taking a role rather than clicking
// through a settings screen. So it reads top to bottom as a story — you've
// been offered a job, here's your manager, here's the company, here's the work,
// here's the letter — instead of the previous flat grid where the offer letter
// was squeezed into a sidebar at the same visual weight as a bullet list.
//
// Every value is CMS-authored (Simulation.onboarding / .manager / .logo_url),
// so this renders for any simulation without per-sim branching.

function Stat({ icon: Icon, children }) {
  if (!children) return null
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white/60">
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {children}
    </span>
  )
}

function Panel({ children, className = '' }) {
  return (
    <section className={`rounded-2xl bg-white p-6 shadow-sm ring-1 ring-border ${className}`}>
      {children}
    </section>
  )
}

function PanelHeading({ icon: Icon, children }) {
  return (
    <h2 className="mb-4 flex items-center gap-2.5 font-display text-base font-extrabold text-on-surface">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      {children}
    </h2>
  )
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
      <div className="flex min-h-screen items-center justify-center bg-surface-low">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const { company, manager, intro, learn = [], projects = [], offer, logo_url: logoUrl } = data
  const managerPhoto = manager?.photo_url ? resolveMediaUrl(manager.photo_url) : null

  // ── Accepted ──────────────────────────────────────────────────────────────
  if (celebrating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#151046] via-primary-dark to-[#0f0d2e] px-6">
        <div className="w-full max-w-md rounded-3xl bg-white p-10 text-center shadow-2xl">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-50 text-5xl ring-1 ring-amber-200">
            🎖️
          </div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-primary">Badge earned</p>
          <h1 className="mt-1.5 font-display text-2xl font-extrabold text-on-surface">Simulation Journey</h1>
          <p className="mt-1 text-sm text-on-surface-variant">{company?.name} · {offer?.role}</p>

          <p className="mt-6 text-sm leading-relaxed text-on-surface">
            Offer accepted — welcome to the team. {manager?.name} has your first assignment ready.
          </p>

          <button
            onClick={() => onAccept?.()}
            className="group mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
          >
            Start your first task
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
          <button
            onClick={() => navigate('/portfolio')}
            className="mt-3 text-xs font-semibold text-on-surface-variant transition-colors hover:text-primary"
          >
            View badge on my profile
          </button>
        </div>
      </div>
    )
  }

  // ── The offer ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-surface-low/40 pb-16">

      {/* Hero — you've been offered a role */}
      <div className="bg-gradient-to-br from-[#151046] via-primary-dark to-[#0f0d2e] text-white">
        <div className="mx-auto max-w-4xl px-6 pb-12 pt-10">
          <div className="mb-6 flex items-center gap-3">
            {logoUrl && (
              <img
                src={resolveMediaUrl(logoUrl)}
                alt=""
                className="h-8 w-auto max-w-[120px] object-contain brightness-0 invert"
              />
            )}
            <span className="font-display text-sm font-bold">{company?.name}</span>
            {company?.industry && (
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-[0.65rem] font-semibold text-white/70">
                {company.industry}
              </span>
            )}
          </div>

          <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-emerald-300">
            You&apos;ve been offered a role
          </p>
          <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            {offer?.title || 'Job Simulation'}
          </h1>
          <p className="mt-2 text-sm text-white/60">
            {offer?.team ? `${offer.team} · ` : ''}{company?.name}
          </p>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
            <Stat icon={MapPin}>{company?.location}</Stat>
            <Stat icon={Users}>{company?.size}</Stat>
            <Stat icon={Briefcase}>{projects.length} real tickets</Stat>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-6 px-6 py-8">

        {/* Manager's note — the centrepiece, in their voice */}
        <Panel className="relative overflow-hidden">
          <Quote className="absolute -right-2 -top-2 h-20 w-20 text-primary/[0.06]" aria-hidden="true" />
          <div className="relative flex items-center gap-4 border-b border-border pb-5">
            <Avatar src={managerPhoto} alt={manager?.name} initials={manager?.avatar} size="lg" />
            <div className="min-w-0">
              <p className="font-display text-base font-extrabold text-on-surface">{manager?.name}</p>
              <p className="text-sm text-on-surface-variant">{manager?.role}</p>
              <p className="mt-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-primary">
                Your manager for this simulation
              </p>
            </div>
          </div>
          <p className="relative mt-5 whitespace-pre-line text-[0.95rem] leading-relaxed text-on-surface">
            {intro}
          </p>
        </Panel>

        {/* The work */}
        {projects.length > 0 && (
          <Panel>
            <PanelHeading icon={Briefcase}>What you&apos;ll ship</PanelHeading>
            <ol className="space-y-3">
              {projects.map((p, i) => (
                <li
                  key={p.id ?? i}
                  className="flex items-start gap-4 rounded-xl bg-surface-low/60 p-4 transition-colors hover:bg-surface-low"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white font-mono text-xs font-bold text-primary shadow-sm">
                    {i + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-on-surface">{p.name}</span>
                    {p.brief && (
                      <span className="mt-0.5 block text-sm leading-relaxed text-on-surface-variant">{p.brief}</span>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          </Panel>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {company?.about && (
            <Panel>
              <PanelHeading icon={Building2}>About {company.name}</PanelHeading>
              <p className="text-sm leading-relaxed text-on-surface-variant">{company.about}</p>
            </Panel>
          )}

          {learn.length > 0 && (
            <Panel>
              <PanelHeading icon={Sparkles}>What you&apos;ll learn</PanelHeading>
              <ul className="space-y-3">
                {learn.map((item, i) => (
                  <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-on-surface">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>

        {/* The letter itself — full width, the loudest thing on the page */}
        <section className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-primary/20">
          <div className="border-b border-border bg-gradient-to-br from-primary/[0.06] to-transparent px-6 py-5 text-center">
            <p className="flex items-center justify-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-primary">
              <FileText className="h-3.5 w-3.5" /> Offer letter
            </p>
            <p className="mt-2 font-display text-lg font-extrabold text-on-surface">{offer?.title}</p>
            <p className="text-sm text-on-surface-variant">
              {offer?.team ? `${offer.team} · ` : ''}{offer?.company}
            </p>
          </div>

          <div className="px-6 py-6 sm:px-10">
            <p className="text-[0.95rem] leading-relaxed text-on-surface">{offer?.body}</p>

            {accept.isError && (
              <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-rose-50 p-3.5 text-sm text-rose-900 ring-1 ring-rose-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{accept.error?.message || 'Could not accept the offer. Please try again.'}</p>
              </div>
            )}

            <button
              onClick={handleAccept}
              disabled={accept.isPending}
              className="group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 font-display text-base font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
            >
              {accept.isPending
                ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Accepting…</>
                : <>Accept offer &amp; start
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>}
            </button>

            <p className="mt-3 text-center text-xs text-on-surface-variant">
              Accepting earns your Simulation Journey badge and begins your first task.
            </p>
          </div>
        </section>

        <div className="text-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm font-semibold text-on-surface-variant transition-colors hover:text-primary"
          >
            ← Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}
