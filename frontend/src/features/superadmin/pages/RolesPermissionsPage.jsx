import { useState } from 'react'
import { Plus, KeyRound, X, Trash2 } from 'lucide-react'
import { useAdminRoles, usePermissionCatalog, useCreateAdminRole, useUpdateAdminRole, useDeleteAdminRole } from '../../../hooks'
import DataTable from '../../../components/design-system/DataTable'

/** RBAC role editor — the built-in "Administrator" role (all permissions,
 * seeded by the backend) can't be renamed/re-permissioned/deleted; custom
 * roles are fully editable. */
export default function RolesPermissionsPage() {
  const { data: roles, isLoading } = useAdminRoles()
  const { data: catalog } = usePermissionCatalog()
  const [editingRole, setEditingRole] = useState(null)
  const [showCreate, setShowCreate] = useState(false)

  const columns = [
    {
      key: 'name', header: 'Role', render: (r) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-900 dark:text-slate-100">{r.name}</span>
          {r.is_builtin && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">Built-in</span>}
        </div>
      ),
    },
    { key: 'description', header: 'Description', render: (r) => r.description || '—' },
    { key: 'permission_keys', header: 'Permissions', render: (r) => `${r.permission_keys.length} granted` },
    { key: 'admin_count', header: 'Admins' },
    {
      key: 'actions', header: '', render: (r) => (
        <button onClick={() => setEditingRole(r)} className="text-xs font-semibold text-primary hover:underline cursor-pointer">
          Edit
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">Define custom roles with fine-grained permissions for the Admin tier.</p>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 text-sm font-semibold bg-primary text-white px-3 py-2 rounded-lg hover:bg-primary-dark transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" /> New Role
        </button>
      </div>

      <DataTable columns={columns} rows={roles} loading={isLoading} emptyIcon={KeyRound} emptyTitle="No roles yet" />

      {showCreate && <RoleFormModal catalog={catalog ?? []} onClose={() => setShowCreate(false)} />}
      {editingRole && <RoleFormModal role={editingRole} catalog={catalog ?? []} onClose={() => setEditingRole(null)} />}
    </div>
  )
}

function RoleFormModal({ role, catalog, onClose }) {
  const isNew = !role
  const isBuiltin = role?.is_builtin
  const createRole = useCreateAdminRole()
  const updateRole = useUpdateAdminRole(role?.id)
  const deleteRole = useDeleteAdminRole()
  const [name, setName] = useState(role?.name || '')
  const [description, setDescription] = useState(role?.description || '')
  const [selected, setSelected] = useState(new Set(role?.permission_keys || []))
  const [error, setError] = useState('')

  const categories = [...new Set(catalog.map((p) => p.category))]

  const togglePerm = (key) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const body = { name, description, permission_keys: [...selected] }
    try {
      if (isNew) await createRole.mutateAsync(body)
      else await updateRole.mutateAsync(body)
      onClose()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-xl p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-slate-100">{isNew ? 'New Role' : `Edit ${role.name}`}</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <input
          value={name} onChange={(e) => setName(e.target.value)} required disabled={isBuiltin} placeholder="Role name"
          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary text-slate-900 dark:text-slate-100 disabled:opacity-50"
        />
        <input
          value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)"
          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary text-slate-900 dark:text-slate-100"
        />

        <div className="space-y-3">
          {categories.map((cat) => (
            <div key={cat}>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">{cat}</p>
              <div className="space-y-1">
                {catalog.filter((p) => p.category === cat).map((p) => (
                  <label key={p.key} className="flex items-start gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selected.has(p.key)}
                      onChange={() => togglePerm(p.key)}
                      disabled={isBuiltin}
                      className="mt-0.5"
                    />
                    <span className="text-slate-700 dark:text-slate-300">{p.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
          {!isNew && !isBuiltin ? (
            <button
              type="button"
              onClick={async () => { await deleteRole.mutateAsync(role.id); onClose() }}
              className="flex items-center gap-1.5 text-sm font-semibold text-red-600 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete role
            </button>
          ) : <span />}
          <button
            type="submit" disabled={isBuiltin || createRole.isPending || updateRole.isPending}
            className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary-dark disabled:opacity-50 cursor-pointer"
          >
            {isNew ? 'Create Role' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
