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
      <div className="flex flex-wrap items-end justify-between gap-3 border-t-2 border-slate-900 pt-4 dark:border-slate-100">
        <div>
          <h1 className="font-display text-[1.4rem] font-extrabold leading-tight tracking-tight text-slate-900 dark:text-slate-100">
            Universities
          </h1>
          <p className="mt-1 text-[0.8rem] text-slate-500 dark:text-slate-400">Partner tenants, their sign-in hosts, and the people in them.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setProvisionFor({ id: null })}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
          >
            <UserPlus className="h-3.5 w-3.5" /> Provision user
          </button>
          <button
            type="button"
            onClick={() => setShowOnboard(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-primary dark:hover:text-white cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> Onboard University
          </button>
        </div>
      </div>

      <UniversitiesTable onProvision={(u) => setProvisionFor(u)} />

      <div>
        <h2 className="mb-3 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
          Teachers across all partners
        </h2>
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
