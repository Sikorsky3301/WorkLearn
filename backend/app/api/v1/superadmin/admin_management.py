"""
Admin lifecycle management. Platform roles come from the `roles` table
(list-only). Custom AdminRole / Permission tables were removed — access is
by role slug (see app.core.permissions.require_permission).
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.models import User
from app.models.roles import Role, RoleSlug, ROLE_IDS
from app.models.rbac import AuditLog
from app.core.permissions import require_permission
from app.core.auth import hash_password, token_user_id
from app.services.audit import log_action, resolve_actor_info
from app.schemas.rbac import (
    AdminCreate, AdminUpdate, AdminResetPassword, AdminOut,
    AdminRoleOut, PermissionOut, AuditLogOut,
)

router = APIRouter(prefix="/api/admin-management", tags=["admin-management"])


def _admin_out(user: User) -> AdminOut:
    return AdminOut(
        id=user.id, name=user.name, email=user.email,
        is_active=user.is_active, suspended_at=user.suspended_at,
        role=user.role, role_id=user.role_id,
        created_at=user.created_at, last_seen_at=user.last_seen_at,
    )


async def _get_admin_or_404(db: AsyncSession, admin_id: int) -> User:
    result = await db.execute(
        select(User).where(User.id == admin_id, User.role_id == ROLE_IDS[RoleSlug.ADMIN])
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "Admin not found")
    return user


# ── Admins ───────────────────────────────────────────────────────────────────

@router.get("/admins", response_model=list[AdminOut])
async def list_admins(db: AsyncSession = Depends(get_db), token: dict = Depends(require_permission("admins.view"))):
    result = await db.execute(
        select(User).where(User.role_id == ROLE_IDS[RoleSlug.ADMIN]).order_by(User.created_at.desc())
    )
    return [_admin_out(u) for u in result.scalars().all()]


@router.post("/admins", response_model=AdminOut)
async def create_admin(
    body: AdminCreate, db: AsyncSession = Depends(get_db), token: dict = Depends(require_permission("admins.create")),
):
    existing = await db.execute(select(User).where(User.email == body.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "An account with this email already exists.")

    user = User(
        name=body.name.strip(), email=body.email.lower().strip(),
        password_hash=hash_password(body.password),
        role_id=ROLE_IDS[RoleSlug.ADMIN],
        avatar=body.name.strip()[:2].upper(),
    )
    db.add(user)
    await db.flush()
    actor_id, actor_role, actor_name = await resolve_actor_info(token, db)
    await log_action(
        db, actor_id=actor_id, actor_role=actor_role, actor_name=actor_name,
        action="admin.create", target_type="admin", target_id=str(user.id),
        meta={"email": user.email, "role_id": user.role_id},
    )
    await db.commit()
    await db.refresh(user)
    return _admin_out(user)


@router.patch("/admins/{admin_id}", response_model=AdminOut)
async def update_admin(
    admin_id: int, body: AdminUpdate,
    db: AsyncSession = Depends(get_db), token: dict = Depends(require_permission("admins.edit")),
):
    user = await _get_admin_or_404(db, admin_id)
    changes = {}
    if body.name is not None:
        user.name = body.name.strip()
        changes["name"] = user.name

    actor_id, actor_role, actor_name = await resolve_actor_info(token, db)
    await log_action(
        db, actor_id=actor_id, actor_role=actor_role, actor_name=actor_name,
        action="admin.update", target_type="admin", target_id=str(user.id), meta=changes,
    )
    await db.commit()
    await db.refresh(user)
    return _admin_out(user)


@router.post("/admins/{admin_id}/suspend", response_model=AdminOut)
async def suspend_admin(
    admin_id: int, db: AsyncSession = Depends(get_db), token: dict = Depends(require_permission("admins.suspend")),
):
    user = await _get_admin_or_404(db, admin_id)
    user.is_active = False
    user.suspended_at = datetime.now(timezone.utc)
    actor_id, actor_role, actor_name = await resolve_actor_info(token, db)
    await log_action(
        db, actor_id=actor_id, actor_role=actor_role, actor_name=actor_name,
        action="admin.suspend", target_type="admin", target_id=str(user.id),
    )
    await db.commit()
    await db.refresh(user)
    return _admin_out(user)


@router.post("/admins/{admin_id}/activate", response_model=AdminOut)
async def activate_admin(
    admin_id: int, db: AsyncSession = Depends(get_db), token: dict = Depends(require_permission("admins.suspend")),
):
    user = await _get_admin_or_404(db, admin_id)
    user.is_active = True
    user.suspended_at = None
    actor_id, actor_role, actor_name = await resolve_actor_info(token, db)
    await log_action(
        db, actor_id=actor_id, actor_role=actor_role, actor_name=actor_name,
        action="admin.activate", target_type="admin", target_id=str(user.id),
    )
    await db.commit()
    await db.refresh(user)
    return _admin_out(user)


@router.post("/admins/{admin_id}/reset-password")
async def reset_admin_password(
    admin_id: int, body: AdminResetPassword,
    db: AsyncSession = Depends(get_db), token: dict = Depends(require_permission("admins.reset_password")),
):
    user = await _get_admin_or_404(db, admin_id)
    user.password_hash = hash_password(body.password)
    actor_id, actor_role, actor_name = await resolve_actor_info(token, db)
    await log_action(
        db, actor_id=actor_id, actor_role=actor_role, actor_name=actor_name,
        action="admin.reset_password", target_type="admin", target_id=str(user.id),
    )
    await db.commit()
    return {"ok": True}


@router.delete("/admins/{admin_id}")
async def delete_admin(
    admin_id: int, db: AsyncSession = Depends(get_db), token: dict = Depends(require_permission("admins.delete")),
):
    user = await _get_admin_or_404(db, admin_id)
    actor_id, actor_role, actor_name = await resolve_actor_info(token, db)
    await log_action(
        db, actor_id=actor_id, actor_role=actor_role, actor_name=actor_name,
        action="admin.delete", target_type="admin", target_id=str(user.id),
        meta={"email": user.email, "name": user.name},
    )
    await db.execute(delete(User).where(User.id == admin_id))
    await db.commit()
    return {"ok": True}


# ── Roles & permissions (platform roles list-only; no custom AdminRoles) ─────

@router.get("/permissions", response_model=list[PermissionOut])
async def list_permissions(db: AsyncSession = Depends(get_db), token: dict = Depends(require_permission("admins.view"))):
    return []


@router.get("/roles", response_model=list[AdminRoleOut])
async def list_roles(db: AsyncSession = Depends(get_db), token: dict = Depends(require_permission("admins.view"))):
    result = await db.execute(select(Role).order_by(Role.id))
    out = []
    for role in result.scalars().all():
        count_res = await db.execute(
            select(func.count()).select_from(User).where(User.role_id == role.id)
        )
        out.append(AdminRoleOut(
            id=role.id, slug=role.slug, name=role.name, description=role.description,
            is_builtin=role.is_builtin, permission_keys=[],
            admin_count=count_res.scalar() or 0, created_at=role.created_at,
        ))
    return out


@router.post("/roles", response_model=AdminRoleOut)
async def create_role(token: dict = Depends(require_permission("admins.manage_roles"))):
    raise HTTPException(400, "Platform roles are fixed; custom AdminRoles were removed.")


@router.patch("/roles/{role_id}", response_model=AdminRoleOut)
async def update_role(role_id: int, token: dict = Depends(require_permission("admins.manage_roles"))):
    raise HTTPException(400, "Platform roles are fixed; custom AdminRoles were removed.")


@router.delete("/roles/{role_id}")
async def delete_role(role_id: int, token: dict = Depends(require_permission("admins.manage_roles"))):
    raise HTTPException(400, "Platform roles are fixed; custom AdminRoles were removed.")


# ── Audit log ────────────────────────────────────────────────────────────────

@router.get("/audit-log", response_model=list[AuditLogOut])
async def list_audit_log(
    limit: int = 100,
    action: str | None = None,
    actor_role: str | None = None,
    target_type: str | None = None,
    search: str | None = None,
    since: datetime | None = None,
    until: datetime | None = None,
    db: AsyncSession = Depends(get_db),
    token: dict = Depends(require_permission("activity.view_audit_log")),
):
    _ = token_user_id(token)  # validate token sub
    q = select(AuditLog)
    if action:
        q = q.where(AuditLog.action.ilike(f"%{action}%"))
    if actor_role:
        q = q.where(AuditLog.actor_role == actor_role)
    if target_type:
        q = q.where(AuditLog.target_type == target_type)
    if search:
        q = q.where(
            AuditLog.actor_name.ilike(f"%{search}%") |
            AuditLog.action.ilike(f"%{search}%") |
            AuditLog.target_id.ilike(f"%{search}%")
        )
    if since:
        q = q.where(AuditLog.created_at >= since)
    if until:
        q = q.where(AuditLog.created_at <= until)
    q = q.order_by(AuditLog.created_at.desc()).limit(limit)

    result = await db.execute(q)
    return [
        AuditLogOut(
            id=a.id, actor_id=a.actor_id, actor_role=a.actor_role, actor_name=a.actor_name,
            action=a.action, target_type=a.target_type, target_id=a.target_id,
            meta=a.meta, created_at=a.created_at,
        )
        for a in result.scalars().all()
    ]
