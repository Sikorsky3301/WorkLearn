import { useQuery } from '@tanstack/react-query'
import { api } from '../client'

// Badges earned by the current user (for the profile)
export function useUserBadges() {
  return useQuery({
    queryKey: ['badges'],
    queryFn: () => api.get('/api/users/me/badges'),
    staleTime: 60_000,
  })
}
