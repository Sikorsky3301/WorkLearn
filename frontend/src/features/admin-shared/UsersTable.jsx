import { useState } from 'react'
import { Search, UserCircle2 } from 'lucide-react'
import { useAdminUsers } from '../../hooks'
import DataTable from '../../shared/design-system/DataTable'
import ManageUserModal from './ManageUserModal'

function Avatar({ name }) {
  const initials = (name || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
      {initials}
    </div>
  )
}

/** Reused by both the SuperAdmin and Admin portals — `role` filters which
 * User.role the underlying /api/admin/users query returns ('' = all). */
export default function UsersTable({ role = '', title = 'Users' }) {
  const [search, setSearch] = useState('')
  const [manageUser, setManageUser] = useState(null)
  const { data: users, isLoading } = useAdminUsers(role, search)

  const columns = [
    {
      key: 'name', header: 'Name', render: (u) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={u.name} />
          <span className="font-medium text-slate-900 dark:text-slate-100">{u.name}</span>
        </div>
      ),
    },
    { key: 'email', header: 'Email' },
    { key: 'joined', header: 'Joined' },
    { key: 'xp', header: 'XP' },
    { key: 'enrollments', header: 'Enrollments' },
    { key: 'last_active', header: 'Last Active' },
    {
      key: 'status', header: 'Status', render: (u) => (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.is_active !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
          {u.is_active !== false ? 'Active' : 'Suspended'}
        </span>
      ),
    },
    {
      key: 'actions', header: '', render: (u) => (
        <button onClick={() => setManageUser(u)} className="text-xs font-semibold text-primary hover:underline cursor-pointer">
          Manage
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${title.toLowerCase()}…`}
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-primary transition-colors text-slate-900 dark:text-slate-100"
        />
      </div>
      <DataTable
        columns={columns}
        rows={users}
        loading={isLoading}
        emptyIcon={UserCircle2}
        emptyTitle={`No ${title.toLowerCase()} yet`}
      />
      {manageUser && <ManageUserModal user={manageUser} onClose={() => setManageUser(null)} />}
    </div>
  )
}
