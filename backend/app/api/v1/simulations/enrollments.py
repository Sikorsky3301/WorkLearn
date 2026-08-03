import logging

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func
from pydantic import BaseModel
from datetime import datetime, timezone
from app.db.database import get_db
from app.core.auth import get_current_user
from app.models import Enrollment, EnrollmentStatus, TaskCompletion, AgentMessage, MessageType, UserBadge
from app.models.cms import Simulation, SimulationTask, SimulationStatus
from app.services.skill_engine import award_task_completion
from app.services.simulation_completion import finalize_if_complete

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["enrollments"])

DEFAULT_MANAGER = {"name": "Your Manager", "role": "Simulation Manager", "company": "", "avatar": "M"}

# Badge granted when the student accepts the simulation's offer letter
JOURNEY_BADGE_KEY = "sim_journey"


class CompleteTaskBody(BaseModel):
    score: int | None = None
    quiz_score: int | None = None
    rubric_rating: dict | None = None


async def _has_journey_badge(db: AsyncSession, user_id: str, sim_id: str) -> bool:
    result = await db.execute(
        select(UserBadge).where(
            UserBadge.user_id == user_id,
            UserBadge.badge_key == JOURNEY_BADGE_KEY,
            UserBadge.simulation_id == sim_id,
        )
    )
    return result.scalar_one_or_none() is not None


async def _get_published_sim(db: AsyncSession, sim_id: str) -> Simulation | None:
    result = await db.execute(
        select(Simulation).where(Simulation.id == sim_id, Simulation.status == SimulationStatus.PUBLISHED)
    )
    return result.scalar_one_or_none()


async def _get_sim_tasks(db: AsyncSession, sim_id: str) -> list[SimulationTask]:
    result = await db.execute(
        select(SimulationTask).where(SimulationTask.simulation_id == sim_id).order_by(SimulationTask.task_index)
    )
    return list(result.scalars().all())


@router.get("/simulations")
async def list_simulations(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Simulation).where(Simulation.status == SimulationStatus.PUBLISHED))
    sims = result.scalars().all()
    out = []
    for sim in sims:
        count_res = await db.execute(
            select(func.count()).select_from(SimulationTask).where(SimulationTask.simulation_id == sim.id)
        )
        out.append({
            "id": sim.id, "title": sim.title, "description": sim.description,
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
    result = await db.execute(
        select(UserBadge).where(UserBadge.user_id == token["sub"]).order_by(UserBadge.granted_at.desc())
    )
    return {"badges": [_badge_dict(b) for b in result.scalars().all()]}


async def _build_assignment(db: AsyncSession, user_id: str, enrollment: Enrollment) -> dict:
    """Manager + current-task summary for one enrollment — shared by the
    single-simulation `/my-assignment` (kept for back-compat) and the
    multi-simulation `/my-assignments` the Dashboard now uses so every
    enrolled simulation's manager/task shows up, not just the latest one."""
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
        "simulation_title": sim.title if sim else sim_id,
        # Powers the AI Mentor's domain-aware persona (app/ai/services/mentor_personas.py)
        "domain": sim.domain if sim else None,
        "enrollment_id": enrollment.id,
        "manager": manager,
        "completed_count": completed_count,
        "total_tasks": len(work_task_ids),
    }

    # Enrolled but hasn't accepted the offer yet → onboarding is pending
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
        # True once they've completed at least one earlier task (i.e. actively in progress)
        "in_progress": completed_count > 0,
        "assigned_at": enrollment.enrolled_at.isoformat(),
    }


@router.get("/my-assignment")
async def my_assignment(db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user)):
    """Most-recently-enrolled simulation's manager/task. Kept for any caller
    still using the singular endpoint — the Dashboard itself now uses
    `/my-assignments` (plural) so it can show every enrolled simulation."""
    user_id = token["sub"]
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
    """One manager/task summary per simulation the student is enrolled in —
    powers the Dashboard's "Your Managers" list so a student running multiple
    job simulations at once sees every manager and their current task."""
    user_id = token["sub"]
    result = await db.execute(
        select(Enrollment).where(Enrollment.user_id == user_id)
        .order_by(Enrollment.enrolled_at.asc())
    )
    enrollments = result.scalars().all()
    assignments = [await _build_assignment(db, user_id, e) for e in enrollments]
    return {"assignments": assignments}


@router.post("/simulations/{sim_id}/enroll")
async def enroll(sim_id: str, background: BackgroundTasks, db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user)):
    user_id = token["sub"]
    result = await db.execute(
        select(Enrollment).where(Enrollment.user_id == user_id, Enrollment.simulation_id == sim_id)
    )
    existing = result.scalar_one_or_none()
    if existing:
        return {"enrollment": _enroll_dict(existing), "already_enrolled": True}

    enrollment = Enrollment(user_id=user_id, simulation_id=sim_id)
    db.add(enrollment)
    await db.commit()
    await db.refresh(enrollment)

    # NOTE: the manager welcome is posted when the student ACCEPTS the offer
    # (see accept_onboarding), not at enroll — onboarding comes first.
    return {"enrollment": _enroll_dict(enrollment), "already_enrolled": False}


