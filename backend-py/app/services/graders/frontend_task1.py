"""Grades Task 1 — Landing Hero Section. Expects the sandbox to have written
output.json (a Jest report from running FRONTEND_TEST_SPECS[1] against the
student's submission.html)."""
from app.services.graders.frontend_common import grade_jest_report

POINTS_BY_TITLE = {
    "has header, main, and footer landmarks": 20,
    "hero section has exactly one h1": 20,
    "nav contains at least one link": 15,
    "CSS uses flexbox or grid for layout": 25,
    "nav links have visible, non-empty text": 20,
}


def grade(output_json: bytes | None, reference=None) -> dict:
    return grade_jest_report(output_json, POINTS_BY_TITLE)
