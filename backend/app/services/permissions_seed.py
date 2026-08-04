"""
Permission catalog seed — REMOVED.

AdminRole / Permission tables no longer exist. Platform access is by role
slug (see app.models.roles.RoleSlug and app.core.permissions).

Roles + default universities are seeded by:
    app.services.roles_seed.seed_roles_and_universities
"""
