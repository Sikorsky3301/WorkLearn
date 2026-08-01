"""
Platform Configuration Center. Stores AI/Billing/Database config values for
real (persisted, real save/load), but nothing here is yet wired into live
app behavior — see models/platform_config.py's docstring. Gated by
config.view/config.manage (see app/services/permissions_seed.py) —
SUPER_ADMIN bypasses these unconditionally; an ADMIN needs the matching
permission on their assigned AdminRole, same as every other Admin-portal
surface. Given how sensitive these values are (API keys, DB connection
strings, payment credentials), a SuperAdmin should only grant config.* to a
role they actually trust with that access.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.models.platform_config import PlatformConfig
from app.core.dependencies import require_permission
from app.services.audit import log_action, resolve_actor_info
from app.services.platform_config import catalog_meta, CONFIG_CATALOG
from app.schemas.platform_config import ConfigEntryOut, SetConfigBody

router = APIRouter(prefix="/api/admin-management/config", tags=["platform-config"])

VALID_CATEGORIES = {"ai", "billing", "database"}


def _entry_out(row: PlatformConfig | None, meta: dict) -> ConfigEntryOut:
    is_secret = meta["is_secret"]
    has_value = bool(row and row.value)
    return ConfigEntryOut(
        category=meta["category"], key=meta["key"], label=meta["label"], description=meta["description"],
        is_secret=is_secret,
        value=None if is_secret else (row.value if row else meta["seed_value"]),
        value_set=has_value,
        updated_at=row.updated_at if row else None,
        updated_by=row.updated_by if row else None,
    )


@router.get("/{category}", response_model=list[ConfigEntryOut])
async def get_config_category(
    category: str, db: AsyncSession = Depends(get_db), token: dict = Depends(require_permission("config.view")),
):
    if category not in VALID_CATEGORIES:
        raise HTTPException(404, "Unknown config category")
    result = await db.execute(select(PlatformConfig).where(PlatformConfig.category == category))
    rows_by_key = {r.key: r for r in result.scalars().all()}

    out = []
    for meta in CONFIG_CATALOG:
        if meta["category"] != category:
            continue
        out.append(_entry_out(rows_by_key.get(meta["key"]), meta))
    return out


@router.put("/{category}/{key}", response_model=ConfigEntryOut)
async def set_config_value(
    category: str, key: str, body: SetConfigBody,
    db: AsyncSession = Depends(get_db), token: dict = Depends(require_permission("config.manage")),
):
    meta = catalog_meta(category, key)
    if not meta:
        raise HTTPException(404, "Unknown config key")

    result = await db.execute(select(PlatformConfig).where(PlatformConfig.category == category, PlatformConfig.key == key))
    row = result.scalar_one_or_none()
    actor_id, actor_role, actor_name = await resolve_actor_info(token, db)

    if row:
        row.value = body.value
        row.updated_by = actor_id
    else:
        row = PlatformConfig(category=category, key=key, value=body.value, is_secret=meta["is_secret"], updated_by=actor_id)
        db.add(row)

    # Never write a secret's actual value into the audit trail.
    await log_action(
        db, actor_id=actor_id, actor_role=actor_role, actor_name=actor_name,
        action="platform_config.set", target_type="platform_config", target_id=f"{category}.{key}",
        meta={"value": "***redacted***" if meta["is_secret"] else body.value},
    )
    await db.commit()
    await db.refresh(row)
    return _entry_out(row, meta)
