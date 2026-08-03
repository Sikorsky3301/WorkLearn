"""
Seeded permission catalog for the ADMIN tier. A new permission is added by a
code change here (like app/services/task_types.py's TASK_TYPES tuple), not a
migration — `seed_permissions` upserts by `key` on every startup, so adding a
row is safe to run against a database that already has older rows.

Only `users.*`, `admins.*`, and `activity.view_feed` are actually enforced by
an endpoint in Phase 1 (see app/api/v1/admin/admin.py, app/api/v1/superadmin/admin_management.py).
The rest are seeded now — categorized per the platform's requested capability
list — so Phase 2 (feature flags, platform analytics) and later simulation-
management delegation can gate against them without a schema change.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert as pg_insert
from app.models.rbac import Permission, AdminRole, AdminRolePermission
from app.models import new_uuid

PERMISSION_CATALOG: list[dict] = [
    # User Management
    {"key": "users.view", "category": "User Management", "label": "View users",
     "description": "View user lists, profiles, and enrollment/activity history."},
    {"key": "users.edit", "category": "User Management", "label": "Edit users",
     "description": "Edit a user's profile fields."},
    {"key": "users.suspend", "category": "User Management", "label": "Suspend / activate users",
     "description": "Suspend or reactivate a user's account."},
    {"key": "users.delete", "category": "User Management", "label": "Delete users",
     "description": "Permanently delete a user and their data."},
    {"key": "users.unlock_feature", "category": "User Management", "label": "Unlock features for users",
     "description": "Grant a per-user feature unlock."},

    # Simulation Management
    {"key": "simulations.view", "category": "Simulation Management", "label": "View simulations",
     "description": "View job simulation content and configuration."},
    {"key": "simulations.create", "category": "Simulation Management", "label": "Create simulations",
     "description": "Create new job simulations."},
    {"key": "simulations.edit", "category": "Simulation Management", "label": "Edit simulations",
     "description": "Edit existing job simulation content."},
    {"key": "simulations.publish", "category": "Simulation Management", "label": "Publish simulations",
     "description": "Publish or unpublish a simulation."},
    {"key": "simulations.delete", "category": "Simulation Management", "label": "Delete simulations",
     "description": "Delete a job simulation."},

    # Analytics
    {"key": "analytics.view_platform", "category": "Analytics", "label": "View platform analytics",
     "description": "View platform-wide analytics (ships Phase 2)."},
    {"key": "analytics.view_cohort", "category": "Analytics", "label": "View cohort analytics",
     "description": "View per-university/cohort analytics (ships Phase 2)."},
    {"key": "analytics.export", "category": "Analytics", "label": "Export analytics",
     "description": "Export analytics data (ships Phase 2)."},

    # Activity Monitoring
    {"key": "activity.view_feed", "category": "Activity Monitoring", "label": "View activity feed",
     "description": "View the live platform activity feed."},
    {"key": "activity.view_audit_log", "category": "Activity Monitoring", "label": "View audit log",
     "description": "View the admin action audit log."},

    # Feature Management
    {"key": "feature_flags.view", "category": "Feature Management", "label": "View feature flags",
     "description": "View feature flag state (ships Phase 2)."},
    {"key": "feature_flags.manage", "category": "Feature Management", "label": "Manage feature flags",
     "description": "Enable/disable feature flags (ships Phase 2)."},

    # Admin Management
    {"key": "admins.view", "category": "Admin Management", "label": "View admins",
     "description": "View the list of Admin-tier users."},
    {"key": "admins.create", "category": "Admin Management", "label": "Create admins",
     "description": "Create new Admin-tier users."},
    {"key": "admins.edit", "category": "Admin Management", "label": "Edit admins",
     "description": "Edit an Admin's profile or role assignment."},
    {"key": "admins.suspend", "category": "Admin Management", "label": "Suspend / activate admins",
     "description": "Suspend or reactivate an Admin's account."},
    {"key": "admins.delete", "category": "Admin Management", "label": "Delete admins",
     "description": "Permanently delete an Admin account."},
    {"key": "admins.manage_roles", "category": "Admin Management", "label": "Manage roles & permissions",
     "description": "Create/edit custom AdminRoles and assign permissions."},
    {"key": "admins.reset_password", "category": "Admin Management", "label": "Reset admin passwords",
     "description": "Reset another Admin's password."},

    # Platform Configuration
    {"key": "config.view", "category": "Platform Configuration", "label": "View platform configuration",
     "description": "View the Configuration Center (AI provider, billing provider, database settings)."},
    {"key": "config.manage", "category": "Platform Configuration", "label": "Manage platform configuration",
     "description": "Change values in the Configuration Center — API keys, credentials, and settings."},
]

BUILTIN_ROLE_NAME = "Administrator"


async def seed_permissions(db: AsyncSession) -> None:
    """Idempotent — upserts the catalog by key, then makes sure one built-in
    'Administrator' AdminRole exists holding every seeded permission (so the
    first real Admin created always has something sensible to assign)."""
    for perm in PERMISSION_CATALOG:
        stmt = pg_insert(Permission).values(**perm).on_conflict_do_update(
            index_elements=["key"],
            set_={"category": perm["category"], "label": perm["label"], "description": perm["description"]},
        )
        await db.execute(stmt)

    existing = await db.execute(
        AdminRole.__table__.select().where(AdminRole.name == BUILTIN_ROLE_NAME)
    )
    role_row = existing.first()
    if role_row is None:
        role_id = new_uuid()
        db.add(AdminRole(id=role_id, name=BUILTIN_ROLE_NAME, description="Full administrative access.", is_builtin=True))
        await db.flush()
    else:
        role_id = role_row.id

    for perm in PERMISSION_CATALOG:
        stmt = pg_insert(AdminRolePermission).values(role_id=role_id, permission_key=perm["key"]).on_conflict_do_nothing()
        await db.execute(stmt)

    await db.commit()
