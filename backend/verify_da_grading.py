"""Prove every Data Analyst task grades correctly, through the real sandbox.

    python verify_da_grading.py

For each task it runs the MODEL SOLUTION in a real Docker container against a
real seeded dataset and asserts it scores 100, then runs the STARTER and
asserts it scores LESS than 100.

Both halves matter and for different reasons:

  * a solution that cannot reach 100 means the task is unpassable, and the
    only person who finds out is a student who did everything right;
  * a starter that already scores 100 means the task asks for nothing, which
    is the failure mode nobody notices because everybody passes.

The frontend simulation has the same script (verify_frontend_grading.py) for
the same reason. Neither is a unit test: they need Docker, they take a minute,
and they exercise the exact path a submission takes.
"""
import argparse
import asyncio
import sys

from app.cms_templates.data_analytics import starters as new_starters
from app.services import sandbox
from app.services.dataset import (
    _clean_reference,
    compute_reference_solution,
    generate_dataset,
    seed_from_enrollment,
)
from app.services.graders.registry import GRADER_REGISTRY

# task_index -> (grader_key, output filename, input). Task 9 is the text brief
# (LLM-judged, no sandbox) and task 10 is a quiz; neither runs code.
#
# `input` mirrors what _resolve_input_csv will really hand the container:
#   "raw"      the seeded extract, mess intact — the cleaning task and the
#              quality report, which profiles that mess
#   "cleaned"  the cleaning task's output, which is what every later analysis
#              works from
# Getting this wrong here would "prove" the graders work against an input no
# student ever sees, which is worse than not checking at all.
TASKS = {
    1: ("da_job_sim.task1_cleaning", "output.csv", "raw"),
    2: ("da_job_sim.quality_report", "output.json", "raw"),
    3: ("da_job_sim.task2_report", "output.json", "cleaned"),
    4: ("da_job_sim.channel_country", "output.json", "cleaned"),
    5: ("da_job_sim.monthly_trend", "output.json", "cleaned"),
    6: ("da_job_sim.task3_segmentation", "output.json", "cleaned"),
    7: ("da_job_sim.cohort_retention", "output.json", "cleaned"),
    8: ("da_job_sim.task4_ab_test", "output.json", "cleaned"),
}

# A fixed id so runs are comparable. Any value works — the seed is derived
# from it, and the reference is derived from the same seed.
ENROLLMENT_ID = 4242


async def _score(code: str, task_index: int, grader_key: str, output_name: str, csv_bytes: bytes,
                 reference: dict) -> tuple[int, list, str]:
    result = await sandbox.run_submission(code, input_files={"dataset.csv": csv_bytes})
    try:
        output = sandbox.read_output(result, output_name)
        stderr = result.stderr or ""
    finally:
        sandbox.cleanup(result.workdir)

    graded = GRADER_REGISTRY[grader_key](output, reference)
    return graded["score"], graded["checks"], stderr


async def run(only: int | None) -> int:
    seed = seed_from_enrollment(ENROLLMENT_ID)
    df = generate_dataset(seed)
    # The cleaned frame stands in for the student's own Task 1 output.csv. It
    # is the canonical cleaning, so a task graded against it is being checked
    # on ITS OWN work, not on how well Task 1 was done.
    inputs = {
        "raw": df.to_csv(index=False).encode("utf-8"),
        "cleaned": _clean_reference(df).to_csv(index=False).encode("utf-8"),
    }

    solutions = _load_solutions()
    starters = _load_starters()

    failures = []
    print(f"seed {seed} from enrollment {ENROLLMENT_ID}\n")

    for task_index, (grader_key, output_name, input_kind) in sorted(TASKS.items()):
        if only and task_index != only:
            continue
        if task_index not in solutions:
            print(f"task {task_index}: no model solution registered — SKIPPED")
            continue

        reference = compute_reference_solution(task_index, df)
        csv_bytes = inputs[input_kind]
        score, checks, stderr = await _score(
            solutions[task_index], task_index, grader_key, output_name, csv_bytes, reference,
        )
        ok = score == 100
        print(f"task {task_index}  solution -> {score:3}/100  {'OK' if ok else 'FAIL'}   ({grader_key}, {input_kind} input)")
        if not ok:
            failures.append(f"task {task_index} solution scored {score}")
            for c in checks:
                if not c["pass"]:
                    print(f"           failed: {c['label']} ({c['points']} pts)")
            tail = (stderr or "").strip().splitlines()[-3:]
            for line in tail:
                print(f"           stderr: {line[:110]}")

        if task_index in starters:
            s_score, _, _ = await _score(
                starters[task_index], task_index, grader_key, output_name, csv_bytes, reference,
            )
            weak = s_score < 100
            print(f"          starter  -> {s_score:3}/100  {'OK' if weak else 'FAIL — starter already passes'}")
            if not weak:
                failures.append(f"task {task_index} starter scored 100 — the task asks for nothing")

    print()
    if failures:
        print(f"{len(failures)} problem(s):")
        for f in failures:
            print(f"  - {f}")
        return 1
    print("All checked tasks: solution 100, starter below 100.")
    return 0


def _load_solutions() -> dict[int, str]:
    """Model solutions live in two places: the four new tasks carry theirs in
    the template package, the original five carry theirs on the database row
    (model_solution.example_solution, seeded by migrate_legacy_sims.py). This
    script only needs the ones it can reach without a database."""
    return dict(new_starters.SOLUTIONS)


def _load_starters() -> dict[int, str]:
    return dict(new_starters.STARTERS)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--task", type=int, help="check one task only")
    args = parser.parse_args()
    missing = [k for k in TASKS.values() if k[0] not in GRADER_REGISTRY]
    if missing:
        print(f"Graders not registered: {missing}")
        return 1
    return asyncio.run(run(args.task))


if __name__ == "__main__":
    sys.exit(main())
