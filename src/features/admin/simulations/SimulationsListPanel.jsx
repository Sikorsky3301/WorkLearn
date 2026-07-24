import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus } from 'lucide-react'
import { useAdminSimulations, usePublishSimulation, useUnpublishSimulation, useDeleteSimulation } from '../../../shared/api/hooks'

/** Simulations tab inside SuperAdmin.jsx — list/search/publish/delete. The
 * builder itself is a dedicated route (/admin/simulations/:id), not nested
 * here — see SimulationBuilder.jsx. */
export default function SimulationsListPanel() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { data, isLoading } = useAdminSimulations()
  const deleteSim = useDeleteSimulation()

  const sims = (data?.simulations ?? []).filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase()) || s.domain?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search simulations…"
            className="input pl-9"
          />
        </div>
        <button
          onClick={() => navigate('/admin/simulations/new')}
          className="flex items-center gap-1.5 text-sm font-semibold text-white bg-primary hover:bg-primary-dark px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> New Simulation
        </button>
      </div>

      {isLoading ? (
        <div className="card shadow-sm"><div className="h-40 bg-surface-high rounded animate-pulse" /></div>
      ) : sims.length === 0 ? (
        <div className="card shadow-sm text-center py-12">
          <p className="text-sm text-on-surface-variant">No simulations found.</p>
        </div>
      ) : (
        <div className="card shadow-sm p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-low border-b border-border">
              <tr>
                {['Title', 'Domain', 'Status', 'Tasks', 'Updated', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {sims.map((s) => (
                <SimRow key={s.id} sim={s} onEdit={() => navigate(`/admin/simulations/${s.id}`)} deleteSim={deleteSim} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function SimRow({ sim, onEdit, deleteSim }) {
  const publish = usePublishSimulation(sim.id)
  const unpublish = useUnpublishSimulation(sim.id)
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <tr className="hover:bg-surface-low transition-colors">
      <td className="px-4 py-3 font-medium text-on-surface">{sim.title}</td>
      <td className="px-4 py-3 text-xs text-on-surface-variant">{sim.domain}</td>
      <td className="px-4 py-3">
        <span className={`chip text-[10px] ${sim.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-high text-on-surface-variant'}`}>
          {sim.status}
        </span>
      </td>
      <td className="px-4 py-3 text-on-surface-variant tabular-nums">{sim.task_count}</td>
      <td className="px-4 py-3 text-xs text-outline">{new Date(sim.updated_at).toLocaleDateString()}</td>
      <td className="px-4 py-3 text-right whitespace-nowrap">
        <button onClick={onEdit} className="text-xs font-semibold text-primary hover:underline mr-3">Edit</button>
        {sim.status === 'PUBLISHED' ? (
          <button onClick={() => unpublish.mutate()} disabled={unpublish.isPending} className="text-xs font-semibold text-on-surface-variant hover:text-on-surface mr-3">
            Unpublish
          </button>
        ) : (
          <button onClick={() => publish.mutate()} disabled={publish.isPending || sim.task_count === 0} className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 mr-3 disabled:opacity-40">
            Publish
          </button>
        )}
        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)} className="text-xs font-semibold text-red-500 hover:text-red-700">Delete</button>
        ) : (
          <span className="inline-flex items-center gap-1.5">
            <button
              onClick={() => deleteSim.mutate(sim.id, { onError: () => alert('Cannot delete — this simulation has existing enrollments.') })}
              className="text-xs font-semibold text-white bg-red-600 px-2 py-0.5 rounded"
            >
              Confirm
            </button>
            <button onClick={() => setConfirmDelete(false)} className="text-xs text-outline">Cancel</button>
          </span>
        )}
      </td>
    </tr>
  )
}
