"""
CRUD for the Simulation CMS — create/edit/publish custom job simulations.
Gated by simulations.* permissions (require_permission alias for admin+super_admin).
Simulations use integer PK + public slug; path params resolve via get_simulation.
"""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import ValidationError, BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from sqlalchemy.orm import selectinload

from app.db.database import get_db
from app.core.permissions import require_cms_access, require_roles
from app.core.auth import token_user_id
from app.models import Enrollment, UserBadge
from app.models.cms import Simulation, SimulationTask, SimulationStatus
from app.models.roles import RoleSlug
from app.api.v1.simulations.enrollments import JOURNEY_BADGE_KEY
from app.schemas.cms import (
    SimulationCreate, SimulationUpdate, SimulationTaskCreate, SimulationTaskUpdate,
    ReorderTasksBody, DuplicateSimulationBody, CreateFromTemplateBody, validate_task_config,
)
from app.cms_templates import TEMPLATES
from app.services.sim_view import build_simulation_public_dict
from app.services import sandbox
from app.services.graders import declarative_rules
from app.services.audit import log_action, resolve_actor_info
from app.services.simulation_lookup import get_simulation as lookup_simulation
from app.services.simulation_scope import (
    assert_can_mutate_simulation,
    apply_publish_scope_for_actor,
    is_platform_admin,
    scope_payload,
)

router = APIRouter(prefix="/api/admin/simulations", tags=["admin-simulations"])


class PreviewRunSandboxBody(BaseModel):
    code: str


class PublishScopeBody(BaseModel):
    available_to_all: bool | None = None
    university_ids: list[int] | None = None


def _sim_summary(sim: Simulation, task_count: int, enrollment_count: int) -> dict:
    return {
        "id": sim.id, "slug": sim.slug, "title": sim.title, "domain": sim.domain,
        "category": sim.category, "status": sim.status.value,
        "task_count": task_count, "enrollment_count": enrollment_count,
        "created_by": sim.created_by,
        "updated_at": sim.updated_at.isoformat(),
        "published_at": sim.published_at.isoformat() if sim.published_at else None,
        **scope_payload(sim),
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
        "id": sim.id, "slug": sim.slug, "title": sim.title, "description": sim.description,
        "company": sim.company, "logo_url": sim.logo_url, "domain": sim.domain,
        "category": sim.category, "accent_color": sim.accent_color,
        "difficulty": sim.difficulty, "estimated_hours": sim.estimated_hours,
        "skills": sim.skills, "rating": sim.rating, "rating_count": sim.rating_count,
        "manager": sim.manager, "onboarding": sim.onboarding,
        "onboarding_xp_award": sim.onboarding_xp_award, "section_labels": sim.section_labels,
        "status": sim.status.value, "created_by": sim.created_by,
        "created_at": sim.created_at.isoformat(), "updated_at": sim.updated_at.isoformat(),
        "published_at": sim.published_at.isoformat() if sim.published_at else None,
        "tasks": [_task_dict(t) for t in sorted(sim.tasks, key=lambda t: t.task_index)],
        **scope_payload(sim),
    }


async def _get_sim_or_404(sim_key: str, db: AsyncSession) -> Simulation:
    sim = await lookup_simulation(db, sim_key)
    if not sim:
        raise HTTPException(404, "Simulation not found")
    await db.refresh(sim, attribute_names=["university_links"])
    return sim


@router.get("")
async def list_simulations(db: AsyncSession = Depends(get_db), token: dict = Depends(require_cms_access())):
    q = select(Simulation).options(selectinload(Simulation.university_links))
    if not is_platform_admin(token):
        q = q.where(Simulation.created_by == token_user_id(token))
    result = await db.execute(q)
    sims = result.scalars().all()
    out = []
    for sim in sims:
        count_res = await db.execute(
            select(func.count()).select_from(SimulationTask).where(SimulationTask.simulation_id == sim.id)
        )
        enroll_res = await db.execute(
            select(func.count()).select_from(Enrollment).where(Enrollment.simulation_id == sim.id)
        )
        out.append(_sim_summary(sim, count_res.scalar() or 0, enroll_res.scalar() or 0))
    return {"simulations": out}


