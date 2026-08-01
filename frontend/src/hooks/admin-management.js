import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/client'

// Admin lifecycle + RBAC (backend's app/routes/admin_management.py) — real,
// not scaffolding: other admins exist or are coming soon (per the project's
// own scoping decision), so this is the full create/edit/suspend/roles flow.

export function useAdmins() {
  return useQuery({
    queryKey: ['admins'],
    queryFn: () => api.get('/api/admin-management/admins'),
    staleTime: 15_000,
  })
}

export function useCreateAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body) => api.post('/api/admin-management/admins', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admins'] }),
  })
}

export function useUpdateAdmin(adminId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body) => api.patch(`/api/admin-management/admins/${adminId}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admins'] }),
  })
}

export function useSuspendAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (adminId) => api.post(`/api/admin-management/admins/${adminId}/suspend`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admins'] }),
  })
}

export function useActivateAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (adminId) => api.post(`/api/admin-management/admins/${adminId}/activate`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admins'] }),
  })
}

export function useResetAdminPassword(adminId) {
  return useMutation({
    mutationFn: (password) => api.post(`/api/admin-management/admins/${adminId}/reset-password`, { password }),
  })
}

export function useDeleteAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (adminId) => api.del(`/api/admin-management/admins/${adminId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admins'] }),
  })
}

export function usePermissionCatalog() {
  return useQuery({
    queryKey: ['permission-catalog'],
    queryFn: () => api.get('/api/admin-management/permissions'),
    staleTime: 5 * 60_000,
  })
}

export function useAdminRoles() {
  return useQuery({
    queryKey: ['admin-roles'],
    queryFn: () => api.get('/api/admin-management/roles'),
    staleTime: 15_000,
  })
}

export function useCreateAdminRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body) => api.post('/api/admin-management/roles', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-roles'] }),
  })
}

export function useUpdateAdminRole(roleId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body) => api.patch(`/api/admin-management/roles/${roleId}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-roles'] }),
  })
}

export function useDeleteAdminRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (roleId) => api.del(`/api/admin-management/roles/${roleId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-roles'] }),
  })
}

// `filters` may include: action, actor_role, target_type, search, since, until
export function useAdminAuditLog(limit = 100, filters = {}) {
  const params = new URLSearchParams({ limit: String(limit) })
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value)
  })
  return useQuery({
    queryKey: ['admin-audit-log', limit, filters],
    queryFn: () => api.get(`/api/admin-management/audit-log?${params.toString()}`),
    staleTime: 15_000,
  })
}
