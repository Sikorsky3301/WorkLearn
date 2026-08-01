"""Write-path for the admin action audit trail (app/models/rbac.py::AuditLog).
Phase 1 only wires this into admin-management/user-lifecycle mutations —
a searchable audit-log UI across every entity is Phase 2's job; the table and
this helper exist now so that phase needs no schema change."""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import User, SuperAdminCredential
from app.models.rbac import AuditLog
from app.core.request_context import request_id_var


async def resolve_actor_info(token: dict, db: AsyncSession) -> tuple[str, str, str]:
    """(actor_id, actor_role, actor_name) for an AuditLog row — the actor is
    either a SuperAdminCredential row or a User row, two different tables,
    depending on which portal issued the token."""
    if token.get("sa"):
        result = await db.execute(select(SuperAdminCredential).where(SuperAdminCredential.id == token["sub"]))
        admin = result.scalar_one_or_none()
        return token["sub"], "SUPER_ADMIN", admin.name if admin else "Unknown"
    result = await db.execute(select(User).where(User.id == token["sub"]))
    user = result.scalar_one_or_none()
    return token["sub"], "ADMIN", user.name if user else "Unknown"


async def log_action(
    db: AsyncSession,
    *,
    actor_id: str | None,
    actor_role: str,
    actor_name: str,
    action: str,
    target_type: str | None = None,
    target_id: str | None = None,
    meta: dict | None = None,
) -> None:
    """Adds an AuditLog row. Does not commit — the caller's own db.commit()
    (already happening for the mutation being logged) covers it, so a log
    entry is never persisted without its corresponding action, or vice versa."""
    db.add(AuditLog(
        actor_id=actor_id,
        actor_role=actor_role,
        actor_name=actor_name,
        action=action,
        target_type=target_type,
        target_id=target_id,
        meta=meta,
        request_id=request_id_var.get(),
    ))
