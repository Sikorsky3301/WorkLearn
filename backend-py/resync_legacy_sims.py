"""
One-time, idempotent RESYNC of the 3 already-migrated simulations
(da-job-sim, frontend-dev-sim, sales-crm-sim) — updates existing Simulation/
SimulationTask rows in place from the builder functions in
migrate_legacy_sims.py, instead of inserting new rows (which
migrate_legacy_sims.py's _insert_sim skips once a sim id already exists).

Needed because migrate_legacy_sims.py was edited after the initial migration
ran (real enrollments already reference these sim ids, so rows can't just be
deleted/recreated) — this applies the same builder output as an UPDATE.

Run with: python resync_legacy_sims.py  (from backend-py/, with PYTHONUTF8=1
to avoid Windows locale mojibake — see migrate_legacy_sims.py's docstring)
"""
import asyncio

from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models_cms import Simulation, SimulationTask
from migrate_legacy_sims import da_job_sim, frontend_dev_sim, sales_crm_sim


async def _resync_sim(db, sim_kwargs: dict, task_kwargs_list: list[dict]):
    sim_id = sim_kwargs["id"]
    result = await db.execute(select(Simulation).where(Simulation.id == sim_id))
    sim = result.scalar_one_or_none()
    if sim is None:
        print(f"  skip {sim_id} — not migrated yet, run migrate_legacy_sims.py first")
        return

    for key, value in sim_kwargs.items():
        if key == "id":
            continue
        setattr(sim, key, value)

    existing = await db.execute(select(SimulationTask).where(SimulationTask.simulation_id == sim_id))
    tasks_by_index = {t.task_index: t for t in existing.scalars().all()}

    for t_kwargs in task_kwargs_list:
        task = tasks_by_index.get(t_kwargs["task_index"])
        if task is None:
            db.add(SimulationTask(simulation_id=sim_id, **t_kwargs))
            continue
        for key, value in t_kwargs.items():
            setattr(task, key, value)

    await db.commit()
    print(f"  resynced {sim_id} ({len(task_kwargs_list)} tasks)")


async def run():
    async with AsyncSessionLocal() as db:
        for builder in (da_job_sim, frontend_dev_sim, sales_crm_sim):
            sim_kwargs, task_kwargs_list = builder()
            await _resync_sim(db, sim_kwargs, task_kwargs_list)


if __name__ == "__main__":
    asyncio.run(run())
