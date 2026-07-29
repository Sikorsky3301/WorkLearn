"""Grades Task 2 — Interactive Navigation. Expects the sandbox to have
written output.json (a Jest report from running FRONTEND_TEST_SPECS[2]
against the student's submission.html, executed via jsdom with
runScripts: 'dangerously' so the inline <script> actually runs)."""
from app.services.graders.frontend_common import grade_jest_report

POINTS_BY_TITLE = {
    'menu toggle button exists with aria-expanded="false"': 25,
    "clicking toggle flips aria-expanded and opens the menu": 40,
    "clicking a nav link marks it active": 35,
}


def grade(output_json: bytes | None, reference=None) -> dict:
    return grade_jest_report(output_json, POINTS_BY_TITLE)
