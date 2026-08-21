"""Push the templates' XP and skill awards into the database.

    python sync_skill_awards.py            # dry run — prints every change
    python sync_skill_awards.py --apply    # write them

WHY THIS EXISTS

`xp_award` and `skill_awards` are columns on SimulationTask, seeded once from
the builders in migrate_legacy_sims.py and app/cms_templates/engineering. That
seeder skips any simulation that already exists, so once a sim is in the
database, editing the template changes nothing. resync_engineering_sim.py
rewrites the Engineering sim wholesale, but there is no equivalent for the
Data Analytics or Sales sims, and a full rewrite is more than is wanted here.

This script touches exactly two columns and nothing else. It does not create,
delete, or reorder tasks, and it never touches student progress.

WHAT IT IS FIXING

The award values had drifted far below the role benchmarks in
TARGET_ROLE_REQUIREMENTS. Completing every task in the Data Analytics
simulation reached 26% readiness for Junior Data Analyst; the Engineering sim
awarded a skill called "async" that no benchmark asks for (the key is
"async_data") and never awarded "component_design" at all. The templates are
now calibrated so that finishing a track's simulation reaches exactly 100% for
that track's entry-level role — see tests/unit/test_skill_gps.py, which fails
if that ever stops being true.

It also repairs the UserSkill rows students already earned under the misspelled
"async" key, folding them into "async_data" so the points are not lost.
"""
import argparse
import asyncio
import sys

from sqlalchemy import select

from app.db.database import AsyncSessionLocal
from app.models import UserSkill
from app.models.cms import Simulation, SimulationTask
from app.cms_templates.engineering import TEMPLATE

# Skill keys that were renamed, and what they became. Applied to UserSkill rows
# so students keep points they already earned under the old key.
RENAMED_SKILLS = {"async": "async_data"}

ENGINEERING_SLUG = "frontend-dev-sim"


def _template_awards() -> dict[str, dict[int, dict]]:
    """slug -> {task_index: {"xp_award": int, "skill_awards": dict}}."""
    import migrate_legacy_sims as legacy

    out: dict[str, dict[int, dict]] = {}
    for builder in (legacy.da_job_sim, legacy.sales_crm_sim):
        sim, tasks = builder()
        out[sim["slug"]] = {
            t["task_index"]: {"xp_award": t.get("xp_award", 0), "skill_awards": t.get("skill_awards") or {}}
            for t in tasks
        }
    # The Engineering template deliberately omits `slug` — it is seed-owned,
    # see _SEED_OWNED in resync_engineering_sim.py.
    out[ENGINEERING_SLUG] = {
        t["task_index"]: {"xp_award": t.get("xp_award", 0), "skill_awards": t.get("skill_awards") or {}}
        for t in TEMPLATE["tasks"]
    }
    return out


async def sync(apply: bool) -> int:
    wanted = _template_awards()
    changes = 0
    orphans = 0

    async with AsyncSessionLocal() as db:
        for slug, by_index in wanted.items():
            sim = (await db.execute(select(Simulation).where(Simulation.slug == slug))).scalar_one_or_none()
            if sim is None:
                print(f"{slug}: not in the database — skipped")
                continue

            rows = (await db.execute(
                select(SimulationTask)
                .where(SimulationTask.simulation_id == sim.id)
                .order_by(SimulationTask.task_index)
            )).scalars().all()

            print(f"\n{slug}  (simulation id={sim.id}, {len(rows)} tasks)")
            for row in rows:
                target = by_index.get(row.task_index)
                if target is None:
                    print(f"  task {row.task_index}: no template entry — left alone")
                    continue

                current = {"xp_award": row.xp_award or 0, "skill_awards": row.skill_awards or {}}
                if current == target:
                    continue

                changes += 1
                print(f"  task {row.task_index}: {row.title}")
                if current["xp_award"] != target["xp_award"]:
                    print(f"      xp     {current['xp_award']} -> {target['xp_award']}")
                if current["skill_awards"] != target["skill_awards"]:
                    print(f"      skills {current['skill_awards']} -> {target['skill_awards']}")
                if apply:
                    row.xp_award = target["xp_award"]
                    row.skill_awards = target["skill_awards"]

        # Fold renamed skill keys into their new key so earned points survive.
        for old_key, new_key in RENAMED_SKILLS.items():
            stale = (await db.execute(select(UserSkill).where(UserSkill.skill_key == old_key))).scalars().all()
            for row in stale:
                orphans += 1
                existing = (await db.execute(select(UserSkill).where(
                    UserSkill.user_id == row.user_id, UserSkill.skill_key == new_key,
                ))).scalar_one_or_none()
                merged = min(100, (existing.current_score if existing else 0) + row.current_score)
                print(f"\nuser {row.user_id}: {old_key}={row.current_score} -> {new_key}={merged}")
                if apply:
                    if existing:
                        existing.current_score = merged
                        await db.delete(row)
                    else:
                        row.skill_key = new_key

        print(f"\n{changes} task rows differ from the templates; {orphans} renamed skill rows.")
        if not apply:
            print("Dry run — nothing written. Re-run with --apply.")
            return 0

        await db.commit()
        print("Written.")
        return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--apply", action="store_true", help="write the changes (default is a dry run)")
    args = parser.parse_args()
    return asyncio.run(sync(args.apply))


if __name__ == "__main__":
    sys.exit(main())
