import { useMutation } from '@tanstack/react-query'
import { api } from '../lib/client'

// Generic CMS-authored LLM-backed task types (ai_roleplay_chat, text_rubric's llm mode)
export function useRoleplayMessage(simId, taskIndex) {
  return useMutation({
    mutationFn: (body) => api.post(`/api/simulations/${simId}/tasks/${taskIndex}/roleplay-message`, body),
  })
}

export function useGradeText(simId, taskIndex) {
  return useMutation({
    mutationFn: (body) => api.post(`/api/simulations/${simId}/tasks/${taskIndex}/grade-text`, body),
  })
}
