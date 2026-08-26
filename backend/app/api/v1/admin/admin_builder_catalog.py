"""What the Sim Builder is allowed to offer, served from the code that
actually implements it.

WHY THIS EXISTS

The builder used to ask authors to TYPE a `grader_key` into a free-text box,
with a caption explaining that it "must match a key already registered in
GRADER_REGISTRY". Nothing checked it. A typo saved cleanly, published cleanly,
and failed for the first student who pressed Submit — at which point the error
belongs to the student, not the author who caused it.

The same was true of `dataset_key`, and of `skill_awards`, where a key that is
not in SKILL_LABELS awards points into a skill the Skill GPS has never heard
of and cannot display.

Every list below is derived from the registry it describes, so the builder can
only offer choices that exist. `used_by` is included because the most common
authoring question about a grader is not "does it exist" but "what is it
already grading, and will I break that" — a grader written against one
simulation's dataset returns nonsense against another's.
"""
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import SKILL_CATEGORIES, SKILL_LABELS
from app.core.permissions import require_cms_access
from app.db.database import get_db
from app.models.cms import Simulation, SimulationTask
from app.schemas.cms import DeclarativeRule
from app.services.graders.registry import DATASET_REGISTRY, GRADER_REGISTRY

router = APIRouter(prefix="/api/admin", tags=["admin-builder-catalog"])

# The authoring shape every simulation on the platform now follows: three
# weeks of three tasks, a five-question check after each task, and one final
# assessment alone in the last week. Served rather than hardcoded in the
# builder so the two cannot drift, and so the readiness panel and the
# scaffold button are measuring the same thing.
SIM_FORMAT = {
    "weeks": 3,
    "tasks_per_week": 3,
    "mini_assessment_questions": 5,
    "mini_pass_mark": 80,
    "final_pass_mark": 70,
    "final_question_count": 40,
    "reference_sims": ["frontend-dev-sim", "da-job-sim"],
}

TASK_TYPES = [
    {"type": "code_sandbox", "label": "Code Sandbox", "group": "Graded work",
     "summary": "The student writes code in a real container and an automated grader scores the file it produces.",
     "supports": ["explainer", "assessment", "sandbox", "grading"]},
    {"type": "text_rubric", "label": "Written Deliverable", "group": "Graded work",
     "summary": "A written answer, scored by an LLM judge against a rubric or checked for required points.",
     "supports": ["explainer", "assessment", "grading"]},
    {"type": "structured_form", "label": "Structured Form", "group": "Graded work",
     "summary": "Named fields the student fills in — use when the shape of the answer matters more than the prose.",
     "supports": ["explainer", "assessment"]},
    {"type": "quiz", "label": "Quiz / Assessment", "group": "Checks",
     "summary": "Multiple choice, graded server-side. Set 'final assessment' to make it the closing exam.",
     "supports": ["assessment"]},
    {"type": "ai_roleplay_chat", "label": "AI Roleplay Chat", "group": "Interactive",
     "summary": "A live conversation with an AI persona — a customer, a stakeholder, an interviewer.",
     "supports": ["explainer", "assessment"]},
    {"type": "crm_workspace", "label": "CRM Workspace", "group": "Interactive",
     "summary": "Renders the built-in sales CRM. Only meaningful for sales and account-management simulations.",
     "supports": ["explainer", "assessment"]},
]

LANGUAGES = [
    {"key": "python", "label": "Python", "runnable": True,
     "hint": "pandas, numpy and matplotlib are in the image. There is no network."},
    {"key": "javascript", "label": "JavaScript", "runnable": True,
     "hint": "Graded with Jest against a hidden spec."},
    {"key": "jsx", "label": "React (JSX)", "runnable": True, "hint": "Graded with Jest + Testing Library."},
    {"key": "html", "label": "HTML / CSS", "runnable": True, "hint": "Graded against the rendered DOM."},
    {"key": "text", "label": "Plain text", "runnable": False, "hint": "Not executed — pair with an LLM-judged grader."},
]

