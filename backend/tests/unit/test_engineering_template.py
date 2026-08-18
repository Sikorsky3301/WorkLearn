"""The Engineering template's structure is load-bearing in three directions at
once — the hidden Jest specs are keyed by task_index, the CMS strips secrets by
task type, and the roadmap groups by week — so the ways it can quietly go wrong
are all "it still imports, it just grades or leaks the wrong thing".
"""
import pytest

from app.cms_templates import TEMPLATES
from app.cms_templates.engineering import TEMPLATE, coding_tasks
from app.schemas.cms import validate_task_config
from app.services.frontend_specs import FRONTEND_TASK_SPECS
from app.services.graders.registry import GRADER_REGISTRY
from app.services.task_types import strip_secrets

TASKS = TEMPLATE["tasks"]
CODING = coding_tasks()


def test_registered_in_the_template_gallery():
    assert TEMPLATES[TEMPLATE["key"]] is TEMPLATE


def test_three_tasks_per_week_for_three_weeks():
    by_week = {}
    for task in CODING:
        by_week.setdefault(task["week"], []).append(task["task_index"])
    assert sorted(by_week) == [1, 2, 3]
    for week, indices in by_week.items():
        assert len(indices) == 3, f"week {week} has {len(indices)} tasks: {indices}"


def test_task_indices_are_contiguous_from_one():
    assert [t["task_index"] for t in TASKS] == list(range(1, len(TASKS) + 1))


@pytest.mark.parametrize("task", CODING, ids=lambda t: f"task{t['task_index']}")
def test_grader_key_matches_task_index(task):
    """The specs are keyed by task_index and the grader by config.grader_key.
    If those two disagree, submissions are graded against another task's
    answer key — and every check still 'passes', just for the wrong exercise."""
    index = task["task_index"]
    assert task["config"]["grader_key"] == f"frontend_dev_sim.task{index}"
    assert index in FRONTEND_TASK_SPECS
    assert task["config"]["grader_key"] in GRADER_REGISTRY


@pytest.mark.parametrize("task", CODING, ids=lambda t: f"task{t['task_index']}")
def test_every_coding_task_has_a_five_question_assessment(task):
    questions = task["config"]["assessment"]["questions"]
    assert len(questions) == 5
    for q in questions:
        assert 0 <= q["correct"] < len(q["options"])
        assert q["explanation"], "an assessment answer with no explanation is just a score"


def test_final_assessment_exists_with_fifty_questions():
    final = TASKS[-1]
    assert final["type"] == "quiz"
    assert final["config"]["is_final_assessment"] is True
    assert len(final["config"]["assessment"]["questions"]) == 50
    # Its own week, so the roadmap renders it as a section rather than a
    # fourth item inside Week 3.
    assert final["week"] == 4
    assert str(final["week"]) in TEMPLATE["simulation"]["section_labels"]


@pytest.mark.parametrize("task", TASKS, ids=lambda t: f"task{t['task_index']}")
def test_assessment_answers_never_reach_the_client(task):
    """`assessment` must be stripped from the public payload for every task
    type it appears on — otherwise the answer key is one devtools tab away."""
    public = strip_secrets(task["type"], task["config"])
    assert "assessment" not in public
    if task["type"] == "code_sandbox":
        assert "grader_key" not in public


@pytest.mark.parametrize("task", TASKS, ids=lambda t: f"task{t['task_index']}")
def test_config_survives_cms_validation(task):
    """validate_task_config round-trips config through a pydantic model, which
    DROPS unknown fields. A key that isn't in the schema is silently erased the
    first time an admin opens the task in the builder and saves."""
    out = validate_task_config(task["type"], task["config"])
    assert out.get("assessment"), "assessment was dropped by the config schema"
    if task["type"] == "code_sandbox":
        assert out.get("explainer"), "explainer was dropped by the config schema"
        assert out["explainer"]["steps"], "explainer steps were dropped"
        assert out["config"]["starter_code"] if "config" in out else out["starter_code"]


