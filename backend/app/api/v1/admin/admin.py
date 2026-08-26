from datetime import datetime, timedelta, timezone
from urllib.parse import urlsplit, urlunsplit
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, distinct, delete
from sqlalchemy.orm import selectinload
from sqlalchemy.dialects.postgresql import insert as pg_insert
from app.db.database import get_db
from app.models import User, Enrollment, EnrollmentStatus, XpLedger, UnlockedFeature, TaskCompletion, UserBadge
from app.models.cms import Simulation
from app.models.university import University
from app.models.roles import RoleSlug, ROLE_IDS
from app.models.feature_flags import FeatureFlagOverride
from app.api.v1.simulations.enrollments import JOURNEY_BADGE_KEY
from app.core.permissions import require_permission, require_roles
from app.core.auth import token_user_id, hash_password
from app.core.config import settings
from app.services.audit import log_action, resolve_actor_info
from app.schemas.university import UniversityOnboardBody, UniversityUpdateBody

router = APIRouter(prefix="/api/admin", tags=["admin"])

EXCLUDED_ROLE_IDS = (ROLE_IDS[RoleSlug.ADMIN], ROLE_IDS[RoleSlug.SUPER_ADMIN])

# The admin users table is the one screen that has to stay usable on a platform
# with thousands of accounts. 100 was the hard cap AND the whole answer: the
# route returned a bare list with no total, so the table paginated 100 rows
# client-side and an admin had no way to know the other 900 existed.
DEFAULT_USER_PAGE = 50
MAX_USER_PAGE = 200


def utc_day_start() -> datetime:
    """Midnight UTC today.

    NOT `datetime.combine(date.today(), ...).replace(tzinfo=utc)`, which is
    what this used to be: `date.today()` is the SERVER'S LOCAL date, and
    stamping it with UTC shifts the window by the machine's offset. On an
    IST box (UTC+5:30) that put the start of "today" in the FUTURE every night
    between 00:00 and 05:30 local, so "Active Today" read 0 for five and a half
    hours a day — the same local-date-vs-UTC bug the analytics endpoint had.
    """
    return datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)


def tenant_login_url(code: str) -> str:
    """Where a partner university's users sign in.

    Built from `settings.frontend_url` rather than hardcoded. It used to be
    f"http://{code}.localhost:5173" — in the backend AND in two places in the
    admin UI — so the "partner login host" an admin copies and emails to a
    university was a localhost address in production.
    """
    parts = urlsplit(settings.frontend_url)
    host = parts.hostname or "localhost"
    port = f":{parts.port}" if parts.port else ""
    return urlunsplit((parts.scheme or "http", f"{str(code).lower()}.{host}{port}", "", "", ""))

ORG_USER_ROLE_IDS = (ROLE_IDS[RoleSlug.STUDENT], ROLE_IDS[RoleSlug.TEACHER])


