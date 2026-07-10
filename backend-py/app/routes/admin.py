from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, distinct, delete
from datetime import date, datetime, timedelta, timezone
from app.database import get_db
from app.auth import get_current_user
from app.models import User, Role, Enrollment, EnrollmentStatus, XpLedger, UnlockedFeature, TaskCompletion, UserBadge
from app.routes.enrollments import SIMULATIONS, JOURNEY_BADGE_KEY

router = APIRouter(prefix="/api/admin", tags=["admin"])

_SIM_TITLES = {s["id"]: s["title"] for s in SIMULATIONS}

def require_superadmin(token: dict = Depends(get_current_user)):
    if token.get("role") != "SUPER_ADMIN":
        raise HTTPException(403, "Superadmin access required")
    return token

@router.get("/stats")
async def admin_stats(db: AsyncSession = Depends(get_db), token: dict = Depends(require_superadmin)):
    total_res = await db.execute(select(func.count()).select_from(User))
    total_users = total_res.scalar() or 0

    uni_res = await db.execute(
        select(func.count(distinct(User.institution_code))).where(User.institution_code.isnot(None))
    )
    uni_count = uni_res.scalar() or 0

    today_start = datetime.combine(date.today(), datetime.min.time()).replace(tzinfo=timezone.utc)
    active_res = await db.execute(select(func.count()).select_from(User).where(User.last_seen_at >= today_start))
    active_today = active_res.scalar() or 0

    certs_res = await db.execute(select(func.count()).select_from(Enrollment).where(Enrollment.status == EnrollmentStatus.COMPLETED))
    certs = certs_res.scalar() or 0

    direct_res = await db.execute(select(func.count()).select_from(User).where(User.role == Role.DIRECT_USER))
    direct_count = direct_res.scalar() or 0

    uni_stu_res = await db.execute(select(func.count()).select_from(User).where(User.role == Role.UNIVERSITY_STUDENT))
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
async def admin_universities(db: AsyncSession = Depends(get_db), token: dict = Depends(require_superadmin)):
    result = await db.execute(
        select(User.institution, User.institution_code, func.count().label("student_count"))
        .where(User.role == Role.UNIVERSITY_STUDENT, User.institution_code.isnot(None))
        .group_by(User.institution, User.institution_code)
        .order_by(func.count().desc())
    )
    rows = result.all()
    out = []
    for row in rows:
        mentor_res = await db.execute(
            select(func.count()).select_from(User).where(
                User.role == Role.CLASS_MENTOR, User.institution_code == row.institution_code
            )
        )
        mentor_count = mentor_res.scalar() or 0
        out.append({
            "code": row.institution_code,
            "name": row.institution or row.institution_code,
            "students": row.student_count,
            "mentors": mentor_count,
            "status": "active",
        })
    return out

@router.get("/users")
async def admin_users(
    role: str = None, search: str = "", limit: int = 100,
    db: AsyncSession = Depends(get_db), token: dict = Depends(require_superadmin)
):
    q = select(User)
    if role:
        try:
            q = q.where(User.role == Role[role])
        except KeyError:
            pass
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
        out.append({
            "id": u.id, "name": u.name, "email": u.email,
            "roll_no": u.roll_no, "role": str(u.role),
            "institution": u.institution, "department": u.department,
            "section": u.section, "xp": u.xp,
            "enrollments": enroll_count,
            "joined": u.created_at.strftime("%b %d"),
            "last_active": u.last_seen_at.strftime("%b %d") if u.last_seen_at else "—",
        })
    return out

@router.get("/activity")
async def admin_activity(limit: int = 20, db: AsyncSession = Depends(get_db), token: dict = Depends(require_superadmin)):
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
async def unlock_feature(user_id: str, body: dict, db: AsyncSession = Depends(get_db), token: dict = Depends(require_superadmin)):
    feature = body.get("feature")
    if not feature:
        raise HTTPException(400, "feature required")
    existing = await db.execute(
        select(UnlockedFeature).where(UnlockedFeature.user_id == user_id, UnlockedFeature.feature == feature)
    )
    if not existing.scalar_one_or_none():
        db.add(UnlockedFeature(user_id=user_id, feature=feature, granted_by=token["sub"]))
        await db.commit()
    return {"ok": True}

@router.get("/users/{user_id}/enrollments")
async def user_enrollments(user_id: str, db: AsyncSession = Depends(get_db), token: dict = Depends(require_superadmin)):
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
        out.append({
            "id": e.id,
            "simulation_id": e.simulation_id,
            "simulation_title": _SIM_TITLES.get(e.simulation_id, e.simulation_id),
            "status": e.status.value if hasattr(e.status, "value") else str(e.status),
            "completed_tasks": done_res.scalar() or 0,
            "enrolled_at": e.enrolled_at.strftime("%b %d, %Y"),
        })
    return {
        "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role.value},
        "enrollments": out,
    }

@router.delete("/enrollments/{enrollment_id}")
async def remove_enrollment(enrollment_id: str, db: AsyncSession = Depends(get_db), token: dict = Depends(require_superadmin)):
    """Remove a user's enrollment from a course — fully resets the journey.

    Cascades task completions, and also revokes the Simulation Journey badge
    for that simulation so onboarding starts fresh on re-enroll.
    """
    result = await db.execute(select(Enrollment).where(Enrollment.id == enrollment_id))
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(404, "Enrollment not found")
    # Revoke the journey badge for this user + simulation (onboarding acceptance)
    await db.execute(
        delete(UserBadge).where(
            UserBadge.user_id == enrollment.user_id,
            UserBadge.badge_key == JOURNEY_BADGE_KEY,
            UserBadge.simulation_id == enrollment.simulation_id,
        )
    )
    await db.execute(delete(Enrollment).where(Enrollment.id == enrollment_id))
    await db.commit()
    return {"ok": True}

@router.delete("/users/{user_id}")
async def delete_user(user_id: str, db: AsyncSession = Depends(get_db), token: dict = Depends(require_superadmin)):
    """Delete a user and all their data (enrollments, skills, XP, messages cascade)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    await db.execute(delete(User).where(User.id == user_id))
    await db.commit()
    return {"ok": True}
