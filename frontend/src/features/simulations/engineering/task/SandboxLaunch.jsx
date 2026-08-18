import { useCallback, useEffect, useRef, useState } from 'react'
import { ExternalLink, RotateCw, Loader2 } from 'lucide-react'
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

export function useSandboxLauncher(slug, taskIndex) {
  const [opening, setOpening] = useState(false)
  const [launched, setLaunched] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  // A new task is a new launch state — otherwise navigating between tasks
  // carries "Reopen sandbox" onto one that has never been opened.
  useEffect(() => {
    setOpening(false)
    setLaunched(false)
    clearTimeout(timer.current)
  }, [slug, taskIndex])

  // The sandbox tab says when it's ready. Matched on slug+task so a second
  // sandbox open elsewhere can't clear this one's spinner.
  const onSimEvent = useCallback((evt) => {
    if (evt?.kind === SIM_EVENT.SANDBOX_READY && evt.slug === slug && evt.taskIndex === taskIndex) {
      clearTimeout(timer.current)
      setOpening(false)
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
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setOpening(false), OPENING_TIMEOUT_MS)
  }, [slug, taskIndex, opening])

  return { open, opening, launched }
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
  return (
    <button
      onClick={onClick}
      disabled={opening}
      className={`group inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-bold transition-colors disabled:cursor-wait ${
        compact ? 'px-4 py-2 text-xs' : 'px-5 py-2.5 text-sm'
      } ${className}`}
    >
      <Icon className={`h-4 w-4 ${opening ? 'animate-spin' : ''}`} />
      {opening
        ? 'Opening…'
        : graded || launched ? 'Reopen sandbox' : 'Open sandbox'}
    </button>
  )
}
