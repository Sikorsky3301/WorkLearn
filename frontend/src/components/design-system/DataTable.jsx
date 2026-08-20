import EmptyState from './EmptyState'
import TablePagination, { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE_OPTIONS, useClientPagination } from './TablePagination'

/** Generic table for portal list pages. `columns`:
 *   [{ key, header, render?: (row) => node }]
 * `render` defaults to `row[key]` when omitted. */
export default function DataTable({
  columns, rows, keyField = 'id', loading,
  emptyIcon, emptyTitle = 'Nothing here yet', emptyDescription,
  pageSize: initialPageSize = DEFAULT_PAGE_SIZE,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  resetKey,
}) {
  const { page, setPage, pageSize, setPageSize, pageRows, total } = useClientPagination(rows, {
    pageSize: initialPageSize,
    resetKey,
  })

  if (loading) {
    return (
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 border-b border-slate-100 dark:border-slate-800 last:border-0 bg-slate-50/60 dark:bg-slate-900/40 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!rows || rows.length === 0) {
    return <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
  }

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
              {columns.map((col) => (
                <th key={col.key} className="text-left font-semibold text-slate-500 dark:text-slate-400 px-4 py-2.5 text-xs uppercase tracking-wide whitespace-nowrap">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr
                key={row[keyField]}
                className="border-b border-slate-100 dark:border-slate-800/60 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-2.5 text-slate-700 dark:text-slate-300">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePagination
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={pageSizeOptions}
      />
    </div>
  )
}
