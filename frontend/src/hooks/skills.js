import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/client'

export function useSkillGPS(targetRole = 'junior_da') {
  return useQuery({
    queryKey: ['skill-gps', targetRole],
    queryFn: () => api.get(`/api/skill-gps?role=${targetRole}`),
    staleTime: 60_000,
  })
}

export function useUserSkills() {
  return useQuery({
    queryKey: ['skills'],
    queryFn: () => api.get('/api/users/me/skills'),
    staleTime: 30_000,
  })
}
