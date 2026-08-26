import { useCallback, useEffect, useRef, useState } from 'react'
import { ExternalLink, RotateCw, Loader2, ArrowUpRight } from 'lucide-react'
import { openAuthedTab } from '../../../../lib/tabHandoff'
import { useSimChannel, SIM_EVENT } from '../../../../lib/simChannel'


// Launching the workbench.
//
// This was a whole bordered card sitting between the header and the brief. It
// is now a button in the header and a copy of the same button in the sticky
// bar — the card's own text ("opens in a new tab so the editor and console get
// real room") explained a mechanism nobody needed explaining, and it pushed
// the actual task description a screen further down.
//
// The sandbox still gets a whole browser tab. What went is the panel
// announcing it.

// Ceiling on the "opening" state, not the duration of it.
//
// The new tab boots the app, adopts the handoff token, fetches the simulation
// and mounts Monaco — a couple of seconds warm, considerably longer cold. The
// workbench announces SANDBOX_READY when it is genuinely usable and that is
// what normally clears this; the timeout only covers the cases where the
// signal never arrives at all (BroadcastChannel unsupported, the tab blocked
// by a popup blocker, a load that failed outright).
//
// Without a visible state the button appears dead for that whole window and
// people click again, which opens a second tab.
const OPENING_TIMEOUT_MS = 5000

// A floor as well as a ceiling.
//
// SANDBOX_READY often arrives in a few hundred milliseconds, and an overlay
// that appears and vanishes inside one blink reads as a flicker rather than a
// transition — worse than showing nothing. Two seconds is long enough to be
// read as deliberate and short enough not to be a wait.
//
// So: the overlay shows for at least OPENING_MIN_MS, clears on SANDBOX_READY
// once that has elapsed, and is force-cleared at OPENING_TIMEOUT_MS whatever
// happens.
const OPENING_MIN_MS = 2000

export function useSandboxLauncher(slug, taskIndex) {
  const [opening, setOpening] = useState(false)
  const [launched, setLaunched] = useState(false)
  const timer = useRef(null)
  const minTimer = useRef(null)
  // SANDBOX_READY can land before the minimum has elapsed. Recording it lets
  // the floor timer close the overlay on its behalf instead of the event being
  // dropped and the full 5s ceiling being served to somebody whose sandbox was
  // ready almost immediately.
  const readyEarly = useRef(false)

  const clearTimers = useCallback(() => {
    clearTimeout(timer.current)
    clearTimeout(minTimer.current)
  }, [])

  useEffect(() => () => clearTimers(), [clearTimers])

  // A new task is a new launch state — otherwise navigating between tasks
  // carries "Reopen sandbox" onto one that has never been opened.
  useEffect(() => {
    setOpening(false)
    setLaunched(false)
    readyEarly.current = false
    clearTimers()
  }, [slug, taskIndex, clearTimers])

  // The sandbox tab says when it's ready. Matched on slug+task so a second
  // sandbox open elsewhere can't clear this one's spinner.
  const onSimEvent = useCallback((evt) => {
    if (evt?.kind === SIM_EVENT.SANDBOX_READY && evt.slug === slug && evt.taskIndex === taskIndex) {
      clearTimeout(timer.current)
      // Only close now if the floor has already passed; otherwise leave it to
      // the floor timer, which reads this flag.
      if (minTimer.current === null) setOpening(false)
      else readyEarly.current = true
    }
  }, [slug, taskIndex])
  useSimChannel(onSimEvent)

  const open = useCallback(() => {
    if (opening) return
    // openAuthedTab MUST be called synchronously inside the click handler —
    // anything awaited first and the popup blocker eats the window. The
    // buffering state is set around it, never before it. See lib/tabHandoff.js.
    openAuthedTab(`/sandbox/${slug}/${taskIndex}`)
    setOpening(true)
    setLaunched(true)
    readyEarly.current = false
    clearTimers()

    minTimer.current = setTimeout(() => {
      minTimer.current = null
      if (readyEarly.current) setOpening(false)
    }, OPENING_MIN_MS)

    timer.current = setTimeout(() => setOpening(false), OPENING_TIMEOUT_MS)
  }, [slug, taskIndex, opening, clearTimers])

  return { open, opening, launched }
}

