import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { api } from '../client'

// Enrollment hooks
export function useEnrollment(simId) {
  return useQuery({
    queryKey: ['enrollment', simId],
    queryFn: () => api.get(`/api/enrollments/by-sim/${simId}`),
    retry: false,
    staleTime: 30_000,
  })
}

export function useEnroll(simId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post(`/api/simulations/${simId}/enroll`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['enrollment', simId] })
      qc.invalidateQueries({ queryKey: ['my-assignment'] })
    },
  })
}

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

// Current task assigned by the simulation manager (for the Dashboard)
export function useMyAssignment() {
  return useQuery({
    queryKey: ['my-assignment'],
    queryFn: () => api.get('/api/my-assignment'),
    staleTime: 30_000,
  })
}

// Simulation onboarding experience (company, manager, projects, offer letter)
export function useOnboarding(simId) {
  return useQuery({
    queryKey: ['onboarding', simId],
    queryFn: () => api.get(`/api/simulations/${simId}/onboarding`),
    enabled: !!simId,
    staleTime: 60_000,
  })
}

export function useAcceptOnboarding(simId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post(`/api/simulations/${simId}/onboarding/accept`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['onboarding', simId] })
      qc.invalidateQueries({ queryKey: ['my-assignment'] })
      qc.invalidateQueries({ queryKey: ['badges'] })
    },
  })
}

// Badges earned by the current user (for the profile)
export function useUserBadges() {
  return useQuery({
    queryKey: ['badges'],
    queryFn: () => api.get('/api/users/me/badges'),
    staleTime: 60_000,
  })
}

export function useCompleteTask(enrollmentId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, score, quizScore, rubricRating }) =>
      api.post(`/api/enrollments/${enrollmentId}/tasks/${taskId}/complete`, {
        score,
        quizScore,
        rubricRating,
      }),
    onSuccess: (_, { taskId }) => {
      qc.invalidateQueries({ queryKey: ['enrollment'] })
      qc.invalidateQueries({ queryKey: ['skills'] })
      qc.invalidateQueries({ queryKey: ['agent-messages'] })
      qc.invalidateQueries({ queryKey: ['my-assignment'] })
    },
  })
}

// Skill GPS hooks
export function useSkillGPS(targetRole = 'junior_da') {
  return useQuery({
    queryKey: ['skill-gps', targetRole],
    queryFn: () => api.get(`/api/skill-gps?role=${targetRole}`),
    staleTime: 60_000,
  })
}

export function useUserSkills() {
  return useQuery({
    queryKey: ['skills'],
    queryFn: () => api.get('/api/users/me/skills'),
    staleTime: 30_000,
  })
}

// Agent messages (Manager notifications — reminders & deadlines)
export function useAgentMessages() {
  return useQuery({
    queryKey: ['agent-messages'],
    queryFn: () => api.get('/api/agent-messages'),
    refetchInterval: 30_000, // poll every 30s for new messages
  })
}

export function useMarkMessageRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.post(`/api/agent-messages/${id}/read`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agent-messages'] }),
  })
}

export function useMarkAllRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post('/api/agent-messages/read-all', {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agent-messages'] }),
  })
}

// Analytics hook
export function useAnalytics(period = 'week') {
  return useQuery({
    queryKey: ['analytics', period],
    queryFn: () => api.get(`/api/analytics?period=${period}`),
    staleTime: 60_000,
  })
}

// Admin hooks (superadmin only)
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

// Mentor hooks
export function useMentorStudents() {
  return useQuery({
    queryKey: ['mentor-students'],
    queryFn: () => api.get('/api/mentor/students'),
    staleTime: 30_000,
  })
}

export function useUnlockFeature() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ studentId, feature }) =>
      api.post(`/api/mentor/students/${studentId}/unlock`, { feature }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mentor-students'] }),
  })
}

export function useRevokeFeature() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ studentId, feature }) =>
      api.del(`/api/mentor/students/${studentId}/unlock/${feature}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mentor-students'] }),
  })
}