@router.get("/simulations/{sim_id}/onboarding")
async def get_onboarding(sim_id: str, db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user)):
    """Onboarding experience content (company, manager, projects, offer) + whether accepted."""
    sim = await _get_published_sim(db, sim_id)
    if not sim:
        raise HTTPException(404, "No onboarding for this simulation")
    tasks = await _get_sim_tasks(db, sim_id)
    # "projects" is derived from the sim's own tasks at read time (not stored
    # in the onboarding JSON blob) so it can never drift from the real task list.
    projects = [{"id": t.task_index, "name": t.title, "brief": t.objective or ""} for t in tasks]
    accepted = await _has_journey_badge(db, token["sub"], sim_id)
    return {**sim.onboarding, "manager": sim.manager, "logo_url": sim.logo_url, "projects": projects,
            "simulation_id": sim_id, "accepted": accepted}


@router.post("/simulations/{sim_id}/onboarding/accept")
async def accept_onboarding(
    sim_id: str, background: BackgroundTasks,
    db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user)
):
    """Accept the offer → grant the Simulation Journey badge and start Week 1."""
    user_id = token["sub"]
    sim = await _get_published_sim(db, sim_id)
    if not sim:
        raise HTTPException(404, "No onboarding for this simulation")

    # Ensure the student is enrolled
    enroll_res = await db.execute(
        select(Enrollment).where(Enrollment.user_id == user_id, Enrollment.simulation_id == sim_id)
    )
    enrollment = enroll_res.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(400, "Enroll in the simulation before accepting the offer.")

    # Idempotent badge grant
    if not await _has_journey_badge(db, user_id, sim_id):
        badge = UserBadge(
            user_id=user_id, badge_key=JOURNEY_BADGE_KEY,
            label=f"{sim.title} — Journey", icon="🎖️", simulation_id=sim_id,
        )
        db.add(badge)
        await db.commit()
        # Manager posts the Week 1 welcome now that onboarding is done
        background.add_task(_spawn_manager_welcome, user_id, enrollment.id, sim_id)

    badge_res = await db.execute(
        select(UserBadge).where(
            UserBadge.user_id == user_id, UserBadge.badge_key == JOURNEY_BADGE_KEY,
            UserBadge.simulation_id == sim_id,
        )
    )
    b = badge_res.scalar_one()
    return {"accepted": True, "badge": _badge_dict(b)}


@router.get("/enrollments/by-sim/{sim_id}")
async def get_by_sim(sim_id: str, db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user)):
    user_id = token["sub"]
    result = await db.execute(
        select(Enrollment).where(Enrollment.user_id == user_id, Enrollment.simulation_id == sim_id)
    )
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(404, "Not enrolled")
    completions = await db.execute(
        select(TaskCompletion.task_id, TaskCompletion.score, TaskCompletion.quiz_score)
        .where(TaskCompletion.enrollment_id == enrollment.id)
    )
    return {**_enroll_dict(enrollment), "task_completions": [{"task_id": r[0], "score": r[1], "quiz_score": r[2]} for r in completions]}


@router.get("/enrollments/{enrollment_id}")
async def get_enrollment(enrollment_id: str, db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user)):
    result = await db.execute(
        select(Enrollment).where(Enrollment.id == enrollment_id, Enrollment.user_id == token["sub"])
    )
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(404, "Enrollment not found")
    completions = await db.execute(
        select(TaskCompletion.task_id).where(TaskCompletion.enrollment_id == enrollment_id)
    )
    return {**_enroll_dict(enrollment), "completed_task_ids": [r[0] for r in completions]}


@router.post("/enrollments/{enrollment_id}/tasks/{task_id}/complete")
async def complete_task(
    enrollment_id: str, task_id: int, body: CompleteTaskBody,
    db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user)
):
    user_id = token["sub"]
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

    # Shared with the sandbox submission path — see
    # app/services/simulation_completion.py for why this can't live inline here.
    finalized = await finalize_if_complete(
        db, user_id=user_id, enrollment_id=enrollment_id,
        simulation_id=sim_id, xp_awarded=awards.get("xp_awarded"),
    )
    return {**awards, **finalized}


def _enroll_dict(e: Enrollment) -> dict:
    return {
        "id": e.id, "user_id": e.user_id, "simulation_id": e.simulation_id,
        "status": e.status, "current_task_idx": e.current_task_idx,
        "enrolled_at": e.enrolled_at.isoformat(), "completed_at": e.completed_at.isoformat() if e.completed_at else None,
    }


def _badge_dict(b: UserBadge) -> dict:
    return {
        "id": b.id, "badge_key": b.badge_key, "label": b.label, "icon": b.icon,
        "simulation_id": b.simulation_id, "granted_at": b.granted_at.isoformat(),
    }


async def _spawn_manager_welcome(user_id: str, enrollment_id: str, sim_id: str):
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
