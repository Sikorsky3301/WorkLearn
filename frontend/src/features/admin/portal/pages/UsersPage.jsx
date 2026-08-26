import { useState } from 'react'
import { UserPlus, Upload } from 'lucide-react'
import UsersTable from '../../shared/UsersTable'
import ProvisionUserModal from '../../shared/ProvisionUserModal'
import BulkProvisionModal from '../../shared/BulkProvisionModal'

export default function UsersPage() {
  const [showProvision, setShowProvision] = useState(false)
  const [showBulk, setShowBulk] = useState(false)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 border-t-2 border-slate-900 pt-4 dark:border-slate-100">
        <div>
          <h1 className="font-display text-[1.4rem] font-extrabold leading-tight tracking-tight text-slate-900 dark:text-slate-100">
            Users
          </h1>
          <p className="mt-1 text-[0.8rem] text-slate-500 dark:text-slate-400">Every account on the platform. Search covers name, email and roll number.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowBulk(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5" /> Bulk upload
          </button>
          <button
            type="button"
            onClick={() => setShowProvision(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-primary dark:hover:text-white cursor-pointer"
          >
            <UserPlus className="h-3.5 w-3.5" /> Provision user
          </button>
        </div>
      </div>
      <UsersTable title="Users" showRoleFilter />
      {showProvision && (
        <ProvisionUserModal mode="platform" onClose={() => setShowProvision(false)} />
      )}
      {showBulk && (
        <BulkProvisionModal mode="platform" onClose={() => setShowBulk(false)} />
      )}
    </div>
  )
}
