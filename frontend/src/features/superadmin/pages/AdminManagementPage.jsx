import { useState } from 'react'
import { Plus, UsersRound, Ban, CheckCircle2, KeyRound, Trash2, X } from 'lucide-react'
import {
  useAdmins, useAdminRoles, useCreateAdmin, useSuspendAdmin, useActivateAdmin,
  useDeleteAdmin, useResetAdminPassword, useUpdateAdmin,
} from '../../../hooks'
import DataTable from '../../../components/design-system/DataTable'
import PermissionGate from '../../../components/design-system/PermissionGate'

/** Full Admin lifecycle — real, not scaffolding (other admins exist or are
 * coming soon, per this project's own scoping decision): create/edit role
 * assignment/suspend/activate/reset-password/delete. */
export default function AdminManagementPage() {
  const { data: admins, isLoading } = useAdmins()
  const { data: roles } = useAdminRoles()
  const [showCreate, setShowCreate] = useState(false)
  const [manageAdmin, setManageAdmin] = useState(null)

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'admin_role_name', header: 'Role', render: (a) => a.admin_role_name || '—' },
    {
      key: 'status', header: 'Status', render: (a) => (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${a.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
          {a.is_active ? 'Active' : 'Suspended'}
        </span>
      ),
    },
    {
      key: 'actions', header: '', render: (a) => (
        <button onClick={() => setManageAdmin(a)} className="text-xs font-semibold text-primary hover:underline cursor-pointer">
          Manage
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">Admins can only do what their assigned role explicitly permits.</p>
        <PermissionGate need="admins.create">
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 text-sm font-semibold bg-primary text-white px-3 py-2 rounded-lg hover:bg-primary-dark transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" /> New Admin
          </button>
        </PermissionGate>
      </div>

      <DataTable
        columns={columns}
        rows={admins}
        loading={isLoading}
        emptyIcon={UsersRound}
        emptyTitle="No admins yet"
        emptyDescription="Create an admin and assign them a role to get started."
      />

      {showCreate && <CreateAdminModal roles={roles ?? []} onClose={() => setShowCreate(false)} />}
      {manageAdmin && <ManageAdminModal admin={manageAdmin} roles={roles ?? []} onClose={() => setManageAdmin(null)} />}
    </div>
  )
}

function CreateAdminModal({ roles, onClose }) {
  const createAdmin = useCreateAdmin()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [roleId, setRoleId] = useState(roles[0]?.id || '')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await createAdmin.mutateAsync({ name, email, password, admin_role_id: roleId })
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
        className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-xl p-5 space-y-3"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-slate-100">New Admin</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
        <input
          value={name} onChange={(e) => setName(e.target.value)} required placeholder="Full name"
          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary text-slate-900 dark:text-slate-100"
        />
        <input
          value={email} onChange={(e) => setEmail(e.target.value)} required type="email" placeholder="Email"
          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary text-slate-900 dark:text-slate-100"
        />
        <input
          value={password} onChange={(e) => setPassword(e.target.value)} required type="password" minLength={6} placeholder="Temporary password"
          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary text-slate-900 dark:text-slate-100"
        />
        <select
          value={roleId} onChange={(e) => setRoleId(e.target.value)} required
          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary text-slate-900 dark:text-slate-100"
        >
          {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          type="submit" disabled={createAdmin.isPending}
          className="w-full bg-primary text-white text-sm font-semibold py-2 rounded-lg hover:bg-primary-dark disabled:opacity-50 cursor-pointer"
        >
          {createAdmin.isPending ? 'Creating…' : 'Create Admin'}
        </button>
      </form>
    </div>
  )
}

function ManageAdminModal({ admin, roles, onClose }) {
  const updateAdmin = useUpdateAdmin(admin.id)
  const suspendAdmin = useSuspendAdmin()
  const activateAdmin = useActivateAdmin()
  const deleteAdmin = useDeleteAdmin()
  const resetPassword = useResetAdminPassword(admin.id)
  const [roleId, setRoleId] = useState(admin.admin_role_id || '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleRoleChange = (id) => {
    setRoleId(id)
    updateAdmin.mutate({ admin_role_id: id })
  }

  const handleResetPassword = async () => {
    if (!newPassword) return
    await resetPassword.mutateAsync(newPassword)
    setNewPassword('')
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100">{admin.name}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{admin.email}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">Role</label>
          <select
            value={roleId} onChange={(e) => handleRoleChange(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary text-slate-900 dark:text-slate-100"
          >
            {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">Reset password</label>
          <div className="flex gap-2">
            <input
              value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" minLength={6} placeholder="New password"
              className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary text-slate-900 dark:text-slate-100"
            />
            <button
              onClick={handleResetPassword} disabled={resetPassword.isPending || !newPassword}
              className="flex items-center gap-1 text-xs font-semibold text-primary border border-primary/30 px-3 rounded-lg hover:bg-primary/5 disabled:opacity-50 cursor-pointer"
            >
              <KeyRound className="h-3.5 w-3.5" /> Reset
            </button>
          </div>
        </div>

        <button
          onClick={() => (admin.is_active ? suspendAdmin.mutate(admin.id) : activateAdmin.mutate(admin.id))}
          className={`w-full flex items-center justify-center gap-2 text-sm font-semibold rounded-lg px-4 py-2 transition-colors cursor-pointer ${
            admin.is_active ? 'text-amber-700 border border-amber-200 hover:bg-amber-50' : 'text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
          }`}
        >
          {admin.is_active ? <Ban className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          {admin.is_active ? 'Suspend this admin' : 'Reactivate this admin'}
        </button>

        <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-1.5 text-sm font-semibold text-red-600 cursor-pointer">
              <Trash2 className="h-3.5 w-3.5" /> Delete this admin
            </button>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-slate-700 dark:text-slate-300">Permanently delete {admin.name}?</span>
              <button
                onClick={async () => { await deleteAdmin.mutateAsync(admin.id); onClose() }}
                className="text-sm text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg font-semibold cursor-pointer"
              >
                Yes, delete
              </button>
              <button onClick={() => setConfirmDelete(false)} className="text-sm text-slate-500 cursor-pointer">Cancel</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
