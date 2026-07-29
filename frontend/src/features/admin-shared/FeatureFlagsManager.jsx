import { useState } from 'react'
import { Plus, Flag, X, Trash2 } from 'lucide-react'
import {
  useFeatureFlags, useCreateFeatureFlag, useUpdateFeatureFlag, useDeleteFeatureFlag,
  useFlagOverrides, useSetFlagOverride, useDeleteFlagOverride,
} from '../../shared/api/hooks'
import DataTable from '../../shared/design-system/DataTable'
import PermissionGate from '../../shared/design-system/PermissionGate'

const ROLE_OPTIONS = ['DIRECT_USER', 'UNIVERSITY_STUDENT', 'CLASS_MENTOR', 'ADMIN']

/** Real, DB-backed feature-flag manager — global default + role/university/
 * user overrides. Used by both portals (gated by feature_flags.view/.manage
 * permissions). Replaces the old hardcoded ROLE_FEATURES map. */
export default function FeatureFlagsManager() {
  const { data: flags, isLoading } = useFeatureFlags()
  const [showCreate, setShowCreate] = useState(false)
  const [editingFlag, setEditingFlag] = useState(null)

  const columns = [
    {
      key: 'label', header: 'Flag', render: (f) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-900 dark:text-slate-100">{f.label}</span>
          {f.is_beta && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">Beta</span>}
        </div>
      ),
    },
    { key: 'category', header: 'Category' },
    {
      key: 'enabled_default', header: 'Default', render: (f) => (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${f.enabled_default ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
          {f.enabled_default ? 'On' : 'Off'}
        </span>
      ),
    },
    { key: 'override_count', header: 'Overrides', render: (f) => `${f.override_count} scoped` },
    {
      key: 'actions', header: '', render: (f) => (
        <button onClick={() => setEditingFlag(f)} className="text-xs font-semibold text-primary hover:underline cursor-pointer">
          Edit
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Global default plus per-role/university/user overrides — replaces the old hardcoded role defaults.
        </p>
        <PermissionGate need="feature_flags.manage">
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 text-sm font-semibold bg-primary text-white px-3 py-2 rounded-lg hover:bg-primary-dark transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" /> New Flag
          </button>
        </PermissionGate>
      </div>

      <DataTable columns={columns} rows={flags} loading={isLoading} emptyIcon={Flag} emptyTitle="No feature flags yet" />

      {showCreate && <FlagFormModal onClose={() => setShowCreate(false)} />}
      {editingFlag && <FlagDetailModal flag={editingFlag} onClose={() => setEditingFlag(null)} />}
    </div>
  )
}

function FlagFormModal({ onClose }) {
  const createFlag = useCreateFeatureFlag()
  const [key, setKey] = useState('')
  const [label, setLabel] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Beta')
  const [isBeta, setIsBeta] = useState(true)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await createFlag.mutateAsync({
        key: key.trim(), label: label.trim(), description, category,
        is_beta: isBeta, enabled_default: false,
      })
      onClose()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-xl p-5 space-y-3"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-slate-100">New Feature Flag</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
        <input
          value={key} onChange={(e) => setKey(e.target.value)} required placeholder="key (e.g. new_dashboard)"
          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary text-slate-900 dark:text-slate-100"
        />
        <input
          value={label} onChange={(e) => setLabel(e.target.value)} required placeholder="Label"
          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary text-slate-900 dark:text-slate-100"
        />
        <input
          value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description"
          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary text-slate-900 dark:text-slate-100"
        />
        <input
          value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category"
          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary text-slate-900 dark:text-slate-100"
        />
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
          <input type="checkbox" checked={isBeta} onChange={(e) => setIsBeta(e.target.checked)} /> Beta rollout
        </label>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          type="submit" disabled={createFlag.isPending}
          className="w-full bg-primary text-white text-sm font-semibold py-2 rounded-lg hover:bg-primary-dark disabled:opacity-50 cursor-pointer"
        >
          {createFlag.isPending ? 'Creating…' : 'Create Flag'}
        </button>
      </form>
    </div>
  )
}

function FlagDetailModal({ flag, onClose }) {
  const updateFlag = useUpdateFeatureFlag(flag.key)
  const deleteFlag = useDeleteFeatureFlag()
  const { data: overrides, isLoading: overridesLoading } = useFlagOverrides(flag.key)
  const setOverride = useSetFlagOverride(flag.key)
  const deleteOverride = useDeleteFlagOverride(flag.key)

  const [enabledDefault, setEnabledDefault] = useState(flag.enabled_default)
  const [scopeType, setScopeType] = useState('role')
  const [scopeValue, setScopeValue] = useState(ROLE_OPTIONS[0])
  const [scopeEnabled, setScopeEnabled] = useState(true)

  const handleToggleDefault = (val) => {
    setEnabledDefault(val)
    updateFlag.mutate({ enabled_default: val })
  }

  const handleAddOverride = (e) => {
    e.preventDefault()
    setOverride.mutate({ scope_type: scopeType, scope_value: scopeValue, enabled: scopeEnabled })
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100">{flag.label}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{flag.description}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="flex items-center justify-between text-sm">
          <span className="text-slate-700 dark:text-slate-300">Global default</span>
          <button
            onClick={() => handleToggleDefault(!enabledDefault)}
            role="switch" aria-checked={enabledDefault}
            className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer ${enabledDefault ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabledDefault ? 'translate-x-5' : ''}`} />
          </button>
        </label>

        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Overrides</p>
          {overridesLoading ? (
            <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
          ) : (overrides ?? []).length === 0 ? (
            <p className="text-xs text-slate-400 mb-2">No scoped overrides — everyone gets the global default.</p>
          ) : (
            <div className="space-y-1.5 mb-3">
              {overrides.map((o) => (
                <div key={o.id} className="flex items-center justify-between text-sm border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2">
                  <span className="text-slate-700 dark:text-slate-300">
                    <span className="font-semibold">{o.scope_type}</span>: {o.scope_value} → {o.enabled ? 'On' : 'Off'}
                  </span>
                  <button onClick={() => deleteOverride.mutate(o.id)} className="text-red-500 hover:text-red-700 cursor-pointer">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleAddOverride} className="flex items-center gap-2 flex-wrap">
            <select
              value={scopeType}
              onChange={(e) => { setScopeType(e.target.value); setScopeValue(e.target.value === 'role' ? ROLE_OPTIONS[0] : '') }}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs outline-none text-slate-900 dark:text-slate-100"
            >
              <option value="role">Role</option>
              <option value="university">University code</option>
              <option value="user">User id</option>
            </select>
            {scopeType === 'role' ? (
              <select
                value={scopeValue} onChange={(e) => setScopeValue(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs outline-none text-slate-900 dark:text-slate-100"
              >
                {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            ) : (
              <input
                value={scopeValue} onChange={(e) => setScopeValue(e.target.value)} required
                placeholder={scopeType === 'university' ? 'institution code' : 'user id'}
                className="flex-1 min-w-[120px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs outline-none text-slate-900 dark:text-slate-100"
              />
            )}
            <select
              value={scopeEnabled ? 'on' : 'off'} onChange={(e) => setScopeEnabled(e.target.value === 'on')}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs outline-none text-slate-900 dark:text-slate-100"
            >
              <option value="on">On</option>
              <option value="off">Off</option>
            </select>
            <button
              type="submit" disabled={setOverride.isPending || !scopeValue}
              className="text-xs font-semibold text-primary border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-primary/5 disabled:opacity-50 cursor-pointer"
            >
              Add
            </button>
          </form>
        </div>

        <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={async () => { await deleteFlag.mutateAsync(flag.key); onClose() }}
            className="flex items-center gap-1.5 text-sm font-semibold text-red-600 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete this flag
          </button>
        </div>
      </div>
    </div>
  )
}
