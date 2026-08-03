import { useState } from 'react'
import { Search, Building2 } from 'lucide-react'
import { useAdminUniversities } from '../../../hooks'
import DataTable from '../../../components/design-system/DataTable'

function Avatar({ name }) {
  const initials = (name || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
      {initials}
    </div>
  )
}

export default function UniversitiesTable() {
  const [search, setSearch] = useState('')
  const { data: universities, isLoading } = useAdminUniversities()

  const filtered = (universities ?? []).filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) || u.code.toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    {
      key: 'name', header: 'Institution', render: (u) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={u.name} />
          <span className="font-medium text-slate-900 dark:text-slate-100">{u.name}</span>
        </div>
      ),
    },
    { key: 'code', header: 'Code' },
    { key: 'students', header: 'Students' },
    { key: 'mentors', header: 'Mentors' },
    {
      key: 'status', header: 'Status', render: (u) => (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{u.status}</span>
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
        keyField="code"
        loading={isLoading}
        emptyIcon={Building2}
        emptyTitle="No universities found"
        emptyDescription="Universities appear here when university students register."
      />
    </div>
  )
}
