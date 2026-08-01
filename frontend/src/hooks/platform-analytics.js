import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/client'

// Platform-wide/cohort analytics (backend's routes/platform_analytics.py) —
// distinct from analytics.js's per-user useAnalytics.
export function usePlatformAnalytics(days = 30) {
  return useQuery({
    queryKey: ['platform-analytics', days],
    queryFn: () => api.get(`/api/admin-management/analytics/platform?days=${days}`),
    staleTime: 60_000,
  })
}
