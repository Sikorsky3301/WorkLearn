// Turning a failed submission into something a student can act on.
//
// This exists because the workbench used to render one sentence — "Couldn't
// reach the grader. Check your connection and try again." — for every possible
// failure. A 500, an expired session, a missing sandbox config and a genuinely
// dropped connection all looked identical, so neither the student nor anyone
// debugging it could tell what had actually happened.
//
// Note what is NOT an error here: the container hitting its time limit still
// returns HTTP 200, with score 0 and `details.error` explaining that no
// output.json was produced. That is a *grading result*, not a transport
// failure, and it is reported by the feedback callout rather than here.
// Conflating the two is what made the original message so misleading.

/**
 * @param {Error & {status?: number}} error  from lib/client.js
 * @returns {{title: string, detail: string, canRetry: boolean, status: number|null}}
 */
export function describeSubmitError(error) {
  const status = error?.status ?? null
  const serverDetail = error?.message && error.message !== 'Request failed' ? error.message : null

  // fetch() rejects with a TypeError when the request never completed —
  // offline, server down, request aborted by a navigation or the tab
  // sleeping. This is the only case where "check your connection" is honest.
  if (status === null) {
    return {
      status: null,
      title: 'Couldn’t reach the grader',
      detail: 'The request didn’t complete — you may be offline, or the tab was interrupted mid-run. Your code is still here; try again.',
      canRetry: true,
    }
  }

  if (status === 401 || status === 403) {
    return {
      status,
      title: 'Your session expired',
      detail: 'Copy your code somewhere safe, then reopen the sandbox from the task page to sign back in.',
      canRetry: false,
    }
  }

  if (status === 404) {
    return {
      status,
      title: 'No sandbox configured for this task',
      detail: serverDetail || 'The server has no grader set up for this task. This is a configuration problem, not something you can fix from here.',
      canRetry: false,
    }
  }

  if (status === 400 || status === 422) {
    return {
      status,
      title: 'The grader rejected the submission',
      detail: serverDetail || 'Your submission was empty or malformed.',
      canRetry: true,
    }
  }

  if (status >= 500) {
    return {
      status,
      title: 'The grader failed to run',
      detail: serverDetail
        ? `Server error: ${serverDetail}`
        : 'Something broke on the server while running your code — usually the sandbox container failing to start. Worth retrying; if it keeps happening it needs looking at server-side.',
      canRetry: true,
    }
  }

  return {
    status,
    title: 'Submission failed',
    detail: serverDetail || `The server responded with ${status}.`,
    canRetry: true,
  }
}
