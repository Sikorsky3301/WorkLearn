"""
Refreshable seed for job simulations — loads backend/seed_data/simulations.json
(produced by export_simulations.py, run wherever the accurate current content
lives) and UPSERTS it: an existing simulation (matched by slug) has its own
fields AND its tasks replaced with the JSON's content; a simulation that
doesn't exist yet is created fresh and published.

This deliberately does NOT hardcode simulation content in Python — an earlier
version of this idea (migrate_legacy_sims.py) did, and drifted stale: months
after it was written, the real da-job-sim/frontend-dev-sim had grown from 5 to
10 tasks (including a Final Assessment) via the CMS, and that file was never
updated to match. Running IT again would have deleted that real content and
replaced it with the outdated 5-task version. Loading from a JSON snapshot
re-exported from the actual source of truth avoids that trap by construction
— there's nothing to fall out of sync, since the JSON is a dump of reality
rather than a second, hand-maintained copy of it.

Safe for already-enrolled students: TaskCompletion.task_id stores task_index
(a plain int, no foreign key to simulation_tasks.id — see
app/models/__init__.py), and nothing else in the schema references a task's
row id. Deleting and recreating a simulation's tasks is safe as long as
task_index stays the same across a refresh — which it does here, since it's
just replaying whatever task_index values were captured in the export.

Workflow:
  1. (wherever the accurate content lives) python export_simulations.py
  2. commit + push backend/seed_data/simulations.json
  3. (wherever you want it applied — e.g. the VPS) python seed_simulations.py

Run: python seed_simulations.py  (from backend/)
"""
import asyncio
import json
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import select, delete

from app.db.database import AsyncSessionLocal
from app.models.cms import Simulation, SimulationTask, SimulationStatus
from app.models import sim_builder  # noqa: F401 — registers SimBuilderProject so
# Simulation.sim_builder_project_id's FK resolves during flush (deleting/
# inserting SimulationTask rows touches Simulation's mapper, which needs
# every table its FKs point at already known to SQLAlchemy's registry)

DATA_PATH = Path(__file__).resolve().parent / "seed_data" / "simulations.json"


async def _upsert_sim(db, sim_kwargs: dict, task_kwargs_list: list[dict]):
    existing = await db.execute(select(Simulation).where(Simulation.slug == sim_kwargs["slug"]))
    sim = existing.scalar_one_or_none()

    if sim is None:
        sim = Simulation(status=SimulationStatus.PUBLISHED, published_at=datetime.now(timezone.utc), **sim_kwargs)
        db.add(sim)
        await db.flush()
        action = "created"
    else:
        for key, value in sim_kwargs.items():
            setattr(sim, key, value)
        await db.execute(delete(SimulationTask).where(SimulationTask.simulation_id == sim.id))
        action = "refreshed"

    for t in task_kwargs_list:
        db.add(SimulationTask(simulation_id=sim.id, **t))
    await db.commit()
    print(f"  {action} {sim_kwargs['slug']} ({len(task_kwargs_list)} tasks)")


async def run():
    if not DATA_PATH.exists():
        raise SystemExit(
            f"{DATA_PATH} not found. Run export_simulations.py first (wherever the "
            "accurate current simulation content lives), commit the JSON it writes, "
            "and pull that here before running this."
        )
    entries = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    async with AsyncSessionLocal() as db:
        for entry in entries:
            await _upsert_sim(db, entry["simulation"], entry["tasks"])


if __name__ == "__main__":
    asyncio.run(run())
