"""Shared "full simulation" payload builder — used by both the public
student runtime (GET /api/simulations/{sim_id}/full, PUBLISHED-only) and the
admin-only draft preview (GET /api/admin/simulations/{sim_id}/preview-full,
any status). Factored out so the two trust boundaries can't silently drift
apart in what shape they return."""
from app.models.cms import Simulation, SimulationTask
from app.services.task_types import strip_secrets


def _assessment_summary(t: SimulationTask) -> dict | None:
    """How many questions a task's assessment has, and what passes it.

    `config.assessment` is stripped wholesale from the public payload because
    it carries the answer key. That left the client unable to tell that
    assessments exist at all — so the overview page could not honestly say a
    ticket is followed by a check, and the roadmap could not show one pending.

    A count and a pass mark give away nothing: the student is told both before
    they start anyway. The questions, the correct indices and the explanations
    stay behind the assessment endpoints.
    """
    questions = ((t.config or {}).get("assessment") or {}).get("questions") or []
    if not questions:
        return None
    return {
        "question_count": len(questions),
        "pass_mark": (t.config["assessment"]).get("pass_mark", 0),
    }


def build_task_public_dict(t: SimulationTask) -> dict:
    return {
        "assessment_summary": _assessment_summary(t),
        "id": t.id, "task_index": t.task_index, "title": t.title, "type": t.type,
        "objective": t.objective, "briefing": t.briefing,
        "what_to_do": t.what_to_do, "what_to_submit": t.what_to_submit, "hints": t.hints,
        "success_criteria": t.success_criteria,
        "reference_data": t.reference_data, "model_solution": t.model_solution,
        "rubric": t.rubric,
        "config": strip_secrets(t.type, t.config), "week": t.week,
        # Not secret — the student is told upfront what a task is worth, and
        # the sandbox workbench prints it on the instructions block. Their
        # absence here was also why GenericSimShell.toManagerChatTask has
        # always read `task.skill_awards` as undefined.
        "xp_award": t.xp_award, "skill_awards": t.skill_awards,
    }


def build_simulation_public_dict(sim: Simulation, tasks: list[SimulationTask]) -> dict:
    return {
        "simulation": {
            "id": sim.id, "slug": sim.slug, "title": sim.title, "description": sim.description,
            "company": sim.company,
            "logo_url": sim.logo_url, "domain": sim.domain, "category": sim.category,
            "accent_color": sim.accent_color, "difficulty": sim.difficulty,
            "estimated_hours": sim.estimated_hours, "skills": sim.skills,
            "rating": sim.rating, "rating_count": sim.rating_count, "manager": sim.manager,
            "section_labels": sim.section_labels,
            # Exposed so the overview page can print a real "last updated"
            # rather than a hardcoded date that starts lying the day after it
            # ships. Not secret — it's the same freshness signal any course
            # catalogue shows, and it's what tells a student whether the
            # content predates the framework version they're on.
            "updated_at": sim.updated_at.isoformat() if sim.updated_at else None,
            "published_at": sim.published_at.isoformat() if sim.published_at else None,
        },
        "tasks": [build_task_public_dict(t) for t in tasks],
    }
