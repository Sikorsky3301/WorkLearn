import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/client'

// ── Class Mentor (features/mentor/ClassMentor.jsx) — a mentor's own roster ──

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