RULE_OPS = [
    {"op": "equals", "label": "Equals", "hint": "Exact match. Use for counts and categorical answers."},
    {"op": "tolerance", "label": "Within tolerance", "hint": "Percentage band around the expected number — the right choice for money and averages."},
    {"op": "range", "label": "Between min and max", "hint": "Accepts anything inside the band."},
    {"op": "regex", "label": "Matches pattern", "hint": "For formats — dates, IDs, casing."},
    {"op": "array_contains", "label": "Contains all of", "hint": "Every listed value must appear."},
    {"op": "row_count_min", "label": "At least N rows", "hint": "For CSV output where the exact count varies."},
    {"op": "row_count_range", "label": "Row count between", "hint": "For CSV output with a known band."},
]


def _summarise(fn) -> str:
    """The first SENTENCE of a grader's documentation.

    Not the first line: docstrings are hard-wrapped at 79 columns, so a first
    line is a sentence chopped mid-clause — "Graders for the four Data Analyst
    tasks added when the simulation went from" is what the picker showed before
    this joined the wrapped lines back together first.

    Several graders document themselves at module level rather than on the
    function, so fall through to that before giving up. An empty string is
    better than a misleading one; the builder renders the key alone when there
    is nothing to say.
    """
    import sys

    for doc in (fn.__doc__, getattr(sys.modules.get(fn.__module__), "__doc__", None)):
        if not doc:
            continue
        # First blank-line-delimited paragraph, unwrapped.
        paragraph = " ".join(
            line.strip() for line in doc.strip().splitlines() if line.strip()
        ).split("  ")[0]
        if not paragraph:
            continue
        sentence, sep, _rest = paragraph.partition(". ")
        return (sentence + "." if sep else paragraph)[:240]
    return ""


def _grader_entries() -> list[dict]:
    return [
        {"key": key, "family": key.split(".", 1)[0], "summary": _summarise(fn)}
        for key, fn in sorted(GRADER_REGISTRY.items())
    ]


@router.get("/builder-catalog")
async def builder_catalog(
    db: AsyncSession = Depends(get_db),
    _=Depends(require_cms_access()),
):
    # Which simulation each grader is already wired to. A grader reads one
    # dataset's columns; pointing a second simulation at it is the kind of
    # mistake that only shows up as a zero score weeks later.
    rows = (await db.execute(
        select(SimulationTask.config, Simulation.slug, Simulation.title, SimulationTask.title)
        .join(Simulation, Simulation.id == SimulationTask.simulation_id)
        .where(SimulationTask.type == "code_sandbox")
    )).all()
    used_by: dict[str, list[dict]] = {}
    for config, sim_slug, sim_title, task_title in rows:
        key = (config or {}).get("grader_key")
        if key:
            used_by.setdefault(key, []).append(
                {"simulation": sim_slug, "simulation_title": sim_title, "task": task_title}
            )

    graders = [{**g, "used_by": used_by.get(g["key"], [])} for g in _grader_entries()]

    return {
        "format": SIM_FORMAT,
        "task_types": TASK_TYPES,
        "languages": LANGUAGES,
        "rule_ops": RULE_OPS,
        "graders": graders,
        "datasets": [
            {"key": key, "summary": (gen.__doc__ or "").strip().splitlines()[0] if gen.__doc__ else ""}
            for key, (gen, _ref) in sorted(DATASET_REGISTRY.items())
        ],
        "skills": [
            {"key": key, "label": label, "category": SKILL_CATEGORIES.get(key, "Technical")}
            for key, label in sorted(SKILL_LABELS.items(), key=lambda kv: kv[1])
        ],
        # Declared here so the rules editor can render the right inputs per op
        # without a second hardcoded copy of the schema.
        "rule_fields": sorted(DeclarativeRule.model_fields),
    }
