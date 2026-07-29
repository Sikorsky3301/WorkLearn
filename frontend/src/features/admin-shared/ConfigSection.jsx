import { useState } from 'react'
import { Check, Save } from 'lucide-react'
import { usePlatformConfig, useSetPlatformConfig } from '../../shared/api/hooks'

/** Renders one Configuration Center category (AI / Billing / Database) —
 * real save/load against PlatformConfig rows. Secrets are write-only: the
 * backend never returns an already-set secret's value, only whether one is
 * stored. */
export default function ConfigSection({ category, noticeText }) {
  const { data: entries, isLoading } = usePlatformConfig(category)
  const setConfig = useSetPlatformConfig(category)

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {noticeText && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-400">
          {noticeText}
        </p>
      )}
      <div className="space-y-2">
        {(entries ?? []).map((entry) => (
          <ConfigRow
            key={entry.key}
            entry={entry}
            onSave={(value) => setConfig.mutateAsync({ key: entry.key, value })}
          />
        ))}
      </div>
    </div>
  )
}

function ConfigRow({ entry, onSave }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(entry.is_secret ? '' : (entry.value ?? ''))
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(value)
      setEditing(false)
      setSavedFlash(true)
      setTimeout(() => setSavedFlash(false), 1500)
      if (entry.is_secret) setValue('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{entry.label}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{entry.description}</p>
        </div>
        {entry.is_secret && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${entry.value_set ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
            {entry.value_set ? 'Set' : 'Not set'}
          </span>
        )}
      </div>

      {entry.is_secret && !editing ? (
        <button onClick={() => setEditing(true)} className="text-xs font-semibold text-primary hover:underline cursor-pointer">
          {entry.value_set ? 'Change value' : 'Set value'}
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <input
            type={entry.is_secret ? 'password' : 'text'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={entry.is_secret ? 'Enter new value' : ''}
            className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-primary text-slate-900 dark:text-slate-100"
          />
          <button
            onClick={handleSave}
            disabled={saving || !value}
            className="flex items-center gap-1 text-xs font-semibold text-white bg-primary px-3 py-1.5 rounded-lg hover:bg-primary-dark disabled:opacity-50 cursor-pointer shrink-0"
          >
            {savedFlash ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
            {savedFlash ? 'Saved' : saving ? 'Saving…' : 'Save'}
          </button>
          {entry.is_secret && (
            <button onClick={() => setEditing(false)} className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer shrink-0">
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  )
}
