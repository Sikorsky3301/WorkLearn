import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/client'

// Server-graded assessments — the mini assessment after each task, and the
// 50-question final.
//
// Unlike the older `post_task_quiz` path, the answers are never sent to the
// browser: GET returns the questions with `correct` and `explanation` stripped
// server-side, and POST returns them only once the attempt has been submitted.
// So there is no client-side scoring here, and there must not be — the score
// this returns IS the score, and it is already recorded.

export function useAssessment(enrollmentId, taskIndex, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['assessment', enrollmentId, taskIndex],
    queryFn: () => api.get(`/api/enrollments/${enrollmentId}/tasks/${taskIndex}/assessment`),
    enabled: enabled && !!enrollmentId && taskIndex != null,
    // The questions are static content; only `previous_score` moves, and
    // submitting invalidates this key anyway.
    staleTime: 5 * 60_000,
    retry: false,
  })
}

export function useSubmitAssessment(enrollmentId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ taskIndex, answers }) =>
      api.post(`/api/enrollments/${enrollmentId}/tasks/${taskIndex}/assessment`, { answers }),
    onSuccess: (_data, { taskIndex }) => {
      qc.invalidateQueries({ queryKey: ['assessment', enrollmentId, taskIndex] })
      // The score lands on TaskCompletion.quiz_score, which the roadmap reads
      // out of the enrollment payload.
      qc.invalidateQueries({ queryKey: ['enrollment'] })
      qc.invalidateQueries({ queryKey: ['task-result'] })
      qc.invalidateQueries({ queryKey: ['skills'] })
      qc.invalidateQueries({ queryKey: ['agent-messages'] })
      // Submitting the FINAL assessment completes the simulation, which issues
      // the certificate and can grant badges server-side.
      qc.invalidateQueries({ queryKey: ['certificates'] })
      qc.invalidateQueries({ queryKey: ['badges'] })
    },
  })
}
