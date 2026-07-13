"""Grades Task 3 — Fetch and Render Live Data. Expects the sandbox to have
written output.json (a Jest report from running FRONTEND_TEST_SPECS[3]
against the student's submission.js, with a mocked fetchFn injected so the
hidden test controls timing/success/failure)."""
from app.services.graders.frontend_common import grade_jest_report

POINTS_BY_TITLE = {
    "shows a loading state before data resolves": 30,
    "renders the team list on success": 40,
    "renders an error state when the fetch rejects": 30,
}


def grade(output_json: bytes | None, reference=None) -> dict:
    return grade_jest_report(output_json, POINTS_BY_TITLE)
