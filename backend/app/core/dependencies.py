from fastapi import Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.auth import get_current_user
from app.db.database import get_db
from app.models import User
from app.models.rbac import AdminRolePermission


def require_permission(key: str):
    """Returns a dependency that lets SUPER_ADMIN through unconditionally,
    and otherwise re-checks the ADMIN's current AdminRole permissions
    against the database on every request. Deliberately never trusts the
    JWT's embedded `permissions` claim (that's a frontend-nav hint only) —
    so revoking a permission or suspending an admin takes effect on their
    very next request, not after their token happens to expire."""

    async def _check(
        token: dict = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ) -> dict:
        if token.get("role") == "SUPER_ADMIN":
            return token
        if token.get("role") != "ADMIN":
            raise HTTPException(403, "Admin access required")

        result = await db.execute(select(User).where(User.id == token["sub"]))
        user = result.scalar_one_or_none()
        if not user or not user.is_active or not user.admin_role_id:
            raise HTTPException(403, "Admin account is inactive or has no assigned role")

        perm_result = await db.execute(
            select(AdminRolePermission.permission_key).where(AdminRolePermission.role_id == user.admin_role_id)
        )
        granted = {row[0] for row in perm_result.all()}
        if key not in granted:
            raise HTTPException(403, f"Missing required permission: {key}")
        return token

    return _check