async def _load_actor(db: AsyncSession, token: dict) -> User:
    uid = token_user_id(token)
    result = await db.execute(
        select(User).where(User.id == uid).options(selectinload(User.role_row), selectinload(User.university))
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(401, "Actor not found")
    return user


def _user_row_out(u: User, enroll_count: int, cms_access: bool = False) -> dict:
    uni_name = u.university.name if u.university else None
    return {
        "id": u.id, "name": u.name, "email": u.email,
        "roll_no": u.roll_no, "role": u.role,
        "university_id": u.university_id,
        "institution": uni_name, "department": u.department,
        "section": u.section, "xp": u.xp,
        "is_active": u.is_active, "suspended_at": u.suspended_at.isoformat() if u.suspended_at else None,
        "enrollments": enroll_count,
        "cms_access": cms_access if u.role == RoleSlug.TEACHER else False,
        # ISO, not "%b %d". The pre-formatted strings carried no YEAR - a row
        # reading "Aug 23" could be this year or three years ago - and being
        # strings they could not be sorted or compared by the table at all.
        # Formatting is the UI's job; this serves the value.
        "joined_at": u.created_at.isoformat() if u.created_at else None,
        "last_active_at": u.last_seen_at.isoformat() if u.last_seen_at else None,
    }


async def _assert_org_user_access(actor: User, target: User) -> None:
    """University Admin may only touch students/teachers in their own university."""
    if actor.role != RoleSlug.UNIVERSITY_ADMIN:
        return
    if not actor.university_id or target.university_id != actor.university_id:
        raise HTTPException(403, "Cannot manage users outside your university")
    if target.role_id not in ORG_USER_ROLE_IDS:
        raise HTTPException(403, "University Admin may only manage students and teachers")


@router.get("/stats")
async def admin_stats(db: AsyncSession = Depends(get_db), token: dict = Depends(require_permission("analytics.view_platform"))):
    total_res = await db.execute(select(func.count()).select_from(User))
    total_users = total_res.scalar() or 0

    uni_res = await db.execute(
        select(func.count(distinct(User.university_id))).where(User.university_id.isnot(None))
    )
    uni_count = uni_res.scalar() or 0

    today_start = utc_day_start()
    active_res = await db.execute(select(func.count()).select_from(User).where(User.last_seen_at >= today_start))
    active_today = active_res.scalar() or 0

    week_start = today_start - timedelta(days=7)
    active_week_res = await db.execute(select(func.count()).select_from(User).where(User.last_seen_at >= week_start))
    active_week = active_week_res.scalar() or 0

    suspended_res = await db.execute(
        select(func.count()).select_from(User).where(User.is_active == False)  # noqa: E712
    )
    suspended = suspended_res.scalar() or 0

    enrollments_res = await db.execute(select(func.count()).select_from(Enrollment))
    enrollments = enrollments_res.scalar() or 0

    certs_res = await db.execute(select(func.count()).select_from(Enrollment).where(Enrollment.status == EnrollmentStatus.COMPLETED))
    certs = certs_res.scalar() or 0

    direct_res = await db.execute(
        select(func.count()).select_from(User)
        .join(University, User.university_id == University.id)
        .where(User.role_id == ROLE_IDS[RoleSlug.STUDENT], University.is_default == True)  # noqa: E712
    )
    direct_count = direct_res.scalar() or 0

    uni_stu_res = await db.execute(
        select(func.count()).select_from(User)
        .join(University, User.university_id == University.id)
        .where(User.role_id == ROLE_IDS[RoleSlug.STUDENT], University.is_default == False)  # noqa: E712
    )
    uni_stu_count = uni_stu_res.scalar() or 0

    return {
        "total_users": total_users,
        "universities": uni_count,
        "active_today": active_today,
        "active_this_week": active_week,
        "suspended_users": suspended,
        "enrollments": enrollments,
        "certificates": certs,
        "direct_users": direct_count,
        "university_students": uni_stu_count,
        # Stated so the UI can label the window honestly instead of saying
        # "today" and meaning something else.
        "window_start_utc": today_start.isoformat(),
    }


@router.get("/universities")
async def admin_universities(
    db: AsyncSession = Depends(get_db),
    token: dict = Depends(require_roles(RoleSlug.ADMIN, RoleSlug.SUPER_ADMIN)),
):
    """Platform Admin only - list partner + academy universities.

    Counts come from two grouped aggregates rather than two queries per row:
    the old version issued 2N+1 queries for N universities.
    """
    universities = (await db.execute(select(University).order_by(University.name))).scalars().all()

    def _counts_for(role_slug):
        return (
            select(User.university_id, func.count())
            .where(User.role_id == ROLE_IDS[role_slug], User.university_id.isnot(None))
            .group_by(User.university_id)
        )

    students = dict((await db.execute(_counts_for(RoleSlug.STUDENT))).all())
    mentors = dict((await db.execute(_counts_for(RoleSlug.TEACHER))).all())

    return [
        {
            "id": uni.id,
            "code": uni.code,
            "name": uni.name,
            "logo_url": uni.logo_url,
            "students": students.get(uni.id, 0),
            "mentors": mentors.get(uni.id, 0),
            "status": "active",
            "is_default": uni.is_default,
            # Served, not built in the browser - the admin UI had its own
            # hardcoded copy of the localhost URL in two places.
            "login_url": None if uni.is_default else tenant_login_url(uni.code),
        }
        for uni in universities
    ]


@router.post("/universities/onboard")
async def onboard_university(
    body: UniversityOnboardBody,
    db: AsyncSession = Depends(get_db),
    token: dict = Depends(require_roles(RoleSlug.ADMIN, RoleSlug.SUPER_ADMIN)),
):
    """Platform Admin only — create partner university + first university_admin."""
    existing_code = await db.execute(
        select(University).where(func.lower(University.code) == body.code)
    )
    if existing_code.scalar_one_or_none():
        raise HTTPException(400, f"University code '{body.code}' already exists")

    email = body.admin.email.lower().strip()
    existing_user = await db.execute(select(User).where(User.email == email))
    if existing_user.scalar_one_or_none():
        raise HTTPException(400, "Admin email already in use")

    uni = University(
        code=body.code,
        name=body.name,
        logo_url=body.logo_url,
        is_default=False,
    )
    db.add(uni)
    await db.flush()

    admin_user = User(
        name=body.admin.name.strip(),
        email=email,
        password_hash=hash_password(body.admin.password),
        role_id=ROLE_IDS[RoleSlug.UNIVERSITY_ADMIN],
        university_id=uni.id,
        avatar=body.admin.name.strip()[:2].upper(),
        onboarding_completed=True,
    )
    db.add(admin_user)
    await db.flush()

    actor_id, actor_role, actor_name = await resolve_actor_info(token, db)
    await log_action(
        db, actor_id=actor_id, actor_role=actor_role, actor_name=actor_name,
        action="university.onboard", target_type="university", target_id=str(uni.id),
        meta={
            "code": uni.code, "name": uni.name, "logo_url": uni.logo_url,
            "university_admin_id": admin_user.id, "university_admin_email": email,
        },
    )
    await db.commit()
    await db.refresh(uni)
    await db.refresh(admin_user)

    return {
        "university": {
            "id": uni.id, "code": uni.code, "name": uni.name,
            "logo_url": uni.logo_url,
            "is_default": uni.is_default, "students": 0, "mentors": 0, "status": "active",
        },
        "admin": {
            "id": admin_user.id, "name": admin_user.name, "email": admin_user.email,
            "role": RoleSlug.UNIVERSITY_ADMIN, "university_id": uni.id,
        },
        "login_host": tenant_login_url(uni.code),
    }


@router.patch("/universities/{university_id}")
async def update_university(
    university_id: int,
    body: UniversityUpdateBody,
    db: AsyncSession = Depends(get_db),
    token: dict = Depends(require_roles(RoleSlug.ADMIN, RoleSlug.SUPER_ADMIN)),
):
    """Platform Admin only — rename university / update logo (code is immutable)."""
    result = await db.execute(select(University).where(University.id == university_id))
    uni = result.scalar_one_or_none()
    if not uni:
        raise HTTPException(404, "University not found")
    if uni.is_default:
        raise HTTPException(400, "Cannot rename the default academy university via this endpoint")

    uni.name = body.name
    if "logo_url" in body.model_fields_set:
        uni.logo_url = body.logo_url
    actor_id, actor_role, actor_name = await resolve_actor_info(token, db)
    await log_action(
        db, actor_id=actor_id, actor_role=actor_role, actor_name=actor_name,
        action="university.update", target_type="university", target_id=str(uni.id),
        meta={"name": uni.name, "code": uni.code, "logo_url": uni.logo_url},
    )
    await db.commit()
    await db.refresh(uni)

    student_res = await db.execute(
        select(func.count()).select_from(User).where(
            User.role_id == ROLE_IDS[RoleSlug.STUDENT], User.university_id == uni.id,
        )
    )
    mentor_res = await db.execute(
        select(func.count()).select_from(User).where(
            User.role_id == ROLE_IDS[RoleSlug.TEACHER], User.university_id == uni.id,
        )
    )
    return {
        "id": uni.id, "code": uni.code, "name": uni.name,
        "logo_url": uni.logo_url,
        "students": student_res.scalar() or 0,
        "mentors": mentor_res.scalar() or 0,
        "status": "active", "is_default": uni.is_default,
    }


@router.get("/users")
async def admin_users(
    role: str = None, search: str = "", scope: str = "",
    limit: int = DEFAULT_USER_PAGE, offset: int = 0,
    db: AsyncSession = Depends(get_db),
    token: dict = Depends(require_roles(RoleSlug.ADMIN, RoleSlug.UNIVERSITY_ADMIN, RoleSlug.SUPER_ADMIN)),
):
    """One page of users, plus the total the page was taken from.

    THREE THINGS THIS FIXES

    1. It used to return a bare list capped at 100 with no total. The table
       then paginated those 100 client-side, so on a platform with a thousand
       accounts an admin saw the newest hundred and had no way to know the rest
       existed - the pager said "1-10 of 100" and looked complete.

    2. `role` was validated with `if role and role in ROLE_IDS`, which SILENTLY
       IGNORED anything unrecognised. SuperAdmin's "Direct Users" page passes
       role="DIRECT_USER", which is not a role slug, so that page listed every
       user on the platform - students and teachers from every partner
       university - under a heading saying otherwise. Unknown values are now a
       400, and "direct vs partner" is what it always meant: `scope`.

    3. Enrollment counts were one COUNT query PER USER - 101 round trips for a
       100-row page, on a query the table re-issued on every keystroke. Now one
       grouped aggregate.
    """
    actor = await _load_actor(db, token)
    limit = max(1, min(limit, MAX_USER_PAGE))
    offset = max(0, offset)

    if actor.role == RoleSlug.UNIVERSITY_ADMIN:
        if not actor.university_id:
            raise HTTPException(400, "University admin has no university assigned")
        base = select(User).where(
            User.university_id == actor.university_id,
            User.role_id.in_(ORG_USER_ROLE_IDS),
        )
    else:
        # Platform Admin / Super Admin - global non-platform-admin accounts
        base = select(User).where(User.role_id.notin_(EXCLUDED_ROLE_IDS))

    if role:
        if role not in ROLE_IDS:
            raise HTTPException(
                400,
                f"Unknown role {role!r}. Expected one of: {', '.join(ROLE_IDS)}. "
                "Use scope=direct or scope=partner to split by tenant.",
            )
        if actor.role == RoleSlug.UNIVERSITY_ADMIN and ROLE_IDS[role] not in ORG_USER_ROLE_IDS:
            raise HTTPException(403, "University Admin may only list students and teachers")
        base = base.where(User.role_id == ROLE_IDS[role])

    if scope:
        if scope not in ("direct", "partner"):
            raise HTTPException(400, f"Unknown scope {scope!r}. Expected 'direct' or 'partner'.")
        if actor.role == RoleSlug.UNIVERSITY_ADMIN:
            raise HTTPException(403, "University Admin sees only their own university")
        # "Direct" means signed up straight to the platform - the default
        # (academy) tenant. Same definition admin_stats has always used.
        base = base.join(University, User.university_id == University.id).where(
            University.is_default == (scope == "direct")
        )

    if search:
        term = f"%{search.strip()}%"
        base = base.where(
            User.name.ilike(term) | User.email.ilike(term) | User.roll_no.ilike(term)
        )

    total = (await db.execute(select(func.count()).select_from(base.subquery()))).scalar() or 0

    q = (
        base.options(selectinload(User.university), selectinload(User.role_row))
        .order_by(User.created_at.desc(), User.id.desc())
        .limit(limit).offset(offset)
    )
    users = (await db.execute(q)).scalars().all()
    user_ids = [u.id for u in users]

    # One aggregate for the whole page, not one query per row.
    counts: dict[int, int] = {}
    if user_ids:
        rows = await db.execute(
            select(Enrollment.user_id, func.count())
            .where(Enrollment.user_id.in_(user_ids))
            .group_by(Enrollment.user_id)
        )
        counts = dict(rows.all())

    teacher_ids = [str(u.id) for u in users if u.role == RoleSlug.TEACHER]
    cms_on: set[str] = set()
    if teacher_ids:
        ov_res = await db.execute(
            select(FeatureFlagOverride).where(
                FeatureFlagOverride.flag_key == "cms_access",
                FeatureFlagOverride.scope_type == "user",
                FeatureFlagOverride.scope_value.in_(teacher_ids),
                FeatureFlagOverride.enabled == True,  # noqa: E712
            )
        )
        cms_on = {o.scope_value for o in ov_res.scalars().all()}

    return {
        "users": [
            _user_row_out(u, counts.get(u.id, 0), cms_access=str(u.id) in cms_on)
            for u in users
        ],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


class CmsAccessBody(BaseModel):
    enabled: bool


@router.put("/users/{user_id}/cms-access")
async def set_teacher_cms_access(
    user_id: int,
    body: CmsAccessBody,
    db: AsyncSession = Depends(get_db),
    token: dict = Depends(require_roles(RoleSlug.ADMIN, RoleSlug.UNIVERSITY_ADMIN, RoleSlug.SUPER_ADMIN)),
):
    """University Admin (org) / Platform Admin: enable or disable CMS for a teacher."""
    actor = await _load_actor(db, token)
    result = await db.execute(select(User).where(User.id == user_id).options(selectinload(User.role_row)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    await _assert_org_user_access(actor, user)
    if user.role != RoleSlug.TEACHER:
        raise HTTPException(400, "CMS access can only be set for teachers")

    scope_value = str(user.id)
    if body.enabled:
        stmt = pg_insert(FeatureFlagOverride).values(
            flag_key="cms_access",
            scope_type="user",
            scope_value=scope_value,
            enabled=True,
        ).on_conflict_do_update(
            index_elements=["flag_key", "scope_type", "scope_value"],
            set_={"enabled": True},
        )
        await db.execute(stmt)
    else:
        await db.execute(
            delete(FeatureFlagOverride).where(
                FeatureFlagOverride.flag_key == "cms_access",
                FeatureFlagOverride.scope_type == "user",
                FeatureFlagOverride.scope_value == scope_value,
            )
        )

    actor_id, actor_role, actor_name = await resolve_actor_info(token, db)
    await log_action(
        db, actor_id=actor_id, actor_role=actor_role, actor_name=actor_name,
        action="user.cms_access", target_type="user", target_id=str(user_id),
        meta={"enabled": body.enabled},
    )
    await db.commit()
    return {"ok": True, "cms_access": body.enabled}


@router.get("/activity")
async def admin_activity(limit: int = 20, db: AsyncSession = Depends(get_db), token: dict = Depends(require_permission("activity.view_feed"))):
    limit = max(1, min(limit, 200))
    result = await db.execute(
        select(XpLedger, User.name)
        .join(User, User.id == XpLedger.user_id)
        .order_by(XpLedger.created_at.desc())
        .limit(limit)
    )
    rows = result.all()
    now = datetime.now(timezone.utc)
    activity = []
    for row, name in rows:
        entry_time = row.created_at
        if entry_time.tzinfo is None:
            entry_time = entry_time.replace(tzinfo=timezone.utc)
        delta = now - entry_time
        if delta.total_seconds() < 3600:
            t = f"{int(delta.total_seconds() // 60)}m ago"
        elif delta.days == 0:
            t = f"{int(delta.total_seconds() // 3600)}h ago"
        else:
            t = f"{delta.days}d ago"
        activity.append({
            "time": t, "user": name,
            "action": f"Earned {row.amount} XP — {row.source.replace('_', ' ')}",
            "type": "success",
        })
    return activity


@router.post("/users/{user_id}/unlock")
async def unlock_feature(user_id: int, body: dict, db: AsyncSession = Depends(get_db), token: dict = Depends(require_permission("users.unlock_feature"))):
    feature = body.get("feature")
    if not feature:
        raise HTTPException(400, "feature required")
    granter_id = token_user_id(token)
    existing = await db.execute(
        select(UnlockedFeature).where(UnlockedFeature.user_id == user_id, UnlockedFeature.feature == feature)
    )
    if not existing.scalar_one_or_none():
        db.add(UnlockedFeature(user_id=user_id, feature=feature, granted_by=granter_id))
        actor_id, actor_role, actor_name = await resolve_actor_info(token, db)
        await log_action(
            db, actor_id=actor_id, actor_role=actor_role, actor_name=actor_name,
            action="user.unlock_feature", target_type="user", target_id=str(user_id), meta={"feature": feature},
        )
        await db.commit()
    return {"ok": True}


@router.get("/users/{user_id}/enrollments")
async def user_enrollments(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    token: dict = Depends(require_roles(RoleSlug.ADMIN, RoleSlug.UNIVERSITY_ADMIN, RoleSlug.SUPER_ADMIN)),
):
    """List a user's course enrollments (for the admin manage view)."""
    actor = await _load_actor(db, token)
    result = await db.execute(select(User).where(User.id == user_id).options(selectinload(User.role_row)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    await _assert_org_user_access(actor, user)

    enroll_res = await db.execute(
        select(Enrollment).where(Enrollment.user_id == user_id).order_by(Enrollment.enrolled_at.desc())
    )
    enrollments = enroll_res.scalars().all()
    out = []
    for e in enrollments:
        done_res = await db.execute(
            select(func.count()).select_from(TaskCompletion)
            .where(TaskCompletion.enrollment_id == e.id, TaskCompletion.task_id >= 1)
        )
        sim_res = await db.execute(select(Simulation).where(Simulation.id == e.simulation_id))
        sim = sim_res.scalar_one_or_none()
        out.append({
            "id": e.id,
            "simulation_id": e.simulation_id,
            "simulation_slug": sim.slug if sim else None,
            "simulation_title": sim.title if sim else str(e.simulation_id),
            "status": e.status.value if hasattr(e.status, "value") else str(e.status),
            "completed_tasks": done_res.scalar() or 0,
            "enrolled_at": e.enrolled_at.strftime("%b %d, %Y"),
        })
    return {
        "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role},
        "enrollments": out,
    }


@router.post("/users/{user_id}/suspend")
async def suspend_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    token: dict = Depends(require_roles(RoleSlug.ADMIN, RoleSlug.UNIVERSITY_ADMIN, RoleSlug.SUPER_ADMIN)),
):
    actor = await _load_actor(db, token)
    result = await db.execute(select(User).where(User.id == user_id).options(selectinload(User.role_row)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    await _assert_org_user_access(actor, user)
    user.is_active = False
    user.suspended_at = datetime.now(timezone.utc)
    actor_id, actor_role, actor_name = await resolve_actor_info(token, db)
    await log_action(
        db, actor_id=actor_id, actor_role=actor_role, actor_name=actor_name,
        action="user.suspend", target_type="user", target_id=str(user_id),
    )
    await db.commit()
    return {"ok": True, "is_active": user.is_active, "suspended_at": user.suspended_at}


@router.post("/users/{user_id}/activate")
async def activate_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    token: dict = Depends(require_roles(RoleSlug.ADMIN, RoleSlug.UNIVERSITY_ADMIN, RoleSlug.SUPER_ADMIN)),
):
    actor = await _load_actor(db, token)
    result = await db.execute(select(User).where(User.id == user_id).options(selectinload(User.role_row)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    await _assert_org_user_access(actor, user)
    user.is_active = True
    user.suspended_at = None
    actor_id, actor_role, actor_name = await resolve_actor_info(token, db)
    await log_action(
        db, actor_id=actor_id, actor_role=actor_role, actor_name=actor_name,
        action="user.activate", target_type="user", target_id=str(user_id),
    )
    await db.commit()
    return {"ok": True, "is_active": user.is_active, "suspended_at": user.suspended_at}


@router.delete("/enrollments/{enrollment_id}")
async def remove_enrollment(enrollment_id: int, db: AsyncSession = Depends(get_db), token: dict = Depends(require_permission("users.edit"))):
    result = await db.execute(select(Enrollment).where(Enrollment.id == enrollment_id))
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(404, "Enrollment not found")
    await db.execute(
        delete(UserBadge).where(
            UserBadge.user_id == enrollment.user_id,
            UserBadge.badge_key == JOURNEY_BADGE_KEY,
            UserBadge.simulation_id == enrollment.simulation_id,
        )
    )
    actor_id, actor_role, actor_name = await resolve_actor_info(token, db)
    await log_action(
        db, actor_id=actor_id, actor_role=actor_role, actor_name=actor_name,
        action="enrollment.remove", target_type="enrollment", target_id=str(enrollment_id),
        meta={"user_id": enrollment.user_id, "simulation_id": enrollment.simulation_id},
    )
    await db.execute(delete(Enrollment).where(Enrollment.id == enrollment_id))
    await db.commit()
    return {"ok": True}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    token: dict = Depends(require_roles(RoleSlug.ADMIN, RoleSlug.UNIVERSITY_ADMIN, RoleSlug.SUPER_ADMIN)),
):
    actor = await _load_actor(db, token)
    result = await db.execute(select(User).where(User.id == user_id).options(selectinload(User.role_row)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    await _assert_org_user_access(actor, user)
    actor_id, actor_role, actor_name = await resolve_actor_info(token, db)
    await log_action(
        db, actor_id=actor_id, actor_role=actor_role, actor_name=actor_name,
        action="user.delete", target_type="user", target_id=str(user_id),
        meta={"email": user.email, "name": user.name},
    )
    await db.execute(delete(User).where(User.id == user_id))
    await db.commit()
    return {"ok": True}
