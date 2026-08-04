import UniversitiesTable from '../../shared/UniversitiesTable'
import UsersTable from '../../shared/UsersTable'

/**
 * Universities + the teacher (formerly "mentor") accounts tied to them.
 * A separate UNIVERSITY_ADMIN role slug now exists in the schema (see
 * app/models/roles.py) but has no dedicated management surface here yet —
 * this section still only lists TEACHER-role accounts, unchanged in scope
 * from before that role was added.
 */
export default function UniversitiesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-3">Universities</h3>
        <UniversitiesTable />
      </div>
      <div>
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-3">Teachers</h3>
        <UsersTable role="teacher" title="Teachers" />
      </div>
    </div>
  )
}
