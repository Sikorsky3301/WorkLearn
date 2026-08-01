import { useEffect, useState } from 'react'
import { X, Trash2, AlertTriangle, Ban, CheckCircle2 } from 'lucide-react'
import { useUserEnrollments, useDeleteUser, useDeleteEnrollment, useSuspendUser, useActivateUser } from '../../hooks'

/** Shared by both portals' user tables — course enrollments, real
 * suspend/activate (previously only hard delete existed), and delete. */
export default function ManageUserModal({ user, onClose }) {
  const { data, isLoading } = useUserEnrollments(user.id)
  const deleteUser = useDeleteUser()
  const deleteEnrollment = useDeleteEnrollment()
  const suspendUser = useSuspendUser()
  const activateUser = useActivateUser()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const enrollments = data?.enrollments ?? []
  const isActive = user.is_active !== false

  useEffect(() => {
    const onKeyDown = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  const handleDeleteUser = async () => {
    await deleteUser.mutateAsync(user.id)
    onClose()
  }

  const handleToggleSuspend = () => {
    if (isActive) suspendUser.mutate(user.id)
    else activateUser.mutate(user.id)
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="manage-user-title"
      >
        <div className="flex items-start justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 id="manage-user-title" className="font-bold text-slate-900 dark:text-slate-100">{user.name}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              {isActive ? 'Active' : 'Suspended'}
            </span>
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors shrink-0 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-5">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Course Enrollments</p>
          {isLoading ? (
            <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
          ) : enrollments.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center bg-slate-50 dark:bg-slate-800/60 rounded-lg">No enrollments.</p>
          ) : (
            <div className="space-y-2">
              {enrollments.map((e) => (
                <div key={e.id} className="flex items-center justify-between border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{e.simulation_title}</p>
                    <p className="text-xs text-slate-400">
                      {e.status} · {e.completed_tasks}/5 tasks · enrolled {e.enrolled_at}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteEnrollment.mutate(e.id)}
                    disabled={deleteEnrollment.isPending}
                    className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 shrink-0 ml-3 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={handleToggleSuspend}
            disabled={suspendUser.isPending || activateUser.isPending}
            className={`w-full flex items-center justify-center gap-2 text-sm font-semibold rounded-lg px-4 py-2 transition-colors cursor-pointer disabled:opacity-50 ${
              isActive
                ? 'text-amber-700 border border-amber-200 hover:bg-amber-50'
                : 'text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            {isActive ? <Ban className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            {isActive
              ? (suspendUser.isPending ? 'Suspending…' : 'Suspend this user')
              : (activateUser.isPending ? 'Activating…' : 'Reactivate this user')}
          </button>
        </div>

        <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-red-50/50 dark:bg-red-950/20">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide mb-2">
            <AlertTriangle className="h-3.5 w-3.5" /> Danger Zone
          </p>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-sm font-semibold text-red-600 border border-red-200 rounded-lg px-4 py-2 hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
            >
              Delete this user
            </button>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-slate-700 dark:text-slate-300">Permanently delete {user.name} and all their data?</span>
              <button
                onClick={handleDeleteUser}
                disabled={deleteUser.isPending}
                className="text-sm text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg font-semibold disabled:opacity-50 cursor-pointer"
              >
                {deleteUser.isPending ? 'Deleting…' : 'Yes, delete'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
