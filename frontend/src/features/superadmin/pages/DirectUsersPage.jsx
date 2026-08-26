import UsersTable from '../../admin/shared/UsersTable'

/** Students who signed up straight to the platform, rather than through a
 *  partner university.
 *
 *  It used to pass `role="DIRECT_USER"`, which is not one of the five role
 *  slugs — and the backend silently ignored any role it did not recognise, so
 *  this page listed EVERY user on the platform, partner students and teachers
 *  included, under a heading saying otherwise. `scope` is the real axis: it
 *  filters on the default (academy) tenant, the same definition
 *  /api/admin/stats has always used for `direct_users`. Unknown role values
 *  are now a 400 rather than a shrug. */
export default function DirectUsersPage() {
  return <UsersTable scope="direct" title="Direct Users" />
}
