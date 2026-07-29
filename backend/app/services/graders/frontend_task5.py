"""Grades Task 5 — Task Manager App (persistent state). Expects the sandbox
to have written output.json (a Jest + React Testing Library report from
running FRONTEND_TEST_SPECS[5] against the student's submission.jsx)."""
from app.services.graders.frontend_common import grade_jest_report

POINTS_BY_TITLE = {
    "adds a new task": 30,
    "completes and deletes a task, and persists to localStorage": 40,
    "rehydrates tasks from localStorage on mount": 30,
}


def grade(output_json: bytes | None, reference=None) -> dict:
    return grade_jest_report(output_json, POINTS_BY_TITLE)
