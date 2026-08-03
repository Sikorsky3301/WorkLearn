import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/client'

export function useCompleteTask(enrollmentId) {
  const qc = useQueryClient()
  return useMutation({
    // snake_case on the wire — the backend's CompleteTaskBody declares
    // `quiz_score`/`rubric_rating`, and Pydantic silently ignores unknown
    // extra keys rather than erroring. Sending camelCase meant both always
    // arrived as None: quiz scores were never persisted, and the >=80% quiz
    // bonus (QUIZ_BONUS_XP, see app/core/config.py) could never fire since
    // award_task_completion only ever saw quiz_score=None.
    mutationFn: ({ taskId, score, quizScore, rubricRating }) =>
      api.post(`/api/enrollments/${enrollmentId}/tasks/${taskId}/complete`, {
        score,
        quiz_score: quizScore,
        rubric_rating: rubricRating,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['enrollment'] })
      qc.invalidateQueries({ queryKey: ['skills'] })
      qc.invalidateQueries({ queryKey: ['agent-messages'] })
      qc.invalidateQueries({ queryKey: ['my-assignment'] })
      qc.invalidateQueries({ queryKey: ['my-assignments'] })
      // Finishing the final task issues the completion certificate and can
      // grant badges server-side — without these the just-earned credential
      // stays invisible until a hard refresh.
      qc.invalidateQueries({ queryKey: ['certificates'] })
      qc.invalidateQueries({ queryKey: ['badges'] })
    },
  })
}
