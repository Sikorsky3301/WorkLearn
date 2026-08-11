from fastapi import Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.auth import get_current_user
from app.db.database import get_db
from app.models import User
from app.models.roles import RoleSlug


def require_roles(*allowed_slugs: str):
    """Allow only users whose role slug is in allowed_slugs.
    Super Admin always passes when listed; if only checking admin portals,
    include RoleSlug.SUPER_ADMIN explicitly where needed."""

    allowed = set(allowed_slugs)

    async def _check(
        token: dict = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ) -> dict:
        role = token.get("role")
        if role not in allowed:
            raise HTTPException(403, "Insufficient role for this action")

        # Load user and enforce is_active for everyone
        try:
            user_id = int(token["sub"])
        except (TypeError, ValueError):
            raise HTTPException(401, "Invalid token")

        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user or not user.is_active:
            raise HTTPException(403, "Account is inactive or not found")
        if user.role != role:
            # Token role must still match DB (role changes take effect immediately)
            raise HTTPException(403, "Role no longer valid — please sign in again")
        token["_user"] = user
        return token

    return _check


# Back-compat alias used by many admin routes — platform admin surface only.
# University Admin is a different role and must use require_roles(..., UNIVERSITY_ADMIN)
# on the few org-scoped endpoints (users list / provision / suspend).
def require_permission(_key: str = ""):
    """Former fine-grained permission gate. Platform Admin (+ Super Admin for portal tools)."""
    return require_roles(RoleSlug.SUPER_ADMIN, RoleSlug.ADMIN)
