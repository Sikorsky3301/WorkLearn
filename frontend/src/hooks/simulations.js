import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/client'

// All available job simulations — single source of truth (backend
// SIMULATIONS list in app/routes/enrollments.py), so the Dashboard and
// simulation-browsing pages never need a second, hand-maintained copy.
export function useSimulations() {
  return useQuery({
    queryKey: ['simulations'],
    queryFn: () => api.get('/api/simulations'),
    staleTime: 5 * 60_000,
  })
}

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
      qc.invalidateQueries({ queryKey: ['my-assignments'] })
    },
  })
}

// Current task assigned by the simulation manager, most-recent enrollment only.
export function useMyAssignment() {
  return useQuery({
    queryKey: ['my-assignment'],
    queryFn: () => api.get('/api/my-assignment'),
    staleTime: 30_000,
  })
}

// One manager/task summary per enrolled simulation — what the Dashboard uses
// so a student running multiple job simulations sees every manager at once.
export function useMyAssignments() {
  return useQuery({
    queryKey: ['my-assignments'],
    queryFn: () => api.get('/api/my-assignments'),
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
      qc.invalidateQueries({ queryKey: ['my-assignments'] })
      qc.invalidateQueries({ queryKey: ['badges'] })
    },
  })
}

// Generic CMS-authored simulation runtime — full sim+tasks definition, plus
// the two LLM-backed task types (ai_roleplay_chat, text_rubric's llm mode).
// Quiz/structured_form/crm_workspace/code_sandbox completion all go through
// useCompleteTask (tasks.js) / useSubmitSandbox (sandbox.js) — unchanged.
export function useSimulationFull(slug) {
  return useQuery({
    queryKey: ['simulation-full', slug],
    queryFn: () => api.get(`/api/simulations/${slug}/full`),
    enabled: !!slug,
    staleTime: 60_000,
  })
}
