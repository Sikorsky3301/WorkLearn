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

/**
 * One page of users, straight from the server.
 *
 * Paging is SERVER-side now. It used to ask for a bare list capped at 100 and
 * page it in the browser, so on a platform with a thousand accounts an admin
 * saw the newest hundred, the pager read "1-10 of 100", and nothing said the
 * other nine hundred existed.
 *
 * `keepPreviousData` keeps the current page on screen while the next one
 * loads, so paging and typing do not flash the table back to its skeleton.
 *
 * Returns `{ users, total, limit, offset }`.
 */
export function useAdminUsers({ role = '', search = '', scope = '', limit = 50, offset = 0 } = {}) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
  if (role) params.set('role', role)
  if (scope) params.set('scope', scope)
  if (search) params.set('search', search)

  return useQuery({
    queryKey: ['admin-users', role, scope, search, limit, offset],
    queryFn: () => api.get(`/api/admin/users?${params.toString()}`),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  })
}

export function useAdminActivity(limit = 20) {
  return useQuery({
    queryKey: ['admin-activity', limit],
    queryFn: () => api.get(`/api/admin/activity?limit=${limit}`),
    staleTime: 15_000,
    placeholderData: (prev) => prev,
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
