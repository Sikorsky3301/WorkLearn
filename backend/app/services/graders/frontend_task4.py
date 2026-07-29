"""Grades Task 4 — React Component (EmployeeList). Expects the sandbox to
have written output.json (a Jest + React Testing Library report from running
FRONTEND_TEST_SPECS[4] against the student's submission.jsx)."""
from app.services.graders.frontend_common import grade_jest_report

POINTS_BY_TITLE = {
    "shows loading state": 25,
    "shows error state": 25,
    "renders employee list": 50,
}


def grade(output_json: bytes | None, reference=None) -> dict:
    return grade_jest_report(output_json, POINTS_BY_TITLE)
