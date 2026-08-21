import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/client'

// The role catalog the Skill GPS is allowed to offer.
//
// This is fetched rather than hardcoded because the hardcoded list had drifted
// out of sync with the backend: it offered four Data Analyst tiers, two of
// which ("Mid-level DA", "Lead DA") had no benchmark on the server at all — the
// server quietly answered those with Junior DA's numbers under a different
// label — and it offered nothing at all for the Engineering or Sales
// simulations this platform ships. Serving the list makes that impossible.
//
// `recommended` is the role the student's own enrollment points at, so a
// frontend student no longer opens a page benchmarked against Data Analytics.
export function useSkillGpsRoles() {
  return useQuery({
    queryKey: ['skill-gps', 'roles'],
    queryFn: () => api.get('/api/skill-gps/roles'),
    staleTime: 30 * 60_000,   // product config; it does not change per session
  })
}

// Gap analysis. Database-speed — the server does no model call on this path.
// `targetRole` may be null while the catalog is still loading; the query stays
// disabled until there is a real role to ask about, so we never fire a request
// for a guessed default and then immediately refire for the right one.
export function useSkillGPS(targetRole) {
  return useQuery({
    queryKey: ['skill-gps', 'gaps', targetRole],
    queryFn: () => api.get(`/api/skill-gps?role=${encodeURIComponent(targetRole)}`),
    enabled: Boolean(targetRole),
    staleTime: 60_000,
  })
}

// The AI recommendations, deliberately a separate request from the gap
// analysis: this one waits on a model, and it used to be inline, which meant
// the entire page sat on a spinner for the length of a completion on every
// load and on every role switch. Now the analysis paints immediately and only
// this card shows a pending state.
export function useSkillGpsActions(targetRole) {
  return useQuery({
    queryKey: ['skill-gps', 'actions', targetRole],
    queryFn: () => api.get(`/api/skill-gps/next-actions?role=${encodeURIComponent(targetRole)}`),
    enabled: Boolean(targetRole),
    staleTime: 10 * 60_000,
    retry: false,             // the server already falls back; don't re-bill it
  })
}

// Every skill point the student has earned. Each row carries its own display
// label and category from the server, so pages no longer keep private copies
// of those maps that only covered the Data Analytics skills.
export function useUserSkills() {
  return useQuery({
    queryKey: ['skills'],
    queryFn: () => api.get('/api/users/me/skills'),
    staleTime: 30_000,
  })
}
