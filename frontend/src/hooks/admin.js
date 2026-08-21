import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, uploadForm, downloadBlob } from '../lib/client'

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

export function useAdminUniversities(options = {}) {
  return useQuery({
    queryKey: ['admin-universities'],
    queryFn: () => api.get('/api/admin/universities'),
    staleTime: 30_000,
    ...options,
  })
}

export function useOnboardUniversity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body) => api.post('/api/admin/universities/onboard', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-universities'] })
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
    },
  })
}

export function useUpdateUniversity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name, logo_url }) => {
      const body = { name }
      if (logo_url !== undefined) body.logo_url = logo_url || null
      return api.patch(`/api/admin/universities/${id}`, body)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-universities'] })
    },
  })
}

export function useProvisionUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body) => api.post('/api/admin/provision/users', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      qc.invalidateQueries({ queryKey: ['admin-universities'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
    },
  })
}

export function useBulkProvisionUsers() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ file }) => {
      const formData = new FormData()
      formData.append('file', file)
      return uploadForm('/api/admin/provision/users/bulk', formData)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      qc.invalidateQueries({ queryKey: ['admin-universities'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
    },
  })
}

export async function downloadProvisionTemplate() {
  const { blob, filename } = await downloadBlob('/api/admin/provision/users/bulk/template', {
    defaultFilename: 'worklearn_bulk_template.xlsx',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.xlsx') ? filename : 'worklearn_bulk_template.xlsx'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
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

export function useSetTeacherCmsAccess() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, enabled }) => api.put(`/api/admin/users/${userId}/cms-access`, { enabled }),
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
