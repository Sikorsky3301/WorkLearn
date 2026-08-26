"""Data Analyst simulation content invariants.

The same guarantees the Engineering template carries (see
test_engineering_template.py), because the failure modes are identical:

  * an assessment whose `correct` index points at nothing, or whose options
    are not distinct — unanswerable, and only discovered by a student;
  * an explainer `contract` that has drifted from the grader it describes,
    which is worse than no contract because it teaches the wrong target;
  * answer keys reaching the browser. The whole `assessment` block is stripped
    from the public payload by task_types.secret_config_keys; this pins that
    it is still listed, and walks the public payload structurally to prove
    nothing leaks.
"""
import pytest

from app.cms_templates.data_analytics import (
    CONTENT_TASK_INDEXES,
    EXPLAINERS,
    FINAL_ASSESSMENT,
    FINAL_TASK,
    MINI_ASSESSMENTS,
    MINI_PASS_MARK,
)
from app.services.graders.registry import GRADER_REGISTRY
from app.services.task_types import TASK_TYPES, strip_secrets

ALL_BANKS = [("mini", i, b) for i, b in MINI_ASSESSMENTS.items()] + [("final", 0, FINAL_ASSESSMENT)]
ALL_QUESTIONS = [(kind, idx, qi, q)
                 for kind, idx, bank in ALL_BANKS
                 for qi, q in enumerate(bank["questions"])]


# ── coverage ─────────────────────────────────────────────────────────────────

def test_every_task_has_an_explainer_and_an_assessment():
    assert set(EXPLAINERS) == set(CONTENT_TASK_INDEXES)
    assert set(MINI_ASSESSMENTS) == set(CONTENT_TASK_INDEXES)


def test_every_mini_assessment_has_five_questions_and_the_shared_pass_mark():
    for idx, bank in MINI_ASSESSMENTS.items():
        assert len(bank["questions"]) == 5, f"task {idx} has {len(bank['questions'])}"
        assert bank["pass_mark"] == MINI_PASS_MARK, f"task {idx} sets its own pass mark"
        assert bank["title"], f"task {idx} bank has no title"


def test_final_assessment_is_substantial_and_passable():
    assert len(FINAL_ASSESSMENT["questions"]) >= 40
    assert 0 < FINAL_ASSESSMENT["pass_mark"] < 100
    assert FINAL_TASK["config"]["question_count"] == len(FINAL_ASSESSMENT["questions"])
    assert FINAL_TASK["config"]["pass_mark"] == FINAL_ASSESSMENT["pass_mark"]
    assert FINAL_TASK["config"]["is_final_assessment"] is True


def test_the_final_task_does_not_collide_with_a_real_task():
    assert FINAL_TASK["task_index"] not in CONTENT_TASK_INDEXES


# ── question integrity ───────────────────────────────────────────────────────

@pytest.mark.parametrize("kind,idx,qi,q", ALL_QUESTIONS)
def test_question_is_answerable(kind, idx, qi, q):
    where = f"{kind} {idx} q{qi + 1}"
    assert q["question"].strip(), f"{where}: empty question"
    assert len(q["options"]) >= 2, f"{where}: fewer than two options"
    assert all(str(o).strip() for o in q["options"]), f"{where}: a blank option"
    assert len(set(q["options"])) == len(q["options"]), f"{where}: duplicate options"
    assert isinstance(q["correct"], int), f"{where}: `correct` is not an int"
    assert 0 <= q["correct"] < len(q["options"]), f"{where}: `correct` is out of range"


@pytest.mark.parametrize("kind,idx,qi,q", ALL_QUESTIONS)
def test_question_explains_its_answer(kind, idx, qi, q):
    """The explanation is what makes a wrong answer worth something."""
    assert q.get("explanation", "").strip(), f"{kind} {idx} q{qi + 1} has no explanation"


def test_the_correct_answer_is_not_always_in_the_same_place():
    """A bank where `correct` is always 1 is passable without reading."""
    for kind, idx, bank in ALL_BANKS:
        positions = {q["correct"] for q in bank["questions"]}
        assert len(positions) > 1, f"{kind} {idx}: every answer is at index {positions.pop()}"


# ── explainer integrity ──────────────────────────────────────────────────────

@pytest.mark.parametrize("idx", sorted(EXPLAINERS))
def test_explainer_is_complete(idx):
    e = EXPLAINERS[idx]
    assert e["situation"].strip(), f"task {idx}: no situation"
    assert e["outcome"].strip(), f"task {idx}: no outcome"
    assert e["steps"], f"task {idx}: no steps"
    assert e["concepts"], f"task {idx}: no concepts"
    assert e["contract"], f"task {idx}: no contract"
    assert e["mistakes"], f"task {idx}: no mistakes"


