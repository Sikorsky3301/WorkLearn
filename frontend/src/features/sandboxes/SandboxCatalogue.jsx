import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Terminal, ArrowRight, ChevronDown, Package, Lock } from 'lucide-react'
import { useSandboxes } from '../../hooks'

// The sandbox catalogue — every practice environment on the platform.
//
// These are the SAME containers the simulations grade in, run without a task,
// a grader or a score. That is the whole pitch: somewhere to try a pandas
// expression or a React hook without it counting for anything.
//
// Everything on a card is served by the backend (see playground.py). The
// package lists in particular are read off the real Dockerfiles — a card that
// advertises a library the image does not have is worse than one that says
// nothing, because the student only finds out mid-attempt.

// The marks are the ones already in public/images/tech/ — the same set the
// marketing hero strip uses (features/marketing/data/technologies.js). They
// are single-path monochrome SVGs served as plain <img>, so they render solid
// black; an unbuilt sandbox gets its logo dimmed rather than a different icon,
// so the row still reads as the same kind of thing.
//
// `logo` comes from the backend catalogue, not from a map here. A second list
// of tech-to-logo in the frontend is exactly the sort of thing that drifts the
// first time a sandbox is renamed.

export default function SandboxCatalogue() {
  const navigate = useNavigate()
  const { data, isLoading, isError } = useSandboxes()
  const sandboxes = data?.sandboxes ?? []

  if (isLoading) return <Skeleton />
  if (isError) return <LoadError />

  const ready = sandboxes.filter((s) => s.available)

  // Available first. A grid that opens with fourteen "not available yet" cards
  // buries the three that work — the ordering IS the answer to "what can I use
  // right now".
  const ordered = [...sandboxes].sort(
    (a, b) => Number(b.available) - Number(a.available),
  )

  return (
    <div className="mx-auto max-w-container px-6 py-8">
      <header className="mb-7 border-b border-border pb-6">
        <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-primary">
          <Terminal className="h-3 w-3" /> Sandbox
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-on-surface">Practice environments</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-on-surface-variant">
          The same containers the simulations grade in — without the task, the grader or the score.
          Nothing you run here is saved or marked. {ready.length} of {sandboxes.length} are ready to use.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {ordered.map((s) => (
          <SandboxCard key={s.key} sandbox={s} onOpen={() => navigate(`/sandboxes/${s.key}`)} />
        ))}
      </div>
    </div>
  )
}

function SandboxCard({ sandbox, onOpen }) {
  const [showCaps, setShowCaps] = useState(false)
  const unavailable = !sandbox.available

  return (
    <article
      className={`flex flex-col rounded-xl border border-border bg-white transition-shadow ${
        unavailable ? 'opacity-75' : 'hover:shadow-panel'
      }`}
    >
      <div className="flex flex-1 flex-col p-5">
        {/* Logo + name, centred like the reference layout.
            The mark sits bare on the card — no tile, no ring, no shadow. These
            are the real brand marks, and a box around each one competes with
            the card's own border for the same job; two nested frames make the
            grid read as boxes-inside-boxes rather than as a row of logos. */}
        <div className="mb-4 flex flex-col items-center text-center">
          {/* Fixed-height row so every card's title starts on the same line,
              whatever the mark's aspect ratio. object-contain keeps a wide
              mark (Ruby on Rails) and a square one (Python) at the same
              optical weight instead of one filling the box and the other
              floating in it. */}
          <span className="mb-3 flex h-14 items-center justify-center">
            {sandbox.logo ? (
              <img
                src={sandbox.logo}
                alt=""
                className={`h-12 w-auto max-w-[6rem] object-contain ${unavailable ? 'opacity-30' : ''}`}
              />
            ) : (
              <Terminal className="h-12 w-12 text-on-surface-variant" />
            )}
          </span>
          <h2 className="text-base font-bold text-on-surface">{sandbox.name}</h2>
          <p className="mt-0.5 text-xs font-medium text-on-surface-variant">{sandbox.runtime}</p>
        </div>

        <p className="mb-4 text-sm leading-relaxed text-on-surface-variant">{sandbox.summary}</p>

        <ul className="mb-4 space-y-1.5">
          {sandbox.capabilities.map((c) => (
            <li key={c} className="flex gap-2 text-sm leading-snug text-on-surface">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-on-surface-variant" />
              {c}
            </li>
          ))}
        </ul>

        {/* "View supported capabilities" expands to the REAL package list from
            the image, rather than linking to a page that would repeat the
            bullets above in longer form. */}
        {sandbox.packages.length > 0 && (
          <div className="mt-auto">
            <button
              onClick={() => setShowCaps((v) => !v)}
              aria-expanded={showCaps}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary-dark"
            >
              View supported capabilities
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showCaps ? 'rotate-180' : ''}`} />
            </button>

            {showCaps && (
              <div className="mt-3 rounded-lg border border-border bg-surface-low/60 p-3">
                <p className="mb-2 flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-widest text-on-surface-variant">
                  <Package className="h-3 w-3" /> Installed in this image
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {sandbox.packages.map((pkg) => (
                    <span key={pkg} className="rounded border border-border bg-white px-1.5 py-0.5 font-mono text-[0.7rem] text-on-surface">
                      {pkg}
                    </span>
                  ))}
                </div>
                {sandbox.used_by.length > 0 && (
                  <p className="mt-2.5 text-[0.7rem] text-on-surface-variant">
                    Graded work in: {sandbox.used_by.join(', ')}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-border p-4">
        {unavailable ? (
          <div className="flex items-center justify-center gap-1.5 rounded-lg bg-surface-low px-4 py-2.5 text-sm font-semibold text-on-surface-variant">
            <Lock className="h-3.5 w-3.5" /> Not available yet
          </div>
        ) : (
          <button
            onClick={onOpen}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-on-surface px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-on-surface/90"
          >
            Open sandbox <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </article>
  )
}

function Skeleton() {
  return (
    <div className="mx-auto max-w-container animate-pulse px-6 py-8">
      <div className="mb-7 space-y-3 border-b border-border pb-6">
        <div className="h-5 w-24 rounded bg-surface-high" />
        <div className="h-7 w-64 rounded bg-surface-high" />
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-80 rounded-xl border border-border bg-surface-low" />
        ))}
      </div>
    </div>
  )
}

function LoadError() {
  return (
    <div className="mx-auto max-w-container px-6 py-8">
      <div className="rounded-xl border border-border bg-white px-6 py-16 text-center">
        <h2 className="mb-2 text-lg font-bold text-on-surface">We couldn&apos;t load the sandboxes</h2>
        <p className="mx-auto mb-6 max-w-sm text-sm text-on-surface-variant">Refresh to try again.</p>
        <button onClick={() => window.location.reload()} className="btn-primary text-sm">Refresh</button>
      </div>
    </div>
  )
}
