"""Platform-wide/cohort analytics — distinct from app/api/v1/analytics/analytics.py,
which is per-user only. Gated by the Analytics permission category."""
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.models import User, Enrollment, EnrollmentStatus
from app.models.cms import Simulation
from app.core.permissions import require_permission

router = APIRouter(prefix="/api/admin-management/analytics", tags=["platform-analytics"])


@router.get("/platform")
async def platform_analytics(
    days: int = 30,
    db: AsyncSession = Depends(get_db),
    token: dict = Depends(require_permission("analytics.view_platform")),
):
    now = datetime.now(timezone.utc)
    day_ago, week_ago, month_ago = now - timedelta(days=1), now - timedelta(days=7), now - timedelta(days=30)
    range_start = now - timedelta(days=days)

    total_users = (await db.execute(select(func.count()).select_from(User))).scalar() or 0
    dau = (await db.execute(select(func.count()).select_from(User).where(User.last_seen_at >= day_ago))).scalar() or 0
    wau = (await db.execute(select(func.count()).select_from(User).where(User.last_seen_at >= week_ago))).scalar() or 0
    mau = (await db.execute(select(func.count()).select_from(User).where(User.last_seen_at >= month_ago))).scalar() or 0
    universities = (await db.execute(
        select(func.count(func.distinct(User.institution_code))).where(User.institution_code.isnot(None))
    )).scalar() or 0
    total_simulations = (await db.execute(select(func.count()).select_from(Simulation))).scalar() or 0
    total_enrollments = (await db.execute(select(func.count()).select_from(Enrollment))).scalar() or 0
    completed_enrollments = (await db.execute(
        select(func.count()).select_from(Enrollment).where(Enrollment.status == EnrollmentStatus.COMPLETED)
    )).scalar() or 0
    completion_rate = round((completed_enrollments / total_enrollments) * 100, 1) if total_enrollments else 0.0

    growth_result = await db.execute(
        select(func.date(User.created_at).label("day"), func.count().label("count"))
        .where(User.created_at >= range_start)
        .group_by(func.date(User.created_at))
        .order_by(func.date(User.created_at))
    )
    rows = growth_result.all()
    # Users created before the window count toward the running total but
    # aren't plotted as their own bar — cumulative_users still starts from
    # an accurate baseline instead of resetting to 0 at the window edge.
    cumulative = total_users - sum(row.count for row in rows)
    growth = []
    for row in rows:
        cumulative += row.count
        growth.append({
            "date": row.day.isoformat() if hasattr(row.day, "isoformat") else str(row.day),
            "new_users": row.count,
            "cumulative_users": cumulative,
        })

    return {
        "summary": {
            "total_users": total_users,
            "dau": dau, "wau": wau, "mau": mau,
            "universities": universities,
            "total_simulations": total_simulations,
            "total_enrollments": total_enrollments,
            "completed_enrollments": completed_enrollments,
            "completion_rate": completion_rate,
        },
        "growth": growth,
    }
