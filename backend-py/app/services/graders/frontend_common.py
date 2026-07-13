"""Shared grading logic for the frontend-dev-sim tasks. Every frontend task's
sandbox artifact is the same shape — a Jest --json report written to
output.json — so all 5 graders just supply a title -> points map for their
own hidden spec's test titles and delegate here."""
from app.services.graders import finalize, try_parse_json


def grade_jest_report(output_json: bytes | None, points_by_title: dict[str, int]) -> dict:
    report = try_parse_json(output_json)
    if report is None:
        checks = [{"id": "output_exists", "label": "Test report (output.json) was produced", "points": 0, "pass": False}]
        return finalize(checks, {"error": "No output.json found or it was unreadable"})

    test_results = report.get("testResults") or []
    if not test_results:
        checks = [{"id": "tests_ran", "label": "Jest ran the hidden test suite", "points": 0, "pass": False}]
        return finalize(checks, {"error": "No test results in report"})

    suite = test_results[0]
    assertions = suite.get("assertionResults") or []
    if not assertions:
        checks = [{"id": "tests_ran", "label": "Jest ran the hidden test suite", "points": 0, "pass": False}]
        return finalize(checks, {"error": "Test suite failed to run", "message": (suite.get("message") or "")[-2000:]})

    checks = []
    for i, assertion in enumerate(assertions):
        title = assertion.get("title", f"check_{i}")
        passed = assertion.get("status") == "passed"
        points = points_by_title.get(title, 0)
        checks.append({"id": f"jest_{i}", "label": title, "points": points, "pass": passed})

    num_passed = sum(1 for c in checks if c["pass"])
    return finalize(checks, {"num_passed": num_passed, "num_total": len(checks)})