/** Full-screen cover while the sandbox tab is opening.
 *
 * The sandbox opens in ANOTHER tab, so without this the page you are looking
 * at simply sits there — the only feedback was a spinner inside the button,
 * which is easy to miss and led to second clicks and second tabs.
 *
 * `pointer-events-auto` on the backdrop is deliberate: it swallows clicks for
 * the duration, which is the actual fix for the double-open.
 */
export function SandboxOpeningOverlay({ open, taskTitle }) {
  if (!open) return null
  return (
    <div
      className="pointer-events-auto fixed inset-0 z-[90] flex flex-col items-center justify-center bg-[#0b0f14]/92 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <div className="cube-loader" />
      <p className="mt-8 font-display text-base font-extrabold text-white">
        Opening your sandbox
      </p>
      {taskTitle && (
        <p className="mt-1 max-w-xs text-center text-sm text-white/55">{taskTitle}</p>
      )}
      <p className="mt-6 text-xs text-white/35">It opens in a new tab</p>
    </div>
  )
}


/** A task's score, kept live while a sandbox tab is grading in another window.
 *
 * The BroadcastChannel listener is the only reason this page can learn that
 * something happened in another tab — without it the header would still show
 * the score from page load after a submission. */
export function useLiveTaskResult(slug, taskIndex, initialScore, initialQuizScore) {
  const [result, setResult] = useState(
    initialScore != null ? { score: initialScore, quizScore: initialQuizScore } : null
  )

  useEffect(() => {
    setResult(initialScore != null ? { score: initialScore, quizScore: initialQuizScore } : null)
  }, [slug, taskIndex, initialScore, initialQuizScore])

  const onSimEvent = useCallback((evt) => {
    if (evt?.kind === SIM_EVENT.TASK_GRADED && evt.slug === slug && evt.taskIndex === taskIndex) {
      setResult({ score: evt.score, quizScore: evt.quizScore ?? null })
    }
  }, [slug, taskIndex])
  useSimChannel(onSimEvent)

  return result
}

/** The launch button, shared by the header and the sticky bar so both show the
 *  same label and the same buffering state. */
export function SandboxButton({ onClick, opening, launched, graded, className = '', compact = false }) {
  const Icon = opening ? Loader2 : (graded || launched) ? RotateCw : ExternalLink
  const label = opening ? 'Opening…' : graded || launched ? 'Reopen sandbox' : 'Open sandbox'

  // The compact form is for the sticky bar, where it sits beside a title in a
  // 40px strip and has to stay a pill.
  if (compact) {
    return (
      <button
        onClick={onClick}
        disabled={opening}
        className={`group inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-colors disabled:cursor-wait ${className}`}
      >
        <Icon className={`h-4 w-4 ${opening ? 'animate-spin' : ''}`} />
        {label}
      </button>
    )
  }

  // The full form is the one solid block on an otherwise unfilled page, and
  // the only thing asking to be pressed — so it is sized like a decision
  // rather than like a link. Square, not a pill: on a page built from rules
  // and grids a rounded capsule is the one shape that does not belong.
  return (
    <button
      onClick={onClick}
      disabled={opening}
      className={`group inline-flex shrink-0 cursor-pointer items-center gap-3 rounded-lg bg-on-surface py-3.5 pl-5 pr-4 text-left text-white transition-colors hover:bg-primary disabled:cursor-wait disabled:hover:bg-on-surface ${className}`}
    >
      <Icon className={`h-5 w-5 shrink-0 ${opening ? 'animate-spin' : ''}`} />
      <span className="flex flex-col leading-tight">
        <span className="font-display text-[0.95rem] font-extrabold">{label}</span>
        <span className="text-[0.72rem] font-medium text-white/55">
          {opening ? 'A new tab is opening' : 'Opens in a new tab'}
        </span>
      </span>
      <ArrowUpRight className="ml-2 h-4 w-4 shrink-0 text-white/45 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </button>
  )
}
