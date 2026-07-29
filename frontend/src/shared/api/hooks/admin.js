import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../client'

// User/university/activity management — backend's app/routes/admin.py.
// Each endpoint is permission-gated server-side (require_permission), so
// these hooks work for both SUPER_ADMIN and any ADMIN holding the matching
// permission — not superadmin-exclusive despite the historical name.

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/api/admin/stats'),
    staleTime: 30_000,
  })
}

export function useAdminUniversities() {
  return useQuery({
    queryKey: ['admin-universities'],
    queryFn: () => api.get('/api/admin/universities'),
    staleTime: 30_000,
  })
}

export function useAdminUsers(role = '', search = '') {
  return useQuery({
    queryKey: ['admin-users', role, search],
    queryFn: () => api.get(`/api/admin/users?role=${role}&search=${encodeURIComponent(search)}`),
    staleTime: 30_000,
  })
}

export function useAdminActivity() {
  return useQuery({
    queryKey: ['admin-activity'],
    queryFn: () => api.get('/api/admin/activity'),
    staleTime: 15_000,
  })
}

export function useUserEnrollments(userId) {
  return useQuery({
    queryKey: ['admin-user-enrollments', userId],
    queryFn: () => api.get(`/api/admin/users/${userId}/enrollments`),
    enabled: !!userId,
  })
}

export function useSuspendUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId) => api.post(`/api/admin/users/${userId}/suspend`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
    },
  })
}

export function useActivateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId) => api.post(`/api/admin/users/${userId}/activate`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId) => api.del(`/api/admin/users/${userId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
      qc.invalidateQueries({ queryKey: ['admin-activity'] })
    },
  })
}

export function useDeleteEnrollment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (enrollmentId) => api.del(`/api/admin/enrollments/${enrollmentId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-user-enrollments'] })
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
    },
  })
}
