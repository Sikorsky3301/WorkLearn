"""
Bridge Sim Builder publish → student-facing CMS Simulation.

Keeps Sim Builder version snapshots, and upserts a linked published
Simulation so GET /api/simulations (ongoing catalog) includes the project.
"""
from __future__ import annotations

import re
from datetime import datetime, timezone

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.cms import Simulation, SimulationTask, SimulationStatus
from app.models.sim_builder import SimBuilderProject


def _slugify(title: str, project_id: int) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", (title or "sim").lower()).strip("-") or "sim"
    base = base[:48]
    return f"{base}-sb{project_id}"


def _block_text(block) -> str:
    cfg = block.config or {}
    btype = block.block_type
    if btype == "heading":
        return cfg.get("text") or cfg.get("content") or "Heading"
    if btype == "text":
        return cfg.get("text") or cfg.get("content") or ""
    if btype == "image":
        url = cfg.get("url") or cfg.get("src") or ""
        alt = cfg.get("alt") or "Image"
        return f"[Image: {alt}] {url}".strip()
    if btype == "video":
        url = cfg.get("url") or cfg.get("src") or ""
        return f"[Video] {url}".strip()
    if btype == "quiz":
        q = cfg.get("question") or cfg.get("prompt") or "Quiz"
        return f"Quiz: {q}"
    # Other block types → instructional stub
    label = btype.replace("_", " ").title()
    return f"[{label}] Complete this activity as described in the simulation builder.\n\n{cfg}"


def _page_to_task(page, task_index: int) -> SimulationTask:
    blocks = sorted(page.blocks or [], key=lambda b: b.order)
    quiz_blocks = [b for b in blocks if b.block_type == "quiz"]
    content_parts = [_block_text(b) for b in blocks]
    briefing = "\n\n".join(p for p in content_parts if p).strip() or f"Complete: {page.title}"

    if quiz_blocks and len(quiz_blocks) == len(blocks):
        # Pure quiz page → quiz task
        questions = []
        for b in quiz_blocks:
            cfg = b.config or {}
            questions.append({
                "prompt": cfg.get("question") or cfg.get("prompt") or "Question",
                "options": cfg.get("options") or ["Option A", "Option B"],
                "correct_index": cfg.get("correct_index", 0),
            })
        return SimulationTask(
            task_index=task_index,
            title=page.title or f"Page {task_index}",
            type="quiz",
            objective=page.title,
            briefing=briefing,
            what_to_do=["Answer each quiz question"],
            what_to_submit=["Quiz answers"],
            hints=[],
            success_criteria=["Submit the quiz"],
            config={"questions": questions} if questions else {"questions": []},
            xp_award=50,
            skill_awards={},
            week=page.week,
            rubric={"criteria": [{"name": "Accuracy", "weight": 1}]},
        )

    return SimulationTask(
        task_index=task_index,
        title=page.title or f"Page {task_index}",
        type="text_rubric",
        objective=page.title,
        briefing=briefing,
        what_to_do=["Read the briefing", "Complete the page activities", "Submit a short reflection"],
        what_to_submit=["Written response"],
        hints=[],
        success_criteria=["Submit a thoughtful response"],
        config={},
        xp_award=50,
        skill_awards={},
        week=page.week,
        rubric={
            "criteria": [
                {"name": "Completeness", "weight": 0.5, "description": "Addresses the page goals"},
                {"name": "Clarity", "weight": 0.5, "description": "Clear and coherent response"},
            ]
        },
    )


async def publish_sim_builder_to_cms(
    db: AsyncSession,
    project: SimBuilderProject,
    *,
    created_by: int | None,
) -> Simulation:
    """Upsert a PUBLISHED CMS Simulation linked to this Sim Builder project."""
    await db.refresh(project, attribute_names=["pages"])
    for page in project.pages:
        await db.refresh(page, attribute_names=["blocks"])

    pages = sorted(project.pages or [], key=lambda p: p.order)
    if not pages:
        raise ValueError("Cannot publish a project with no pages")

    result = await db.execute(
        select(Simulation).where(Simulation.sim_builder_project_id == project.id)
        .options(selectinload(Simulation.tasks))
    )
    sim = result.scalar_one_or_none()
    slug = _slugify(project.title, project.id)
    now = datetime.now(timezone.utc)

    defaults = {
        "title": project.title,
        "description": f"Published from Sim Builder: {project.title}",
        "company": "WorkLearn Partner",
        "domain": "General",
        "difficulty": "Beginner",
        "estimated_hours": "2–4 hrs",
        "skills": [],
        "manager": {"name": "Your Manager", "title": "Mentor", "avatar": None},
        "onboarding": {
            "welcome": f"Welcome to {project.title}",
            "offer_letter": f"You have been assigned {project.title}.",
        },
        "section_labels": {},
        "status": SimulationStatus.PUBLISHED,
        "published_at": now,
        "created_by": created_by,
    }

    if sim is None:
        # Ensure slug uniqueness if somehow taken
        existing_slug = await db.execute(select(Simulation).where(Simulation.slug == slug))
        if existing_slug.scalar_one_or_none():
            slug = f"{slug}-{project.id}"
        sim = Simulation(slug=slug, sim_builder_project_id=project.id, **defaults)
        db.add(sim)
        await db.flush()
    else:
        sim.title = defaults["title"]
        sim.description = defaults["description"]
        sim.status = SimulationStatus.PUBLISHED
        sim.published_at = now
        # Replace tasks
        await db.execute(delete(SimulationTask).where(SimulationTask.simulation_id == sim.id))
        await db.flush()

    for i, page in enumerate(pages, start=1):
        task = _page_to_task(page, i)
        task.simulation_id = sim.id
        db.add(task)

    await db.flush()
    return sim
