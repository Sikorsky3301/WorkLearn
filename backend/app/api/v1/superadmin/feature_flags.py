"""Admin-facing CRUD for the real feature-flag system — gated by the
Feature Management permission category (feature_flags.view / .manage)."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.models.feature_flags import FeatureFlag, FeatureFlagOverride
from app.core.permissions import require_permission
from app.services.audit import log_action, resolve_actor_info
from app.schemas.feature_flags import (
    FeatureFlagCreate, FeatureFlagUpdate, FeatureFlagOut,
    FeatureFlagOverrideOut, SetOverrideBody,
)

router = APIRouter(prefix="/api/admin-management/feature-flags", tags=["feature-flags"])


async def _flag_out(db: AsyncSession, flag: FeatureFlag) -> FeatureFlagOut:
    count_res = await db.execute(select(func.count()).select_from(FeatureFlagOverride).where(FeatureFlagOverride.flag_key == flag.key))
    return FeatureFlagOut(
        key=flag.key, label=flag.label, description=flag.description, category=flag.category,
        is_beta=flag.is_beta, enabled_default=flag.enabled_default,
        override_count=count_res.scalar() or 0,
        created_at=flag.created_at, updated_at=flag.updated_at,
    )


@router.get("", response_model=list[FeatureFlagOut])
async def list_flags(db: AsyncSession = Depends(get_db), token: dict = Depends(require_permission("feature_flags.view"))):
    result = await db.execute(select(FeatureFlag).order_by(FeatureFlag.category, FeatureFlag.key))
    return [await _flag_out(db, f) for f in result.scalars().all()]


@router.post("", response_model=FeatureFlagOut)
async def create_flag(
    body: FeatureFlagCreate, db: AsyncSession = Depends(get_db), token: dict = Depends(require_permission("feature_flags.manage")),
):
    existing = await db.execute(select(FeatureFlag).where(FeatureFlag.key == body.key))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "A flag with this key already exists.")
    flag = FeatureFlag(**body.model_dump())
    db.add(flag)
    actor_id, actor_role, actor_name = await resolve_actor_info(token, db)
    await log_action(
        db, actor_id=actor_id, actor_role=actor_role, actor_name=actor_name,
        action="feature_flag.create", target_type="feature_flag", target_id=flag.key,
        meta={"label": flag.label, "enabled_default": flag.enabled_default},
    )
    await db.commit()
    await db.refresh(flag)
    return await _flag_out(db, flag)


@router.patch("/{key}", response_model=FeatureFlagOut)
async def update_flag(
    key: str, body: FeatureFlagUpdate,
    db: AsyncSession = Depends(get_db), token: dict = Depends(require_permission("feature_flags.manage")),
):
    result = await db.execute(select(FeatureFlag).where(FeatureFlag.key == key))
    flag = result.scalar_one_or_none()
    if not flag:
        raise HTTPException(404, "Flag not found")

    changes = body.model_dump(exclude_unset=True)
    for field, value in changes.items():
        setattr(flag, field, value)

    actor_id, actor_role, actor_name = await resolve_actor_info(token, db)
    await log_action(
        db, actor_id=actor_id, actor_role=actor_role, actor_name=actor_name,
        action="feature_flag.update", target_type="feature_flag", target_id=key, meta=changes,
    )
    await db.commit()
    await db.refresh(flag)
    return await _flag_out(db, flag)


@router.delete("/{key}")
async def delete_flag(
    key: str, db: AsyncSession = Depends(get_db), token: dict = Depends(require_permission("feature_flags.manage")),
):
    result = await db.execute(select(FeatureFlag).where(FeatureFlag.key == key))
    flag = result.scalar_one_or_none()
    if not flag:
        raise HTTPException(404, "Flag not found")
    actor_id, actor_role, actor_name = await resolve_actor_info(token, db)
    await log_action(
        db, actor_id=actor_id, actor_role=actor_role, actor_name=actor_name,
        action="feature_flag.delete", target_type="feature_flag", target_id=key,
    )
    await db.execute(delete(FeatureFlag).where(FeatureFlag.key == key))
    await db.commit()
    return {"ok": True}


@router.get("/{key}/overrides", response_model=list[FeatureFlagOverrideOut])
async def list_overrides(
    key: str, db: AsyncSession = Depends(get_db), token: dict = Depends(require_permission("feature_flags.view")),
):
    result = await db.execute(select(FeatureFlagOverride).where(FeatureFlagOverride.flag_key == key).order_by(FeatureFlagOverride.created_at))
    return result.scalars().all()


@router.put("/{key}/overrides", response_model=FeatureFlagOverrideOut)
async def set_override(
    key: str, body: SetOverrideBody,
    db: AsyncSession = Depends(get_db), token: dict = Depends(require_permission("feature_flags.manage")),
):
    flag_res = await db.execute(select(FeatureFlag).where(FeatureFlag.key == key))
    if not flag_res.scalar_one_or_none():
        raise HTTPException(404, "Flag not found")

    existing = await db.execute(
        select(FeatureFlagOverride).where(
            FeatureFlagOverride.flag_key == key,
            FeatureFlagOverride.scope_type == body.scope_type,
            FeatureFlagOverride.scope_value == body.scope_value,
        )
    )
    override = existing.scalar_one_or_none()
    if override:
        override.enabled = body.enabled
    else:
        override = FeatureFlagOverride(flag_key=key, scope_type=body.scope_type, scope_value=body.scope_value, enabled=body.enabled)
        db.add(override)

    actor_id, actor_role, actor_name = await resolve_actor_info(token, db)
    await log_action(
        db, actor_id=actor_id, actor_role=actor_role, actor_name=actor_name,
        action="feature_flag.set_override", target_type="feature_flag", target_id=key,
        meta={"scope_type": body.scope_type, "scope_value": body.scope_value, "enabled": body.enabled},
    )
    await db.commit()
    await db.refresh(override)
    return override


@router.delete("/{key}/overrides/{override_id}")
async def delete_override(
    key: str, override_id: str,
    db: AsyncSession = Depends(get_db), token: dict = Depends(require_permission("feature_flags.manage")),
):
    result = await db.execute(select(FeatureFlagOverride).where(FeatureFlagOverride.id == override_id, FeatureFlagOverride.flag_key == key))
    override = result.scalar_one_or_none()
    if not override:
        raise HTTPException(404, "Override not found")
    actor_id, actor_role, actor_name = await resolve_actor_info(token, db)
    await log_action(
        db, actor_id=actor_id, actor_role=actor_role, actor_name=actor_name,
        action="feature_flag.delete_override", target_type="feature_flag", target_id=key,
        meta={"scope_type": override.scope_type, "scope_value": override.scope_value},
    )
    await db.execute(delete(FeatureFlagOverride).where(FeatureFlagOverride.id == override_id))
    await db.commit()
    return {"ok": True}
