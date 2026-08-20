import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export const DEFAULT_PAGE_SIZE = 10
export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50]

/** Client-side page slice for a full in-memory list. Resets to page 1 when
 * the list length or page size changes; clamps if the current page is past
 * the last page (e.g. after a search shrinks the list). */
export function useClientPagination(rows, { pageSize: initialPageSize = DEFAULT_PAGE_SIZE, resetKey } = {}) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const list = rows ?? []
  const total = list.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1)

  useEffect(() => {
    setPage(1)
  }, [total, pageSize, resetKey])

  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * pageSize
  const pageRows = list.slice(start, start + pageSize)

  return { page: safePage, setPage, pageSize, setPageSize, pageRows, total, totalPages }
}

function pageNumbers(current, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  const pages = new Set([1, totalPages, current, current - 1, current + 1])
  return [...pages].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b)
}

/** Footer: “Showing X–Y of N”, page-size select, prev/next + compact pages.
 * Hidden when there is only one page. */
export default function TablePagination({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1)
  if (totalPages <= 1) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const numbers = pageNumbers(page, totalPages)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/40 text-xs text-slate-500 dark:text-slate-400">
      <p className="tabular-nums">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1.5">
          <span>Rows</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-1.5 py-1 text-xs outline-none text-slate-700 dark:text-slate-200"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {numbers.map((n, i) => (
            <span key={n} className="flex items-center">
              {i > 0 && numbers[i - 1] !== n - 1 && (
                <span className="px-1 text-slate-400">…</span>
              )}
              <button
                type="button"
                onClick={() => onPageChange(n)}
                className={`min-w-7 h-7 px-1.5 rounded-md cursor-pointer ${
                  n === page
                    ? 'bg-primary text-white font-semibold'
                    : 'hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {n}
              </button>
            </span>
          ))}
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
