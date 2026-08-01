import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/client'

// Per-user analytics (backend's app/routes/analytics.py) — not platform-wide;
// platform/cohort analytics ships Phase 2, see admin.js's useAdminStats for
// the small set of platform-wide numbers that already exist today.
export function useAnalytics(period = 'week') {
  return useQuery({
    queryKey: ['analytics', period],
    queryFn: () => api.get(`/api/analytics?period=${period}`),
    staleTime: 60_000,
  })
}
