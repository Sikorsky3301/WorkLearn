import { useEffect, useMemo, useState } from 'react'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '../../../components/ui/shadcn/dialog'
import { Button } from '../../../components/ui/shadcn/button'
import { useAdminUniversities } from '../../../hooks'

/** Admin-only: choose All universities or multi-select before publish / scope edit. */
export default function PublishScopeModal({
  open,
  onOpenChange,
  onConfirm,
  confirming = false,
  title = 'Publish to universities',
  confirmLabel = 'Publish',
  initialAvailableToAll = true,
  initialUniversityIds = [],
}) {
  const { data, isLoading } = useAdminUniversities({ enabled: open })
  const universities = useMemo(
    () => (Array.isArray(data) ? data : data?.universities ?? []),
    [data],
  )
  const [mode, setMode] = useState(initialAvailableToAll ? 'all' : 'selected')
  const [selected, setSelected] = useState(() => new Set(initialUniversityIds))

  useEffect(() => {
    if (!open) return
    setMode(initialAvailableToAll ? 'all' : 'selected')
    setSelected(new Set(initialUniversityIds))
  }, [open, initialAvailableToAll, initialUniversityIds])

  function toggleUni(id) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleConfirm() {
    if (mode === 'all') {
      onConfirm({ available_to_all: true, university_ids: [] })
      return
    }
    const university_ids = [...selected]
    if (university_ids.length === 0) return
    onConfirm({ available_to_all: false, university_ids })
  }

  const canConfirm = mode === 'all' || selected.size > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Choose which university tenants can see this simulation in their student catalog.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-border p-3 hover:bg-surface-low">
            <input
              type="radio"
              name="publish-scope"
              checked={mode === 'all'}
              onChange={() => setMode('all')}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-semibold text-on-surface">All universities</span>
              <span className="block text-xs text-on-surface-variant mt-0.5">Visible on the academy and every partner host.</span>
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-border p-3 hover:bg-surface-low">
            <input
              type="radio"
              name="publish-scope"
              checked={mode === 'selected'}
              onChange={() => setMode('selected')}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-semibold text-on-surface">Selected universities</span>
              <span className="block text-xs text-on-surface-variant mt-0.5">Only the partners you pick below.</span>
            </span>
          </label>

          {mode === 'selected' && (
            <div className="max-h-48 overflow-y-auto rounded-lg border border-border divide-y divide-border">
              {isLoading ? (
                <p className="text-xs text-on-surface-variant p-3">Loading universities…</p>
              ) : universities.length === 0 ? (
                <p className="text-xs text-on-surface-variant p-3">No universities found.</p>
              ) : (
                universities.map((u) => (
                  <label key={u.id} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-surface-low">
                    <input
                      type="checkbox"
                      checked={selected.has(u.id)}
                      onChange={() => toggleUni(u.id)}
                    />
                    <span className="text-sm text-on-surface">
                      {u.name}
                      {u.is_default ? ' (Academy)' : u.code ? ` (${u.code})` : ''}
                    </span>
                  </label>
                ))
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={confirming}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={!canConfirm || confirming}>
            {confirming ? 'Saving…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
