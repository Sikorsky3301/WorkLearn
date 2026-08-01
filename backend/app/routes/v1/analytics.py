from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta, timezone, date
from app.db.database import get_db
from app.core.auth import get_current_user
from app.models import User, TaskCompletion, XpLedger, Enrollment, EnrollmentStatus
from app.services.skill_engine import get_user_skills

router = APIRouter(prefix="/api", tags=["analytics"])

@router.get("/analytics")
async def analytics(period: str = "week", db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user)):
    user_id = token["sub"]
    now = datetime.now(timezone.utc)

    if period == "week":
        since = now - timedelta(days=7)
    elif period == "month":
        since = now - timedelta(days=30)
    else:
        since = now - timedelta(days=365)

    # XP in period
    xp_res = await db.execute(select(XpLedger).where(XpLedger.user_id == user_id, XpLedger.created_at >= since).order_by(XpLedger.created_at))
    xp_records = xp_res.scalars().all()

    # Completions in period
    tc_res = await db.execute(select(TaskCompletion).where(TaskCompletion.user_id == user_id, TaskCompletion.completed_at >= since).order_by(TaskCompletion.completed_at))
    completions = tc_res.scalars().all()

    # All completions (for streak)
    all_tc = await db.execute(select(TaskCompletion.completed_at).where(TaskCompletion.user_id == user_id).order_by(TaskCompletion.completed_at.desc()))
    all_dates = [r[0] for r in all_tc]

    # User totals
    user_res = await db.execute(select(User).where(User.id == user_id))
    user = user_res.scalar_one_or_none()

    total_xp_res = await db.execute(select(func.sum(XpLedger.amount)).where(XpLedger.user_id == user_id))
    total_xp = total_xp_res.scalar() or 0

    total_tasks = await db.execute(select(func.count()).where(TaskCompletion.user_id == user_id))
    total_tasks = total_tasks.scalar() or 0

    completed_sims = await db.execute(select(func.count()).where(Enrollment.user_id == user_id, Enrollment.status == EnrollmentStatus.COMPLETED))
    completed_sims = completed_sims.scalar() or 0

    streak = _compute_streak(all_dates)
    week_activity = _week_activity(xp_records, completions)
    streak_grid = _streak_grid(all_dates)
    skills = await get_user_skills(db, user_id)

    return {
        "period": period,
        "top_stats": [
            {"label": "Total XP", "value": str(total_xp), "up": True},
            {"label": "Day Streak", "value": f"{streak} days", "up": streak > 0},
            {"label": "Tasks Completed", "value": str(total_tasks), "up": total_tasks > 0},
            {"label": "Simulations Done", "value": str(completed_sims), "up": completed_sims > 0},
        ],
        "week_activity": week_activity,
        "streak_grid": streak_grid,
        "skills": skills,
        "xp_history": [{"date": r.created_at.isoformat(), "amount": r.amount, "source": r.source} for r in xp_records],
    }

def _compute_streak(dates: list[datetime]) -> int:
    if not dates:
        return 0
    unique_days = sorted({d.date() for d in dates}, reverse=True)
    streak = 0
    today = date.today()
    for i, day in enumerate(unique_days):
        expected = today - timedelta(days=i)
        if day == expected:
            streak += 1
        else:
            break
    return streak

def _week_activity(xp_records, completions) -> list:
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    today = date.today()
    monday = today - timedelta(days=today.weekday())
    result = []
    for i, day in enumerate(days):
        d = monday + timedelta(days=i)
        day_xp = sum(r.amount for r in xp_records if r.created_at.date() == d)
        day_tasks = sum(1 for c in completions if c.completed_at.date() == d)
        result.append({"day": day, "xp": day_xp, "tasks": day_tasks})
    return result

def _streak_grid(dates: list[datetime]) -> list:
    active = {d.date() for d in dates}
    today = date.today()
    grid = []
    for week in range(11, -1, -1):
        row = []
        for day in range(7):
            d = today - timedelta(weeks=week, days=(6 - day))
            row.append(3 if d in active else 0)
        grid.append(row)
    return grid
