import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ChevronsUpDown, TriangleAlert } from 'lucide-react'
import EmptyState from './EmptyState'
import TablePagination, { DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE_OPTIONS, useClientPagination } from './TablePagination'

/**
 * The table every portal list page is built from.
 *
 * `columns`: [{ key, header, render?, sortValue?, sortable?, align?, width? }]
 *   render     defaults to row[key]
 *   sortValue  what to sort BY when it differs from what is displayed — a
 *              rendered cell is JSX, and a date rendered as "3 days ago" has
 *              to sort by its timestamp, not by that string
 *   sortable   defaults to true; set false for an actions column
 *
 * TWO THINGS IT COULD NOT DO BEFORE
 *
 * 1. SORT. Not one column, anywhere in the admin portal. On a users list the
 *    first question is always "who joined most recently" or "who has not been
 *    back", and neither was answerable.
 *
 * 2. PAGE SERVER-SIDE. It always sliced an in-memory array, which is correct
 *    for a list the server sent whole and a lie for one the server truncated.
 *    Pass `serverPagination` and it renders the page it is given and reports
 *    the true total instead.
 */
export default function DataTable({
  columns, rows, keyField = 'id', loading, error,
  emptyIcon, emptyTitle = 'Nothing here yet', emptyDescription, emptyAction,
  pageSize: initialPageSize = DEFAULT_PAGE_SIZE,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  resetKey,
  defaultSort,
  serverPagination,
  onRowClick,
  dense = false,
}) {
  const [sort, setSort] = useState(defaultSort ?? null) // { key, dir: 'asc' | 'desc' }

  const sortedRows = useMemo(() => {
    const list = rows ?? []
    if (!sort) return list
    const col = columns.find((c) => c.key === sort.key)
    if (!col) return list

    const valueOf = (row) => {
      if (col.sortValue) return col.sortValue(row)
      const raw = row[col.key]
      return raw == null ? '' : raw
    }

    // Copy before sorting: the array is react-query's cached data, and sorting
    // it in place mutates the cache for every other reader of that query.
    return [...list].sort((a, b) => {
      const av = valueOf(a)
      const bv = valueOf(b)
      // Nulls always sort last, whichever direction — "never signed in" is not
      // "signed in a very long time ago", and floating it to the top on one
      // click and the bottom on the next is just noise.
      if (av === '' || av == null) return 1
      if (bv === '' || bv == null) return -1
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' })
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }, [rows, sort, columns])

  const client = useClientPagination(serverPagination ? [] : sortedRows, {
    pageSize: initialPageSize,
    resetKey,
  })
  const pageRows = serverPagination ? sortedRows : client.pageRows
  const total = serverPagination ? serverPagination.total : client.total

  function toggleSort(col) {
    if (col.sortable === false) return
    setSort((prev) => {
      if (prev?.key !== col.key) return { key: col.key, dir: 'asc' }
      if (prev.dir === 'asc') return { key: col.key, dir: 'desc' }
      return null // third click clears — back to the server's own order
    })
  }

  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-11 animate-pulse border-b border-slate-100 bg-slate-50/60 last:border-0 dark:border-slate-800 dark:bg-slate-900/40"
          />
        ))}
      </div>
    )
  }

  // A failed request used to fall through to the empty state, so a Super Admin
  // hitting a 403 on /api/admin/universities was told "No universities yet"
  // while three of them sat in the database. An error is not an empty list.
  if (error) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 dark:border-red-900 dark:bg-red-950/40">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-red-900 dark:text-red-200">Could not load this list</p>
          <p className="mt-0.5 text-xs leading-relaxed text-red-700 dark:text-red-300">
            {error.message || 'The request failed.'}
          </p>
        </div>
      </div>
    )
  }

  if (!rows || rows.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    )
  }

  const cellPad = dense ? 'px-3 py-2' : 'px-4 py-2.5'

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60">
              {columns.map((col) => {
                const active = sort?.key === col.key
                const canSort = col.sortable !== false
                const Icon = !active ? ChevronsUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown
                return (
                  <th
                    key={col.key}
                    style={col.width ? { width: col.width } : undefined}
                    className={`whitespace-nowrap px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 ${
                      col.align === 'right' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {canSort && col.header ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col)}
                        aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                        className={`group inline-flex cursor-pointer items-center gap-1 transition-colors hover:text-slate-900 dark:hover:text-slate-100 ${
                          active ? 'text-slate-900 dark:text-slate-100' : ''
                        }`}
                      >
                        {col.header}
                        <Icon
                          className={`h-3 w-3 transition-opacity ${
                            active ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'
                          }`}
                        />
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr
                key={row[keyField]}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-900/40 ${
                  onRowClick ? 'cursor-pointer' : ''
                }`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`${cellPad} text-slate-700 dark:text-slate-300 ${
                      col.align === 'right' ? 'text-right' : ''
                    }`}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {serverPagination ? (
        <TablePagination
          total={total}
          page={serverPagination.page}
          pageSize={serverPagination.pageSize}
          onPageChange={serverPagination.onPageChange}
          onPageSizeChange={serverPagination.onPageSizeChange}
          pageSizeOptions={pageSizeOptions}
          alwaysShowCount
        />
      ) : (
        <TablePagination
          total={total}
          page={client.page}
          pageSize={client.pageSize}
          onPageChange={client.setPage}
          onPageSizeChange={client.setPageSize}
          pageSizeOptions={pageSizeOptions}
          alwaysShowCount
        />
      )}
    </div>
  )
}
