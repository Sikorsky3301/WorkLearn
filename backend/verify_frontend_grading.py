"""End-to-end grading check: run every task's worked solution through the real
Docker sandbox and assert it scores 100.

The unit tests prove the point maps are complete and total 100 given a green
Jest report. They cannot prove the Jest spec and the worked solution actually
agree — a spec asserting on an id the solution doesn't use passes every unit
test and fails every student.

This closes that gap the only way it can be closed: by running the container.

    python verify_frontend_grading.py            # all nine tasks
    python verify_frontend_grading.py 4 6        # just those

Needs Docker running and the worklearn-sandbox-frontend image built.
"""
import asyncio
import sys
import time

from app.cms_templates.engineering import coding_tasks
from app.core.config import settings
from app.services.frontend_specs import FRONTEND_TASK_SPECS
from app.services.graders.registry import GRADER_REGISTRY
from app.services.sandbox_runners import docker_runner
from app.services import sandbox


async def grade_one(task: dict, source: str) -> tuple[int, dict]:
    index = task["task_index"]
    config = task["config"]

    result = await docker_runner.run_submission(
        source,
        input_files={"submission.test.js": FRONTEND_TASK_SPECS[index].source},
        image=settings.sandbox_image_frontend,
        submission_filename=config["input_filename"],
    )
    try:
        output = sandbox.read_output(result, config["output_filename"])
        stderr = result.stderr
    finally:
        sandbox.cleanup(result.workdir)

    graded = GRADER_REGISTRY[config["grader_key"]](output, None)
    graded["details"]["stderr_tail"] = stderr[-1500:]
    return graded["score"], graded


async def main(only: list[int]) -> int:
    tasks = [t for t in coding_tasks() if not only or t["task_index"] in only]
    failures = []

    for task in tasks:
        index = task["task_index"]
        started = time.monotonic()

        try:
            solution_score, graded = await grade_one(task, task["model_solution"]["example_solution"])
            # The inverse check, and the one that actually proves the suite is
            # measuring something: the untouched starter must NOT pass. A spec
            # that scores 100 on the stub asserts nothing, and would hand every
            # student full marks for opening the editor.
            starter_score, _ = await grade_one(task, task["config"]["starter_code"])
        except Exception as exc:  # noqa: BLE001 — report, don't abort the run
            print(f"  task {index}  ERROR  {type(exc).__name__}: {exc}")
            failures.append(index)
            continue

        elapsed = time.monotonic() - started
        ok = solution_score == 100 and starter_score < 100
        print(f"  task {index}  {'OK  ' if ok else 'FAIL'}  solution={solution_score:>3}  "
              f"starter={starter_score:>3}  {elapsed:.1f}s  {task['title']}")

        if not ok:
            failures.append(index)
            if starter_score == 100:
                print("           the STARTER scores 100 — this spec asserts nothing")
            for check in graded.get("checks", []):
                if not check["pass"]:
                    print(f"           failed: {check['label']}  (-{check['points']})")
            detail = graded.get("details", {})
            if detail.get("error"):
                print(f"           {detail['error']}")
            if detail.get("stderr_tail"):
                print("           stderr:", detail["stderr_tail"][-400:].replace("\n", "\n           "))

    print()
    if failures:
        print(f"{len(failures)} task(s) failed: {failures}")
        print("Either the worked solution is wrong, the hidden spec asserts on "
              "something the student was never told to build, or the spec passes "
              "on the untouched starter.")
        return 1
    print(f"All {len(tasks)} tasks: worked solution scores 100, starter does not.")
    return 0


if __name__ == "__main__":
    only = [int(a) for a in sys.argv[1:]]
    sys.exit(asyncio.run(main(only)))
