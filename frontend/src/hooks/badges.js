import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/client'

// Badges earned by the current user (for the profile)
export function useUserBadges() {
  return useQuery({
    queryKey: ['badges'],
    queryFn: () => api.get('/api/users/me/badges'),
    staleTime: 60_000,
  })
}
