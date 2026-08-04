"""Provision students / teachers / university admins into the users table."""
from pydantic import BaseModel, EmailStr, Field
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.database import get_db
from app.models import User
from app.models.roles import RoleSlug, ROLE_IDS
from app.models.university import University
from app.core.auth import hash_password, token_user_id, get_current_user
from app.core.permissions import require_roles
from app.services.audit import log_action, resolve_actor_info

router = APIRouter(prefix="/api/admin/provision", tags=["provisioning"])

PROVISIONABLE = {
    "student": RoleSlug.STUDENT,
    "teacher": RoleSlug.TEACHER,
    "university_admin": RoleSlug.UNIVERSITY_ADMIN,
}


class ProvisionUserBody(BaseModel):
    name: str
    role: str = Field(description="student | teacher | university_admin")
    email: EmailStr
    roll_no: str | None = None
    password: str = Field(min_length=6)
    university_id: int | None = None
    department: str | None = None
    section: str | None = None
    year: str | None = None


async def _actor(db: AsyncSession, token: dict) -> User:
    uid = token_user_id(token)
    result = await db.execute(
        select(User).where(User.id == uid).options(selectinload(User.role_row), selectinload(User.university))
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(401, "Actor not found")
    return user


@router.post("/users")
async def provision_user(
    body: ProvisionUserBody,
    db: AsyncSession = Depends(get_db),
    token: dict = Depends(require_roles(RoleSlug.SUPER_ADMIN, RoleSlug.ADMIN, RoleSlug.UNIVERSITY_ADMIN)),
):
    slug = PROVISIONABLE.get(body.role)
    if not slug:
        raise HTTPException(400, "role must be student, teacher, or university_admin")

    actor = await _actor(db, token)

    # Resolve university
    if actor.role == RoleSlug.UNIVERSITY_ADMIN:
        if not actor.university_id:
            raise HTTPException(400, "University admin has no university assigned")
        university_id = actor.university_id
    else:
        if body.university_id is None:
            raise HTTPException(400, "university_id is required")
        university_id = body.university_id
        uni = await db.execute(select(University).where(University.id == university_id))
        if not uni.scalar_one_or_none():
            raise HTTPException(400, "Unknown university_id")

    if slug == RoleSlug.STUDENT and not body.roll_no:
        raise HTTPException(400, "student needs roll_no (email is required for login)")

    existing = await db.execute(select(User).where(User.email == body.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Email already in use")
    if body.roll_no:
        existing = await db.execute(select(User).where(User.roll_no == body.roll_no.strip()))
        if existing.scalar_one_or_none():
            raise HTTPException(400, "Roll number already in use")

    user = User(
        name=body.name.strip(),
        email=body.email.lower().strip(),
        roll_no=body.roll_no.strip() if body.roll_no else None,
        password_hash=hash_password(body.password),
        role_id=ROLE_IDS[slug],
        university_id=university_id,
        department=body.department,
        section=body.section,
        year=body.year,
        avatar=body.name.strip()[:2].upper(),
    )
    db.add(user)
    await db.flush()

    actor_id, actor_role, actor_name = await resolve_actor_info(token, db)
    await log_action(
        db, actor_id=actor_id, actor_role=actor_role, actor_name=actor_name,
        action="user.provision", target_type="user", target_id=str(user.id),
        meta={"role": slug, "university_id": university_id},
    )
    await db.commit()
    await db.refresh(user)
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "roll_no": user.roll_no,
        "role": slug,
        "university_id": university_id,
    }
