import { useState } from 'react'
import { Plus, UserPlus } from 'lucide-react'
import UniversitiesTable from '../../shared/UniversitiesTable'
import UsersTable from '../../shared/UsersTable'
import OnboardUniversityModal from '../../shared/OnboardUniversityModal'
import ProvisionUserModal from '../../shared/ProvisionUserModal'

/**
 * Platform Admin — partner university onboard, rename, provision, and teachers list.
 * University Admin uses a separate portal (`/university-admin`), not this page.
 */
export default function UniversitiesPage() {
  const [showOnboard, setShowOnboard] = useState(false)
  const [provisionFor, setProvisionFor] = useState(null)

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Universities</h3>
          <p className="text-xs text-slate-500 mt-0.5">Onboard partners, set subdomain codes, and provision org users.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setProvisionFor({ id: null })}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            <UserPlus className="h-3.5 w-3.5" /> Provision user
          </button>
          <button
            type="button"
            onClick={() => setShowOnboard(true)}
            className="btn-primary inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2"
          >
            <Plus className="h-3.5 w-3.5" /> Onboard University
          </button>
        </div>
      </div>

      <UniversitiesTable onProvision={(u) => setProvisionFor(u)} />

      <div>
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-3">Teachers</h3>
        <UsersTable role="teacher" title="Teachers" />
      </div>

      {showOnboard && <OnboardUniversityModal onClose={() => setShowOnboard(false)} />}
      {provisionFor && (
        <ProvisionUserModal
          defaultUniversityId={provisionFor.id}
          onClose={() => setProvisionFor(null)}
          mode="platform"
        />
      )}
    </div>
  )
}
