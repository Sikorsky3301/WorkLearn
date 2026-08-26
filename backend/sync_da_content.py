"""Restructure the Data Analyst simulation to three weeks of three tasks.

    python sync_da_content.py            # dry run — prints every change
    python sync_da_content.py --apply    # write them

WHAT IT DOES

  1. RENUMBERS the five original tasks and the final assessment onto their new
     positions and weeks (new_tasks.RENUMBER).
  2. CREATES the four new tasks — Data Quality Report, Channel & Country,
     Monthly Trend & Growth, Cohort Retention — with their graders, starters
     and model solutions.
  3. ATTACHES the explainer and mini assessment to all nine tasks.

Result: 3 weeks x 3 tasks + a final assessment in week 4, matching the
Frontend Developer simulation.

WHY THE RENUMBER NEEDS CARE

`(simulation_id, task_index)` is effectively unique, and the moves overlap:
task 2 becomes task 3 while a task 3 still exists. Applying them in ascending
order collides. This script moves every task to a temporary NEGATIVE index
first, then down onto its final one — two passes, no collisions, and no
dependence on whether the database happens to enforce the constraint.

STUDENT PROGRESS

TaskCompletion.task_id holds the task_index, so a student who completed the
old task 3 (RFM) will have that completion read as the new task 3 (Sales
Report). There is no correct automatic fix — the work was done against
different content. `--reset-progress` clears DA completions so the sim starts
clean; without it, existing progress is left alone and will be mismapped.
Which is right depends on whether anyone has real progress, so it is a
deliberate choice rather than a default.
"""
import argparse
import asyncio
import sys

from sqlalchemy import delete, select

from app.cms_templates.data_analytics import (
    EXPLAINERS,
    FINAL_TASK,
    SECTION_LABELS,
    assessment_for,
)
from app.cms_templates.data_analytics.new_tasks import NEW_TASKS, RENUMBER, WEEKS
from app.db.database import AsyncSessionLocal
from app.models import Enrollment, TaskCompletion
from app.models.cms import Simulation, SimulationTask

SLUG = "da-job-sim"


class _Pending:
    """Stand-in for a task the apply would create, so a dry run can describe
    the content it would attach to it."""

    def __init__(self, spec: dict):
        self.task_index = spec["task_index"]
        self.title = spec["title"]
        self.week = spec["week"]
        self.config = spec["config"]


def _projected_index(rows) -> dict:
    """Where each existing task WILL be once the renumber is applied."""
    out = {}
    for task in rows:
        new_index = RENUMBER.get(task.task_index, (task.task_index, task.week))[0]
        out[new_index] = task
    return out


