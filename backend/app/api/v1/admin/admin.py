from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, distinct, delete
from app.db.database import get_db
from app.models import User, Enrollment, EnrollmentStatus, XpLedger, UnlockedFeature, TaskCompletion, UserBadge
from app.models.cms import Simulation
from app.models.university import University
from app.models.roles import RoleSlug, ROLE_IDS
from app.api.v1.simulations.enrollments import JOURNEY_BADGE_KEY
from app.core.permissions import require_permission
from app.core.auth import token_user_id
from app.services.audit import log_action, resolve_actor_info

router = APIRouter(prefix="/api/admin", tags=["admin"])

EXCLUDED_ROLE_IDS = (ROLE_IDS[RoleSlug.ADMIN], ROLE_IDS[RoleSlug.SUPER_ADMIN])


@router.get("/stats")
async def admin_stats(db: AsyncSession = Depends(get_db), token: dict = Depends(require_permission("analytics.view_platform"))):
    total_res = await db.execute(select(func.count()).select_from(User))
    total_users = total_res.scalar() or 0

    uni_res = await db.execute(
        select(func.count(distinct(User.university_id))).where(User.university_id.isnot(None))
    )
    uni_count = uni_res.scalar() or 0

    today_start = datetime.combine(date.today(), datetime.min.time()).replace(tzinfo=timezone.utc)
    active_res = await db.execute(select(func.count()).select_from(User).where(User.last_seen_at >= today_start))
    active_today = active_res.scalar() or 0

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
        "certificates": certs,
        "direct_users": direct_count,
        "university_students": uni_stu_count,
    }


@router.get("/universities")
async def admin_universities(db: AsyncSession = Depends(get_db), token: dict = Depends(require_permission("analytics.view_platform"))):
    result = await db.execute(select(University).order_by(University.name))
    universities = result.scalars().all()
    out = []
    for uni in universities:
        student_res = await db.execute(
            select(func.count()).select_from(User).where(
                User.role_id == ROLE_IDS[RoleSlug.STUDENT],
                User.university_id == uni.id,
            )
        )
        mentor_res = await db.execute(
            select(func.count()).select_from(User).where(
                User.role_id == ROLE_IDS[RoleSlug.TEACHER],
                User.university_id == uni.id,
            )
        )
        out.append({
            "id": uni.id,
            "code": uni.code,
            "name": uni.name,
            "students": student_res.scalar() or 0,
            "mentors": mentor_res.scalar() or 0,
            "status": "active",
            "is_default": uni.is_default,
        })
    return out


@router.get("/users")
async def admin_users(
    role: str = None, search: str = "", limit: int = 100,
    db: AsyncSession = Depends(get_db), token: dict = Depends(require_permission("users.view")),
):
    # Admin-tier accounts never show up here — managed via admin_management.
    q = select(User).where(User.role_id.notin_(EXCLUDED_ROLE_IDS))
    if role and role in ROLE_IDS:
        q = q.where(User.role_id == ROLE_IDS[role])
    if search:
        q = q.where(
            User.name.ilike(f"%{search}%") |
            User.email.ilike(f"%{search}%") |
            User.roll_no.ilike(f"%{search}%")
        )
    q = q.order_by(User.created_at.desc()).limit(limit)
    result = await db.execute(q)
    users = result.scalars().all()
    out = []
    for u in users:
        enroll_res = await db.execute(select(func.count()).select_from(Enrollment).where(Enrollment.user_id == u.id))
        enroll_count = enroll_res.scalar() or 0
        uni_name = u.university.name if u.university else None
        out.append({
            "id": u.id, "name": u.name, "email": u.email,
            "roll_no": u.roll_no, "role": u.role,
            "university_id": u.university_id,
            "institution": uni_name, "department": u.department,
            "section": u.section, "xp": u.xp,
            "is_active": u.is_active, "suspended_at": u.suspended_at.isoformat() if u.suspended_at else None,
            "enrollments": enroll_count,
            "joined": u.created_at.strftime("%b %d"),
            "last_active": u.last_seen_at.strftime("%b %d") if u.last_seen_at else "—",
        })
    return out


@router.get("/activity")
async def admin_activity(limit: int = 20, db: AsyncSession = Depends(get_db), token: dict = Depends(require_permission("activity.view_feed"))):
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
async def user_enrollments(user_id: int, db: AsyncSession = Depends(get_db), token: dict = Depends(require_permission("users.view"))):
    """List a user's course enrollments (for the admin manage view)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")

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
async def suspend_user(user_id: int, db: AsyncSession = Depends(get_db), token: dict = Depends(require_permission("users.suspend"))):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
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
async def activate_user(user_id: int, db: AsyncSession = Depends(get_db), token: dict = Depends(require_permission("users.suspend"))):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
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
async def delete_user(user_id: int, db: AsyncSession = Depends(get_db), token: dict = Depends(require_permission("users.delete"))):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    actor_id, actor_role, actor_name = await resolve_actor_info(token, db)
    await log_action(
        db, actor_id=actor_id, actor_role=actor_role, actor_name=actor_name,
        action="user.delete", target_type="user", target_id=str(user_id),
        meta={"email": user.email, "name": user.name},
    )
    await db.execute(delete(User).where(User.id == user_id))
    await db.commit()
    return {"ok": True}
