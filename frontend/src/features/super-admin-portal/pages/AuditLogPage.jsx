import { useState } from 'react'
import { ClipboardList, Search } from 'lucide-react'
import { useAdminAuditLog } from '../../../shared/api/hooks'
import DataTable from '../../../shared/design-system/DataTable'

/** Full searchable admin-action audit trail — distinct from the XP-ledger
 * "Activity Log" page. Backed by AuditLog rows written by
 * app/services/audit.py::log_action on every mutating admin endpoint. */
export default function AuditLogPage() {
  const [search, setSearch] = useState('')
  const [actorRole, setActorRole] = useState('')
  const [action, setAction] = useState('')
  const [targetType, setTargetType] = useState('')

  const { data: logs, isLoading } = useAdminAuditLog(200, {
    search: search || undefined,
    actor_role: actorRole || undefined,
    action: action || undefined,
    target_type: targetType || undefined,
  })

  const columns = [
    { key: 'created_at', header: 'When', render: (a) => new Date(a.created_at).toLocaleString() },
    {
      key: 'actor_name', header: 'Actor', render: (a) => (
        <div>
          <p className="font-medium text-slate-900 dark:text-slate-100">{a.actor_name}</p>
          <p className="text-[10px] text-slate-400">{a.actor_role}</p>
        </div>
      ),
    },
    {
      key: 'action', header: 'Action', render: (a) => (
        <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{a.action}</code>
      ),
    },
    { key: 'target', header: 'Target', render: (a) => (a.target_type ? `${a.target_type}:${a.target_id ?? '—'}` : '—') },
    {
      key: 'meta', header: 'Details', render: (a) => (
        a.meta ? <span className="text-xs text-slate-500 dark:text-slate-400 truncate block max-w-xs">{JSON.stringify(a.meta)}</span> : '—'
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search actor, action, target…"
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-primary text-slate-900 dark:text-slate-100"
          />
        </div>
        <select
          value={actorRole} onChange={(e) => setActorRole(e.target.value)}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm outline-none text-slate-900 dark:text-slate-100"
        >
          <option value="">All actors</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="ADMIN">Admin</option>
        </select>
        <input
          value={action} onChange={(e) => setAction(e.target.value)} placeholder="Filter by action (e.g. user.suspend)"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary text-slate-900 dark:text-slate-100 w-56"
        />
        <input
          value={targetType} onChange={(e) => setTargetType(e.target.value)} placeholder="Target type (e.g. user)"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary text-slate-900 dark:text-slate-100 w-44"
        />
      </div>

      <DataTable columns={columns} rows={logs} loading={isLoading} emptyIcon={ClipboardList} emptyTitle="No matching audit events" />
    </div>
  )
}
