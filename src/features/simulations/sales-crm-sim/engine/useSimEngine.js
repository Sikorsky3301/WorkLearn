import { useEffect, useRef } from 'react'
import { useCompleteTask } from '../../../../shared/api/hooks'
import { useCrmSimStore } from '../store/useCrmSimStore'

// Ticks the in-simulation timer once a second while the attempt is active.
export function useSimTimer() {
  const status = useCrmSimStore((s) => s.status)
  const tick = useCrmSimStore((s) => s.tick)

  useEffect(() => {
    if (status !== 'in_progress') return
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [status, tick])
}

export function formatElapsed(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  const pad = (n) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

// Marks a stage complete locally (Zustand) and mirrors it to the existing
// enrollment/XP system on the backend (task_id = stage index, 1-8) — reuses
// the same POST /enrollments/:id/tasks/:taskId/complete the other two
// simulations use, so XP/skills/Skill-GPS all update for free.
export function useStageCompletion() {
  const enrollmentId = useCrmSimStore((s) => s.enrollmentId)
  const completeStage = useCrmSimStore((s) => s.completeStage)
  const completedStages = useCrmSimStore((s) => s.completedStages)
  const { mutate: completeTaskRemote } = useCompleteTask(enrollmentId)

  const completedRef = useRef(completedStages)
  completedRef.current = completedStages

  function completeStageIndex(index, { score } = {}) {
    if (completedRef.current.includes(index)) return
    completeStage(index)
    if (enrollmentId) {
      completeTaskRemote({ taskId: index, score: score ?? null, quizScore: null, rubricRating: null })
    }
  }

  return { completeStageIndex }
}
