from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from datetime import datetime, timezone
from app.db.database import get_db
from app.models import User, UnlockedFeature, UserBadge
from app.models.roles import RoleSlug, ROLE_IDS
from app.models.university import University, DEFAULT_UNIVERSITY_CODE
from app.models.profile import EducationEntry
from app.core.auth import verify_password, hash_password, create_token, get_current_user, token_user_id
from app.core.config import settings
from app.services.feature_flags import resolve_feature_flags
from app.services.tenant import (
    TENANT_HOST_HEADER,
    host_from_request,
    resolve_tenant,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginDirectBody(BaseModel):
    email: str
    password: str


class RegisterBody(BaseModel):
    name: str
    email: str
    password: str


def _university_dict(uni: University | None) -> dict | None:
    if not uni:
        return None
    return {
        "id": uni.id,
        "code": uni.code,
        "name": uni.name,
        "logo_url": uni.logo_url,
        "is_default": uni.is_default,
    }


def _safe_user(user: User) -> dict:
    return {
        "id": user.id, "name": user.name, "email": user.email,
        "roll_no": user.roll_no, "role": user.role,
        "role_id": user.role_id,
        "university_id": user.university_id,
        "university": _university_dict(user.university),
        "department": user.department,
        "section": user.section, "year": user.year, "avatar": user.avatar,
        "xp": user.xp, "target_role": user.target_role,
        "headline": user.headline, "bio": user.bio, "phone": user.phone,
        "location": user.location, "linkedin_url": user.linkedin_url,
        "github_url": user.github_url, "website_url": user.website_url,
        "photo_url": user.photo_url, "resume_url": user.resume_url,
        "resume_filename": user.resume_filename,
        "resume_uploaded_at": user.resume_uploaded_at.isoformat() if user.resume_uploaded_at else None,
        "onboarding_completed": user.onboarding_completed, "preferred_domain": user.preferred_domain,
        "is_active": user.is_active,
    }


async def _touch(db: AsyncSession, user_id: int):
    await db.execute(update(User).where(User.id == user_id).values(last_seen_at=datetime.now(timezone.utc)))
    await db.commit()


async def _get_default_university_id(db: AsyncSession) -> int:
    result = await db.execute(select(University).where(University.is_default == True))  # noqa: E712
    uni = result.scalar_one_or_none()
    if not uni:
        result = await db.execute(select(University).where(University.code == DEFAULT_UNIVERSITY_CODE))
        uni = result.scalar_one_or_none()
    if not uni:
        raise HTTPException(500, "Default university is not configured")
    return uni.id


async def _load_user_by_id(db: AsyncSession, user_id: int) -> User | None:
    result = await db.execute(
        select(User).where(User.id == user_id).options(
            selectinload(User.role_row), selectinload(User.university),
        )
    )
    return result.scalar_one_or_none()


async def _tenant_for_request(
    request: Request,
    db: AsyncSession,
    x_worklearn_host: str | None,
) -> University:
    return await resolve_tenant(db, host_from_request(request, x_worklearn_host))


def _require_academy(tenant: University) -> None:
    if not tenant.is_default:
        raise HTTPException(
            403,
            f"This sign-in is only available on the main WorkLearn Teaching Academy site, not on {tenant.code}.",
        )


def _require_partner(tenant: University) -> None:
    if tenant.is_default:
        raise HTTPException(
            403,
            "University accounts must sign in on their university subdomain "
            "(e.g. http://iitd.localhost:5173).",
        )


def _user_allowed_on_tenant(user: User, tenant: University) -> bool:
    """Host picks the tenant; account role must match that host's entry rules.

    Academy (default): academy students (no roll_no) and platform admin.
    Partner: students with roll_no, teachers, and university_admin for that org.
    Super Admin stays on /login/superadmin only.
    """
    if user.role == RoleSlug.SUPER_ADMIN:
        return False
    if tenant.is_default:
        if user.role == RoleSlug.ADMIN:
            return True
        if user.role == RoleSlug.STUDENT and not user.roll_no:
            if user.university_id and user.university_id != tenant.id:
                return False
            return True
        return False
    if user.university_id != tenant.id:
        return False
    if user.role == RoleSlug.UNIVERSITY_ADMIN:
        return True
    if user.role == RoleSlug.TEACHER:
        return True
    if user.role == RoleSlug.STUDENT and user.roll_no:
        return True
    return False


async def _issue_session(db: AsyncSession, user: User) -> dict:
    await _touch(db, user.id)
    flags = await resolve_feature_flags(db, user)
    payload = {**_safe_user(user), "feature_flags": flags}
    if user.role == RoleSlug.STUDENT:
        unlocked = await db.execute(select(UnlockedFeature).where(UnlockedFeature.user_id == user.id))
        payload["unlocked_features"] = [f.feature for f in unlocked.scalars().all()]
    expire = (
        settings.admin_jwt_expire_hours
        if user.role in (RoleSlug.ADMIN, RoleSlug.UNIVERSITY_ADMIN, RoleSlug.SUPER_ADMIN)
        else None
    )
    return {
        "token": create_token(user.id, user.role, expire_hours=expire),
        "user": payload,
    }


async def _authenticate(
    db: AsyncSession,
    tenant: University,
    email: str,
    password: str,
) -> dict:
    result = await db.execute(
        select(User).where(User.email == email.lower().strip()).options(
            selectinload(User.role_row), selectinload(User.university),
        )
    )
    user = result.scalar_one_or_none()
    if not user or not _user_allowed_on_tenant(user, tenant):
        raise HTTPException(401, "That email and password don't match.")
    if not verify_password(password, user.password_hash):
        raise HTTPException(401, "That email and password don't match.")
    if not user.is_active:
        raise HTTPException(403, "This account has been suspended.")
    return await _issue_session(db, user)


@router.post("/login")
async def login(
    body: LoginDirectBody,
    request: Request,
    db: AsyncSession = Depends(get_db),
    x_worklearn_host: str | None = Header(None, alias=TENANT_HOST_HEADER),
):
    """Unified sign-in: tenant from host, portal from account role."""
    tenant = await _tenant_for_request(request, db, x_worklearn_host)
    return await _authenticate(db, tenant, body.email, body.password)


@router.post("/register")
async def register(
    body: RegisterBody,
    request: Request,
    db: AsyncSession = Depends(get_db),
    x_worklearn_host: str | None = Header(None, alias=TENANT_HOST_HEADER),
):
    tenant = await _tenant_for_request(request, db, x_worklearn_host)
    _require_academy(tenant)

    existing = await db.execute(select(User).where(User.email == body.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "An account with this email already exists.")
    if len(body.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters.")
    university_id = await _get_default_university_id(db)
    user = User(
        name=body.name.strip(),
        email=body.email.lower().strip(),
        password_hash=hash_password(body.password),
        role_id=ROLE_IDS[RoleSlug.STUDENT],
        university_id=university_id,
        avatar=body.name.strip()[:2].upper(),
    )
    db.add(user)
    await db.commit()
    user = await _load_user_by_id(db, user.id)
    flags = await resolve_feature_flags(db, user)
    return {
        "token": create_token(user.id, user.role),
        "user": {**_safe_user(user), "feature_flags": flags},
    }


@router.post("/login/direct")
async def login_direct(
    body: LoginDirectBody,
    request: Request,
    db: AsyncSession = Depends(get_db),
    x_worklearn_host: str | None = Header(None, alias=TENANT_HOST_HEADER),
):
    tenant = await _tenant_for_request(request, db, x_worklearn_host)
    _require_academy(tenant)

    email = body.email.lower().strip()
    result = await db.execute(
        select(User).where(User.email == email).options(
            selectinload(User.role_row), selectinload(User.university),
        )
    )
    user = result.scalar_one_or_none()
    if not user or user.role != RoleSlug.STUDENT or user.roll_no:
        raise HTTPException(401, "That email and password don't match.")
    if user.university_id and user.university_id != tenant.id:
        raise HTTPException(401, "That email and password don't match.")
    if not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "That email and password don't match.")
    if not user.is_active:
        raise HTTPException(403, "This account has been suspended.")
    await _touch(db, user.id)
    flags = await resolve_feature_flags(db, user)
    return {"token": create_token(user.id, user.role), "user": {**_safe_user(user), "feature_flags": flags}}


@router.post("/login/superadmin")
async def login_superadmin(
    body: LoginDirectBody,
    request: Request,
    db: AsyncSession = Depends(get_db),
    x_worklearn_host: str | None = Header(None, alias=TENANT_HOST_HEADER),
):
    tenant = await _tenant_for_request(request, db, x_worklearn_host)
    _require_academy(tenant)

    result = await db.execute(
        select(User).where(User.email == body.email.lower().strip()).options(
            selectinload(User.role_row), selectinload(User.university),
        )
    )
    user = result.scalar_one_or_none()
    if not user or user.role != RoleSlug.SUPER_ADMIN:
        raise HTTPException(401, "That email and password don't match.")
    if not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "That email and password don't match.")
    if not user.is_active:
        raise HTTPException(403, "This account has been suspended.")
    await _touch(db, user.id)
    return {
        "token": create_token(user.id, user.role, expire_hours=settings.admin_jwt_expire_hours),
        "user": {**_safe_user(user), "feature_flags": await resolve_feature_flags(db, user)},
    }


@router.post("/login/admin")
async def login_admin(
    body: LoginDirectBody,
    request: Request,
    db: AsyncSession = Depends(get_db),
    x_worklearn_host: str | None = Header(None, alias=TENANT_HOST_HEADER),
):
    tenant = await _tenant_for_request(request, db, x_worklearn_host)
    email = body.email.lower().strip()
    result = await db.execute(
        select(User).where(User.email == email).options(
            selectinload(User.role_row), selectinload(User.university),
        )
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(401, "That email and password don't match.")

    if tenant.is_default:
        if user.role != RoleSlug.ADMIN:
            raise HTTPException(401, "That email and password don't match.")
    else:
        if user.role != RoleSlug.UNIVERSITY_ADMIN or user.university_id != tenant.id:
            raise HTTPException(401, "That email and password don't match.")

    if not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "That email and password don't match.")
    if not user.is_active:
        raise HTTPException(403, "This admin account has been suspended.")
    await _touch(db, user.id)
    flags = await resolve_feature_flags(db, user)
    return {
        "token": create_token(user.id, user.role, expire_hours=settings.admin_jwt_expire_hours),
        "user": {**_safe_user(user), "feature_flags": flags},
    }


@router.post("/login/university")
async def login_university(
    body: LoginDirectBody,
    request: Request,
    db: AsyncSession = Depends(get_db),
    x_worklearn_host: str | None = Header(None, alias=TENANT_HOST_HEADER),
):
    tenant = await _tenant_for_request(request, db, x_worklearn_host)
    _require_partner(tenant)

    email = body.email.lower().strip()
    result = await db.execute(
        select(User).where(User.email == email).options(
            selectinload(User.role_row), selectinload(User.university),
        )
    )
    user = result.scalar_one_or_none()
    if not user or user.role != RoleSlug.STUDENT or not user.roll_no:
        raise HTTPException(401, "That email and password don't match.")
    if user.university_id != tenant.id:
        raise HTTPException(401, "That email and password don't match.")
    if not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "That email and password don't match.")
    if not user.is_active:
        raise HTTPException(403, "This account has been suspended.")
    await _touch(db, user.id)
    unlocked = await db.execute(select(UnlockedFeature).where(UnlockedFeature.user_id == user.id))
    features = [f.feature for f in unlocked.scalars().all()]
    flags = await resolve_feature_flags(db, user)
    return {
        "token": create_token(user.id, user.role),
        "user": {**_safe_user(user), "unlocked_features": features, "feature_flags": flags},
    }


