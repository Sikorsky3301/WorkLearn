import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Runs an exam in fullscreen and stops the clock the moment the student leaves.
 *
 * ── WHAT "LEAVING" MEANS ──────────────────────────────────────────────────
 *
 * Three separate signals, because no one of them catches everything:
 *
 *   fullscreenchange   Escape, F11, or the browser's own exit affordance.
 *   visibilitychange   switching tab, minimising, locking the screen. This is
 *                      the one that catches alt-tab on most platforms.
 *   blur               focus moving to another window while this one is still
 *                      visible — a second monitor, a floating app. `visibility`
 *                      does NOT fire for that, which is why it is not enough
 *                      on its own.
 *
 * Any of them pauses. Resuming is deliberate: the student clicks, which is also
 * the user gesture the Fullscreen API requires — `requestFullscreen()` from a
 * timer or an event handler that is not a click is rejected by every browser,
 * so an "auto-resume" would silently fail and leave the exam running outside
 * fullscreen.
 *
 * ── WHAT THIS IS NOT ──────────────────────────────────────────────────────
 *
 * It is not real proctoring, and nothing in the browser is. A determined
 * student has a second device, and no amount of JavaScript sees it. What this
 * does is make leaving DELIBERATE and RECORDED: the clock stops, an overlay
 * covers the questions, and every switch is counted and reported with the
 * attempt. That is a deterrent and an audit trail, not a lock — and the copy
 * in the UI says exactly that rather than implying a guarantee.
 *
 * The count is kept honest by not pretending a pause is free: time spent
 * paused is excluded from the remaining time, so pausing cannot buy thinking
 * time either.
 */

export const PROCTOR_STATE = {
  IDLE: 'idle',        // not started
  RUNNING: 'running',  // fullscreen, clock ticking
  PAUSED: 'paused',    // left the window or fullscreen; clock stopped
  FINISHED: 'finished',
}

function requestFullscreen(el) {
  const node = el || document.documentElement
  const fn = node.requestFullscreen
    || node.webkitRequestFullscreen
    || node.msRequestFullscreen
  // Safari and old Edge return undefined rather than a promise.
  return fn ? Promise.resolve(fn.call(node)).catch(() => {}) : Promise.resolve()
}

function exitFullscreen() {
  if (!document.fullscreenElement && !document.webkitFullscreenElement) return Promise.resolve()
  const fn = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen
  return fn ? Promise.resolve(fn.call(document)).catch(() => {}) : Promise.resolve()
}

export function isFullscreen() {
  return Boolean(document.fullscreenElement || document.webkitFullscreenElement)
}

/**
 * @param {object} opts
 * @param {number} opts.durationMinutes  0 = untimed
 * @param {() => void} opts.onExpire     called once when the clock hits zero
 * @param {boolean} opts.enforceFullscreen
 */
export function useProctoredSession({ durationMinutes = 0, onExpire, enforceFullscreen = true } = {}) {
  const [state, setState] = useState(PROCTOR_STATE.IDLE)
  const [violations, setViolations] = useState([])
  // Seconds actually spent answering — paused time never counts.
  const [elapsed, setElapsed] = useState(0)

  const totalSeconds = durationMinutes > 0 ? durationMinutes * 60 : 0
  const remaining = totalSeconds ? Math.max(0, totalSeconds - elapsed) : null
  const expired = totalSeconds > 0 && remaining === 0

  const stateRef = useRef(state)
  stateRef.current = state
  const expiredRef = useRef(false)

  const record = useCallback((reason) => {
    setViolations((prev) => [...prev, { reason, at: new Date().toISOString() }])
  }, [])

  const start = useCallback(async () => {
    if (enforceFullscreen) await requestFullscreen()
    setState(PROCTOR_STATE.RUNNING)
  }, [enforceFullscreen])

  const resume = useCallback(async () => {
    // Must be called from a click: the Fullscreen API rejects a request that
    // does not come from a user gesture.
    if (enforceFullscreen && !isFullscreen()) await requestFullscreen()
    setState(PROCTOR_STATE.RUNNING)
  }, [enforceFullscreen])

  const finish = useCallback(async () => {
    setState(PROCTOR_STATE.FINISHED)
    await exitFullscreen()
  }, [])

  // ── the clock ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (state !== PROCTOR_STATE.RUNNING) return undefined
    const id = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [state])

  useEffect(() => {
    if (!expired || expiredRef.current) return
    expiredRef.current = true
    setState(PROCTOR_STATE.FINISHED)
    exitFullscreen()
    onExpire?.()
  }, [expired, onExpire])

  // ── the three ways out ──────────────────────────────────────────────────
  useEffect(() => {
    if (state === PROCTOR_STATE.IDLE || state === PROCTOR_STATE.FINISHED) return undefined

    const pause = (reason) => {
      if (stateRef.current !== PROCTOR_STATE.RUNNING) return
      setState(PROCTOR_STATE.PAUSED)
      record(reason)
    }

    const onVisibility = () => { if (document.hidden) pause('left the tab') }
    const onBlur = () => pause('window lost focus')
    const onFullscreen = () => {
      if (enforceFullscreen && !isFullscreen()) pause('left fullscreen')
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', onBlur)
    document.addEventListener('fullscreenchange', onFullscreen)
    document.addEventListener('webkitfullscreenchange', onFullscreen)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', onBlur)
      document.removeEventListener('fullscreenchange', onFullscreen)
      document.removeEventListener('webkitfullscreenchange', onFullscreen)
    }
  }, [state, enforceFullscreen, record])

  // Closing the tab mid-exam loses the attempt, so say so. Browsers ignore the
  // custom string now and show their own wording; returnValue is what still
  // triggers the prompt at all.
  useEffect(() => {
    if (state !== PROCTOR_STATE.RUNNING && state !== PROCTOR_STATE.PAUSED) return undefined
    const onBeforeUnload = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [state])

  // Never leave the browser stuck in fullscreen if this unmounts mid-exam.
  useEffect(() => () => { exitFullscreen() }, [])

  return {
    state,
    started: state !== PROCTOR_STATE.IDLE,
    running: state === PROCTOR_STATE.RUNNING,
    paused: state === PROCTOR_STATE.PAUSED,
    finished: state === PROCTOR_STATE.FINISHED,
    remaining,
    elapsed,
    totalSeconds,
    violations,
    switchCount: violations.length,
    start,
    resume,
    finish,
  }
}

/** mm:ss, or h:mm:ss past an hour. */
export function formatClock(seconds) {
  if (seconds == null) return '—'
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`
}
