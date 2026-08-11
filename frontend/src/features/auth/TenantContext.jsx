import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../../lib/client'

const TenantContext = createContext(null)

export function TenantProvider({ children }) {
  const [tenant, setTenant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    api.get('/api/tenant')
      .then((t) => {
        if (!cancelled) setTenant(t)
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || 'Unknown university subdomain')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-8">
        <div className="max-w-md text-center">
          <h1 className="text-lg font-bold text-on-surface mb-2">University not found</h1>
          <p className="text-sm text-on-surface-variant mb-4">
            {error || 'This subdomain is not linked to a partner university.'}
          </p>
          <a href="http://localhost:5173/login" className="text-sm font-semibold text-primary hover:underline">
            Go to WorkLearn Teaching Academy →
          </a>
        </div>
      </div>
    )
  }

  const isPartner = !tenant.is_default

  return (
    <TenantContext.Provider value={{ tenant, isPartner, loading, error }}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  const ctx = useContext(TenantContext)
  if (!ctx) throw new Error('useTenant must be used within TenantProvider')
  return ctx
}
