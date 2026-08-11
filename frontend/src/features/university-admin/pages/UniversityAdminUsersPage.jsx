import { useState } from 'react'
import { UserPlus, Upload } from 'lucide-react'
import UsersTable from '../../admin/shared/UsersTable'
import ProvisionUserModal from '../../admin/shared/ProvisionUserModal'
import BulkProvisionModal from '../../admin/shared/BulkProvisionModal'

export default function UniversityAdminUsersPage() {
  const [showProvision, setShowProvision] = useState(false)
  const [showBulk, setShowBulk] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Students & teachers</h3>
          <p className="text-xs text-slate-500 mt-0.5">Org-scoped list for your university only.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowBulk(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5" /> Bulk upload
          </button>
          <button
            type="button"
            onClick={() => setShowProvision(true)}
            className="btn-primary inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2"
          >
            <UserPlus className="h-3.5 w-3.5" /> Provision user
          </button>
        </div>
      </div>
      <UsersTable title="Users" />
      {showProvision && (
        <ProvisionUserModal mode="university_admin" onClose={() => setShowProvision(false)} />
      )}
      {showBulk && (
        <BulkProvisionModal mode="university_admin" onClose={() => setShowBulk(false)} />
      )}
    </div>
  )
}
