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
    ArchitectureParseBody, CreateFromArchitectureBody, ApplyArchitectureBody,
)
from app.services.mermaid_architecture import (
    parse_flowchart, plan_to_tasks, architecture_placeholder_sim,
)
from app.cms_templates import TEMPLATES
from app.services.sim_view import build_simulation_public_dict
from app.services import sandbox
from app.services.graders import declarative_rules
from app.services.graders.registry import DATASET_REGISTRY, GRADER_REGISTRY
from app.services.dataset import seed_from_enrollment
from app.core.config import settings
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
        "architecture_mermaid": sim.architecture_mermaid,
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


def _architecture_plan_or_400(mermaid: str):
    parsed = parse_flowchart(mermaid)
    if parsed["errors"]:
        raise HTTPException(400, "; ".join(parsed["errors"]))
    tasks, labels = plan_to_tasks(parsed)
    if not tasks:
        raise HTTPException(400, "No stages could be generated from the diagram.")
    return parsed, tasks, labels


def _add_tasks_from_plan(db: AsyncSession, sim: Simulation, tasks: list[dict]):
    for t in tasks:
        task_data = SimulationTaskCreate(**t)
        validated_config = validate_task_config(task_data.type, task_data.config)
        db.add(SimulationTask(
            simulation_id=sim.id, task_index=task_data.task_index, title=task_data.title, type=task_data.type,
            objective=task_data.objective, briefing=task_data.briefing,
            what_to_do=task_data.what_to_do, what_to_submit=task_data.what_to_submit,
            hints=task_data.hints, success_criteria=task_data.success_criteria,
            config=validated_config,
            xp_award=task_data.xp_award, skill_awards=task_data.skill_awards, week=task_data.week,
        ))


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
        architecture_mermaid=body.architecture_mermaid,
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
        architecture_mermaid=source.architecture_mermaid,
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
        architecture_mermaid=sim_data.architecture_mermaid,
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


@router.post("/architecture/parse")
async def parse_architecture(body: ArchitectureParseBody, token: dict = Depends(require_cms_access())):
    parsed = parse_flowchart(body.mermaid)
    tasks, labels = ([], parsed.get("section_labels") or {})
    if not parsed["errors"]:
        tasks, labels = plan_to_tasks(parsed)
    return {
        "errors": parsed["errors"],
        "warnings": parsed["warnings"],
        "section_labels": labels,
        "tasks": [
            {"task_index": t["task_index"], "title": t["title"], "type": t["type"], "week": t.get("week")}
            for t in tasks
        ],
    }


@router.post("/from-architecture")
async def create_from_architecture(
    body: CreateFromArchitectureBody,
    db: AsyncSession = Depends(get_db), token: dict = Depends(require_cms_access()),
):
    _, tasks, labels = _architecture_plan_or_400(body.mermaid)
    existing = await db.execute(select(Simulation).where(Simulation.slug == body.slug))
    if existing.scalar_one_or_none():
        raise HTTPException(409, f"Simulation slug '{body.slug}' already exists")

    extra = {
        k: v for k, v in {
            "description": body.description, "company": body.company, "domain": body.domain,
            "category": body.category, "difficulty": body.difficulty,
            "estimated_hours": body.estimated_hours, "skills": body.skills,
        }.items() if v is not None
    }
    sim_fields = architecture_placeholder_sim(body.slug, body.title, len(tasks), extra)
    sim_data = SimulationCreate(**sim_fields, architecture_mermaid=body.mermaid, section_labels=labels)
    sim = Simulation(
        slug=sim_data.slug, title=sim_data.title, description=sim_data.description, company=sim_data.company,
        logo_url=sim_data.logo_url, domain=sim_data.domain, category=sim_data.category,
        accent_color=sim_data.accent_color, difficulty=sim_data.difficulty,
        estimated_hours=sim_data.estimated_hours, skills=sim_data.skills,
        rating=sim_data.rating, rating_count=sim_data.rating_count,
        manager=sim_data.manager.model_dump(), onboarding=sim_data.onboarding.model_dump(),
        onboarding_xp_award=sim_data.onboarding_xp_award, section_labels=sim_data.section_labels,
        architecture_mermaid=sim_data.architecture_mermaid,
        status=SimulationStatus.DRAFT, created_by=token_user_id(token),
    )
    db.add(sim)
    await db.flush()
    try:
        _add_tasks_from_plan(db, sim, tasks)
    except (ValidationError, KeyError) as e:
        raise HTTPException(422, f"Invalid generated task config: {e}")
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


