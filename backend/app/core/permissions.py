from fastapi import Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.core.auth import get_current_user
from app.db.database import get_db
from app.models import User
from app.models.roles import RoleSlug
from app.services.feature_flags import resolve_feature_flags


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


def require_cms_access():
    """CMS / Sim Builder: platform Admin + Super Admin, or Teacher with cms_access flag."""

    async def _check(
        token: dict = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ) -> dict:
        role = token.get("role")
        try:
            user_id = int(token["sub"])
        except (TypeError, ValueError):
            raise HTTPException(401, "Invalid token")

        result = await db.execute(
            select(User).where(User.id == user_id).options(
                selectinload(User.role_row), selectinload(User.university),
            )
        )
        user = result.scalar_one_or_none()
        if not user or not user.is_active:
            raise HTTPException(403, "Account is inactive or not found")
        if user.role != role:
            raise HTTPException(403, "Role no longer valid — please sign in again")

        if role in (RoleSlug.SUPER_ADMIN, RoleSlug.ADMIN):
            token["_user"] = user
            return token

        if role == RoleSlug.TEACHER:
            flags = await resolve_feature_flags(db, user)
            if flags.get("cms_access"):
                token["_user"] = user
                return token
            raise HTTPException(403, "CMS access has not been enabled for your account")

        raise HTTPException(403, "Insufficient role for this action")

    return _check
