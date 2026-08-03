// Values match the backend Role enum (uppercase) — see
// backend/app/models/__init__.py's `Role`.
export const ROLES = {
  DIRECT_USER:        'DIRECT_USER',
  UNIVERSITY_STUDENT: 'UNIVERSITY_STUDENT',
  CLASS_MENTOR:       'CLASS_MENTOR',
  SUPER_ADMIN:        'SUPER_ADMIN',
  // Fine-grained-permission admin tier, distinct from SUPER_ADMIN — see
  // backend's app/models/rbac.py. Real enforcement is always server-side
  // (require_permission); permission checks below are a UI-nav convenience only.
  ADMIN:              'ADMIN',
}
