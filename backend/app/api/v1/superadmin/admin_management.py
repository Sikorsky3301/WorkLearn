"""
Admin lifecycle + RBAC management — real, not scaffolding (other admins exist
or are coming soon, per the user's own scoping decision). Every mutating
route logs to AuditLog via app/services/audit.py::log_action.

SUPER_ADMIN can call every endpoint here unconditionally (require_permission's
bypass). An ADMIN needs the specific permission key on their assigned
AdminRole — most naturally `admins.manage_roles`/`admins.create` etc., since
managing OTHER admins is itself gated by the Admin Management permission
category.
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.models import User, Role
from app.models.rbac import AdminRole, Permission, AdminRolePermission, AuditLog
from app.core.permissions import require_permission
from app.core.auth import hash_password
from app.services.audit import log_action, resolve_actor_info
from app.schemas.rbac import (
    AdminCreate, AdminUpdate, AdminResetPassword, AdminOut,
    AdminRoleCreate, AdminRoleUpdate, AdminRoleOut,
    PermissionOut, AuditLogOut,
)

router = APIRouter(prefix="/api/admin-management", tags=["admin-management"])


# ── Helpers ──────────────────────────────────────────────────────────────────

async def _role_name(db: AsyncSession, role_id: str | None) -> str | None:
    if not role_id:
        return None
    result = await db.execute(select(AdminRole.name).where(AdminRole.id == role_id))
    return result.scalar_one_or_none()


async def _admin_out(db: AsyncSession, user: User) -> AdminOut:
    return AdminOut(
        id=user.id, name=user.name, email=user.email,
        is_active=user.is_active, suspended_at=user.suspended_at,
        admin_role_id=user.admin_role_id, admin_role_name=await _role_name(db, user.admin_role_id),
        created_at=user.created_at, last_seen_at=user.last_seen_at,
    )


async def _get_admin_or_404(db: AsyncSession, admin_id: str) -> User:
    result = await db.execute(select(User).where(User.id == admin_id, User.role == Role.ADMIN))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "Admin not found")
    return user


async def _role_out(db: AsyncSession, role: AdminRole) -> AdminRoleOut:
    perms_res = await db.execute(
        select(AdminRolePermission.permission_key).where(AdminRolePermission.role_id == role.id)
    )
    count_res = await db.execute(select(func.count()).select_from(User).where(User.admin_role_id == role.id))
    return AdminRoleOut(
        id=role.id, name=role.name, description=role.description, is_builtin=role.is_builtin,
        permission_keys=[row[0] for row in perms_res.all()],
        admin_count=count_res.scalar() or 0,
        created_at=role.created_at, updated_at=role.updated_at,
    )


# ── Admins ───────────────────────────────────────────────────────────────────

@router.get("/admins", response_model=list[AdminOut])
async def list_admins(db: AsyncSession = Depends(get_db), token: dict = Depends(require_permission("admins.view"))):
    result = await db.execute(select(User).where(User.role == Role.ADMIN).order_by(User.created_at.desc()))
    return [await _admin_out(db, u) for u in result.scalars().all()]


@router.post("/admins", response_model=AdminOut)
async def create_admin(
    body: AdminCreate, db: AsyncSession = Depends(get_db), token: dict = Depends(require_permission("admins.create")),
):
    existing = await db.execute(select(User).where(User.email == body.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "An account with this email already exists.")
    role_res = await db.execute(select(AdminRole).where(AdminRole.id == body.admin_role_id))
    if not role_res.scalar_one_or_none():
        raise HTTPException(400, "Unknown admin_role_id.")

    user = User(
        name=body.name.strip(), email=body.email.lower().strip(),
        password_hash=hash_password(body.password), role=Role.ADMIN,
        admin_role_id=body.admin_role_id, avatar=body.name.strip()[:2].upper(),
    )
    db.add(user)
    await db.flush()
    actor_id, actor_role, actor_name = await resolve_actor_info(token, db)
    await log_action(
        db, actor_id=actor_id, actor_role=actor_role, actor_name=actor_name,
        action="admin.create", target_type="admin", target_id=user.id,
        meta={"email": user.email, "admin_role_id": body.admin_role_id},
    )
    await db.commit()
    await db.refresh(user)
    return await _admin_out(db, user)


@router.patch("/admins/{admin_id}", response_model=AdminOut)
async def update_admin(
    admin_id: str, body: AdminUpdate,
    db: AsyncSession = Depends(get_db), token: dict = Depends(require_permission("admins.edit")),
):
    user = await _get_admin_or_404(db, admin_id)
    changes = {}
    if body.name is not None:
        user.name = body.name.strip()
        changes["name"] = user.name
    if body.admin_role_id is not None:
        role_res = await db.execute(select(AdminRole).where(AdminRole.id == body.admin_role_id))
        if not role_res.scalar_one_or_none():
            raise HTTPException(400, "Unknown admin_role_id.")
        user.admin_role_id = body.admin_role_id
        changes["admin_role_id"] = body.admin_role_id

    actor_id, actor_role, actor_name = await resolve_actor_info(token, db)
    await log_action(
        db, actor_id=actor_id, actor_role=actor_role, actor_name=actor_name,
        action="admin.update", target_type="admin", target_id=user.id, meta=changes,
    )
    await db.commit()
    await db.refresh(user)
    return await _admin_out(db, user)


@router.post("/admins/{admin_id}/suspend", response_model=AdminOut)
async def suspend_admin(
    admin_id: str, db: AsyncSession = Depends(get_db), token: dict = Depends(require_permission("admins.suspend")),
):
    user = await _get_admin_or_404(db, admin_id)
    user.is_active = False
    user.suspended_at = datetime.now(timezone.utc)
    actor_id, actor_role, actor_name = await resolve_actor_info(token, db)
    await log_action(
        db, actor_id=actor_id, actor_role=actor_role, actor_name=actor_name,
        action="admin.suspend", target_type="admin", target_id=user.id,
    )
    await db.commit()
    await db.refresh(user)
    return await _admin_out(db, user)


@router.post("/admins/{admin_id}/activate", response_model=AdminOut)
async def activate_admin(
    admin_id: str, db: AsyncSession = Depends(get_db), token: dict = Depends(require_permission("admins.suspend")),
):
    user = await _get_admin_or_404(db, admin_id)
    user.is_active = True
    user.suspended_at = None
    actor_id, actor_role, actor_name = await resolve_actor_info(token, db)
    await log_action(
        db, actor_id=actor_id, actor_role=actor_role, actor_name=actor_name,
        action="admin.activate", target_type="admin", target_id=user.id,
    )
    await db.commit()
    await db.refresh(user)
    return await _admin_out(db, user)


@router.post("/admins/{admin_id}/reset-password")
async def reset_admin_password(
    admin_id: str, body: AdminResetPassword,
    db: AsyncSession = Depends(get_db), token: dict = Depends(require_permission("admins.reset_password")),
):
    user = await _get_admin_or_404(db, admin_id)
    user.password_hash = hash_password(body.password)
    actor_id, actor_role, actor_name = await resolve_actor_info(token, db)
    await log_action(
        db, actor_id=actor_id, actor_role=actor_role, actor_name=actor_name,
        action="admin.reset_password", target_type="admin", target_id=user.id,
    )
    await db.commit()
    return {"ok": True}


@router.delete("/admins/{admin_id}")
async def delete_admin(
    admin_id: str, db: AsyncSession = Depends(get_db), token: dict = Depends(require_permission("admins.delete")),
):
    user = await _get_admin_or_404(db, admin_id)
    actor_id, actor_role, actor_name = await resolve_actor_info(token, db)
    await log_action(
        db, actor_id=actor_id, actor_role=actor_role, actor_name=actor_name,
        action="admin.delete", target_type="admin", target_id=user.id,
        meta={"email": user.email, "name": user.name},
    )
    await db.execute(delete(User).where(User.id == admin_id))
    await db.commit()
    return {"ok": True}


# ── Roles & permissions ──────────────────────────────────────────────────────

@router.get("/permissions", response_model=list[PermissionOut])
async def list_permissions(db: AsyncSession = Depends(get_db), token: dict = Depends(require_permission("admins.view"))):
    result = await db.execute(select(Permission).order_by(Permission.category, Permission.key))
    return [
        PermissionOut(key=p.key, category=p.category, label=p.label, description=p.description)
        for p in result.scalars().all()
    ]


@router.get("/roles", response_model=list[AdminRoleOut])
async def list_roles(db: AsyncSession = Depends(get_db), token: dict = Depends(require_permission("admins.view"))):
    result = await db.execute(select(AdminRole).order_by(AdminRole.created_at))
    return [await _role_out(db, r) for r in result.scalars().all()]


@router.post("/roles", response_model=AdminRoleOut)
async def create_role(
    body: AdminRoleCreate, db: AsyncSession = Depends(get_db), token: dict = Depends(require_permission("admins.manage_roles")),
):
    existing = await db.execute(select(AdminRole).where(AdminRole.name == body.name))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "A role with this name already exists.")

    role = AdminRole(name=body.name.strip(), description=body.description, created_by=token["sub"])
    db.add(role)
    await db.flush()
    for key in body.permission_keys:
        db.add(AdminRolePermission(role_id=role.id, permission_key=key))

    actor_id, actor_role, actor_name = await resolve_actor_info(token, db)
    await log_action(
        db, actor_id=actor_id, actor_role=actor_role, actor_name=actor_name,
        action="role.create", target_type="admin_role", target_id=role.id,
        meta={"name": role.name, "permission_keys": body.permission_keys},
    )
    await db.commit()
    await db.refresh(role)
    return await _role_out(db, role)


@router.patch("/roles/{role_id}", response_model=AdminRoleOut)
async def update_role(
    role_id: str, body: AdminRoleUpdate,
    db: AsyncSession = Depends(get_db), token: dict = Depends(require_permission("admins.manage_roles")),
):
    result = await db.execute(select(AdminRole).where(AdminRole.id == role_id))
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(404, "Role not found")
    if role.is_builtin and (body.name is not None or body.permission_keys is not None):
        raise HTTPException(400, "The built-in Administrator role cannot be renamed or have its permissions changed.")

    changes = {}
    if body.name is not None:
        role.name = body.name.strip()
        changes["name"] = role.name
    if body.description is not None:
        role.description = body.description
        changes["description"] = role.description
    if body.permission_keys is not None:
        await db.execute(delete(AdminRolePermission).where(AdminRolePermission.role_id == role.id))
        for key in body.permission_keys:
            db.add(AdminRolePermission(role_id=role.id, permission_key=key))
        changes["permission_keys"] = body.permission_keys

    actor_id, actor_role, actor_name = await resolve_actor_info(token, db)
    await log_action(
        db, actor_id=actor_id, actor_role=actor_role, actor_name=actor_name,
        action="role.update", target_type="admin_role", target_id=role.id, meta=changes,
    )
    await db.commit()
    await db.refresh(role)
    return await _role_out(db, role)


@router.delete("/roles/{role_id}")
async def delete_role(
    role_id: str, db: AsyncSession = Depends(get_db), token: dict = Depends(require_permission("admins.manage_roles")),
):
    result = await db.execute(select(AdminRole).where(AdminRole.id == role_id))
    role = result.scalar_one_or_none()
    if not role:
        raise HTTPException(404, "Role not found")
    if role.is_builtin:
        raise HTTPException(400, "The built-in Administrator role cannot be deleted.")
    count_res = await db.execute(select(func.count()).select_from(User).where(User.admin_role_id == role.id))
    if (count_res.scalar() or 0) > 0:
        raise HTTPException(400, "Reassign admins off this role before deleting it.")

    actor_id, actor_role, actor_name = await resolve_actor_info(token, db)
    await log_action(
        db, actor_id=actor_id, actor_role=actor_role, actor_name=actor_name,
        action="role.delete", target_type="admin_role", target_id=role.id, meta={"name": role.name},
    )
    await db.execute(delete(AdminRole).where(AdminRole.id == role.id))
    await db.commit()
    return {"ok": True}


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
