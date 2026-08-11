import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Copy, Users } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { useCmsBasePath } from '../../../hooks/useCmsBasePath'
import { useAdminSimulations, usePublishSimulation, useUnpublishSimulation, useDeleteSimulation, useDuplicateSimulation, useUnenrollAllStudents, usePatchPublishScope } from '../../../hooks'
import NewSimulationDialog from './NewSimulationDialog'
import PublishScopeModal from '../shared/PublishScopeModal'

/** Simulations page inside the Admin portal — list/search/publish/delete.
 * The builder itself is a dedicated route (/admin/simulations/:id), not
 * nested here — see SimulationBuilder.jsx. */
export default function SimulationsListPanel() {
  const navigate = useNavigate()
  const cmsBase = useCmsBasePath()
  const [search, setSearch] = useState('')
  const [newDialogOpen, setNewDialogOpen] = useState(false)
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
          onClick={() => setNewDialogOpen(true)}
          className="flex items-center gap-1.5 text-sm font-semibold text-white bg-primary hover:bg-primary-dark px-4 py-2 rounded-lg transition-colors shadow-sm cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4" /> New Simulation
        </button>
      </div>

      <NewSimulationDialog open={newDialogOpen} onOpenChange={setNewDialogOpen} />

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
                {['Title', 'Domain', 'Status', 'Tasks', 'Enrollments', 'Updated', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-on-surface-variant">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {sims.map((s) => (
                <SimRow
                  key={s.id} sim={s}
                  onEdit={() => navigate(`${cmsBase}/simulations/${s.id}`)}
                  onDuplicated={(newSim) => navigate(`${cmsBase}/simulations/${newSim.id}`)}
                  deleteSim={deleteSim}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function scopeLabel(sim) {
  if (sim.available_to_all_universities !== false) return 'All universities'
  const n = (sim.university_ids || []).length
  return n ? `${n} universit${n === 1 ? 'y' : 'ies'}` : 'Scoped'
}

function SimRow({ sim, onEdit, onDuplicated, deleteSim }) {
  const { hasPermission } = useAuth()
  const isPlatformAdmin = hasPermission()
  const publish = usePublishSimulation(sim.id)
  const unpublish = useUnpublishSimulation(sim.id)
  const patchScope = usePatchPublishScope(sim.id)
  const duplicateSim = useDuplicateSimulation(sim.id)
  const unenrollAll = useUnenrollAllStudents(sim.id)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmUnenroll, setConfirmUnenroll] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const [newId, setNewId] = useState('')
  const [scopeOpen, setScopeOpen] = useState(false)
  const [scopeMode, setScopeMode] = useState('publish')

  function startDuplicate() {
    setNewId(`${sim.id}-copy`)
    setDuplicating(true)
  }

  function confirmDuplicate() {
    if (!newId.trim()) return
    duplicateSim.mutate(newId.trim(), {
      onSuccess: (res) => { setDuplicating(false); onDuplicated(res) },
      onError: (e) => alert(e?.message || 'Could not duplicate — that id may already exist.'),
    })
  }

  function handlePublishClick() {
    if (isPlatformAdmin) {
      setScopeMode('publish')
      setScopeOpen(true)
      return
    }
    publish.mutate({}, { onError: (e) => alert(e?.message || 'Could not publish this simulation.') })
  }

  function handleScopeConfirm(body) {
    const mut = scopeMode === 'edit' ? patchScope : publish
    mut.mutate(body, {
      onSuccess: () => setScopeOpen(false),
      onError: (e) => alert(e?.message || 'Could not update publish scope.'),
    })
  }

  return (
    <tr className="hover:bg-surface-low transition-colors">
      <td className="px-4 py-3 font-medium text-on-surface">
        <div>{sim.title}</div>
        {sim.status === 'PUBLISHED' && (
          <div className="text-[11px] text-outline mt-0.5">{scopeLabel(sim)}</div>
        )}
      </td>
      <td className="px-4 py-3 text-xs text-on-surface-variant">{sim.domain}</td>
      <td className="px-4 py-3">
        <span className={`chip text-[10px] ${sim.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-high text-on-surface-variant'}`}>
          {sim.status}
        </span>
      </td>
      <td className="px-4 py-3 text-on-surface-variant tabular-nums">{sim.task_count}</td>
      <td className="px-4 py-3 text-on-surface-variant tabular-nums">{sim.enrollment_count ?? 0}</td>
      <td className="px-4 py-3 text-xs text-outline">{new Date(sim.updated_at).toLocaleDateString()}</td>
      <td className="px-4 py-3 text-right whitespace-nowrap">
        {duplicating ? (
          <span className="inline-flex items-center gap-1.5">
            <input
              autoFocus
              value={newId}
              onChange={(e) => setNewId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirmDuplicate()}
              className="input py-1 px-2 text-xs w-40"
              placeholder="new-simulation-id"
            />
            <button
              onClick={confirmDuplicate}
              disabled={duplicateSim.isPending || !newId.trim()}
              className="text-xs font-semibold text-white bg-primary px-2 py-0.5 rounded disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {duplicateSim.isPending ? 'Copying…' : 'Create'}
            </button>
            <button onClick={() => setDuplicating(false)} className="text-xs text-outline cursor-pointer hover:text-on-surface-variant transition-colors">Cancel</button>
          </span>
        ) : (
          <>
            <button onClick={onEdit} className="text-xs font-semibold text-primary hover:underline mr-3 cursor-pointer">Edit</button>
            <button
              onClick={startDuplicate}
              title="Duplicate this simulation"
              className="inline-flex items-center gap-1 text-xs font-semibold text-on-surface-variant hover:text-on-surface mr-3 cursor-pointer"
            >
              <Copy className="h-3 w-3" /> Duplicate
            </button>
            {sim.status === 'PUBLISHED' ? (
              <>
                {isPlatformAdmin && (
                  <button
                    onClick={() => { setScopeMode('edit'); setScopeOpen(true) }}
                    className="text-xs font-semibold text-on-surface-variant hover:text-on-surface mr-3 cursor-pointer"
                  >
                    Edit scope
                  </button>
                )}
                <button onClick={() => unpublish.mutate()} disabled={unpublish.isPending} className="text-xs font-semibold text-on-surface-variant hover:text-on-surface mr-3 cursor-pointer disabled:cursor-not-allowed">
                  Unpublish
                </button>
              </>
            ) : (
              <button
                onClick={handlePublishClick}
                disabled={publish.isPending || sim.task_count === 0}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 mr-3 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Publish
              </button>
            )}
            {sim.enrollment_count > 0 && (
              !confirmUnenroll ? (
                <button
                  onClick={() => { setConfirmDelete(false); setConfirmUnenroll(true) }}
                  title="Remove every student's enrollment so this simulation can be deleted"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-800 mr-3 cursor-pointer"
                >
                  <Users className="h-3 w-3" /> De-enroll all
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5 mr-3">
                  <span className="text-xs text-on-surface-variant">
                    Remove all {sim.enrollment_count} enrollment{sim.enrollment_count !== 1 ? 's' : ''}?
                  </span>
                  <button
                    onClick={() => unenrollAll.mutate(undefined, {
                      onSuccess: () => setConfirmUnenroll(false),
                      onError: (e) => alert(e?.message || 'Could not remove enrollments.'),
                    })}
                    disabled={unenrollAll.isPending}
                    className="text-xs font-semibold text-white bg-amber-600 px-2 py-0.5 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {unenrollAll.isPending ? 'Removing…' : 'Confirm'}
                  </button>
                  <button onClick={() => setConfirmUnenroll(false)} className="text-xs text-outline cursor-pointer hover:text-on-surface-variant transition-colors">Cancel</button>
                </span>
              )
            )}
            {!confirmDelete ? (
              <button onClick={() => { setConfirmUnenroll(false); setConfirmDelete(true) }} className="text-xs font-semibold text-red-500 hover:text-red-700 cursor-pointer">Delete</button>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <button
                  onClick={() => deleteSim.mutate(sim.id, { onError: () => alert('Cannot delete — this simulation has existing enrollments.') })}
                  className="text-xs font-semibold text-white bg-red-600 px-2 py-0.5 rounded cursor-pointer"
                >
                  Confirm
                </button>
                <button onClick={() => setConfirmDelete(false)} className="text-xs text-outline cursor-pointer hover:text-on-surface-variant transition-colors">Cancel</button>
              </span>
            )}
          </>
        )}
        <PublishScopeModal
          open={scopeOpen}
          onOpenChange={setScopeOpen}
          onConfirm={handleScopeConfirm}
          confirming={publish.isPending || patchScope.isPending}
          title={scopeMode === 'edit' ? 'Edit publish scope' : 'Publish to universities'}
          confirmLabel={scopeMode === 'edit' ? 'Save scope' : 'Publish'}
          initialAvailableToAll={sim.available_to_all_universities !== false}
          initialUniversityIds={sim.university_ids || []}
        />
      </td>
    </tr>
  )
}
