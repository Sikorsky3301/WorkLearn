import { describe, it, expect, vi, afterEach } from 'vitest'

// The client's fetch wrapper is the only place that can tell "the server said
// no" apart from "there was no server" — after that, both are just a string.
// These tests pin the distinction, because losing it is what put the browser's
// raw "Failed to fetch" in front of a user who then went and checked their
// password.

async function importClient() {
  vi.resetModules()
  return import('../../../lib/client')
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function stubStorage() {
  vi.stubGlobal('sessionStorage', {
    getItem: () => null, setItem: () => {}, removeItem: () => {},
  })
  vi.stubGlobal('window', { location: { host: 'localhost:5173' } })
  // The technical diagnosis is deliberately logged rather than shown; silence
  // it so a passing run isn't full of red.
  vi.spyOn(console, 'error').mockImplementation(() => {})
}

describe('api client error classification', () => {
  it('turns an unreachable server into an actionable message, not "Failed to fetch"', async () => {
    stubStorage()
    vi.stubGlobal('navigator', { onLine: true })
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    const { api } = await importClient()
    const err = await api.post('/api/auth/login', {}).catch((e) => e)

    expect(err.isNetworkError).toBe(true)
    expect(err.message).not.toContain('Failed to fetch')
    expect(err.message).toMatch(/can't reach worklearn/i)
    // Written for the person signing in: no hostname, no port, nothing about
    // servers or APIs. That diagnosis goes to the console instead.
    expect(err.message).not.toMatch(/localhost|http|api|backend|server/i)
    // The original is kept for debugging rather than discarded.
    expect(err.cause).toBeInstanceOf(TypeError)
  })

  it('says you are offline when the browser knows you are', async () => {
    stubStorage()
    vi.stubGlobal('navigator', { onLine: false })
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    const { api } = await importClient()
    const err = await api.get('/api/anything').catch((e) => e)

    expect(err.isNetworkError).toBe(true)
    expect(err.message).toMatch(/not connected to the internet/i)
  })

  it('logs the technical detail for whoever can act on it', async () => {
    stubStorage()
    vi.stubGlobal('navigator', { onLine: true })
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    const { api } = await importClient()
    await api.post('/api/auth/login', {}).catch(() => {})

    // eslint-disable-next-line no-console
    const [logged] = console.error.mock.calls[0]
    expect(logged).toMatch(/backend/i)
    expect(logged).toMatch(/VITE_API_URL/)
  })

  it('leaves a real HTTP failure alone and marks it as not a network error', async () => {
    stubStorage()
    vi.stubGlobal('navigator', { onLine: true })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      headers: { get: () => 'application/json' },
      json: async () => ({ detail: 'Invalid email or password.' }),
    }))

    const { api } = await importClient()
    const err = await api.post('/api/auth/login', {}).catch((e) => e)

    expect(err.isNetworkError).toBeUndefined()
    expect(err.status).toBe(401)
    expect(err.message).toBe('Invalid email or password.')
  })
})
