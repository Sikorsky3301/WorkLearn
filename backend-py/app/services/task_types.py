"""
Registry of the fixed set of task-type plugins the CMS supports. Its only
real jobs: (1) tell admin_simulations.py which secret config keys must never
be sent to students via the public sim_runtime.py endpoints, (2) give a
human label for the admin builder's palette/list views.

Validation of `config` itself happens via schemas_cms.py's CONFIG_MODELS,
not here — this registry is metadata, not a class hierarchy, since there
are only 6 fixed types and no plugin-loading mechanism is needed.
"""
from dataclasses import dataclass, field


@dataclass(frozen=True)
class TaskTypeSpec:
    label: str
    grades_via: str  # "llm_or_manual" | "rubric" | "score" | "llm" | "sandbox"
    requires_sandbox: bool = False
    # Config keys stripped from the public GET /api/simulations/{id}/full
    # response — students never see grading internals.
    secret_config_keys: tuple[str, ...] = field(default_factory=tuple)


TASK_TYPES: dict[str, TaskTypeSpec] = {
    "text_rubric": TaskTypeSpec(
        label="Text + Rubric",
        grades_via="llm_or_manual",
        secret_config_keys=("llm_judge_prompt", "required_keywords"),
    ),
    "structured_form": TaskTypeSpec(
        label="Structured Form",
        grades_via="rubric",
    ),
    "quiz": TaskTypeSpec(
        label="Quiz",
        grades_via="score",
        # `correct` (the answer index) is intentionally NOT stripped here —
        # today's client-side quiz grading already requires it be visible to
        # the browser (StageQuiz.jsx computes the score itself); this matches
        # existing behavior, not a new information leak.
    ),
    "ai_roleplay_chat": TaskTypeSpec(
        label="AI Roleplay Chat",
        grades_via="llm",
        secret_config_keys=("persona.personality_prompt",),
    ),
    "crm_workspace": TaskTypeSpec(
        label="CRM Workspace",
        grades_via="rubric",
    ),
    "code_sandbox": TaskTypeSpec(
        label="Code Sandbox",
        grades_via="sandbox",
        requires_sandbox=True,
        secret_config_keys=("grader_key", "dataset_key", "rules", "static_input_files"),
    ),
}


def strip_secrets(task_type: str, config: dict) -> dict:
    """Returns a copy of `config` with this type's secret keys removed —
    supports dotted paths (e.g. "persona.personality_prompt") for one level
    of nesting, which is all the current registry needs."""
    spec = TASK_TYPES.get(task_type)
    if not spec:
        return config
    out = {k: v for k, v in config.items()}
    for key in spec.secret_config_keys:
        if "." in key:
            parent, child = key.split(".", 1)
            if isinstance(out.get(parent), dict):
                nested = {k: v for k, v in out[parent].items() if k != child}
                out[parent] = nested
        else:
            out.pop(key, None)
    return out
