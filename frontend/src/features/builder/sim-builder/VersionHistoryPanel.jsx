import { useState } from 'react'
import { History, RotateCcw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useSimBuilderVersions, useRestoreSimBuilderVersion } from '../../../hooks'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../../../components/ui/shadcn/sheet'

/** Toolbar "Version History" — lists snapshots created by Publish, with a
 * confirm-before-restore step (destructive: replaces the live draft).
 * v1 is whole-snapshot based, not a field-level diff. */
export default function VersionHistoryPanel({ projectId, onClose }) {
  const { data, isLoading } = useSimBuilderVersions(projectId)
  const restoreVersion = useRestoreSimBuilderVersion(projectId)
  const [confirmId, setConfirmId] = useState(null)

  const versions = data?.versions ?? []

  function handleRestore(versionId) {
    restoreVersion.mutate(versionId, {
      onSuccess: () => { toast.success('Version restored'); setConfirmId(null); onClose() },
      onError: (e) => toast.error(e?.message || 'Could not restore this version'),
    })
  }

  return (
    <Sheet open onOpenChange={(next) => !next && onClose()}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2"><History className="h-4 w-4" /> Version History</SheetTitle>
          <SheetDescription>Every Publish creates a snapshot. Restoring replaces the current draft with that snapshot.</SheetDescription>
        </SheetHeader>

        <div className="mt-2 space-y-2 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="h-24 bg-surface-high rounded-lg animate-pulse" />
          ) : versions.length === 0 ? (
            <p className="text-sm text-on-surface-variant text-center py-8">No published versions yet.</p>
          ) : (
            versions.map((v) => (
              <div key={v.id} className="flex items-center justify-between border border-border rounded-lg px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-on-surface truncate">{v.label || `Version ${v.version_number}`}</p>
                  <p className="text-xs text-outline">{new Date(v.created_at).toLocaleString()}</p>
                </div>
                {confirmId === v.id ? (
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <button
                      onClick={() => handleRestore(v.id)}
                      disabled={restoreVersion.isPending}
                      className="text-xs font-semibold text-white bg-primary px-2 py-1 rounded cursor-pointer disabled:opacity-50"
                    >
                      {restoreVersion.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Confirm'}
                    </button>
                    <button onClick={() => setConfirmId(null)} className="text-xs text-on-surface-variant cursor-pointer">Cancel</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmId(v.id)}
                    className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer shrink-0 ml-2"
                  >
                    <RotateCcw className="h-3 w-3" /> Restore
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
