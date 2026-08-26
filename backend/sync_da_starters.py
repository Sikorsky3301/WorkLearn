"""Replace the four solution-shaped starters with real boilerplate.

    python sync_da_starters.py            # dry run — shows what changes
    python sync_da_starters.py --apply    # write it

WHY

Data Analyst tasks 1, 3, 6 and 8 shipped `starter_code` that was the finished
solution. Graded through the real graders, the starters alone scored:

    task 1  Clean the Data          100      <- submit without typing, pass
    task 6  RFM Segmentation         80      <- passes
    task 8  A/B Test Analysis        65
    task 3  Sales Report             25

Tasks 2, 4, 5 and 7 — added in the three-week restructure — were already
boilerplate and score 10. This brings the original four in line with them.

Touches ONE key on four rows: `config.starter_code`. It does not change any
grader, dataset, briefing, explainer or assessment, and it never touches
student progress. A student who has already started a task keeps whatever is
in their own editor — starter code is only read when the workbench opens with
no saved draft.
"""
import argparse
import asyncio
import sys

from sqlalchemy import select

from app.cms_templates.data_analytics.original_starters import ORIGINAL_STARTERS
from app.db.database import AsyncSessionLocal
from app.models.cms import Simulation, SimulationTask

SLUG = "da-job-sim"


async def sync(apply: bool) -> int:
    async with AsyncSessionLocal() as db:
        sim = (await db.execute(select(Simulation).where(Simulation.slug == SLUG))).scalar_one_or_none()
        if sim is None:
            print(f"No simulation with slug {SLUG!r}.")
            return 1

        rows = (await db.execute(
            select(SimulationTask)
            .where(SimulationTask.simulation_id == sim.id)
            .order_by(SimulationTask.task_index)
        )).scalars().all()
        by_index = {t.task_index: t for t in rows}

        changed = 0
        for index, starter in sorted(ORIGINAL_STARTERS.items()):
            task = by_index.get(index)
            if task is None:
                print(f"  task {index}: MISSING from the database — skipped")
                continue

            config = dict(task.config or {})
            before = config.get("starter_code") or ""
            if before == starter:
                print(f"  task {index}: {task.title} — already boilerplate")
                continue

            changed += 1
            print(f"  task {index}: {task.title}")
            print(f"      {len(before.splitlines())} lines -> {len(starter.splitlines())} lines")
            if apply:
                config["starter_code"] = starter
                # Reassign, never mutate: SQLAlchemy does not track in-place
                # edits to a JSON column, so a mutation writes nothing.
                task.config = config

        print(f"\n{changed} starters differ.")
        if not apply:
            print("Dry run — nothing written. Re-run with --apply.")
            return 0

        await db.commit()
        print("Written.")
        return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--apply", action="store_true", help="write the changes (default is a dry run)")
    return asyncio.run(sync(parser.parse_args().apply))


if __name__ == "__main__":
    sys.exit(main())