@pytest.mark.parametrize("task", CODING, ids=lambda t: f"task{t['task_index']}")
def test_explainer_teaches_both_audiences(task):
    """The whole point of the redesign: every task explains itself in plain
    language AND names the trade-off underneath. A step with only one of those
    has lost half its readership."""
    explainer = task["config"]["explainer"]
    assert explainer["situation"] and explainer["outcome"]
    assert len(explainer["steps"]) >= 3
    assert all(s["plain"] for s in explainer["steps"]), "a step with no plain explanation"
    assert any(s.get("deeper") for s in explainer["steps"]), "no advanced layer anywhere"
    assert explainer["concepts"], "no concepts defined for a beginner"
    assert explainer["contract"], "nothing tells the student what the checks look for"
    assert explainer["mistakes"]


@pytest.mark.parametrize("task", CODING, ids=lambda t: f"task{t['task_index']}")
def test_contract_names_appear_in_the_hidden_spec(task):
    """A contract entry the tests don't actually assert on is a promise the
    grader doesn't keep — and worse, a name the student may be told to use
    while the real check looks for something else.

    Loose on purpose: the contract is prose ("<header>, <main>, <footer>"), so
    this asserts that each entry contributes at least one recognisable token to
    the spec rather than demanding an exact match.
    """
    import re

    source = FRONTEND_TASK_SPECS[task["task_index"]].source
    for item in task["config"]["explainer"]["contract"]:
        tokens = re.findall(r"[A-Za-z][A-Za-z0-9_-]{2,}", item["name"])
        assert any(t in source for t in tokens), (
            f"task {task['task_index']}: contract entry {item['name']!r} "
            f"matches nothing in the hidden spec"
        )


def test_assessment_summary_exposes_counts_but_never_answers():
    """The overview page needs to know an assessment EXISTS and how big it is,
    without any part of the answer key crossing the wire."""
    from app.services.sim_view import build_task_public_dict
    from app.models.cms import SimulationTask

    for task in TASKS:
        row = SimulationTask(
            id=task["task_index"], simulation_id=1, task_index=task["task_index"],
            title=task["title"], type=task["type"], config=task["config"],
            objective=task.get("objective"), briefing=task.get("briefing", ""),
            what_to_do=task.get("what_to_do", []), what_to_submit=task.get("what_to_submit", []),
            hints=task.get("hints", []), success_criteria=task.get("success_criteria", []),
            xp_award=task.get("xp_award", 0), skill_awards=task.get("skill_awards", {}),
            week=task.get("week"),
        )
        public = build_task_public_dict(row)

        summary = public["assessment_summary"]
        assert summary is not None, f"task {task['task_index']} lost its assessment summary"
        assert summary["question_count"] == len(task["config"]["assessment"]["questions"])
        assert summary["pass_mark"] == task["config"]["assessment"]["pass_mark"]

        # The count is public; nothing else about the assessment is.
        assert "assessment" not in public["config"]
        leaks = _answer_key_fields(public)
        assert leaks == [], f"answer-key fields reached the public payload: {leaks}"


def _answer_key_fields(node, path="") -> list[str]:
    """Paths of any `correct` / `explanation` KEY in a payload.

    Structural on purpose. A substring search over the serialised payload
    reports every task that happens to use the word — "make the nav announce
    itself correctly", "a loose email check is fine and correct" — and a test
    that cries wolf on ordinary prose gets deleted the third time it fires.
    Only a real dict key is a real leak.
    """
    found = []
    if isinstance(node, dict):
        for key, value in node.items():
            if key in ("correct", "explanation"):
                found.append(f"{path}/{key}")
            found += _answer_key_fields(value, f"{path}/{key}")
    elif isinstance(node, list):
        for i, value in enumerate(node):
            found += _answer_key_fields(value, f"{path}[{i}]")
    return found
