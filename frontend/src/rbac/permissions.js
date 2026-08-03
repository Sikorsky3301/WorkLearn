// Mirrors backend/app/services/permissions_seed.py's PERMISSION_CATALOG keys.
// Call sites should use these constants instead of raw string literals, so a
// typo'd permission key fails at build time (unresolved import) rather than
// silently always denying access.
export const PERMISSIONS = {
  // User Management
  USERS_VIEW:          'users.view',
  USERS_EDIT:          'users.edit',
  USERS_SUSPEND:       'users.suspend',
  USERS_DELETE:        'users.delete',
  USERS_UNLOCK_FEATURE: 'users.unlock_feature',

  // Simulation Management
  SIMULATIONS_VIEW:    'simulations.view',
  SIMULATIONS_CREATE:  'simulations.create',
  SIMULATIONS_EDIT:    'simulations.edit',
  SIMULATIONS_PUBLISH: 'simulations.publish',
  SIMULATIONS_DELETE:  'simulations.delete',

  // Analytics
  ANALYTICS_VIEW_PLATFORM: 'analytics.view_platform',
  ANALYTICS_VIEW_COHORT:   'analytics.view_cohort',
  ANALYTICS_EXPORT:        'analytics.export',

  // Activity Monitoring
  ACTIVITY_VIEW_FEED:      'activity.view_feed',
  ACTIVITY_VIEW_AUDIT_LOG: 'activity.view_audit_log',

  // Feature Management
  FEATURE_FLAGS_VIEW:   'feature_flags.view',
  FEATURE_FLAGS_MANAGE: 'feature_flags.manage',

  // Admin Management
  ADMINS_VIEW:           'admins.view',
  ADMINS_CREATE:         'admins.create',
  ADMINS_EDIT:           'admins.edit',
  ADMINS_SUSPEND:        'admins.suspend',
  ADMINS_DELETE:         'admins.delete',
  ADMINS_MANAGE_ROLES:   'admins.manage_roles',
  ADMINS_RESET_PASSWORD: 'admins.reset_password',

  // Platform Configuration
  CONFIG_VIEW:   'config.view',
  CONFIG_MANAGE: 'config.manage',
}
