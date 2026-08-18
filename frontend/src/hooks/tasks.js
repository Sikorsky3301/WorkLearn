import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/client'

// Full grading detail for one completed task — the roadmap's score breakdown.
// Deliberately its own request rather than part of the enrollment payload:
// `rubric_rating` carries every grader check plus captured stdout/stderr, and
// the enrollment query fires on the overview page, the shell and every
// enrollment check. `enabled` keeps it to the moment a drawer opens.
export function useTaskResult(enrollmentId, taskIndex, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['task-result', enrollmentId, taskIndex],
    queryFn: () => api.get(`/api/enrollments/${enrollmentId}/tasks/${taskIndex}/result`),
    enabled: enabled && !!enrollmentId && taskIndex != null,
    staleTime: 60_000,
  })
}

// Attach a post-task quiz score to a task that has already been graded.
//
// Needed because code_sandbox tasks had nowhere to record one: the sandbox
// awards server-side with quiz_score=null, and the client then skips the
// generic complete endpoint to avoid double-awarding XP — so the quiz result
// was silently dropped. This endpoint touches quiz_score only; it does not
// re-run award_task_completion.
export function useSubmitQuizScore(enrollmentId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ taskIndex, quizScore }) =>
      api.post(`/api/enrollments/${enrollmentId}/tasks/${taskIndex}/quiz-score`, {
        quiz_score: quizScore,
      }),
    onSuccess: (_data, { taskIndex }) => {
      qc.invalidateQueries({ queryKey: ['enrollment'] })
      qc.invalidateQueries({ queryKey: ['task-result', enrollmentId, taskIndex] })
    },
  })
}

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
