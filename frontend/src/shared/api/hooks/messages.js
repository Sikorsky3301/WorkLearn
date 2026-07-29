import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../client'

// Agent messages (Manager notifications — reminders & deadlines)
export function useAgentMessages() {
  return useQuery({
    queryKey: ['agent-messages'],
    queryFn: () => api.get('/api/agent-messages'),
    refetchInterval: 30_000, // poll every 30s for new messages
  })
}

export function useMarkMessageRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.post(`/api/agent-messages/${id}/read`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agent-messages'] }),
  })
}

export function useMarkAllRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post('/api/agent-messages/read-all', {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agent-messages'] }),
  })
}
