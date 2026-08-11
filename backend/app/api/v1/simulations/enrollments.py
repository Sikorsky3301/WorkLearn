import logging

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.db.database import get_db
from app.core.auth import get_current_user, token_user_id
from app.models import Enrollment, TaskCompletion, AgentMessage, MessageType, UserBadge
from app.models.cms import Simulation, SimulationTask
from app.services.skill_engine import award_task_completion
from app.services.simulation_completion import finalize_if_complete
from app.services.simulation_lookup import get_simulation
from app.services.tenant import TENANT_HOST_HEADER, host_from_request, resolve_tenant
from app.services.simulation_scope import (
    published_sims_for_university,
    assert_sim_visible_to_tenant,
)
from app.models.university import University
from sqlalchemy import func

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["enrollments"])

DEFAULT_MANAGER = {"name": "Your Manager", "role": "Simulation Manager", "company": "", "avatar": "M"}

# Badge granted when the student accepts the simulation's offer letter
JOURNEY_BADGE_KEY = "sim_journey"


class CompleteTaskBody(BaseModel):
    score: int | None = None
    quiz_score: int | None = None
    rubric_rating: dict | None = None


async def _has_journey_badge(db: AsyncSession, user_id: int, sim_id: int) -> bool:
    result = await db.execute(
        select(UserBadge).where(
            UserBadge.user_id == user_id,
            UserBadge.badge_key == JOURNEY_BADGE_KEY,
            UserBadge.simulation_id == sim_id,
        )
    )
    return result.scalar_one_or_none() is not None


async def _get_published_sim(db: AsyncSession, key: str | int) -> Simulation | None:
    return await get_simulation(db, key, published_only=True)


async def _tenant_university(
    db: AsyncSession,
    request: Request,
    x_worklearn_host: str | None,
) -> University:
    return await resolve_tenant(db, host_from_request(request, x_worklearn_host))


async def _get_sim_tasks(db: AsyncSession, sim_id: int) -> list[SimulationTask]:
    result = await db.execute(
        select(SimulationTask).where(SimulationTask.simulation_id == sim_id).order_by(SimulationTask.task_index)
    )
    return list(result.scalars().all())


@router.get("/simulations")
async def list_simulations(
    request: Request,
    db: AsyncSession = Depends(get_db),
    x_worklearn_host: str | None = Header(None, alias=TENANT_HOST_HEADER),
):
    uni = await _tenant_university(db, request, x_worklearn_host)
    sims = await published_sims_for_university(db, uni.id)
    out = []
    for sim in sims:
        count_res = await db.execute(
            select(func.count()).select_from(SimulationTask).where(SimulationTask.simulation_id == sim.id)
        )
        out.append({
            "id": sim.id, "slug": sim.slug, "title": sim.title, "description": sim.description,
            "company": sim.company, "logo_url": sim.logo_url,
            "domain": sim.domain, "category": sim.category or sim.domain,
            "accent_color": sim.accent_color,
            "tag": sim.category or sim.domain, "level": sim.difficulty, "difficulty": sim.difficulty,
            "tasks": count_res.scalar() or 0, "estimated_hours": sim.estimated_hours,
            "skills": sim.skills, "rating": sim.rating, "rating_count": sim.rating_count,
            "manager": sim.manager,
        })
    return {"simulations": out}


@router.get("/users/me/badges")
async def my_badges(db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user)):
    user_id = token_user_id(token)
    result = await db.execute(
        select(UserBadge).where(UserBadge.user_id == user_id).order_by(UserBadge.granted_at.desc())
    )
    return {"badges": [_badge_dict(b) for b in result.scalars().all()]}


async def _build_assignment(db: AsyncSession, user_id: int, enrollment: Enrollment) -> dict:
    """Manager + current-task summary for one enrollment."""
    sim_id = enrollment.simulation_id
    sim = await _get_published_sim(db, sim_id)
    tasks = await _get_sim_tasks(db, sim_id) if sim else []
    manager = sim.manager if sim else DEFAULT_MANAGER
    task_by_index = {t.task_index: t for t in tasks}
    work_task_ids = sorted(task_by_index.keys())

    completions = await db.execute(
        select(TaskCompletion.task_id).where(TaskCompletion.enrollment_id == enrollment.id)
    )
    completed_ids = {r[0] for r in completions}
    completed_count = len([t for t in work_task_ids if t in completed_ids])
    next_task_id = next((t for t in work_task_ids if t not in completed_ids), None)

    base = {
        "simulation_id": sim_id,
        "simulation_slug": sim.slug if sim else None,
        "simulation_title": sim.title if sim else str(sim_id),
        "domain": sim.domain if sim else None,
        "enrollment_id": enrollment.id,
        "manager": manager,
        "completed_count": completed_count,
        "total_tasks": len(work_task_ids),
    }

    if not await _has_journey_badge(db, user_id, sim_id):
        return {**base, "has_assignment": False, "reason": "onboarding_pending"}

    if next_task_id is None:
        return {**base, "has_assignment": False, "reason": "completed"}

    next_task = task_by_index.get(next_task_id)
    return {
        **base,
        "has_assignment": True,
        "task_id": next_task_id,
        "task_name": next_task.title if next_task else f"Task {next_task_id}",
        "brief": (next_task.objective or "") if next_task else "",
        "in_progress": completed_count > 0,
        "assigned_at": enrollment.enrolled_at.isoformat(),
    }


