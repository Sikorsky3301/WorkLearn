import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useUnlockFeature, useRevokeFeature } from '../../../hooks'
import { FEATURE_LABELS, GRANTABLE_FEATURES, initials } from './mentorUtils'

export default function UnlockFeaturesModal({ student, onClose }) {
  const { mutate: grantFeature, isPending: granting, variables: grantVars } = useUnlockFeature()
  const { mutate: revokeFeature, isPending: revoking, variables: revokeVars } = useRevokeFeature()

  useEffect(() => {
    const onKeyDown = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKeyDown)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prev
    }
  }, [onClose])

  const pendingFeature = granting ? grantVars?.feature : revoking ? revokeVars?.feature : null

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="unlock-features-title"
      >
        <div className="flex items-start justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
              {initials(student.name)}
            </div>
            <div className="min-w-0">
              <h3 id="unlock-features-title" className="font-bold text-slate-900 dark:text-slate-100 truncate">{student.name}</h3>
              <p className="text-xs text-slate-500 font-mono">{student.roll_no}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Grant or revoke feature access. University students start with limited features by default.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {GRANTABLE_FEATURES.map((f) => {
              const has = (student.unlocked || []).includes(f)
              const busy = pendingFeature === f
              return (
                <button
                  key={f}
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (has) revokeFeature({ studentId: student.id, feature: f })
                    else grantFeature({ studentId: student.id, feature: f })
                  }}
                  className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors cursor-pointer disabled:opacity-50 ${
                    has
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-red-50 hover:border-red-200 hover:text-red-600'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-primary/5 hover:border-primary hover:text-primary'
                  }`}
                >
                  {has ? '✓ ' : '+ '}{FEATURE_LABELS[f]}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