@router.post("/login/mentor")
async def login_mentor(
    body: LoginDirectBody,
    request: Request,
    db: AsyncSession = Depends(get_db),
    x_worklearn_host: str | None = Header(None, alias=TENANT_HOST_HEADER),
):
    tenant = await _tenant_for_request(request, db, x_worklearn_host)
    _require_partner(tenant)

    email = body.email.lower().strip()
    result = await db.execute(
        select(User).where(User.email == email).options(
            selectinload(User.role_row), selectinload(User.university),
        )
    )
    user = result.scalar_one_or_none()
    if not user or user.role != RoleSlug.TEACHER:
        raise HTTPException(401, "That email and password don't match.")
    if user.university_id != tenant.id:
        raise HTTPException(401, "That email and password don't match.")
    if not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "That email and password don't match.")
    if not user.is_active:
        raise HTTPException(403, "This account has been suspended.")
    await _touch(db, user.id)
    flags = await resolve_feature_flags(db, user)
    return {"token": create_token(user.id, user.role), "user": {**_safe_user(user), "feature_flags": flags}}


@router.get("/me")
async def me(db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user)):
    user_id = token_user_id(token)
    user = await _load_user_by_id(db, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    if not user.is_active:
        raise HTTPException(403, "This account has been suspended.")
    await _touch(db, user.id)
    unlocked = await db.execute(select(UnlockedFeature).where(UnlockedFeature.user_id == user.id))
    features = [f.feature for f in unlocked.scalars().all()]
    badges_res = await db.execute(select(UserBadge).where(UserBadge.user_id == user.id))
    badges = [_badge_dict(b) for b in badges_res.scalars().all()]
    education_res = await db.execute(
        select(EducationEntry).where(EducationEntry.user_id == user.id)
        .order_by(EducationEntry.sort_order, EducationEntry.start_year.desc())
    )
    education = [_education_dict(e) for e in education_res.scalars().all()]
    return {
        **_safe_user(user),
        "unlocked_features": features,
        "badges": badges,
        "education": education,
        "feature_flags": await resolve_feature_flags(db, user),
    }


def _badge_dict(b: UserBadge) -> dict:
    return {
        "id": b.id, "badge_key": b.badge_key, "label": b.label, "icon": b.icon,
        "simulation_id": b.simulation_id, "granted_at": b.granted_at.isoformat(),
    }


def _education_dict(e: EducationEntry) -> dict:
    return {
        "id": e.id, "institution": e.institution, "degree": e.degree,
        "field_of_study": e.field_of_study, "start_year": e.start_year, "end_year": e.end_year,
        "is_current": e.is_current, "description": e.description, "sort_order": e.sort_order,
    }
