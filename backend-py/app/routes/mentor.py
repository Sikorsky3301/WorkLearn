from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from datetime import datetime, timezone
from app.database import get_db
from app.auth import get_current_user
from app.models import User, Role, Enrollment, TaskCompletion, UnlockedFeature

router = APIRouter(prefix="/api/mentor", tags=["mentor"])

def require_mentor(token: dict = Depends(get_current_user)):
    if token.get("role") not in ("CLASS_MENTOR", "SUPER_ADMIN"):
        raise HTTPException(403, "Mentor access required")
    return token

@router.get("/students")
async def mentor_students(db: AsyncSession = Depends(get_db), token: dict = Depends(require_mentor)):
    user_id = token["sub"]
    mentor_res = await db.execute(select(User).where(User.id == user_id))
    mentor = mentor_res.scalar_one_or_none()
    if not mentor or not mentor.institution_code:
        return []

    students_res = await db.execute(
        select(User)
        .where(User.role == Role.UNIVERSITY_STUDENT, User.institution_code == mentor.institution_code)
        .order_by(User.name)
    )
    students = students_res.scalars().all()

    out = []
    for s in students:
        enroll_res = await db.execute(
            select(Enrollment).where(Enrollment.user_id == s.id, Enrollment.simulation_id == "da-job-sim")
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
    student_id: str, body: UnlockBody,
    db: AsyncSession = Depends(get_db), token: dict = Depends(require_mentor)
):
    existing = await db.execute(
        select(UnlockedFeature).where(
            UnlockedFeature.user_id == student_id, UnlockedFeature.feature == body.feature
        )
    )
    if not existing.scalar_one_or_none():
        db.add(UnlockedFeature(user_id=student_id, feature=body.feature, granted_by=token["sub"]))
        await db.commit()
    return {"ok": True}

@router.delete("/students/{student_id}/unlock/{feature}")
async def revoke_unlock(
    student_id: str, feature: str,
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
