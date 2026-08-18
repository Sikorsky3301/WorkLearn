"""Graders for every Frontend Developer job-simulation task.

Replaces the five near-identical frontend_task{1..5}.py modules. Each of those
was a copy of the same two lines plus a hand-maintained title→points dict that
lived a file away from the spec it described — the exact arrangement that let a
renamed test title silently score 0. The points now come from
frontend_specs.FRONTEND_TASK_SPECS, so there is one definition of what a task
is worth and it sits beside the test that earns it.

Every grader still reads only the sandbox's OUTPUT ARTIFACT (the Jest --json
report written to output.json) — never the container's stdout.
"""
from __future__ import annotations

from typing import Callable

from app.services.frontend_specs import FRONTEND_TASK_SPECS
from app.services.graders.frontend_common import grade_jest_report


def make_grader(task_index: int) -> Callable[..., dict]:
    """Grader for one task index, bound to that task's point map."""
    spec = FRONTEND_TASK_SPECS[task_index]

    def grade(output_json: bytes | None, reference=None) -> dict:
        return grade_jest_report(output_json, spec.points)

    grade.__name__ = f"grade_frontend_task{task_index}"
    grade.__doc__ = (
        f"Grades Task {task_index} — {spec.title}. Expects output.json: the Jest "
        f"report from running FRONTEND_TASK_SPECS[{task_index}] against the "
        f"student's submission."
    )
    return grade


GRADERS: dict[str, Callable[..., dict]] = {
    f"frontend_dev_sim.task{i}": make_grader(i) for i in sorted(FRONTEND_TASK_SPECS)
}
