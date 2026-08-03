import UniversitiesTable from '../../shared/UniversitiesTable'
import UsersTable from '../../shared/UsersTable'

/**
 * Universities + the mentor accounts tied to them. CLASS_MENTOR is the only
 * university-side administrative role this platform has (there's no
 * separate "university admin" role in the schema), so managing mentors here
 * — search, suspend/activate, delete — is what "manage university admins
 * and mentors" means in practice.
 */
export default function UniversitiesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-3">Universities</h3>
        <UniversitiesTable />
      </div>
      <div>
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-3">University Admins &amp; Mentors</h3>
        <UsersTable role="CLASS_MENTOR" title="Mentors" />
      </div>
    </div>
  )
}