@router.post("")
async def create_simulation(body: SimulationCreate, db: AsyncSession = Depends(get_db), token: dict = Depends(require_cms_access())):
    existing = await db.execute(select(Simulation).where(Simulation.slug == body.slug))
    if existing.scalar_one_or_none():
        raise HTTPException(409, f"Simulation slug '{body.slug}' already exists")

    sim = Simulation(
        slug=body.slug, title=body.title, description=body.description, company=body.company,
        logo_url=body.logo_url, domain=body.domain, category=body.category,
        accent_color=body.accent_color, difficulty=body.difficulty,
        estimated_hours=body.estimated_hours, skills=body.skills,
        rating=body.rating, rating_count=body.rating_count,
        manager=body.manager.model_dump(), onboarding=body.onboarding.model_dump(),
        onboarding_xp_award=body.onboarding_xp_award, section_labels=body.section_labels,
        status=SimulationStatus.DRAFT, created_by=token_user_id(token),
    )
    db.add(sim)
    await db.commit()
    await db.refresh(sim, attribute_names=["tasks"])
    # New sims have no targeting rows yet — set committed empty collection so
    # _sim_dict/scope_payload never async-lazy-loads university_links.
    from sqlalchemy.orm.attributes import set_committed_value
    set_committed_value(sim, "university_links", [])
    return _sim_dict(sim)


@router.post("/{sim_id}/duplicate")
async def duplicate_simulation(
    sim_id: str, body: DuplicateSimulationBody,
    db: AsyncSession = Depends(get_db), token: dict = Depends(require_cms_access()),
):
    source = await _get_sim_or_404(sim_id, db)
    assert_can_mutate_simulation(token, source)
    await db.refresh(source, attribute_names=["tasks"])

    existing = await db.execute(select(Simulation).where(Simulation.slug == body.new_slug))
    if existing.scalar_one_or_none():
        raise HTTPException(409, f"Simulation slug '{body.new_slug}' already exists")

    new_sim = Simulation(
        slug=body.new_slug, title=source.title, description=source.description,
        company=source.company, logo_url=source.logo_url, domain=source.domain,
        category=source.category, accent_color=source.accent_color,
        difficulty=source.difficulty, estimated_hours=source.estimated_hours,
        skills=source.skills, rating=source.rating, rating_count=source.rating_count,
        manager=source.manager, onboarding=source.onboarding,
        onboarding_xp_award=source.onboarding_xp_award,
        section_labels=source.section_labels,
        status=SimulationStatus.DRAFT, created_by=token_user_id(token),
    )
    db.add(new_sim)
    await db.flush()

    for t in source.tasks:
        db.add(SimulationTask(
            simulation_id=new_sim.id, task_index=t.task_index, title=t.title, type=t.type,
            objective=t.objective, briefing=t.briefing,
            what_to_do=t.what_to_do, what_to_submit=t.what_to_submit,
            hints=t.hints, success_criteria=t.success_criteria,
            reference_data=t.reference_data, model_solution=t.model_solution,
            rubric=t.rubric, config=t.config,
            xp_award=t.xp_award, skill_awards=t.skill_awards, week=t.week,
        ))

    await db.commit()
    await db.refresh(new_sim, attribute_names=["tasks"])
    from sqlalchemy.orm.attributes import set_committed_value
    set_committed_value(new_sim, "university_links", [])
    return _sim_dict(new_sim)


@router.post("/from-template/{template_key}")
async def create_from_template(
    template_key: str, body: CreateFromTemplateBody,
    db: AsyncSession = Depends(get_db), token: dict = Depends(require_cms_access()),
):
    template = TEMPLATES.get(template_key)
    if not template:
        raise HTTPException(404, f"Unknown template '{template_key}'")

    existing = await db.execute(select(Simulation).where(Simulation.slug == body.slug))
    if existing.scalar_one_or_none():
        raise HTTPException(409, f"Simulation slug '{body.slug}' already exists")

    sim_data = SimulationCreate(**{
        **template["simulation"],
        "slug": body.slug,
        "title": body.title or template["simulation"]["title"],
    })
    sim = Simulation(
        slug=sim_data.slug, title=sim_data.title, description=sim_data.description, company=sim_data.company,
        logo_url=sim_data.logo_url, domain=sim_data.domain, category=sim_data.category,
        accent_color=sim_data.accent_color, difficulty=sim_data.difficulty,
        estimated_hours=sim_data.estimated_hours, skills=sim_data.skills,
        rating=sim_data.rating, rating_count=sim_data.rating_count,
        manager=sim_data.manager.model_dump(), onboarding=sim_data.onboarding.model_dump(),
        onboarding_xp_award=sim_data.onboarding_xp_award, section_labels=sim_data.section_labels,
        status=SimulationStatus.DRAFT, created_by=token_user_id(token),
    )
    db.add(sim)
    await db.flush()

    for t in template["tasks"]:
        task_data = SimulationTaskCreate(**t)
        validated_config = validate_task_config(task_data.type, task_data.config)
        db.add(SimulationTask(
            simulation_id=sim.id, task_index=task_data.task_index, title=task_data.title, type=task_data.type,
            objective=task_data.objective, briefing=task_data.briefing,
            what_to_do=task_data.what_to_do, what_to_submit=task_data.what_to_submit,
            hints=task_data.hints, success_criteria=task_data.success_criteria,
            reference_data=task_data.reference_data.model_dump() if task_data.reference_data else None,
            model_solution=task_data.model_solution.model_dump() if task_data.model_solution else None,
            rubric=task_data.rubric, config=validated_config,
            xp_award=task_data.xp_award, skill_awards=task_data.skill_awards, week=task_data.week,
        ))

    await db.commit()
    await db.refresh(sim, attribute_names=["tasks"])
    from sqlalchemy.orm.attributes import set_committed_value
    set_committed_value(sim, "university_links", [])
    return _sim_dict(sim)