@router.post("/{sim_id}/architecture/apply")
async def apply_architecture(
    sim_id: str, body: ApplyArchitectureBody,
    db: AsyncSession = Depends(get_db), token: dict = Depends(require_cms_access()),
):
    sim = await _get_sim_or_404(sim_id, db)
    assert_can_mutate_simulation(token, sim)
    parsed, tasks, labels = _architecture_plan_or_400(body.mermaid)
    sim.architecture_mermaid = body.mermaid
    sim.section_labels = {**(sim.section_labels or {}), **labels}

    if body.mode == "replace":
        await db.execute(delete(SimulationTask).where(SimulationTask.simulation_id == sim.id))
    else:
        max_res = await db.execute(
            select(func.max(SimulationTask.task_index)).where(SimulationTask.simulation_id == sim.id)
        )
        offset = max_res.scalar() or 0
        for t in tasks:
            t["task_index"] = t["task_index"] + offset

    try:
        _add_tasks_from_plan(db, sim, tasks)
    except (ValidationError, KeyError) as e:
        raise HTTPException(422, f"Invalid generated task config: {e}")

    await db.commit()
    await db.refresh(sim, attribute_names=["tasks", "university_links"])
    return {"warnings": parsed["warnings"], **_sim_dict(sim)}


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


# Preview runs are not scoped to an enrollment, and the dataset generator is
# seeded from one. So a preview gets its own deterministic seed derived from
# the task itself: the same task always previews against the same data, two
# tasks preview against different data, and no student's dataset is reused.
def _preview_seed(sim: Simulation, task: SimulationTask) -> int:
    return seed_from_enrollment(f"cms-preview-{sim.id}-{task.task_index}")


