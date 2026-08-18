"""The frontend sim's grading is only correct if every hidden test is worth
something and the worths add up. Both facts are easy to break silently — a
renamed test title still passes, it just stops scoring — so they're asserted
here rather than discovered by a student who wrote a perfect answer and got 80.
"""
import pytest

from app.services.frontend_specs import FRONTEND_TASK_SPECS, titles_in, validate_specs
from app.services.graders.registry import GRADER_REGISTRY


def test_every_spec_is_fully_and_exactly_scored():
    problems = validate_specs()
    assert problems == [], "grading is desynced from the specs:\n  " + "\n  ".join(problems)


@pytest.mark.parametrize("index", sorted(FRONTEND_TASK_SPECS))
def test_each_task_has_a_registered_grader(index):
    assert f"frontend_dev_sim.task{index}" in GRADER_REGISTRY


@pytest.mark.parametrize("index", sorted(FRONTEND_TASK_SPECS))
def test_a_full_pass_scores_100(index):
    """Simulates the Jest report for an all-green run and checks the grader
    returns exactly 100 — the property the point map exists to guarantee."""
    import json

    spec = FRONTEND_TASK_SPECS[index]
    report = {
        "testResults": [{
            "assertionResults": [
                {"title": title, "status": "passed"} for title in titles_in(spec)
            ],
        }],
    }
    result = GRADER_REGISTRY[f"frontend_dev_sim.task{index}"](json.dumps(report).encode(), None)
    assert result["score"] == 100


@pytest.mark.parametrize("index", sorted(FRONTEND_TASK_SPECS))
def test_a_full_failure_scores_0(index):
    import json

    spec = FRONTEND_TASK_SPECS[index]
    report = {
        "testResults": [{
            "assertionResults": [
                {"title": title, "status": "failed"} for title in titles_in(spec)
            ],
        }],
    }
    result = GRADER_REGISTRY[f"frontend_dev_sim.task{index}"](json.dumps(report).encode(), None)
    assert result["score"] == 0
    assert len(result["checks"]) == len(titles_in(spec))
