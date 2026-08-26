import { Navigate, useParams } from 'react-router-dom'

/**
 * Keeps the builder's old URLs working after it moved under `/content`.
 *
 * The Sim Builder used to be reachable from two unrelated places: the CMS
 * editor at `/admin/simulations/:id` (a detail view of the Simulations table)
 * and the block-project tool at `/admin/sim-builder/:id`. Both are now under
 * `/admin/content/sim-builder`, which is where the nav points and where the
 * new-tab handoff lands.
 *
 * These paths are in people's bookmarks, in browser history, and in whatever
 * links have already been shared — so they redirect rather than 404. `replace`
 * keeps the dead URL out of history, so Back goes where the user came from
 * instead of bouncing through the redirect again.
 *
 * `to` is a function of the route params, because `<Navigate to="…/:id">` does
 * not interpolate — it would send the literal string ":id".
 */
export default function LegacyBuilderRedirect({ to }) {
  const params = useParams()
  return <Navigate to={to(params)} replace />
}
