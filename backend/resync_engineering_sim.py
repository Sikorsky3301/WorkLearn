"""Re-sync a live simulation row from the Engineering template.

migrate_legacy_sims.py deliberately SKIPS a simulation that already exists — it
is a one-time seed, and re-running it must never clobber a row an admin has
since edited in the CMS. That is the right behaviour for a seed and the wrong
behaviour for a template change, so this script exists separately.

    python resync_engineering_sim.py                 # dry run: show the diff
    python resync_engineering_sim.py --apply         # rewrite the tasks
    python resync_engineering_sim.py --apply --reset-progress

WHAT --reset-progress IS FOR
----------------------------
TaskCompletion.task_id holds a task_INDEX, not a row id. The template went from
5 tasks to 9 and the indices were re-cut in the process — what used to be Task 2
(Interactive Navigation) is now Task 3, and index 2 is a new responsive-grid
ticket. So an existing completion of "task 2" now claims credit for work the
student never did, and its stored score belongs to a different exercise.

There is no correct automatic remapping, because the new tasks did not exist to
be completed. Either accept the mismatch on a dev database, or clear progress
for this simulation and start clean. This script will not guess.
"""
import argparse
import asyncio
import sys

from sqlalchemy import delete, select

from app.db.database import AsyncSessionLocal
from app.models import Enrollment, TaskCompletion
from app.models.cms import Simulation, SimulationTask
from app.cms_templates.engineering import TEMPLATE

SLUG = "frontend-dev-sim"

# Fields owned by the seed rather than the template — see frontend_dev_sim()
# in migrate_legacy_sims.py. Preserved across a re-sync so a template change
# can't wipe the seeded asset paths.
_SEED_OWNED = ("slug", "logo_url")


async def resync(apply: bool, reset_progress: bool) -> int:
    async with AsyncSessionLocal() as db:
        sim = (await db.execute(select(Simulation).where(Simulation.slug == SLUG))).scalar_one_or_none()
        if not sim:
            print(f"No simulation with slug {SLUG!r}. Run migrate_legacy_sims.py first.")
            return 1

        existing = (await db.execute(
            select(SimulationTask).where(SimulationTask.simulation_id == sim.id)
            .order_by(SimulationTask.task_index)
        )).scalars().all()

        template_tasks = TEMPLATE["tasks"]
        print(f"{SLUG}  (simulation id={sim.id})")
        print(f"  tasks in database : {len(existing)}  {[t.task_index for t in existing]}")
        print(f"  tasks in template : {len(template_tasks)}  {[t['task_index'] for t in template_tasks]}")
        print()
        for t in template_tasks:
            was = next((e for e in existing if e.task_index == t["task_index"]), None)
            mark = " " if was and was.title == t["title"] else "*"
            print(f"  {mark} {t['task_index']:>2}  wk{t['week']}  {t['title']}"
                  + (f"   (was: {was.title})" if was and was.title != t["title"] else ""))

        completions = (await db.execute(
            select(TaskCompletion)
            .join(Enrollment, Enrollment.id == TaskCompletion.enrollment_id)
            .where(Enrollment.simulation_id == sim.id)
        )).scalars().all()
        print(f"\n  existing task completions on this simulation: {len(completions)}")

        if not apply:
            print("\nDry run — nothing written. Re-run with --apply to rewrite the tasks.")
            if completions and not reset_progress:
                print("Consider --reset-progress as well: task indices were re-cut, so those "
                      "completions now point at different exercises.")
            return 0

        # Simulation-level fields (labels, description, onboarding copy...).
        for key, value in TEMPLATE["simulation"].items():
            if key in _SEED_OWNED:
                continue
            if key == "manager":
                # Keep the seeded photo_url, take everything else.
                value = {**value, **{k: v for k, v in (sim.manager or {}).items() if k == "photo_url"}}
            setattr(sim, key, value)

        # Replace the tasks wholesale. Editing in place would leave orphans
        # whenever the template shrinks, and a partial update is harder to
        # reason about than a clean rewrite of a fully templated row.
        await db.execute(delete(SimulationTask).where(SimulationTask.simulation_id == sim.id))
        for t in template_tasks:
            db.add(SimulationTask(simulation_id=sim.id, **t))

        if reset_progress:
            enrollment_ids = [e.id for e in (await db.execute(
                select(Enrollment).where(Enrollment.simulation_id == sim.id)
            )).scalars().all()]
            if enrollment_ids:
                await db.execute(
                    delete(TaskCompletion).where(TaskCompletion.enrollment_id.in_(enrollment_ids))
                )
                for e in (await db.execute(
                    select(Enrollment).where(Enrollment.simulation_id == sim.id)
                )).scalars().all():
                    e.current_task_idx = 1
                print(f"  cleared {len(completions)} completions across {len(enrollment_ids)} enrollments")

        await db.commit()
        print(f"\nRewrote {len(template_tasks)} tasks from the template.")
        return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--apply", action="store_true", help="write the changes (default is a dry run)")
    parser.add_argument("--reset-progress", action="store_true",
                        help="also delete task completions for this simulation — see the docstring")
    args = parser.parse_args()
    sys.exit(asyncio.run(resync(args.apply, args.reset_progress)))
