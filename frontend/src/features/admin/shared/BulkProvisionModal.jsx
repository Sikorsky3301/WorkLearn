import { useEffect, useState } from 'react'
import { X, Loader2, AlertCircle, Download, Upload } from 'lucide-react'
import { useBulkProvisionUsers, downloadProvisionTemplate } from '../../../hooks'

/**
 * Bulk provision from .xlsx / .csv.
 * Platform Admin: university_code column per row; roles student | teacher | university_admin.
 * University Admin: own org only (no university_code); student | teacher only.
 */
export default function BulkProvisionModal({ onClose, mode = 'platform' }) {
  const isUniAdmin = mode === 'university_admin'
  const bulk = useBulkProvisionUsers()

  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  const handleDownload = async () => {
    setError('')
    setDownloading(true)
    try {
      await downloadProvisionTemplate()
    } catch (err) {
      setError(err.message || 'Template download failed')
    } finally {
      setDownloading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setResult(null)
    if (!file) {
      setError('Choose an .xlsx or .csv file')
      return
    }
    try {
      const data = await bulk.mutateAsync({ file })
      setResult(data)
    } catch (err) {
      setError(err.message || 'Bulk upload failed')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4" onClick={onClose} role="presentation">
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-provision-title"
      >
        <div className="flex items-start justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 id="bulk-provision-title" className="font-bold text-slate-900 dark:text-slate-100">Bulk upload</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Download template (includes sample rows) → edit → upload.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 rounded-lg px-3 py-2">
            {isUniAdmin
              ? 'Users are added to your university only. Roles: student, teacher. Template has no university_code — you cannot provision into another org.'
              : 'Each row needs university_code (e.g. iitd). Roles: student, teacher, university_admin. Cannot add admin or super_admin.'}
          </p>

          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer"
          >
            {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            Download Excel template
          </button>

          {!result ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">File (.xlsx or .csv)</label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary"
                />
              </div>

              {error && (
                <p role="alert" className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  {error}
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer">Cancel</button>
                <button type="submit" disabled={bulk.isPending} className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2">
                  {bulk.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {bulk.isPending ? 'Uploading…' : 'Upload'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Created <strong>{result.summary?.created ?? 0}</strong> of <strong>{result.summary?.total ?? 0}</strong>
                {(result.summary?.failed ?? 0) > 0 && (
                  <> · <span className="text-red-600">{result.summary.failed} failed</span></>
                )}
              </p>
              {(result.errors?.length ?? 0) > 0 && (
                <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg text-xs">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0">
                      <tr>
                        <th className="text-left px-2 py-1.5">Row</th>
                        <th className="text-left px-2 py-1.5">Email</th>
                        <th className="text-left px-2 py-1.5">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.errors.map((err, i) => (
                        <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
                          <td className="px-2 py-1.5">{err.row}</td>
                          <td className="px-2 py-1.5 font-mono truncate max-w-[8rem]">{err.email || '—'}</td>
                          <td className="px-2 py-1.5 text-red-600">{err.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <button type="button" onClick={onClose} className="btn-primary w-full py-2.5 text-sm">Done</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