@router.get("/{sim_id}")
async def get_simulation(sim_id: str, db: AsyncSession = Depends(get_db), token: dict = Depends(require_cms_access())):
    sim = await _get_sim_or_404(sim_id, db)
    assert_can_mutate_simulation(token, sim)
    await db.refresh(sim, attribute_names=["tasks"])
    return _sim_dict(sim)


@router.get("/{sim_id}/preview-full")
async def preview_full_simulation(sim_id: str, db: AsyncSession = Depends(get_db), token: dict = Depends(require_cms_access())):
    sim = await _get_sim_or_404(sim_id, db)
    assert_can_mutate_simulation(token, sim)
    tasks_res = await db.execute(
        select(SimulationTask).where(SimulationTask.simulation_id == sim.id).order_by(SimulationTask.task_index)
    )
    tasks = tasks_res.scalars().all()
    return build_simulation_public_dict(sim, tasks)


@router.patch("/{sim_id}")
async def update_simulation(sim_id: str, body: SimulationUpdate, db: AsyncSession = Depends(get_db), token: dict = Depends(require_cms_access())):
    sim = await _get_sim_or_404(sim_id, db)
    assert_can_mutate_simulation(token, sim)
    patch = body.model_dump(exclude_unset=True)
    if "slug" in patch and patch["slug"] is not None and patch["slug"] != sim.slug:
        clash = await db.execute(select(Simulation).where(Simulation.slug == patch["slug"]))
        if clash.scalar_one_or_none():
            raise HTTPException(409, f"Simulation slug '{patch['slug']}' already exists")
    for key in ("manager", "onboarding"):
        if key in patch and patch[key] is not None:
            patch[key] = getattr(body, key).model_dump()
    for key, value in patch.items():
        setattr(sim, key, value)
    await db.commit()
    await db.refresh(sim, attribute_names=["tasks", "university_links"])
    return _sim_dict(sim)


@router.post("/{sim_id}/publish")
async def publish_simulation(
    sim_id: str,
    body: PublishScopeBody | None = None,
    db: AsyncSession = Depends(get_db),
    token: dict = Depends(require_cms_access()),
):
    sim = await _get_sim_or_404(sim_id, db)
    assert_can_mutate_simulation(token, sim)
    tasks_res = await db.execute(select(SimulationTask).where(SimulationTask.simulation_id == sim.id))
    tasks = tasks_res.scalars().all()
    if not tasks:
        raise HTTPException(400, "Cannot publish a simulation with no tasks")

    issues = []
    for t in tasks:
        if t.rubric is not None and abs(sum(t.rubric.values()) - 1.0) > 1e-6:
            issues.append(f'"{t.title}": rubric weights sum to {sum(t.rubric.values()):.2f}, must equal 1.0')
        if t.type == "code_sandbox" and t.config.get("grading_strategy") == "declarative_rules":
            rules = t.config.get("rules") or []
            points = sum(r.get("points", 0) for r in rules)
            if rules and points != 100:
                issues.append(f'"{t.title}": declarative rule points sum to {points}, must equal 100')
    if issues:
        raise HTTPException(400, "Cannot publish — grading configuration is incomplete: " + "; ".join(issues))

    await apply_publish_scope_for_actor(db, token, sim, body.model_dump() if body else {})
    sim.status = SimulationStatus.PUBLISHED
    sim.published_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(sim, attribute_names=["university_links"])
    return {"ok": True, "status": sim.status.value, **scope_payload(sim)}


