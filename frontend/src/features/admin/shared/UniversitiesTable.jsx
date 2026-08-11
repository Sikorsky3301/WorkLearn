import { useState } from 'react'
import { Search, Building2, Copy, Check, Pencil, UserPlus } from 'lucide-react'
import { useAdminUniversities, useUpdateUniversity } from '../../../hooks'
import DataTable from '../../../components/design-system/DataTable'

function Avatar({ name }) {
  const initials = (name || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
      {initials}
    </div>
  )
}

function partnerHost(code) {
  return `http://${String(code).toLowerCase()}.localhost:5173`
}

export default function UniversitiesTable({ onProvision }) {
  const [search, setSearch] = useState('')
  const [copied, setCopied] = useState(null)
  const [editing, setEditing] = useState(null)
  const [editName, setEditName] = useState('')
  const { data: universities, isLoading } = useAdminUniversities()
  const updateUni = useUpdateUniversity()

  const filtered = (universities ?? []).filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) || u.code.toLowerCase().includes(search.toLowerCase())
  )

  const copyHost = async (u) => {
    const url = partnerHost(u.code)
    try {
      await navigator.clipboard.writeText(url)
      setCopied(u.id)
      setTimeout(() => setCopied(null), 1500)
    } catch { /* ignore */ }
  }

  const startEdit = (u) => {
    if (u.is_default) return
    setEditing(u.id)
    setEditName(u.name)
  }

  const saveEdit = async (u) => {
    const name = editName.trim()
    if (!name || name === u.name) {
      setEditing(null)
      return
    }
    try {
      await updateUni.mutateAsync({ id: u.id, name })
      setEditing(null)
    } catch {
      /* keep editor open; mutation error surfaces via react-query */
    }
  }

  const columns = [
    {
      key: 'name', header: 'Institution', render: (u) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar name={u.name} />
          {editing === u.id ? (
            <input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={() => saveEdit(u)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit(u)
                if (e.key === 'Escape') setEditing(null)
              }}
              className="input py-1 text-sm min-w-0 flex-1"
            />
          ) : (
            <span className="font-medium text-slate-900 dark:text-slate-100 truncate">{u.name}</span>
          )}
        </div>
      ),
    },
    {
      key: 'code', header: 'Code', render: (u) => (
        <span className="font-mono text-xs">{u.code}</span>
      ),
    },
    { key: 'students', header: 'Students' },
    { key: 'mentors', header: 'Teachers' },
    {
      key: 'host', header: 'Partner host', render: (u) => (
        u.is_default ? (
          <span className="text-xs text-slate-400">Academy (default)</span>
        ) : (
          <button
            type="button"
            onClick={() => copyHost(u)}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer font-mono"
            title="Copy partner host URL"
          >
            {copied === u.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {String(u.code).toLowerCase()}.localhost:5173
          </button>
        )
      ),
    },
    {
      key: 'status', header: 'Status', render: (u) => (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{u.status}</span>
      ),
    },
    {
      key: 'actions', header: '', render: (u) => (
        <div className="flex items-center gap-2 justify-end">
          {!u.is_default && (
            <>
              <button type="button" onClick={() => startEdit(u)} className="text-xs text-slate-500 hover:text-primary cursor-pointer" title="Rename">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              {onProvision && (
                <button
                  type="button"
                  onClick={() => onProvision(u)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  <UserPlus className="h-3.5 w-3.5" /> Provision
                </button>
              )}
            </>
          )}
        </div>
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
          placeholder="Search universities…"
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-primary transition-colors text-slate-900 dark:text-slate-100"
        />
      </div>
      <DataTable
        columns={columns}
        rows={filtered}
        keyField="id"
        loading={isLoading}
        emptyIcon={Building2}
        emptyTitle="No universities found"
        emptyDescription="Use Onboard University to create a partner org."
      />
    </div>
  )
}
