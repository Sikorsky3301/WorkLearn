import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../client'

// Real, DB-backed feature flags (app/routes/feature_flags.py) — replaces
// the old hardcoded ROLE_FEATURES map. Admin-facing CRUD lives here;
// `feature_flags` resolved for the CURRENT user comes back on every
// login/`/me` response instead (see useAuth's `user.feature_flags`).

export function useFeatureFlags() {
  return useQuery({
    queryKey: ['feature-flags'],
    queryFn: () => api.get('/api/admin-management/feature-flags'),
    staleTime: 15_000,
  })
}

export function useCreateFeatureFlag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body) => api.post('/api/admin-management/feature-flags', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feature-flags'] }),
  })
}

export function useUpdateFeatureFlag(key) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body) => api.patch(`/api/admin-management/feature-flags/${key}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feature-flags'] }),
  })
}

export function useDeleteFeatureFlag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (key) => api.del(`/api/admin-management/feature-flags/${key}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feature-flags'] }),
  })
}

export function useFlagOverrides(key) {
  return useQuery({
    queryKey: ['feature-flag-overrides', key],
    queryFn: () => api.get(`/api/admin-management/feature-flags/${key}/overrides`),
    enabled: !!key,
  })
}

export function useSetFlagOverride(key) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body) => api.put(`/api/admin-management/feature-flags/${key}/overrides`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feature-flag-overrides', key] })
      qc.invalidateQueries({ queryKey: ['feature-flags'] })
    },
  })
}

export function useDeleteFlagOverride(key) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (overrideId) => api.del(`/api/admin-management/feature-flags/${key}/overrides/${overrideId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feature-flag-overrides', key] })
      qc.invalidateQueries({ queryKey: ['feature-flags'] })
    },
  })
}