@router.patch("/{sim_id}/publish-scope")
async def patch_publish_scope(
    sim_id: str,
    body: PublishScopeBody,
    db: AsyncSession = Depends(get_db),
    token: dict = Depends(require_roles(RoleSlug.SUPER_ADMIN, RoleSlug.ADMIN)),
):
    """Platform admin only — change university targeting without unpublishing."""
    sim = await _get_sim_or_404(sim_id, db)
    await apply_publish_scope_for_actor(db, token, sim, body.model_dump())
    await db.commit()
    await db.refresh(sim, attribute_names=["university_links"])
    return {"ok": True, **scope_payload(sim)}


@router.post("/{sim_id}/unpublish")
async def unpublish_simulation(sim_id: str, db: AsyncSession = Depends(get_db), token: dict = Depends(require_cms_access())):
    sim = await _get_sim_or_404(sim_id, db)
    assert_can_mutate_simulation(token, sim)
    sim.status = SimulationStatus.DRAFT
    sim.published_at = None
    await db.commit()
    return {"ok": True, "status": sim.status.value}


@router.delete("/{sim_id}")
async def delete_simulation(sim_id: str, db: AsyncSession = Depends(get_db), token: dict = Depends(require_cms_access())):
    sim = await _get_sim_or_404(sim_id, db)
    assert_can_mutate_simulation(token, sim)
    enroll_count = await db.execute(
        select(func.count()).select_from(Enrollment).where(Enrollment.simulation_id == sim.id)
    )
    if (enroll_count.scalar() or 0) > 0:
        raise HTTPException(409, "Cannot delete a simulation with existing enrollments")
    await db.delete(sim)
    await db.commit()
    return {"ok": True}


@router.delete("/{sim_id}/enrollments")
async def unenroll_all_students(
    sim_id: str, db: AsyncSession = Depends(get_db), token: dict = Depends(require_cms_access())
):
    sim = await _get_sim_or_404(sim_id, db)
    assert_can_mutate_simulation(token, sim)
    result = await db.execute(select(Enrollment).where(Enrollment.simulation_id == sim.id))
    enrollments = result.scalars().all()
    if not enrollments:
        return {"ok": True, "unenrolled_count": 0}

    user_ids = [e.user_id for e in enrollments]
    await db.execute(
        delete(UserBadge).where(
            UserBadge.simulation_id == sim.id,
            UserBadge.badge_key == JOURNEY_BADGE_KEY,
            UserBadge.user_id.in_(user_ids),
        )
    )
    actor_id, actor_role, actor_name = await resolve_actor_info(token, db)
    await log_action(
        db, actor_id=actor_id, actor_role=actor_role, actor_name=actor_name,
        action="simulation.unenroll_all", target_type="simulation", target_id=str(sim.id),
        meta={"slug": sim.slug, "unenrolled_count": len(enrollments), "user_ids": user_ids},
    )
    await db.execute(delete(Enrollment).where(Enrollment.simulation_id == sim.id))
    await db.commit()
    return {"ok": True, "unenrolled_count": len(enrollments)}