@pytest.mark.parametrize("idx", sorted(EXPLAINERS))
def test_every_step_teaches_at_both_levels(idx):
    """`plain` for someone who has never done this, `deeper` for the trade-off.
    A step with only one of them is half a step."""
    for i, step in enumerate(EXPLAINERS[idx]["steps"], 1):
        assert step["title"].strip(), f"task {idx} step {i}: no title"
        assert step["plain"].strip(), f"task {idx} step {i}: no plain explanation"
        assert (step.get("deeper") or "").strip(), f"task {idx} step {i}: no deeper note"


@pytest.mark.parametrize("idx", sorted(EXPLAINERS))
def test_every_concept_is_defined_and_motivated(idx):
    for c in EXPLAINERS[idx]["concepts"]:
        assert c["term"].strip(), f"task {idx}: a concept with no term"
        assert c["plain"].strip(), f"task {idx}: {c['term']} is not defined"
        assert c["why"].strip(), f"task {idx}: {c['term']} has no reason to exist"


@pytest.mark.parametrize("idx", sorted(EXPLAINERS))
def test_contract_items_state_a_requirement(idx):
    for item in EXPLAINERS[idx]["contract"]:
        assert item["name"].strip(), f"task {idx}: a contract item with no name"
        assert item["must"].strip(), f"task {idx}: {item['name']} states no requirement"


# ── content vs the real graders ──────────────────────────────────────────────

DA_GRADER_KEYS = {
    1: "da_job_sim.task1_cleaning",
    2: "da_job_sim.quality_report",
    3: "da_job_sim.task2_report",
    4: "da_job_sim.channel_country",
    5: "da_job_sim.monthly_trend",
    6: "da_job_sim.task3_segmentation",
    7: "da_job_sim.cohort_retention",
    8: "da_job_sim.task4_ab_test",
    9: "da_job_sim.task5_brief",
}


@pytest.mark.parametrize("idx,key", sorted(DA_GRADER_KEYS.items()))
def test_each_task_still_has_a_registered_grader(idx, key):
    """The explainers describe these graders. If one is renamed or removed the
    contract blocks become fiction, so fail here rather than in a student's
    submission."""
    assert key in GRADER_REGISTRY, f"task {idx}: {key} is not registered"


@pytest.mark.parametrize("idx", [1, 2, 3, 4, 5, 6, 7, 8])
def test_code_tasks_name_their_output_artifact_in_the_contract(idx):
    """Grading reads the artifact, never stdout — so the contract has to say
    which file, or a student can pass every visible instruction and score 0."""
    names = " ".join(item["name"] + " " + item["must"] for item in EXPLAINERS[idx]["contract"]).lower()
    assert "output.csv" in names or "output.json" in names, \
        f"task {idx}: the contract never names the output file"


# ── answer keys must not reach the browser ───────────────────────────────────

def test_assessment_is_a_secret_config_key_for_both_task_types():
    """This is the mechanism that strips the answers. If `assessment` ever
    leaves these lists, every correct index ships to the client."""
    for task_type in ("quiz", "code_sandbox"):
        assert "assessment" in TASK_TYPES[task_type].secret_config_keys, \
            f"`assessment` is not stripped for {task_type} tasks"


def _answer_key_fields(payload, path="config"):
    """Structural walk for the keys that ARE the answer key.

    Deliberately not a substring search for the word 'correct': eight of these
    tasks legitimately use it in prose ('the correct response is…'), and a text
    match flags all of them. Only a dict key named `correct` or `explanation`
    inside a question is a leak.
    """
    found = []
    if isinstance(payload, dict):
        for k, v in payload.items():
            if k in ("correct", "explanation"):
                found.append(f"{path}.{k}")
            found.extend(_answer_key_fields(v, f"{path}.{k}"))
    elif isinstance(payload, list):
        for i, v in enumerate(payload):
            found.extend(_answer_key_fields(v, f"{path}[{i}]"))
    return found


@pytest.mark.parametrize("idx", sorted(MINI_ASSESSMENTS))
def test_stripping_the_assessment_removes_every_answer_key(idx):
    config = {"explainer": EXPLAINERS[idx], "assessment": MINI_ASSESSMENTS[idx],
              "grader_key": DA_GRADER_KEYS[idx], "language": "python"}

    assert _answer_key_fields(config), "the fixture should contain answer keys before stripping"

    public = strip_secrets("code_sandbox", config)
    leaked = _answer_key_fields(public)
    assert not leaked, f"task {idx} leaks answer keys to the client: {leaked}"


def test_stripping_the_final_assessment_removes_every_answer_key():
    public = strip_secrets("quiz", FINAL_TASK["config"])
    leaked = _answer_key_fields(public)
    assert not leaked, f"the final assessment leaks answer keys: {leaked}"
    # The student still needs to know how many questions and what passes.
    assert public.get("question_count") == len(FINAL_ASSESSMENT["questions"])
    assert public.get("pass_mark") == FINAL_ASSESSMENT["pass_mark"]
