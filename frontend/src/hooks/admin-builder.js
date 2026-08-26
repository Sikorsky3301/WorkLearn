import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/client'

// What the Sim Builder is allowed to offer — grader keys, dataset keys, skill
// keys, languages and the house format — served from the registries that
// actually implement them (backend: api/v1/admin/admin_builder_catalog.py).
//
// The builder used to ask authors to TYPE a grader key into a free-text box.
// A typo saved cleanly, published cleanly, and then failed for the first
// student who pressed Submit. Anything the builder offers now comes from
// here, so it can only offer things that exist.
export function useBuilderCatalog() {
  return useQuery({
    queryKey: ['admin-builder-catalog'],
    queryFn: () => api.get('/api/admin/builder-catalog'),
    // Registries change on deploy, not during an editing session.
    staleTime: 5 * 60_000,
  })
}
