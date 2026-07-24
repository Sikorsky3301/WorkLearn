"""
Superadmin CRUD for the Simulation CMS — create/edit/publish custom job
simulations. Gated by the same require_superadmin dependency the rest of
the admin panel uses (see app/dependencies.py).
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.dependencies import require_superadmin
from app.models import Enrollment
from app.models_cms import Simulation, SimulationTask, SimulationStatus
from app.schemas_cms import (
    SimulationCreate, SimulationUpdate, SimulationTaskCreate, SimulationTaskUpdate,
    ReorderTasksBody, validate_task_config,
)

router = APIRouter(prefix="/api/admin/simulations", tags=["admin-simulations"])


def _sim_summary(sim: Simulation, task_count: int) -> dict:
    return {
        "id": sim.id, "title": sim.title, "domain": sim.domain,
        "category": sim.category, "status": sim.status.value,
        "task_count": task_count,
        "updated_at": sim.updated_at.isoformat(),
        "published_at": sim.published_at.isoformat() if sim.published_at else None,
    }


def _task_dict(t: SimulationTask) -> dict:
    return {
        "id": t.id, "simulation_id": t.simulation_id, "task_index": t.task_index,
        "title": t.title, "type": t.type, "objective": t.objective,
        "briefing": t.briefing, "what_to_do": t.what_to_do, "what_to_submit": t.what_to_submit,
        "hints": t.hints, "success_criteria": t.success_criteria,
        "reference_data": t.reference_data, "model_solution": t.model_solution,
        "rubric": t.rubric, "config": t.config, "xp_award": t.xp_award,
        "skill_awards": t.skill_awards, "week": t.week,
    }


def _sim_dict(sim: Simulation) -> dict:
    return {
        "id": sim.id, "title": sim.title, "description": sim.description,
        "company": sim.company, "logo_url": sim.logo_url, "domain": sim.domain,
        "category": sim.category, "accent_color": sim.accent_color,
        "difficulty": sim.difficulty, "estimated_hours": sim.estimated_hours,
        "skills": sim.skills, "rating": sim.rating, "rating_count": sim.rating_count,
        "manager": sim.manager, "onboarding": sim.onboarding,
        "onboarding_xp_award": sim.onboarding_xp_award, "status": sim.status.value,
        "created_at": sim.created_at.isoformat(), "updated_at": sim.updated_at.isoformat(),
        "published_at": sim.published_at.isoformat() if sim.published_at else None,
        "tasks": [_task_dict(t) for t in sorted(sim.tasks, key=lambda t: t.task_index)],
    }


async def _get_sim_or_404(sim_id: str, db: AsyncSession) -> Simulation:
    result = await db.execute(select(Simulation).where(Simulation.id == sim_id))
    sim = result.scalar_one_or_none()
    if not sim:
        raise HTTPException(404, "Simulation not found")
    return sim


@router.get("")
async def list_simulations(db: AsyncSession = Depends(get_db), _=Depends(require_superadmin)):
    result = await db.execute(select(Simulation))
    sims = result.scalars().all()
    out = []
    for sim in sims:
        count_res = await db.execute(
            select(func.count()).select_from(SimulationTask).where(SimulationTask.simulation_id == sim.id)
        )
        out.append(_sim_summary(sim, count_res.scalar() or 0))
    return {"simulations": out}


@router.post("")
async def create_simulation(body: SimulationCreate, db: AsyncSession = Depends(get_db), token: dict = Depends(require_superadmin)):
    existing = await db.execute(select(Simulation).where(Simulation.id == body.id))
    if existing.scalar_one_or_none():
        raise HTTPException(409, f"Simulation id '{body.id}' already exists")

    sim = Simulation(
        id=body.id, title=body.title, description=body.description, company=body.company,
        logo_url=body.logo_url, domain=body.domain, category=body.category,
        accent_color=body.accent_color, difficulty=body.difficulty,
        estimated_hours=body.estimated_hours, skills=body.skills,
        rating=body.rating, rating_count=body.rating_count,
        manager=body.manager.model_dump(), onboarding=body.onboarding.model_dump(),
        onboarding_xp_award=body.onboarding_xp_award,
        status=SimulationStatus.DRAFT, created_by=token.get("sub"),
    )
    db.add(sim)
    await db.commit()
    await db.refresh(sim, attribute_names=["tasks"])
    return _sim_dict(sim)


@router.get("/{sim_id}")
async def get_simulation(sim_id: str, db: AsyncSession = Depends(get_db), _=Depends(require_superadmin)):
    sim = await _get_sim_or_404(sim_id, db)
    await db.refresh(sim, attribute_names=["tasks"])
    return _sim_dict(sim)


@router.patch("/{sim_id}")
async def update_simulation(sim_id: str, body: SimulationUpdate, db: AsyncSession = Depends(get_db), _=Depends(require_superadmin)):
    sim = await _get_sim_or_404(sim_id, db)
    patch = body.model_dump(exclude_unset=True)
    for key in ("manager", "onboarding"):
        if key in patch and patch[key] is not None:
            patch[key] = getattr(body, key).model_dump()
    for key, value in patch.items():
        setattr(sim, key, value)
    await db.commit()
    await db.refresh(sim, attribute_names=["tasks"])
    return _sim_dict(sim)


@router.post("/{sim_id}/publish")
async def publish_simulation(sim_id: str, db: AsyncSession = Depends(get_db), _=Depends(require_superadmin)):
    sim = await _get_sim_or_404(sim_id, db)
    task_count = await db.execute(
        select(func.count()).select_from(SimulationTask).where(SimulationTask.simulation_id == sim_id)
    )
    if not (task_count.scalar() or 0):
        raise HTTPException(400, "Cannot publish a simulation with no tasks")
    sim.status = SimulationStatus.PUBLISHED
    sim.published_at = datetime.now(timezone.utc)
    await db.commit()
    return {"ok": True, "status": sim.status.value}


@router.post("/{sim_id}/unpublish")
async def unpublish_simulation(sim_id: str, db: AsyncSession = Depends(get_db), _=Depends(require_superadmin)):
    sim = await _get_sim_or_404(sim_id, db)
    sim.status = SimulationStatus.DRAFT
    sim.published_at = None
    await db.commit()
    return {"ok": True, "status": sim.status.value}


@router.delete("/{sim_id}")
async def delete_simulation(sim_id: str, db: AsyncSession = Depends(get_db), _=Depends(require_superadmin)):
    sim = await _get_sim_or_404(sim_id, db)
    enroll_count = await db.execute(
        select(func.count()).select_from(Enrollment).where(Enrollment.simulation_id == sim_id)
    )
    if (enroll_count.scalar() or 0) > 0:
        raise HTTPException(409, "Cannot delete a simulation with existing enrollments")
    await db.delete(sim)
    await db.commit()
    return {"ok": True}


@router.post("/{sim_id}/tasks")
async def create_task(sim_id: str, body: SimulationTaskCreate, db: AsyncSession = Depends(get_db), _=Depends(require_superadmin)):
    await _get_sim_or_404(sim_id, db)
    try:
        validated_config = validate_task_config(body.type, body.config)
    except (ValidationError, KeyError) as e:
        raise HTTPException(422, f"Invalid config for task type '{body.type}': {e}")

    existing = await db.execute(
        select(SimulationTask).where(
            SimulationTask.simulation_id == sim_id, SimulationTask.task_index == body.task_index,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(409, f"task_index {body.task_index} already exists on this simulation")

    task = SimulationTask(
        simulation_id=sim_id, task_index=body.task_index, title=body.title, type=body.type,
        objective=body.objective, briefing=body.briefing,
        what_to_do=body.what_to_do, what_to_submit=body.what_to_submit, hints=body.hints,
        success_criteria=body.success_criteria,
        reference_data=body.reference_data.model_dump() if body.reference_data else None,
        model_solution=body.model_solution.model_dump() if body.model_solution else None,
        rubric=body.rubric, config=validated_config,
        xp_award=body.xp_award, skill_awards=body.skill_awards, week=body.week,
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return _task_dict(task)


async def _get_task_or_404(sim_id: str, task_id: str, db: AsyncSession) -> SimulationTask:
    result = await db.execute(
        select(SimulationTask).where(SimulationTask.id == task_id, SimulationTask.simulation_id == sim_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(404, "Task not found")
    return task


@router.patch("/{sim_id}/tasks/{task_id}")
async def update_task(sim_id: str, task_id: str, body: SimulationTaskUpdate, db: AsyncSession = Depends(get_db), _=Depends(require_superadmin)):
    task = await _get_task_or_404(sim_id, task_id, db)
    patch = body.model_dump(exclude_unset=True)
    if "config" in patch and patch["config"] is not None:
        try:
            patch["config"] = validate_task_config(task.type, patch["config"])
        except ValidationError as e:
            raise HTTPException(422, f"Invalid config for task type '{task.type}': {e}")
    for key, value in patch.items():
        setattr(task, key, value)
    await db.commit()
    await db.refresh(task)
    return _task_dict(task)


@router.delete("/{sim_id}/tasks/{task_id}")
async def delete_task(sim_id: str, task_id: str, db: AsyncSession = Depends(get_db), _=Depends(require_superadmin)):
    task = await _get_task_or_404(sim_id, task_id, db)
    await db.delete(task)
    await db.commit()
    return {"ok": True}


@router.post("/{sim_id}/tasks/reorder")
async def reorder_tasks(sim_id: str, body: ReorderTasksBody, db: AsyncSession = Depends(get_db), _=Depends(require_superadmin)):
    result = await db.execute(select(SimulationTask).where(SimulationTask.simulation_id == sim_id))
    tasks_by_id = {t.id: t for t in result.scalars().all()}
    if set(body.task_ids) != set(tasks_by_id.keys()):
        raise HTTPException(400, "task_ids must be exactly the simulation's current task set")

    # Two-pass update avoids transiently colliding with the UniqueConstraint
    # on (simulation_id, task_index) while indices are being reshuffled.
    for i, task_id in enumerate(body.task_ids):
        tasks_by_id[task_id].task_index = -(i + 1)
    await db.flush()
    for i, task_id in enumerate(body.task_ids):
        tasks_by_id[task_id].task_index = i + 1
    await db.commit()
    return {"ok": True}