async def sync(apply: bool, reset_progress: bool) -> int:
    async with AsyncSessionLocal() as db:
        sim = (await db.execute(select(Simulation).where(Simulation.slug == SLUG))).scalar_one_or_none()
        if sim is None:
            print(f"No simulation with slug {SLUG!r}. Run migrate_legacy_sims.py first.")
            return 1

        rows = (await db.execute(
            select(SimulationTask).where(SimulationTask.simulation_id == sim.id)
            .order_by(SimulationTask.task_index)
        )).scalars().all()
        by_index = {t.task_index: t for t in rows}

        print(f"{SLUG}  (simulation id={sim.id})")
        print(f"  before: {len(rows)} tasks at {sorted(by_index)}\n")

        # A restructured sim has the four new grader keys present; the old
        # one has six tasks whose indexes happen to overlap, so counting
        # indexes alone would misread it.
        present_graders = {(t.config or {}).get("grader_key") for t in rows}
        already_restructured = all(
            NEW_TASKS[i]["config"]["grader_key"] in present_graders for i in NEW_TASKS
        )

        # ── 1. renumber ──
        if not already_restructured:
            print("  RENUMBER")
            for old in sorted(RENUMBER):
                new, week = RENUMBER[old]
                task = by_index.get(old)
                if task is None:
                    print(f"    task {old}: absent — skipped")
                    continue
                if old == new and task.week == week:
                    continue
                print(f"    {old} -> {new}  (week {task.week} -> {week})  {task.title}")
                if apply:
                    # Park it out of the way first; the second pass lands it.
                    task.task_index = -old
                    task.week = week
            if apply:
                await db.flush()
                for old in sorted(RENUMBER):
                    task = by_index.get(old)
                    if task is not None and task.task_index < 0:
                        task.task_index = RENUMBER[old][0]
                await db.flush()
        else:
            print("  RENUMBER: already applied — skipped")

        # Project the post-renumber layout IN MEMORY rather than re-reading.
        #
        # On a dry run nothing has been written, so a re-read returns the old
        # numbering and every phase below reports against positions that are
        # about to change — it announced that "task 2: Data Quality Report is
        # already present" because the OLD task 2 (Sales Report) still sat
        # there. A preview that describes a state the apply will not produce is
        # worse than no preview.
        #
        # ONLY when the renumber is actually pending. Projecting an already
        # restructured sim applies RENUMBER a second time — task 2 maps to 3,
        # 3 to 6, and so on — which leaves index 2 looking empty and makes the
        # next phase try to CREATE a task that already exists. That is a unique
        # constraint violation on (simulation_id, task_index), and it is the
        # whole reason this script must be safe to re-run.
        by_index = (
            {t.task_index: t for t in rows} if already_restructured
            else _projected_index(rows)
        )

        # ── 2. the four new tasks ──
        print("\n  NEW TASKS")
        for idx in sorted(NEW_TASKS):
            spec = NEW_TASKS[idx]
            if idx in by_index:
                print(f"    task {idx}: {spec['title']} — already present")
                continue
            print(f"    task {idx}: CREATE  {spec['title']}  (week {spec['week']}, {spec['config']['grader_key']})")
            if apply:
                db.add(SimulationTask(simulation_id=sim.id, **spec))
        if apply:
            await db.flush()
            rows = (await db.execute(
                select(SimulationTask).where(SimulationTask.simulation_id == sim.id)
                .order_by(SimulationTask.task_index)
            )).scalars().all()
            by_index = {t.task_index: t for t in rows}
        else:
            # Dry run: the new rows do not exist, so stand in for them with the
            # spec itself. Only `config` and `title` are read below.
            for idx, spec in NEW_TASKS.items():
                by_index.setdefault(idx, _Pending(spec))

        # ── 3. explainers + assessments on all nine ──

        print("\n  CONTENT")
        for idx in sorted(EXPLAINERS):
            task = by_index.get(idx)
            if task is None:
                print(f"    task {idx}: MISSING from the database")
                continue
            config = dict(task.config or {})
            deltas = []
            if config.get("explainer") != EXPLAINERS[idx]:
                deltas.append(f"explainer ({len(EXPLAINERS[idx]['steps'])} steps)")
                config["explainer"] = EXPLAINERS[idx]
            bank = assessment_for(idx)
            if bank and config.get("assessment") != bank:
                deltas.append(f"assessment ({len(bank['questions'])}q)")
                config["assessment"] = bank
            if not deltas:
                continue
            print(f"    task {idx}: {', '.join(deltas)}  — {task.title}")
            if apply:
                # Reassign, never mutate: SQLAlchemy does not track in-place
                # edits to a JSON column, so a mutation writes nothing.
                task.config = config

        # ── 4. the final assessment lands in week 4 ──
        final = by_index.get(FINAL_TASK["task_index"])
        if final is None:
            print(f"\n    task {FINAL_TASK['task_index']}: CREATE  Final Assessment")
            if apply:
                db.add(SimulationTask(simulation_id=sim.id, **FINAL_TASK))
        elif final.week != FINAL_TASK["week"]:
            print(f"\n    task {final.task_index}: week {final.week} -> {FINAL_TASK['week']}")
            if apply:
                final.week = FINAL_TASK["week"]

        # ── 5. the week names ──
        #
        # Cheap and idempotent, but it is what turns "Week 2" on the roadmap
        # into a sentence that says what the week is for. Merged rather than
        # replaced, so a label somebody renamed in the builder for a week this
        # template does not describe is left alone.
        wanted = {**(sim.section_labels or {}), **SECTION_LABELS}
        if wanted != (sim.section_labels or {}):
            print("\n  WEEK NAMES")
            for key in sorted(wanted, key=int):
                before = (sim.section_labels or {}).get(key)
                if before != wanted[key]:
                    print(f"    week {key}: {before!r} -> {wanted[key]!r}")
            if apply:
                sim.section_labels = wanted

        if reset_progress:
            enrollment_ids = (await db.execute(
                select(Enrollment.id).where(Enrollment.simulation_id == sim.id)
            )).scalars().all()
            print(f"\n  RESET PROGRESS: {len(enrollment_ids)} enrollment(s)")
            if apply and enrollment_ids:
                await db.execute(delete(TaskCompletion).where(
                    TaskCompletion.enrollment_id.in_(enrollment_ids)
                ))

        if not apply:
            print("\nDry run — nothing written. Re-run with --apply.")
            return 0

        await db.commit()

        rows = (await db.execute(
            select(SimulationTask).where(SimulationTask.simulation_id == sim.id)
            .order_by(SimulationTask.task_index)
        )).scalars().all()
        print("\n  after:")
        for week, indexes in sorted(WEEKS.items()):
            titles = [f"{t.task_index}. {t.title}" for t in rows if t.week == week]
            print(f"    week {week}: {titles}")
        print("\nWritten.")
        return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--apply", action="store_true", help="write the changes (default is a dry run)")
    parser.add_argument("--reset-progress", action="store_true",
                        help="clear DA task completions — renumbering mismaps them")
    args = parser.parse_args()
    return asyncio.run(sync(args.apply, args.reset_progress))


if __name__ == "__main__":
    sys.exit(main())
