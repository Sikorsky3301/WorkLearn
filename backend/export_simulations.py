"""
Dumps the current content of the core job simulations into
backend/seed_data/simulations.json — a portable snapshot, independent of any
database's auto-generated ids/timestamps, keyed by slug.

Run this locally whenever a simulation's content changes (edited via the CMS,
a task added, etc.) to capture the new state, commit the updated JSON, then
run seed_simulations.py wherever you want that content applied/refreshed
(e.g. the VPS) — see that file's docstring for why this exists instead of
migrate_legacy_sims.py, which had drifted stale against the real data.

By default exports da-job-sim, frontend-dev-sim, sales-crm-sim — the 3 core
simulations. Pass slugs on the command line to export different/additional
ones instead, e.g.: python export_simulations.py ml-engineer

Run: python export_simulations.py  (from backend/)
"""
import asyncio
import json
import sys
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.database import AsyncSessionLocal
from app.models.cms import Simulation

DEFAULT_SLUGS = ["da-job-sim", "frontend-dev-sim", "sales-crm-sim"]

OUT_PATH = Path(__file__).resolve().parent / "seed_data" / "simulations.json"

# Only portable fields — no id/created_by/created_at/updated_at/published_at/
# sim_builder_project_id, all of which are either auto-generated or specific
# to the database this was exported from, not meaningful to carry over.
SIM_FIELDS = (
    "slug", "title", "description", "company", "logo_url", "domain", "category",
    "accent_color", "difficulty", "estimated_hours", "skills", "rating",
    "rating_count", "manager", "onboarding", "onboarding_xp_award",
    "section_labels", "architecture_mermaid",
)
TASK_FIELDS = (
    "task_index", "title", "type", "objective", "briefing", "what_to_do",
    "what_to_submit", "hints", "success_criteria", "reference_data",
    "model_solution", "rubric", "config", "xp_award", "skill_awards", "week",
)


async def run(slugs: list[str]):
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Simulation)
            .where(Simulation.slug.in_(slugs))
            .options(selectinload(Simulation.tasks))
        )
        sims = {s.slug: s for s in result.scalars().all()}

        missing = [s for s in slugs if s not in sims]
        if missing:
            print(f"WARNING: not found, skipped: {', '.join(missing)}")

        out = []
        for slug in slugs:
            sim = sims.get(slug)
            if not sim:
                continue
            sim_kwargs = {f: getattr(sim, f) for f in SIM_FIELDS}
            tasks = [
                {f: getattr(t, f) for f in TASK_FIELDS}
                for t in sorted(sim.tasks, key=lambda t: t.task_index)
            ]
            out.append({"simulation": sim_kwargs, "tasks": tasks})
            print(f"  exported {slug} ({len(tasks)} tasks)")

        OUT_PATH.parent.mkdir(exist_ok=True)
        OUT_PATH.write_text(json.dumps(out, indent=2, default=str), encoding="utf-8")
        print(f"\nWrote {OUT_PATH}")


if __name__ == "__main__":
    asyncio.run(run(sys.argv[1:] or DEFAULT_SLUGS))
