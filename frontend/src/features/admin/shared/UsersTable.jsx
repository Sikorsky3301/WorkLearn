import { useEffect, useMemo, useState } from 'react'
import { Search, UserCircle2, X, Loader2 } from 'lucide-react'
import { useAdminUsers } from '../../../hooks'
import { useDebounced } from '../../../hooks/useDebounced'
import DataTable from '../../../components/design-system/DataTable'
import ManageUserModal from './ManageUserModal'

/**
 * The platform's user list.
 *
 * WHAT WAS WRONG WITH IT
 *
 * · It asked for a bare list capped at 100 and paged it in the browser. On a
 *   platform with a thousand accounts an admin saw the newest hundred, the
 *   pager read "1–10 of 100", and nothing indicated the rest existed.
 * · It re-queried on EVERY KEYSTROKE, and the server answered each one with a
 *   COUNT plus one query per row.
 * · It showed neither ROLE nor UNIVERSITY, though the server returned both —
 *   so on a multi-tenant platform you could not tell a teacher from a student,
 *   or which partner an account belonged to.
 * · Dates arrived pre-formatted as "Aug 23" with no year, as strings, so they
 *   could be neither read unambiguously nor sorted.
 * · Nothing was sortable.
 */

const ROLE_STYLE = {
  student: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  teacher: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  university_admin: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
}
const ROLE_LABEL = {
  student: 'Student', teacher: 'Teacher', university_admin: 'Uni Admin',
}

const ROLE_FILTERS = [
  { key: '', label: 'Everyone' },
  { key: 'student', label: 'Students' },
  { key: 'teacher', label: 'Teachers' },
]

function Avatar({ name }) {
  const initials = (name || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
      {initials}
    </div>
  )
}

/** A date a human can read, with the full timestamp on hover.
 *
 *  "3d ago" is what you want to scan; the exact date is what you want when a
 *  row looks wrong. The old table had neither — just "Aug 23", year unknown. */
function RelativeDate({ iso, never = 'Never' }) {
  if (!iso) return <span className="text-slate-400 dark:text-slate-600">{never}</span>
  const then = new Date(iso)
  if (Number.isNaN(then.getTime())) return <span className="text-slate-400">—</span>

  const days = Math.floor((Date.now() - then.getTime()) / 86_400_000)
  const label =
    days <= 0 ? 'Today'
      : days === 1 ? 'Yesterday'
        : days < 30 ? `${days}d ago`
          : days < 365 ? `${Math.floor(days / 30)}mo ago`
            : `${Math.floor(days / 365)}y ago`

  return (
    <span title={then.toLocaleString()} className="whitespace-nowrap tabular-nums">
      {label}
    </span>
  )
}

export default function UsersTable({ role = '', scope = '', title = 'Users', showRoleFilter = false }) {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState(role)
  const [manageUserId, setManageUserId] = useState(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const debouncedSearch = useDebounced(search, 300)
  const effectiveRole = showRoleFilter ? roleFilter : role

  const { data, isLoading, isFetching } = useAdminUsers({
    role: effectiveRole,
    scope,
    search: debouncedSearch,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  })

  const users = data?.users ?? []
  const total = data?.total ?? 0

  // A filter change can leave you past the last page of the new result set.
  useEffect(() => { setPage(1) }, [debouncedSearch, effectiveRole, scope, pageSize])

  // The modal is opened from a row, but the row object is a SNAPSHOT. Suspend
  // a user and the table refetches while the modal keeps rendering the stale
  // copy — the header badge went on saying "Active" after the suspend landed.
  // Holding the id and reading the live row fixes that for every field.
  const manageUser = useMemo(
    () => users.find((u) => u.id === manageUserId) ?? null,
    [users, manageUserId]
  )
  useEffect(() => {
    if (manageUserId != null && !isFetching && !manageUser) setManageUserId(null)
  }, [manageUserId, manageUser, isFetching])

  const showRole = !role || showRoleFilter

  const columns = [
    {
      key: 'name', header: 'Name',
      render: (u) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar name={u.name} />
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-900 dark:text-slate-100">{u.name}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
          </div>
        </div>
      ),
    },
    ...(showRole ? [{
      key: 'role', header: 'Role',
      render: (u) => (
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${ROLE_STYLE[u.role] || ROLE_STYLE.student}`}>
          {ROLE_LABEL[u.role] || u.role}
        </span>
      ),
    }] : []),
    {
      key: 'institution', header: 'University',
      render: (u) => (
        <span className="block max-w-[13rem] truncate" title={u.institution || ''}>
          {u.institution || <span className="text-slate-400 dark:text-slate-600">—</span>}
        </span>
      ),
    },
    { key: 'xp', header: 'XP', align: 'right', render: (u) => <span className="tabular-nums">{(u.xp ?? 0).toLocaleString()}</span> },
    { key: 'enrollments', header: 'Sims', align: 'right', render: (u) => <span className="tabular-nums">{u.enrollments ?? 0}</span> },
    {
      key: 'joined_at', header: 'Joined',
      sortValue: (u) => (u.joined_at ? new Date(u.joined_at).getTime() : null),
      render: (u) => <RelativeDate iso={u.joined_at} never="—" />,
    },
    {
      key: 'last_active_at', header: 'Last active',
      sortValue: (u) => (u.last_active_at ? new Date(u.last_active_at).getTime() : null),
      render: (u) => <RelativeDate iso={u.last_active_at} />,
    },
    {
      key: 'status', header: 'Status',
      sortValue: (u) => (u.is_active !== false ? 1 : 0),
      render: (u) => (
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
          u.is_active !== false
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
            : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
        }`}>
          {u.is_active !== false ? 'Active' : 'Suspended'}
        </span>
      ),
    },
    {
      key: 'actions', header: '', sortable: false, align: 'right',
      render: (u) => (
        <button
          onClick={(e) => { e.stopPropagation(); setManageUserId(u.id) }}
          className="cursor-pointer text-xs font-semibold text-primary hover:underline"
        >
          Manage
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or roll number…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-8 text-sm text-slate-900 outline-none transition-colors focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {showRoleFilter && (
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-800 dark:bg-slate-900">
            {ROLE_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setRoleFilter(f.key)}
                aria-pressed={roleFilter === f.key}
                className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  roleFilter === f.key
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* Fetching, not loading: the previous page stays on screen while the
            next one arrives, so this is the only signal that anything is in
            flight. Without it, a slow search looks like nothing happened. */}
        {isFetching && !isLoading && (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
            <Loader2 className="h-3 w-3 animate-spin" /> Updating
          </span>
        )}
      </div>

      <DataTable
        columns={columns}
        rows={users}
        loading={isLoading}
        dense
        emptyIcon={UserCircle2}
        emptyTitle={debouncedSearch ? 'No matches' : `No ${title.toLowerCase()} yet`}
        emptyDescription={
          debouncedSearch
            ? `Nothing matches “${debouncedSearch}”. Search covers name, email and roll number.`
            : undefined
        }
        serverPagination={{
          total,
          page,
          pageSize,
          onPageChange: setPage,
          onPageSizeChange: setPageSize,
        }}
        pageSizeOptions={[25, 50, 100]}
      />

      {manageUser && <ManageUserModal user={manageUser} onClose={() => setManageUserId(null)} />}
    </div>
  )
}
