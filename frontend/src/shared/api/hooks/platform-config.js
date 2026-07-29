import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../client'

// Platform Configuration Center (SuperAdmin-only) — real, persisted config
// values for AI/Billing/Database. Not yet wired into live app behavior; see
// backend's app/models_platform_config.py for the full context.

export function usePlatformConfig(category) {
  return useQuery({
    queryKey: ['platform-config', category],
    queryFn: () => api.get(`/api/admin-management/config/${category}`),
    staleTime: 15_000,
  })
}

export function useSetPlatformConfig(category) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ key, value }) => api.put(`/api/admin-management/config/${category}/${key}`, { value }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['platform-config', category] }),
  })
}
