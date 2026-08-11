import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/client'

// Simulation CMS admin hooks — CRUD for Simulation/SimulationTask (backend's
// app/routes/admin_simulations.py). Currently require_superadmin-gated on the
// backend (see plan's Phase 1 boundary notes); simulations.* permission keys
// are seeded for Phase 2 to wire these up for the Admin tier without a
// schema change.

export function useAdminSimulations() {
  return useQuery({
    queryKey: ['admin-simulations'],
    queryFn: () => api.get('/api/admin/simulations'),
    staleTime: 10_000,
  })
}

export function useAdminSimulation(id) {
  return useQuery({
    queryKey: ['admin-simulation', id],
    queryFn: () => api.get(`/api/admin/simulations/${id}`),
    enabled: !!id,
  })
}

export function useSimulationTemplates() {
  return useQuery({
    queryKey: ['admin-sim-templates'],
    queryFn: () => api.get('/api/admin/simulation-templates'),
    staleTime: 60_000,
  })
}

export function useCreateSimulationFromTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ templateKey, id, title, slug }) =>
      api.post(`/api/admin/simulations/from-template/${templateKey}`, {
        slug: slug || id,
        title,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-simulations'] }),
  })
}

export function useCreateSimulation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body) => {
      const {
        id,
        status,
        tasks,
        created_at,
        updated_at,
        published_at,
        created_by,
        available_to_all_universities,
        university_ids,
        enrollment_count,
        task_count,
        ...rest
      } = body || {}
      return api.post('/api/admin/simulations', {
        ...rest,
        slug: rest.slug || id,
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-simulations'] }),
  })
}

export function useUpdateSimulation(id) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body) => {
      const {
        id: _id,
        status,
        tasks,
        created_at,
        updated_at,
        published_at,
        created_by,
        available_to_all_universities,
        university_ids,
        enrollment_count,
        task_count,
        ...rest
      } = body || {}
      // UI stores the public slug in `id` while creating; after load, numeric
      // id is separate from `slug`. Never send the integer PK as slug.
      const payload = { ...rest }
      if (typeof body?.id === 'string' && body.id && !payload.slug) {
        payload.slug = body.id
      }
      return api.patch(`/api/admin/simulations/${id}`, payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-simulation', id] })
      qc.invalidateQueries({ queryKey: ['admin-simulations'] })
    },
  })
}

export function usePublishSimulation(id) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body = {}) => api.post(`/api/admin/simulations/${id}/publish`, body || {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-simulation', id] })
      qc.invalidateQueries({ queryKey: ['admin-simulations'] })
    },
  })
}

export function usePatchPublishScope(id) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body) => api.patch(`/api/admin/simulations/${id}/publish-scope`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-simulation', id] })
      qc.invalidateQueries({ queryKey: ['admin-simulations'] })
    },
  })
}

export function useUnpublishSimulation(id) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post(`/api/admin/simulations/${id}/unpublish`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-simulation', id] })
      qc.invalidateQueries({ queryKey: ['admin-simulations'] })
    },
  })
}

export function useDeleteSimulation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.del(`/api/admin/simulations/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-simulations'] }),
  })
}

// Clears the block delete_simulation raises when a simulation still has
// enrollments — removes every student's enrollment (and their journey
// badge for this sim) in one call. Irreversible; the UI gates this behind
// its own explicit confirm naming the student count, same as delete.
export function useUnenrollAllStudents(id) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.del(`/api/admin/simulations/${id}/enrollments`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-simulations'] }),
  })
}

export function useDuplicateSimulation(id) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (newId) => api.post(`/api/admin/simulations/${id}/duplicate`, { new_slug: newId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-simulations'] }),
  })
}

export function useCreateTask(simId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body) => api.post(`/api/admin/simulations/${simId}/tasks`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-simulation', simId] }),
  })
}

export function useUpdateTask(simId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, ...body }) => api.patch(`/api/admin/simulations/${simId}/tasks/${taskId}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-simulation', simId] }),
  })
}

export function useDeleteTask(simId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (taskId) => api.del(`/api/admin/simulations/${simId}/tasks/${taskId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-simulation', simId] }),
  })
}

export function useDuplicateTask(simId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (taskId) => api.post(`/api/admin/simulations/${simId}/tasks/${taskId}/duplicate`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-simulation', simId] }),
  })
}

export function useReorderTasks(simId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (taskIds) => api.post(`/api/admin/simulations/${simId}/tasks/reorder`, { task_ids: taskIds }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-simulation', simId] }),
  })
}

export function usePreviewFullSimulation(simId) {
  return useQuery({
    queryKey: ['admin-sim-preview-full', simId],
    queryFn: () => api.get(`/api/admin/simulations/${simId}/preview-full`),
    enabled: !!simId,
  })
}

export function usePreviewRunSandbox(simId, taskId) {
  return useMutation({
    mutationFn: (code) => api.post(`/api/admin/simulations/${simId}/tasks/${taskId}/preview-run-sandbox`, { code }),
  })
}
