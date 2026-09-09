import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/client'

// Class Mentor (features/mentor/) — university-scoped roster

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

// ── AI Mentor (features/ai-mentor/) — domain-aware topic chips ──────────────
// Message feedback (thumbs up/down) is submitted via a plain api.patch() call
// inside useMentorChat.js instead of a react-query mutation — it's local
// chat state, not cached server data.

export function useMentorTopics() {
  return useQuery({
    queryKey: ['mentor-topics'],
    queryFn: () => api.get('/api/mentor/topics'),
    staleTime: 60_000,
  })
}

// Dedicated AI Mentor settings — the mentor's target role (auto-derived from
// enrollment unless explicitly overridden here, see effective_target_role()
// on the backend) and conversation-history management.
export function useMentorSettings() {
  return useQuery({
    queryKey: ['mentor-settings'],
    queryFn: () => api.get('/api/mentor/settings'),
    staleTime: 0,
  })
}

export function useUpdateMentorSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (targetRole) => api.patch('/api/mentor/settings', { target_role: targetRole }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mentor-settings'] }),
  })
}

export function useClearMentorHistory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.del('/api/chat/history'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mentor-settings'] })
      qc.invalidateQueries({ queryKey: ['mentor-sessions'] })
    },
  })
}

// Multi-chat support — the sidebar's list of a student's separate
// conversation threads with the mentor. Sessions are created lazily, on a
// chat's first message (see useMentorChat's sendMessage), not by an explicit
// "create" call here — that's what keeps an abandoned "New Chat" click from
// leaving a phantom empty thread in this list.
export function useMentorSessions() {
  return useQuery({
    queryKey: ['mentor-sessions'],
    queryFn: () => api.get('/api/mentor/sessions'),
    staleTime: 10_000,
  })
}

export function useRenameMentorSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, title }) => api.patch(`/api/mentor/sessions/${sessionId}`, { title }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mentor-sessions'] }),
  })
}

export function useDeleteMentorSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sessionId) => api.del(`/api/mentor/sessions/${sessionId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mentor-sessions'] }),
  })
}
