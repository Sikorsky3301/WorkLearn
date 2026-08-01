"""Shared "full simulation" payload builder — used by both the public
student runtime (GET /api/simulations/{sim_id}/full, PUBLISHED-only) and the
admin-only draft preview (GET /api/admin/simulations/{sim_id}/preview-full,
any status). Factored out so the two trust boundaries can't silently drift
apart in what shape they return."""
from app.models.cms import Simulation, SimulationTask
from app.services.task_types import strip_secrets


def build_task_public_dict(t: SimulationTask) -> dict:
    return {
        "id": t.id, "task_index": t.task_index, "title": t.title, "type": t.type,
        "objective": t.objective, "briefing": t.briefing,
        "what_to_do": t.what_to_do, "what_to_submit": t.what_to_submit, "hints": t.hints,
        "success_criteria": t.success_criteria,
        "reference_data": t.reference_data, "model_solution": t.model_solution,
        "rubric": t.rubric,
        "config": strip_secrets(t.type, t.config), "week": t.week,
    }


def build_simulation_public_dict(sim: Simulation, tasks: list[SimulationTask]) -> dict:
    return {
        "simulation": {
            "id": sim.id, "title": sim.title, "description": sim.description, "company": sim.company,
            "logo_url": sim.logo_url, "domain": sim.domain, "category": sim.category,
            "accent_color": sim.accent_color, "difficulty": sim.difficulty,
            "estimated_hours": sim.estimated_hours, "skills": sim.skills,
            "rating": sim.rating, "rating_count": sim.rating_count, "manager": sim.manager,
            "section_labels": sim.section_labels,
        },
        "tasks": [build_task_public_dict(t) for t in tasks],
    }
