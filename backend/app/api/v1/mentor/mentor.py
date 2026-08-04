from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from datetime import datetime, timezone
from app.db.database import get_db
from app.core.auth import get_current_user, token_user_id
from app.models import User, Enrollment, TaskCompletion, UnlockedFeature
from app.models.roles import RoleSlug, ROLE_IDS
from app.services.simulation_lookup import get_simulation

router = APIRouter(prefix="/api/mentor", tags=["mentor"])


def require_mentor(token: dict = Depends(get_current_user)):
    if token.get("role") not in (RoleSlug.TEACHER, RoleSlug.SUPER_ADMIN):
        raise HTTPException(403, "Mentor access required")
    return token


@router.get("/students")
async def mentor_students(db: AsyncSession = Depends(get_db), token: dict = Depends(require_mentor)):
    user_id = token_user_id(token)
    mentor_res = await db.execute(select(User).where(User.id == user_id))
    mentor = mentor_res.scalar_one_or_none()
    if not mentor or not mentor.university_id:
        return []

    students_res = await db.execute(
        select(User)
        .where(
            User.role_id == ROLE_IDS[RoleSlug.STUDENT],
            User.university_id == mentor.university_id,
        )
        .order_by(User.name)
    )
    students = students_res.scalars().all()

    da_sim = await get_simulation(db, "da-job-sim", published_only=True)

    out = []
    for s in students:
        enrollment = None
        if da_sim:
            enroll_res = await db.execute(
                select(Enrollment).where(
                    Enrollment.user_id == s.id,
                    Enrollment.simulation_id == da_sim.id,
                )
            )
            enrollment = enroll_res.scalar_one_or_none()
        tasks_done = 0
        if enrollment:
            tc_res = await db.execute(
                select(func.count()).select_from(TaskCompletion).where(TaskCompletion.enrollment_id == enrollment.id)
            )
            tasks_done = tc_res.scalar() or 0

        ul_res = await db.execute(select(UnlockedFeature.feature).where(UnlockedFeature.user_id == s.id))
        unlocked = [r[0] for r in ul_res]

        last_seen = s.last_seen_at
        if last_seen:
            if last_seen.tzinfo is None:
                last_seen = last_seen.replace(tzinfo=timezone.utc)
            delta = datetime.now(timezone.utc) - last_seen
            if delta.total_seconds() < 3600:
                last_active = f"{int(delta.total_seconds() // 60)}m ago"
            elif delta.days == 0:
                last_active = f"{int(delta.total_seconds() // 3600)}h ago"
            else:
                last_active = f"{delta.days}d ago"
        else:
            last_active = "never"

        out.append({
            "id": s.id, "name": s.name, "roll_no": s.roll_no,
            "section": s.section or "—", "department": s.department,
            "year": s.year, "xp": s.xp,
            "tasks_done": tasks_done, "enrolled": enrollment is not None,
            "unlocked": unlocked, "last_active": last_active,
            "status": "active" if enrollment else "not_enrolled",
        })
    return out


class UnlockBody(BaseModel):
    feature: str


@router.post("/students/{student_id}/unlock")
async def unlock_for_student(
    student_id: int, body: UnlockBody,
    db: AsyncSession = Depends(get_db), token: dict = Depends(require_mentor)
):
    granter_id = token_user_id(token)
    existing = await db.execute(
        select(UnlockedFeature).where(
            UnlockedFeature.user_id == student_id, UnlockedFeature.feature == body.feature
        )
    )
    if not existing.scalar_one_or_none():
        db.add(UnlockedFeature(user_id=student_id, feature=body.feature, granted_by=granter_id))
        await db.commit()
    return {"ok": True}


@router.delete("/students/{student_id}/unlock/{feature}")
async def revoke_unlock(
    student_id: int, feature: str,
    db: AsyncSession = Depends(get_db), token: dict = Depends(require_mentor)
):
    result = await db.execute(
        select(UnlockedFeature).where(
            UnlockedFeature.user_id == student_id, UnlockedFeature.feature == feature
        )
    )
    entry = result.scalar_one_or_none()
    if entry:
        await db.delete(entry)
        await db.commit()
    return {"ok": True}
