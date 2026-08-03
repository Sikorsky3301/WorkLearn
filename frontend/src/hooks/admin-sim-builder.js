import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/client'

// Sim Builder (separate from the job-sim CMS in admin-simulations.js — see
// src/features/builder/sim-builder/)

export function useSimBuilderProjects() {
  return useQuery({
    queryKey: ['sim-builder-projects'],
    queryFn: () => api.get('/api/admin/sim-builder'),
    staleTime: 10_000,
  })
}

export function useSimBuilderProject(id) {
  return useQuery({
    queryKey: ['sim-builder-project', id],
    queryFn: () => api.get(`/api/admin/sim-builder/${id}`),
    enabled: !!id,
  })
}

export function useCreateSimBuilderProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body) => api.post('/api/admin/sim-builder', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sim-builder-projects'] }),
  })
}

export function useDeleteSimBuilderProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (projectId) => api.del(`/api/admin/sim-builder/${projectId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sim-builder-projects'] }),
  })
}

export function usePublishSimBuilderProject(projectId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post(`/api/admin/sim-builder/${projectId}/publish`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sim-builder-project', projectId] })
      qc.invalidateQueries({ queryKey: ['sim-builder-projects'] })
      qc.invalidateQueries({ queryKey: ['sim-builder-versions', projectId] })
    },
  })
}

export function useCreateSimBuilderPage(projectId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body) => api.post(`/api/admin/sim-builder/${projectId}/pages`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sim-builder-project', projectId] }),
  })
}

export function useDeleteSimBuilderPage(projectId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (pageId) => api.del(`/api/admin/sim-builder/${projectId}/pages/${pageId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sim-builder-project', projectId] }),
  })
}

export function useReorderSimBuilderPages(projectId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (pageIds) => api.post(`/api/admin/sim-builder/${projectId}/pages/reorder`, { page_ids: pageIds }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sim-builder-project', projectId] }),
  })
}

// pageId is a call-time argument (not bound at hook-creation time) so these
// can target any page in the project — needed for undo/redo of a page
// delete, which recreates blocks onto a fresh page id.
export function useCreateSimBuilderBlock(projectId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ pageId, ...body }) => api.post(`/api/admin/sim-builder/${projectId}/pages/${pageId}/blocks`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sim-builder-project', projectId] }),
  })
}

export function useUpdateSimBuilderBlock(projectId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ pageId, blockId, config }) => api.patch(`/api/admin/sim-builder/${projectId}/pages/${pageId}/blocks/${blockId}`, { config }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sim-builder-project', projectId] }),
  })
}

export function useDeleteSimBuilderBlock(projectId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ pageId, blockId }) => api.del(`/api/admin/sim-builder/${projectId}/pages/${pageId}/blocks/${blockId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sim-builder-project', projectId] }),
  })
}

export function useReorderSimBuilderBlocks(projectId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ pageId, blockIds }) => api.post(`/api/admin/sim-builder/${projectId}/pages/${pageId}/blocks/reorder`, { block_ids: blockIds }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sim-builder-project', projectId] }),
  })
}

export function useSimBuilderVersions(projectId) {
  return useQuery({
    queryKey: ['sim-builder-versions', projectId],
    queryFn: () => api.get(`/api/admin/sim-builder/${projectId}/versions`),
    enabled: !!projectId,
  })
}

export function useRestoreSimBuilderVersion(projectId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (versionId) => api.post(`/api/admin/sim-builder/${projectId}/versions/${versionId}/restore`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sim-builder-project', projectId] }),
  })
}

export function useAiGenerateSimBuilder(projectId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (prompt) => api.post(`/api/admin/sim-builder/${projectId}/ai-generate`, { prompt }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sim-builder-project', projectId] }),
  })
}
