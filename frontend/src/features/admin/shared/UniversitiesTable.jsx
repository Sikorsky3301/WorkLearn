import { useState } from 'react'
import { Search, Building2, Copy, Check, Pencil, UserPlus, ImageIcon } from 'lucide-react'
import { useAdminUniversities, useUpdateUniversity } from '../../../hooks'
import { resolveMediaUrl } from '../../../lib/client'
import DataTable from '../../../components/design-system/DataTable'
import LogoUploadField from '../../builder/cms/shared/LogoUploadField'

function UniAvatar({ name, logoUrl }) {
  if (logoUrl) {
    return (
      <img
        src={resolveMediaUrl(logoUrl)}
        alt=""
        className="h-8 w-8 rounded-lg object-contain bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0"
      />
    )
  }
  const initials = (name || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
      {initials}
    </div>
  )
}

// The partner sign-in URL comes from the API (`login_url`), which builds it
// from the deployment's own frontend_url. It used to be hardcoded here as
// `http://{code}.localhost:5173` — so the link an admin copied and emailed to
// a university was a localhost address in production. The fallback below is
// only for a row served by an older backend.
function partnerHost(u) {
  return u.login_url || `${window.location.origin.replace('//', `//${String(u.code).toLowerCase()}.`)}`
}

export default function UniversitiesTable({ onProvision }) {
  const [search, setSearch] = useState('')
  const [copied, setCopied] = useState(null)
  const [editing, setEditing] = useState(null)
  const [editName, setEditName] = useState('')
  const [logoEdit, setLogoEdit] = useState(null)
  const [editLogoUrl, setEditLogoUrl] = useState('')
  const { data: universities, isLoading } = useAdminUniversities()
  const updateUni = useUpdateUniversity()

  const filtered = (universities ?? []).filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) || u.code.toLowerCase().includes(search.toLowerCase())
  )

  const copyHost = async (u) => {
    const url = partnerHost(u)
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

  const startLogoEdit = (u) => {
    if (u.is_default) return
    setLogoEdit(u)
    setEditLogoUrl(u.logo_url || '')
  }

  const saveLogoEdit = async () => {
    if (!logoEdit) return
    const next = (editLogoUrl || '').trim() || null
    const prev = logoEdit.logo_url || null
    if (next === prev) {
      setLogoEdit(null)
      return
    }
    try {
      await updateUni.mutateAsync({
        id: logoEdit.id,
        name: logoEdit.name,
        logo_url: next,
      })
      setLogoEdit(null)
    } catch {
      /* keep modal open */
    }
  }

  const columns = [
    {
      key: 'name', header: 'Institution', render: (u) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <UniAvatar name={u.name} logoUrl={u.logo_url} />
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
    { key: 'students', header: 'Students', align: 'right', render: (u) => <span className="tabular-nums">{u.students}</span> },
    { key: 'mentors', header: 'Teachers', align: 'right', render: (u) => <span className="tabular-nums">{u.mentors}</span> },
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
            {partnerHost(u).replace(/^https?:\/\//, '')}
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
      key: 'actions', header: '', sortable: false, align: 'right', render: (u) => (
        <div className="flex items-center gap-2 justify-end">
          {!u.is_default && (
            <>
              <button type="button" onClick={() => startEdit(u)} className="text-xs text-slate-500 hover:text-primary cursor-pointer" title="Rename">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={() => startLogoEdit(u)} className="text-xs text-slate-500 hover:text-primary cursor-pointer" title="Edit logo">
                <ImageIcon className="h-3.5 w-3.5" />
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
        resetKey={search}
      />

      {logoEdit && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
          onClick={() => setLogoEdit(null)}
          role="presentation"
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-logo-title"
          >
            <div>
              <h3 id="edit-logo-title" className="font-bold text-slate-900 dark:text-slate-100">University logo</h3>
              <p className="text-xs text-slate-500 mt-0.5">{logoEdit.name}</p>
            </div>
            <LogoUploadField
              label="Logo"
              value={editLogoUrl}
              onChange={setEditLogoUrl}
            />
            <p className="text-[11px] text-slate-500">Clear to fall back to the WorkLearn logo on the partner subdomain.</p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setLogoEdit(null)}
                className="flex-1 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updateUni.isPending}
                onClick={saveLogoEdit}
                className="btn-primary flex-1 py-2.5 text-sm"
              >
                {updateUni.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
