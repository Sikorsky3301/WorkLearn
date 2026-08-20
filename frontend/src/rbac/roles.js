// Values match the backend's RoleSlug (lowercase) — see
// backend/app/models/roles.py. DIRECT_USER and UNIVERSITY_STUDENT from the
// old taxonomy are merged into one STUDENT slug now (independent vs.
// university-affiliated is distinguished by user.university.is_default,
// not by the role itself); CLASS_MENTOR was renamed to TEACHER;
// UNIVERSITY_ADMIN is new.
export const ROLES = {
  STUDENT:          'student',
  TEACHER:          'teacher',
  UNIVERSITY_ADMIN: 'university_admin',
  SUPER_ADMIN:      'super_admin',
  // Platform admin tier, distinct from SUPER_ADMIN — see backend's
  // app/models/roles.py. Real enforcement is always server-side
  // (require_permission); permission checks below are a UI-nav convenience only.
  ADMIN:            'admin',
}

/** Default authenticated landing path per role — mirrors ProtectedRoute redirects. */
export function portalPathForRole(role) {
  switch (role) {
    case ROLES.SUPER_ADMIN: return '/super-admin'
    case ROLES.ADMIN: return '/admin'
    case ROLES.UNIVERSITY_ADMIN: return '/university-admin'
    case ROLES.TEACHER: return '/mentor'
    default: return '/dashboard'
  }
}