@router.post("/{sim_id}/tasks")
async def create_task(sim_id: str, body: SimulationTaskCreate, db: AsyncSession = Depends(get_db), token: dict = Depends(require_cms_access())):
    sim = await _get_sim_or_404(sim_id, db)
    assert_can_mutate_simulation(token, sim)
    try:
        validated_config = validate_task_config(body.type, body.config)
    except (ValidationError, KeyError) as e:
        raise HTTPException(422, f"Invalid config for task type '{body.type}': {e}")

    existing = await db.execute(
        select(SimulationTask).where(
            SimulationTask.simulation_id == sim.id, SimulationTask.task_index == body.task_index,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(409, f"task_index {body.task_index} already exists on this simulation")

    task = SimulationTask(
        simulation_id=sim.id, task_index=body.task_index, title=body.title, type=body.type,
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


async def _get_task_or_404(sim: Simulation, task_id: int, db: AsyncSession) -> SimulationTask:
    result = await db.execute(
        select(SimulationTask).where(SimulationTask.id == task_id, SimulationTask.simulation_id == sim.id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(404, "Task not found")
    return task


@router.post("/{sim_id}/tasks/{task_id}/preview-run-sandbox")
async def preview_run_sandbox(
    sim_id: str, task_id: int, body: PreviewRunSandboxBody,
    db: AsyncSession = Depends(get_db), token: dict = Depends(require_cms_access()),
):
    sim = await _get_sim_or_404(sim_id, db)
    assert_can_mutate_simulation(token, sim)
    task = await _get_task_or_404(sim, task_id, db)
    if task.type != "code_sandbox":
        raise HTTPException(400, "Only code_sandbox tasks support preview runs")
    config = task.config
    if config.get("grading_strategy") != "declarative_rules":
        raise HTTPException(400, "Interactive preview only supports declarative-rules sandbox tasks — registered-grader tasks require a real enrollment")
    if not body.code.strip():
        raise HTTPException(400, "code is required")

    input_name = config.get("input_filename") or "submission.py"
    output_name = config.get("output_filename") or "output.json"
    input_files = dict(config.get("static_input_files") or {})
    result = await sandbox.run_submission(
        body.code, input_files=input_files, image=config.get("docker_image"), submission_filename=input_name,
    )
    try:
        output_bytes = sandbox.read_output(result, output_name)
        stdout, stderr, timed_out = result.stdout, result.stderr, result.timed_out
    finally:
        sandbox.cleanup(result.workdir)

    grade_result = declarative_rules.evaluate(output_bytes, config.get("rules") or [])
    grade_result["details"]["stdout"] = stdout[-2000:]
    grade_result["details"]["stderr"] = stderr[-2000:]
    grade_result["details"]["timed_out"] = timed_out
    return grade_result


@router.patch("/{sim_id}/tasks/{task_id}")
async def update_task(sim_id: str, task_id: int, body: SimulationTaskUpdate, db: AsyncSession = Depends(get_db), token: dict = Depends(require_cms_access())):
    sim = await _get_sim_or_404(sim_id, db)
    assert_can_mutate_simulation(token, sim)
    task = await _get_task_or_404(sim, task_id, db)
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


@router.post("/{sim_id}/tasks/{task_id}/duplicate")
async def duplicate_task(sim_id: str, task_id: int, db: AsyncSession = Depends(get_db), token: dict = Depends(require_cms_access())):
    sim = await _get_sim_or_404(sim_id, db)
    assert_can_mutate_simulation(token, sim)
    source = await _get_task_or_404(sim, task_id, db)
    max_index_res = await db.execute(
        select(func.max(SimulationTask.task_index)).where(SimulationTask.simulation_id == sim.id)
    )
    next_index = (max_index_res.scalar() or 0) + 1

    new_task = SimulationTask(
        simulation_id=sim.id, task_index=next_index, title=f"{source.title} (Copy)", type=source.type,
        objective=source.objective, briefing=source.briefing,
        what_to_do=source.what_to_do, what_to_submit=source.what_to_submit,
        hints=source.hints, success_criteria=source.success_criteria,
        reference_data=source.reference_data, model_solution=source.model_solution,
        rubric=source.rubric, config=source.config,
        xp_award=source.xp_award, skill_awards=source.skill_awards, week=source.week,
    )
    db.add(new_task)
    await db.commit()
    await db.refresh(new_task)
    return _task_dict(new_task)


@router.delete("/{sim_id}/tasks/{task_id}")
async def delete_task(sim_id: str, task_id: int, db: AsyncSession = Depends(get_db), token: dict = Depends(require_cms_access())):
    sim = await _get_sim_or_404(sim_id, db)
    assert_can_mutate_simulation(token, sim)
    task = await _get_task_or_404(sim, task_id, db)
    await db.delete(task)
    await db.commit()
    return {"ok": True}


@router.post("/{sim_id}/tasks/reorder")
async def reorder_tasks(sim_id: str, body: ReorderTasksBody, db: AsyncSession = Depends(get_db), token: dict = Depends(require_cms_access())):
    sim = await _get_sim_or_404(sim_id, db)
    assert_can_mutate_simulation(token, sim)
    result = await db.execute(select(SimulationTask).where(SimulationTask.simulation_id == sim.id))
    tasks_by_id = {t.id: t for t in result.scalars().all()}
    if set(body.task_ids) != set(tasks_by_id.keys()):
        raise HTTPException(400, "task_ids must be exactly the simulation's current task set")

    for i, tid in enumerate(body.task_ids):
        tasks_by_id[tid].task_index = -(i + 1)
    await db.flush()
    for i, tid in enumerate(body.task_ids):
        tasks_by_id[tid].task_index = i + 1
    await db.commit()
    return {"ok": True}