@router.get("/my-assignment")
async def my_assignment(db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user)):
    user_id = token_user_id(token)
    result = await db.execute(
        select(Enrollment).where(Enrollment.user_id == user_id)
        .order_by(Enrollment.enrolled_at.desc()).limit(1)
    )
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        return {"has_assignment": False, "reason": "not_enrolled"}
    return await _build_assignment(db, user_id, enrollment)


@router.get("/my-assignments")
async def my_assignments(db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user)):
    user_id = token_user_id(token)
    result = await db.execute(
        select(Enrollment).where(Enrollment.user_id == user_id)
        .order_by(Enrollment.enrolled_at.asc())
    )
    enrollments = result.scalars().all()
    assignments = [await _build_assignment(db, user_id, e) for e in enrollments]
    return {"assignments": assignments}


@router.post("/simulations/{sim_id}/enroll")
async def enroll(
    sim_id: str,
    request: Request,
    background: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    token: dict = Depends(get_current_user),
    x_worklearn_host: str | None = Header(None, alias=TENANT_HOST_HEADER),
):
    user_id = token_user_id(token)
    sim = await _get_published_sim(db, sim_id)
    if not sim:
        raise HTTPException(404, "Simulation not found")
    uni = await _tenant_university(db, request, x_worklearn_host)
    await assert_sim_visible_to_tenant(db, sim, uni.id)

    result = await db.execute(
        select(Enrollment).where(Enrollment.user_id == user_id, Enrollment.simulation_id == sim.id)
    )
    existing = result.scalar_one_or_none()
    if existing:
        return {"enrollment": _enroll_dict(existing, sim.slug), "already_enrolled": True}

    enrollment = Enrollment(user_id=user_id, simulation_id=sim.id)
    db.add(enrollment)
    await db.commit()
    await db.refresh(enrollment)
    return {"enrollment": _enroll_dict(enrollment, sim.slug), "already_enrolled": False}


@router.get("/simulations/{sim_id}/onboarding")
async def get_onboarding(
    sim_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    token: dict = Depends(get_current_user),
    x_worklearn_host: str | None = Header(None, alias=TENANT_HOST_HEADER),
):
    user_id = token_user_id(token)
    sim = await _get_published_sim(db, sim_id)
    if not sim:
        raise HTTPException(404, "No onboarding for this simulation")
    uni = await _tenant_university(db, request, x_worklearn_host)
    await assert_sim_visible_to_tenant(db, sim, uni.id)
    tasks = await _get_sim_tasks(db, sim.id)
    projects = [{"id": t.task_index, "name": t.title, "brief": t.objective or ""} for t in tasks]
    accepted = await _has_journey_badge(db, user_id, sim.id)
    return {**sim.onboarding, "manager": sim.manager, "logo_url": sim.logo_url, "projects": projects,
            "simulation_id": sim.id, "simulation_slug": sim.slug, "accepted": accepted}


@router.post("/simulations/{sim_id}/onboarding/accept")
async def accept_onboarding(
    sim_id: str,
    request: Request,
    background: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    token: dict = Depends(get_current_user),
    x_worklearn_host: str | None = Header(None, alias=TENANT_HOST_HEADER),
):
    user_id = token_user_id(token)
    sim = await _get_published_sim(db, sim_id)
    if not sim:
        raise HTTPException(404, "No onboarding for this simulation")
    uni = await _tenant_university(db, request, x_worklearn_host)
    await assert_sim_visible_to_tenant(db, sim, uni.id)

    enroll_res = await db.execute(
        select(Enrollment).where(Enrollment.user_id == user_id, Enrollment.simulation_id == sim.id)
    )
    enrollment = enroll_res.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(400, "Enroll in the simulation before accepting the offer.")

    if not await _has_journey_badge(db, user_id, sim.id):
        badge = UserBadge(
            user_id=user_id, badge_key=JOURNEY_BADGE_KEY,
            label=f"{sim.title} — Journey", icon="🎖️", simulation_id=sim.id,
        )
        db.add(badge)
        await db.commit()
        background.add_task(_spawn_manager_welcome, user_id, enrollment.id, sim.id)

    badge_res = await db.execute(
        select(UserBadge).where(
            UserBadge.user_id == user_id, UserBadge.badge_key == JOURNEY_BADGE_KEY,
            UserBadge.simulation_id == sim.id,
        )
    )
    b = badge_res.scalar_one()
    return {"accepted": True, "badge": _badge_dict(b, sim.slug)}


