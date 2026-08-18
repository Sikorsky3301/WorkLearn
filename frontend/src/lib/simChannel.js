// Cross-tab messaging for the simulation runtime.
//
// The sandbox runs in its own browser tab, so when it grades a task the tab
// that opened it — showing the roadmap or the task page — has no idea anything
// happened. This is the wire between them.
//
// `BroadcastChannel` rather than `window.opener.postMessage` because the
// opener may have been closed or navigated away, and because other tabs
// (dashboard, a second roadmap) should update too. It is opener-independent.
//
// IMPORTANT: handlers must be idempotent and purely local — invalidate a
// query, update local state. Two tabs can be listening, and both will run the
// handler for the same event. Anything that awards, posts or persists belongs
// server-side, on the path that produced the event.
//
// The zustand sim store uses `persist`, which does NOT sync across tabs, so
// this is also the only thing keeping an open roadmap's in-memory state
// honest. Even so, treat the server as the source of truth and let this
// trigger a refetch rather than trying to patch state by hand.
import { useEffect } from 'react'

const CHANNEL = 'wl-sim'

const supported = () => typeof BroadcastChannel !== 'undefined'

/** Announce something that happened in this tab. Safe to call anywhere. */
export function postSimEvent(event) {
  if (!supported()) return
  let bc
  try {
    bc = new BroadcastChannel(CHANNEL)
    bc.postMessage(event)
  } catch {
    // Nothing to do — subscribers fall back to refetch-on-focus.
  } finally {
    bc?.close()
  }
}

/**
 * Subscribe to sim events for the life of the component.
 *
 * Not a reliable delivery channel: unsupported browsers get nothing, and a tab
 * that was closed at the time misses the message entirely. Every consumer must
 * ALSO refetch on window focus so the UI converges regardless.
 */
export function useSimChannel(handler) {
  useEffect(() => {
    if (!supported()) return undefined
    let bc
    try {
      bc = new BroadcastChannel(CHANNEL)
    } catch {
      return undefined
    }
    const onMessage = (e) => handler(e.data)
    bc.addEventListener('message', onMessage)
    return () => {
      bc.removeEventListener('message', onMessage)
      bc.close()
    }
  }, [handler])
}

export const SIM_EVENT = {
  TASK_GRADED: 'task-graded',
  // Posted by the workbench once it has a session, the task, and Monaco
  // mounted — i.e. the moment the sandbox is genuinely usable. The task page
  // waits on this to clear its "Opening…" state, so the wait is as long as the
  // load actually took rather than a guessed duration.
  SANDBOX_READY: 'sandbox-ready',
}