@router.post("/{sim_id}/tasks/{task_id}/preview-run-sandbox")
async def preview_run_sandbox(
    sim_id: str, task_id: int, body: PreviewRunSandboxBody,
    db: AsyncSession = Depends(get_db), token: dict = Depends(require_cms_access()),
):
    """Run one submission against a task exactly the way a student's would be.

    This used to refuse anything that was not `declarative_rules`, which is
    every task in both shipped simulations — so the builder's live preview said
    "requires a real enrollment" on the only tasks anyone actually wanted to
    preview, and an author had no way to check their starter code, their
    filenames or their grader wiring without enrolling as a student.

    All three real grading paths are supported now, each mirroring its
    counterpart in api/v1/simulations/sandbox.py:

      * registered_grader + dataset_key   generate the dataset from a preview
                                          seed, run the code, grade against a
                                          reference recomputed from that same
                                          dataframe
      * registered_grader, no dataset     the frontend family: inject the
                                          hidden Jest spec, run in the frontend
                                          image, grade the Jest report
      * declarative_rules                 unchanged
      * submission_mode == "text"         no container at all; the LLM judge
                                          reads the submitted text

    ONE DELIBERATE DIFFERENCE from the student path: a chained task (one whose
    input is normally the artifact a previous task produced) is previewed
    against the RAW generated dataset, because there is no enrollment and so no
    previous artifact to chain from. The response says so in
    `details.preview_note` rather than letting an author read a low score as a
    broken task.
    """
    sim = await _get_sim_or_404(sim_id, db)
    assert_can_mutate_simulation(token, sim)
    task = await _get_task_or_404(sim, task_id, db)
    if task.type != "code_sandbox":
        raise HTTPException(400, "Only code_sandbox tasks support preview runs")
    if not body.code.strip():
        raise HTTPException(400, "code is required")

    config = task.config or {}
    strategy = config.get("grading_strategy", "declarative_rules")
    grader_key = config.get("grader_key")
    notes: list[str] = []

    # ── text submissions never touch a container ─────────────────────────────
    if config.get("submission_mode") == "text":
        if strategy != "registered_grader" or grader_key not in GRADER_REGISTRY:
            raise HTTPException(400, "This text task has no registered grader to preview against.")
        grade_fn = GRADER_REGISTRY[grader_key]
        grade_result = await grade_fn(body.code, {})
        grade_result.setdefault("details", {})["preview_note"] = (
            "Graded by the same judge a student's submission goes to."
        )
        return grade_result

    input_name = config.get("input_filename") or "submission.py"
    output_name = config.get("output_filename") or "output.json"

    if strategy == "registered_grader":
        if grader_key not in GRADER_REGISTRY:
            raise HTTPException(
                400,
                f"No grader is registered under {grader_key!r}. Pick one from the list on the "
                "Grading tab — a key that is not registered fails for every student at submit.",
            )
        grade_fn = GRADER_REGISTRY[grader_key]
        dataset_key = config.get("dataset_key")

        if dataset_key:
            if dataset_key not in DATASET_REGISTRY:
                raise HTTPException(400, f"No dataset generator is registered under {dataset_key!r}.")
            generate_dataset, compute_reference = DATASET_REGISTRY[dataset_key]
            df = generate_dataset(_preview_seed(sim, task))
            # `input_filename` means something DIFFERENT on a dataset-backed
            # task: it names the DATA file mounted into the workspace, not the
            # file the student's code is saved as. The student path leaves
            # submission_filename at its default for exactly this reason —
            # overriding it here saved the code as "dataset.csv" and the
            # container's entrypoint then reported "No submission.py found".
            input_files = {input_name: df.to_csv(index=False).encode("utf-8")}
            submission_filename = None
            image = config.get("docker_image")
            reference = compute_reference(task.task_index, df)
            if task.task_index != 1 and not config.get("use_raw_dataset"):
                notes.append(
                    "Previewing against the RAW generated dataset. A student reaches this task with "
                    "the file the previous task produced, so their input may differ."
                )
        else:
            # The frontend family: no dataset, a hidden Jest spec instead.
            from app.services.frontend_specs import FRONTEND_TEST_SPECS

            spec = FRONTEND_TEST_SPECS.get(task.task_index)
            if spec is None:
                raise HTTPException(
                    400,
                    f"{grader_key!r} needs a hidden test spec, and none is registered for task "
                    f"{task.task_index}. Preview is not available for this task.",
                )
            input_files = {"submission.test.js": spec}
            # Here `input_filename` DOES name the student's own file
            # (submission.html / submission.jsx), matching the student path.
            submission_filename = input_name
            image = config.get("docker_image") or settings.sandbox_image_frontend
            reference = None
    else:
        grade_fn = None
        input_files = dict(config.get("static_input_files") or {})
        submission_filename = input_name
        image = config.get("docker_image")
        reference = None

    try:
        result = await sandbox.run_submission(
            body.code, input_files=input_files, image=image,
            **({"submission_filename": submission_filename} if submission_filename else {}),
        )
    except Exception as exc:  # noqa: BLE001 — infrastructure, not the submission
        raise HTTPException(
            503,
            f"The code sandbox could not start ({type(exc).__name__}: {exc}). "
            "This is a server-side problem, not the task.",
        ) from exc
    try:
        output_bytes = sandbox.read_output(result, output_name)
        stdout, stderr, timed_out = result.stdout, result.stderr, result.timed_out
    finally:
        sandbox.cleanup(result.workdir)

    # A runner that never started the container comes back "successfully" with
    # the daemon's own error on stderr and no output file. Reported as a score
    # it reads as "your code is wrong", which is the one thing it is not — so
    # say what actually happened instead of grading a run that never ran.
    if output_bytes is None and result.exit_code not in (0, None) and (
        "docker" in stderr.lower() or "daemon" in stderr.lower() or "cannot find the file" in stderr.lower()
    ):
        raise HTTPException(
            503,
            "The code sandbox could not start, so nothing was run. This is a server-side "
            f"problem, not the task: {stderr.strip()[:400]}",
        )

    if grade_fn is not None:
        grade_result = grade_fn(output_bytes, reference)
    else:
        grade_result = declarative_rules.evaluate(output_bytes, config.get("rules") or [])

    details = grade_result.setdefault("details", {})
    details["stdout"] = stdout[-2000:]
    details["stderr"] = stderr[-2000:]
    details["timed_out"] = timed_out
    if output_bytes is None:
        notes.append(
            f"Your code did not write {output_name}. The grader reads that file and nothing else, "
            "so a student in this position scores zero however good their code is."
        )
    if notes:
        details["preview_note"] = " ".join(notes)
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
