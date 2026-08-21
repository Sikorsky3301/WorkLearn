import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/client'

// Per-user analytics (backend's app/api/v1/analytics/analytics.py) — not
// platform-wide; platform/cohort analytics is a separate surface, see
// platform-analytics.js.

// The period options the backend actually implements.
//
// Fetched rather than hardcoded for the same reason the Skill GPS role list is:
// the old page offered week / month / all time from a literal in the component,
// and the backend honoured none of them — every period returned an identical
// payload. A selector whose options come from the server cannot drift away from
// what the server does.
export function useAnalyticsPeriods() {
  return useQuery({
    queryKey: ['analytics', 'periods'],
    queryFn: () => api.get('/api/analytics/periods'),
    staleTime: 30 * 60_000,
  })
}

export function useAnalytics(period) {
  return useQuery({
    queryKey: ['analytics', period],
    queryFn: () => api.get(`/api/analytics?period=${encodeURIComponent(period)}`),
    enabled: Boolean(period),
    staleTime: 60_000,
    // Keeps the previous period's data on screen while the next one loads, so
    // changing the period redraws in place instead of flashing the skeleton.
    placeholderData: (prev) => prev,
  })
}
