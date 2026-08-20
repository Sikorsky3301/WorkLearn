const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

// localStorage — one session for the whole origin (every tab, and after a
// browser restart) until logout or JWT expiry. All tabs share the same
// account; you cannot stay signed in as student in one tab and admin in
// another.
export function getToken() {
  return localStorage.getItem('wl_token')
}

export function setToken(token) {
  localStorage.setItem('wl_token', token)
}

export function clearToken() {
  localStorage.removeItem('wl_token')
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    'X-WorkLearn-Host': window.location.host,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  // Only treat a 401 as "your session expired" when a token was actually
  // attached to this request — a login/register call is unauthenticated by
  // definition, so a wrong-password 401 from /api/auth/login/* must NOT
  // trigger this: it should surface as a normal inline form error instead of
  // wiping (harmless) state and hard-redirecting mid-login.
  if (res.status === 401 && token) {
    clearToken()
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    const detail = err.detail ?? err.error ?? 'Request failed'
    if (typeof detail === 'string') throw new Error(detail)
    if (Array.isArray(detail)) {
      const msg = detail
        .map((d) => (d?.loc ? `${d.loc.filter((x) => x !== 'body').join('.')}: ${d.msg}` : d?.msg || JSON.stringify(d)))
        .join('; ')
      throw new Error(msg || 'Validation failed')
    }
    throw new Error(JSON.stringify(detail))
  }

  // SSE responses — caller handles the stream directly
  if (res.headers.get('content-type')?.includes('text/event-stream')) return res

  return res.json()
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  del: (path) => request(path, { method: 'DELETE' }),
}

// Uploads an image (multipart) for the Simulation CMS (company logos,
// manager photos). No 'Content-Type' header — the browser sets the
// multipart boundary itself when the body is a FormData instance.
export async function uploadImage(file) {
  const token = getToken()
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${BASE_URL}/api/admin/uploads/image`, {
    method: 'POST',
    headers: {
      'X-WorkLearn-Host': window.location.host,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.detail ?? err.error ?? 'Upload failed')
  }
  return res.json()
}

// Generic multipart upload — same pattern as uploadImage above, parameterised
// by endpoint so profile photo/resume uploads (which aren't gated by
// simulations.edit, unlike the CMS's image upload) can reuse it.
export async function uploadFile(path, file) {
  const token = getToken()
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'X-WorkLearn-Host': window.location.host,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.detail ?? err.error ?? 'Upload failed')
  }
  return res.json()
}

/** Multipart POST with optional extra form fields (e.g. bulk provision university_id). */
export async function uploadForm(path, formData) {
  const token = getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'X-WorkLearn-Host': window.location.host,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    const detail = err.detail ?? err.error ?? 'Upload failed'
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail))
  }
  return res.json()
}

/** Authenticated GET that returns a Blob (Excel template downloads). */
export async function downloadBlob(path, { defaultFilename = 'download.xlsx' } = {}) {
  const token = getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'X-WorkLearn-Host': window.location.host,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.detail ?? err.error ?? 'Download failed')
  }
  const raw = await res.blob()
  // Force spreadsheet MIME so the OS doesn't treat it as a generic .bin
  const blob = new Blob([raw], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const disposition = res.headers.get('Content-Disposition') || ''
  const match = disposition.match(/filename\*?=(?:UTF-8''|")?([^\";]+)"?/i)
  let filename = match?.[1] ? decodeURIComponent(match[1].replace(/['"]/g, '')) : defaultFilename
  if (!/\.xlsx$/i.test(filename)) {
    filename = defaultFilename.endsWith('.xlsx') ? defaultFilename : `${filename.replace(/\.[^.]+$/, '') || 'template'}.xlsx`
  }
  return { blob, filename }
}

// Backend-uploaded images (logo_url/photo_url) are stored as paths relative
// to the API origin (e.g. "/static/uploads/xyz.png"), not the frontend's own
// origin — resolve them against BASE_URL so <img src> doesn't 404 against
// the Vite dev server. Already-absolute URLs (http(s)://...) pass through
// unchanged, so admin-pasted external image URLs keep working too.
export function resolveMediaUrl(url) {
  if (!url) return url
  if (/^https?:\/\//i.test(url)) return url
  return `${BASE_URL}${url}`
}

// Saves a file the backend serves as an attachment (Content-Disposition) to
// the user's machine. Needs a raw fetch (not `request`/`api.get`) since the
// response is a file blob, not JSON — but still needs the auth header.
export async function downloadFile(path, filename) {
  const token = getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? err.error ?? 'Download failed')
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// Streaming SSE helper for AI Mentor chat. `signal` (an AbortController's
// .signal) lets the caller stop reading mid-stream — see CareerTwin's Stop
// button. Aborting rejects the in-flight fetch/reader read with a
// DOMException named "AbortError", which the caller distinguishes from a
// real failure. The final `message_id` the server sends right before
// [DONE] is threaded through to `onDone(meta)` so the UI can attach
// feedback (thumbs up/down) to the exact MentorChatMessage row.
export async function streamChat({ message, conversationHistory, context, onChunk, onDone, signal }) {
  const token = getToken()
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message, conversation_history: conversationHistory, context }),
    signal,
  })

  if (!res.ok) throw new Error('Chat request failed')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let messageId = null

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value)
    const lines = chunk.split('\n')

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (data === '[DONE]') { onDone?.({ messageId }); return }
      let parsed
      try { parsed = JSON.parse(data) } catch { continue }
      if (parsed.error) throw new Error(parsed.error)
      if (parsed.text) onChunk(parsed.text)
      if (parsed.message_id) messageId = parsed.message_id
    }
  }
  onDone?.({ messageId })
}
