import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { api } from '../client'

// Submit code (or text, for the executive brief) to the server sandbox for
// grading — the server runs it in Docker and grades the produced artifact.
export function useSubmitSandbox(enrollmentId, taskId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body) => api.post(`/api/sandbox/${enrollmentId}/tasks/${taskId}/submit`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['enrollment'] })
      qc.invalidateQueries({ queryKey: ['skills'] })
      qc.invalidateQueries({ queryKey: ['my-assignment'] })
      qc.invalidateQueries({ queryKey: ['sandbox-files', enrollmentId, taskId] })
    },
  })
}

// Directory listing for the sandbox's Explorer sidebar (submission.py always
// present; dataset.csv / output.* included with real previewable content).
export function useSandboxFiles(enrollmentId, taskId) {
  return useQuery({
    queryKey: ['sandbox-files', enrollmentId, taskId],
    queryFn: () => api.get(`/api/sandbox/${enrollmentId}/tasks/${taskId}/files`),
    enabled: !!enrollmentId && !!taskId,
    staleTime: 10_000,
  })
}

// Full, paginated rows for a CSV file (dataset.csv can be ~9,600 rows — the
// Explorer's inline preview from useSandboxFiles only ever shows the first 10).
export function useSandboxFileRows(enrollmentId, taskId, filename, page, pageSize = 50) {
  return useQuery({
    queryKey: ['sandbox-file-rows', enrollmentId, taskId, filename, page, pageSize],
    queryFn: () => api.get(`/api/sandbox/${enrollmentId}/tasks/${taskId}/files/${filename}/rows?page=${page}&page_size=${pageSize}`),
    enabled: !!enrollmentId && !!taskId && !!filename,
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  })
}
