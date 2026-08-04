"""Write-path for the admin action audit trail."""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import User
from app.models.rbac import AuditLog
from app.core.request_context import request_id_var
from app.core.auth import token_user_id


async def resolve_actor_info(token: dict, db: AsyncSession) -> tuple[int | None, str, str]:
    """(actor_id, actor_role, actor_name) from the users table."""
    try:
        uid = token_user_id(token)
    except Exception:
        return None, token.get("role") or "unknown", "Unknown"
    result = await db.execute(select(User).where(User.id == uid))
    user = result.scalar_one_or_none()
    if not user:
        return uid, token.get("role") or "unknown", "Unknown"
    return user.id, user.role, user.name


async def log_action(
    db: AsyncSession,
    *,
    actor_id: int | None,
    actor_role: str,
    actor_name: str,
    action: str,
    target_type: str | None = None,
    target_id: str | None = None,
    meta: dict | None = None,
) -> None:
    db.add(AuditLog(
        actor_id=actor_id,
        actor_role=actor_role,
        actor_name=actor_name,
        action=action,
        target_type=target_type,
        target_id=str(target_id) if target_id is not None else None,
        meta=meta,
        request_id=request_id_var.get(),
    ))
