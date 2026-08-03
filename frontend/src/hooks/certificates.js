import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/client'

// Completion certificates earned by the current user. Read-only by design —
// certificates are issued server-side when a simulation is fully completed
// (see backend app/services/certificates.py), never created from the client.
export function useUserCertificates() {
  return useQuery({
    queryKey: ['certificates'],
    queryFn: () => api.get('/api/users/me/certificates'),
    staleTime: 60_000,
  })
}
