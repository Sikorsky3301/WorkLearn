import { useMemo, useState } from 'react'
import { useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, flexRender, createColumnHelper } from '@tanstack/react-table'
import { ArrowUpDown, Search } from 'lucide-react'
import { useCrmSimStore } from '../../../../../stores/useCrmSimStore'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../../../shared/ui/shadcn/table'
import { Input } from '../../../../../shared/ui/shadcn/input'
import { Badge } from '../../../../../shared/ui/shadcn/badge'

const columnHelper = createColumnHelper()

export default function CrmLeads() {
  const leads = useCrmSimStore((s) => s.crm.leads)
  const lq = useCrmSimStore((s) => s.leadQualification)
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState([])

  const rows = useMemo(
    () => leads.map((l) => ({ ...l, score: lq.leadScore, buyingIntent: lq.buyingIntent, priority: lq.priority })),
    [leads, lq]
  )

  const columns = useMemo(() => [
    columnHelper.accessor('name', { header: 'Name' }),
    columnHelper.accessor('company', { header: 'Company' }),
    columnHelper.accessor('industry', { header: 'Industry' }),
    columnHelper.accessor('score', {
      header: 'Lead Score',
      cell: (info) => info.getValue() != null ? <Badge variant={info.getValue() >= 70 ? 'success' : info.getValue() >= 40 ? 'warning' : 'danger'}>{info.getValue()}</Badge> : <span className="text-outline">Unscored</span>,
    }),
    columnHelper.accessor('buyingIntent', {
      header: 'Buying Intent',
      cell: (info) => info.getValue() ? <Badge variant="outline" className="capitalize">{info.getValue()}</Badge> : '—',
    }),
    columnHelper.accessor('priority', {
      header: 'Priority',
      cell: (info) => info.getValue() ? <span className="capitalize">{info.getValue()}</span> : '—',
    }),
  ], [])

  const table = useReactTable({
    data: rows,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-on-surface">Leads</h1>
        <div className="relative w-56">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-outline" />
          <Input placeholder="Search leads..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} className="pl-8" />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    <button
                      className="flex items-center gap-1 hover:text-on-surface transition-colors"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && <ArrowUpDown className="h-3 w-3" />}
                    </button>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-on-surface-variant">Score and priority come from your Stage 1 assessment — head back there to change them.</p>
    </div>
  )
}
