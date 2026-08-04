"""
Feature-flag catalog, seeding, and resolution.
Role overrides use role slugs (student, teacher, ...).
University overrides match universities.code via the user's university join.
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert as pg_insert
from app.models import User
from app.models.roles import RoleSlug
from app.models.feature_flags import FeatureFlag, FeatureFlagOverride

FEATURE_FLAG_CATALOG: list[dict] = [
    {"key": "python_sandbox", "label": "Python Sandbox", "category": "Core",
     "description": "Run and execute Python code in an isolated sandbox."},
    {"key": "model_solution", "label": "Model Solution Reveal", "category": "Core",
     "description": "Reveal the reference solution after an attempt."},
    {"key": "certificate", "label": "Certificate Issue", "category": "Core",
     "description": "Issue a completion certificate for finished simulations."},
    {"key": "all_courses", "label": "Full Course Catalog", "category": "Core",
     "description": "Browse and enroll in every published simulation."},
    {"key": "download_dataset", "label": "Dataset Download", "category": "Core",
     "description": "Download the raw dataset behind a data task."},
    {"key": "assign_tasks", "label": "Task Assignment", "category": "Core",
     "description": "Assign specific tasks to individual students."},
]

# Independent students (default university) get the open catalog; university-
# provisioned students are tightened via university overrides if needed.
ROLE_DEFAULTS: dict[str, dict[str, bool]] = {
    RoleSlug.STUDENT: {
        "python_sandbox": True, "download_dataset": True, "model_solution": True,
        "certificate": True, "all_courses": True, "assign_tasks": False,
    },
    RoleSlug.TEACHER: {
        "python_sandbox": True, "download_dataset": True, "model_solution": True,
        "certificate": True, "all_courses": True, "assign_tasks": True,
    },
}


async def seed_feature_flags(db: AsyncSession) -> None:
    for flag in FEATURE_FLAG_CATALOG:
        stmt = pg_insert(FeatureFlag).values(**flag, enabled_default=False).on_conflict_do_update(
            index_elements=["key"],
            set_={"label": flag["label"], "description": flag["description"], "category": flag["category"]},
        )
        await db.execute(stmt)

    for role, flags in ROLE_DEFAULTS.items():
        for key, enabled in flags.items():
            stmt = pg_insert(FeatureFlagOverride).values(
                flag_key=key, scope_type="role", scope_value=role, enabled=enabled,
            ).on_conflict_do_nothing(index_elements=["flag_key", "scope_type", "scope_value"])
            await db.execute(stmt)

    await db.commit()


async def resolve_feature_flags(db: AsyncSession, user: User) -> dict[str, bool]:
    flags_res = await db.execute(select(FeatureFlag))
    resolved = {f.key: f.enabled_default for f in flags_res.scalars().all()}

    overrides_res = await db.execute(select(FeatureFlagOverride))
    overrides = overrides_res.scalars().all()
    role_val = user.role
    uni_code = user.university.code if user.university else None

    for o in overrides:
        if o.scope_type == "role" and o.scope_value == role_val:
            resolved[o.flag_key] = o.enabled
    for o in overrides:
        if o.scope_type == "university" and uni_code and o.scope_value == uni_code:
            resolved[o.flag_key] = o.enabled
    for o in overrides:
        if o.scope_type == "user" and o.scope_value == str(user.id):
            resolved[o.flag_key] = o.enabled

    return resolved