@router.get("/enrollments/by-sim/{sim_id}")
async def get_by_sim(sim_id: str, db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user)):
    user_id = token_user_id(token)
    sim = await _get_published_sim(db, sim_id)
    if not sim:
        raise HTTPException(404, "Simulation not found")
    result = await db.execute(
        select(Enrollment).where(Enrollment.user_id == user_id, Enrollment.simulation_id == sim.id)
    )
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(404, "Not enrolled")
    completions = await db.execute(
        select(TaskCompletion.task_id, TaskCompletion.score, TaskCompletion.quiz_score)
        .where(TaskCompletion.enrollment_id == enrollment.id)
    )
    return {
        **_enroll_dict(enrollment, sim.slug),
        "task_completions": [{"task_id": r[0], "score": r[1], "quiz_score": r[2]} for r in completions],
    }


@router.get("/enrollments/{enrollment_id}")
async def get_enrollment(enrollment_id: int, db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user)):
    user_id = token_user_id(token)
    result = await db.execute(
        select(Enrollment).where(Enrollment.id == enrollment_id, Enrollment.user_id == user_id)
    )
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(404, "Enrollment not found")
    sim = await _get_published_sim(db, enrollment.simulation_id)
    completions = await db.execute(
        select(TaskCompletion.task_id).where(TaskCompletion.enrollment_id == enrollment_id)
    )
    return {
        **_enroll_dict(enrollment, sim.slug if sim else None),
        "completed_task_ids": [r[0] for r in completions],
    }


@router.post("/enrollments/{enrollment_id}/tasks/{task_id}/complete")
async def complete_task(
    enrollment_id: int, task_id: int, body: CompleteTaskBody,
    db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user)
):
    user_id = token_user_id(token)
    result = await db.execute(
        select(Enrollment).where(Enrollment.id == enrollment_id, Enrollment.user_id == user_id)
    )
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(404, "Enrollment not found")
    sim_id = enrollment.simulation_id

    awards = await award_task_completion(
        db, user_id, enrollment_id, task_id, simulation_id=sim_id,
        score=body.score, quiz_score=body.quiz_score, rubric_rating=body.rubric_rating,
    )

    finalized = await finalize_if_complete(
        db, user_id=user_id, enrollment_id=enrollment_id,
        simulation_id=sim_id, xp_awarded=awards.get("xp_awarded"),
    )
    return {**awards, **finalized}


def _enroll_dict(e: Enrollment, slug: str | None = None) -> dict:
    d = {
        "id": e.id, "user_id": e.user_id, "simulation_id": e.simulation_id,
        "status": e.status, "current_task_idx": e.current_task_idx,
        "enrolled_at": e.enrolled_at.isoformat(),
        "completed_at": e.completed_at.isoformat() if e.completed_at else None,
    }
    if slug is not None:
        d["simulation_slug"] = slug
    return d


def _badge_dict(b: UserBadge, slug: str | None = None) -> dict:
    d = {
        "id": b.id, "badge_key": b.badge_key, "label": b.label, "icon": b.icon,
        "simulation_id": b.simulation_id, "granted_at": b.granted_at.isoformat(),
    }
    if slug is not None:
        d["simulation_slug"] = slug
    return d


async def _spawn_manager_welcome(user_id: int, enrollment_id: int, sim_id: int):
    """Deterministic welcome from the Manager — no LLM."""
    from app.db.database import AsyncSessionLocal
    from app.models import User
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            return
        sim = await _get_published_sim(db, sim_id)
        manager = sim.manager if sim else DEFAULT_MANAGER
        first_task_res = await db.execute(
            select(SimulationTask).where(SimulationTask.simulation_id == sim_id, SimulationTask.task_index == 1)
        )
        first_task = first_task_res.scalar_one_or_none()
        first_task_name = first_task.title if first_task else "Task 1"
        content = (
            f"Welcome to the team, {user.name}! I'm {manager['name']}, your {manager['role']}. "
            f"Your first assignment is \"{first_task_name}\" — head to the Job Simulation to get started."
        )
        db.add(AgentMessage(user_id=user_id, enrollment_id=enrollment_id, type=MessageType.STANDUP, content=content))
        await db.commit()
