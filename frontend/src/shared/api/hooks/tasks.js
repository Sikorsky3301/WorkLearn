import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../client'

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
      qc.invalidateQueries({ queryKey: ['my-assignments'] })
    },
  })
}
