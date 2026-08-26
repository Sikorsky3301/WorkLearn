import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '../lib/client'

// Standalone practice sandboxes — see backend/app/api/v1/simulations/playground.py.
//
// The catalogue is fetched, never hardcoded here. Which sandboxes exist is a
// property of which container images are built, and only the backend knows
// that; a list written into the page drifts the moment an image is added or
// removed and nothing reports it. `available: false` entries are real —
// they're listed so the page can show what's coming without offering a button
// that would 503.
export function useSandboxes() {
  return useQuery({
    queryKey: ['playground', 'sandboxes'],
    queryFn: () => api.get('/api/playground/sandboxes'),
    staleTime: 30 * 60_000,
  })
}

// One sandbox, including its starter code — withheld from the list response
// because the catalogue renders cards, not editors.
export function useSandbox(key) {
  return useQuery({
    queryKey: ['playground', 'sandbox', key],
    queryFn: () => api.get(`/api/playground/sandboxes/${encodeURIComponent(key)}`),
    enabled: Boolean(key),
    staleTime: 30 * 60_000,
  })
}

// A run is a mutation, not a query: it has a side effect (a container starts),
// it must never be cached, and it must never be re-fired on a refocus.
export function useRunSandbox() {
  return useMutation({
    mutationFn: ({ sandbox, code }) => api.post('/api/playground/run', { sandbox, code }),
  })
}
