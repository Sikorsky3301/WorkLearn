import { useMutation } from '@tanstack/react-query'
import { api } from '../client'

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

// Sales CRM job simulation — AI-backed endpoints (grading, AI customer,
// final scoring). CRM entity data itself lives in the sim's own Zustand
// store (useCrmSimStore), not React Query — these hooks only cover the
// calls that need a real LLM.
export function useGradeEmail() {
  return useMutation({
    mutationFn: (body) => api.post('/api/crm-sim/grade-email', body),
  })
}

export function useAiCustomer() {
  return useMutation({
    mutationFn: (body) => api.post('/api/crm-sim/ai-customer', body),
  })
}

export function useFinalScore() {
  return useMutation({
    mutationFn: (body) => api.post('/api/crm-sim/final-score', body),
  })
}
