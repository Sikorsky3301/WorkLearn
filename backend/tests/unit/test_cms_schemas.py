"""The task-config schemas are a WHITELIST, and this is what keeps it honest.

`validate_task_config` round-trips every save from the builder through the
per-type pydantic model, and pydantic drops keys it does not know about. So a
config key that the runtime reads but no schema declares is not merely
undocumented — it is deleted the first time an author opens that task in the
builder and presses Save, silently, with no error anywhere.

That is not hypothetical. `use_raw_dataset` was exactly this: read by
`_wants_raw_dataset` in api/v1/simulations/sandbox.py to hand a task the
original extract instead of the previous task's output, declared nowhere. The
Data Analyst "Data Quality Report" task depends on it, and without it that
task is fed the student's own CLEANED file — so every honest count comes back
zero and a correct submission scores nothing.

`test_every_runtime_config_key_is_declared` reads the source for the keys the
runtime actually asks for and fails if any of them would not survive a save.
It is deliberately source-scanning rather than a fixed list: a fixed list has
to be remembered, and the thing that went wrong here is precisely that
somebody did not.
"""
import re
from pathlib import Path

import pytest

from app.schemas.cms import CONFIG_MODELS, validate_task_config

APP_DIR = Path(__file__).resolve().parents[2] / "app"

# Read off `config` dicts by other names, or genuinely not part of a task
# config. `text`/`content`/`url`/... belong to Sim Builder BLOCK configs
# (sim_builder_publish.py), a different model entirely.
_NOT_TASK_CONFIG = {"text", "content", "url", "src", "alt", "question", "prompt",
                    "options", "correct_index"}


def _runtime_config_keys() -> set[str]:
    """Every key the backend reads off a SimulationTask.config."""
    pattern = re.compile(r"""config(?:\.get\(|\[)\s*["']([a-z_][a-z0-9_]*)["']""")
    found: set[str] = set()
    for path in APP_DIR.rglob("*.py"):
        if "__pycache__" in path.parts or path.name == "sim_builder_publish.py":
            continue
        found.update(pattern.findall(path.read_text(encoding="utf-8")))
    return found - _NOT_TASK_CONFIG


def _declared_keys() -> set[str]:
    keys: set[str] = set()
    for model in CONFIG_MODELS.values():
        keys.update(model.model_fields)
    return keys


def test_every_runtime_config_key_is_declared():
    missing = sorted(_runtime_config_keys() - _declared_keys())
    assert not missing, (
        "These config keys are read at runtime but declared on no config model, so "
        "validate_task_config DELETES them on every save from the builder: "
        f"{missing}. Add each one to the matching model in app/schemas/cms.py."
    )


@pytest.mark.parametrize("key,value", [
    ("use_raw_dataset", True),
    ("dataset_key", "da_job_sim.lumen_orders"),
    ("grader_key", "da_job_sim.quality_report"),
])
def test_code_sandbox_keys_survive_a_save(key, value):
    """A save must be lossless for the keys grading depends on."""
    config = {
        "language": "python", "grading_strategy": "registered_grader",
        "submission_mode": "code", "input_filename": "dataset.csv",
        "output_filename": "output.json", key: value,
    }
    assert validate_task_config("code_sandbox", config)[key] == value


def test_explainer_and_assessment_survive_a_save_on_every_task_type():
    """Both are attached by the content templates and rendered by the task
    page. They live on TaskConfigBase precisely so no type can lose them."""
    explainer = {"situation": "s", "outcome": "o", "steps": [{"title": "t", "plain": "p"}]}
    assessment = {
        "title": "Check", "pass_mark": 80,
        "questions": [{"question": "q", "options": ["a", "b"], "correct": 1, "explanation": "e"}],
    }
    minimal = {
        "ai_roleplay_chat": {"persona": {"name": "n", "role": "r", "personality_prompt": "p"}},
    }
    for task_type in CONFIG_MODELS:
        config = {**minimal.get(task_type, {}), "explainer": explainer, "assessment": assessment}
        out = validate_task_config(task_type, config)
        assert out["explainer"]["steps"][0]["title"] == "t", task_type
        assert out["assessment"]["questions"][0]["correct"] == 1, task_type
        assert out["assessment"]["pass_mark"] == 80, task_type
