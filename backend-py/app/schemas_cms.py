"""
Pydantic request/response models for the Simulation CMS. One config model per
task `type` (see app/services/task_types.py for the registry that dispatches
to these), all sharing an optional `post_task_quiz` block — matching
sales-crm-sim's actual UX (a quiz *gate* after a stage's real work, not a
separate stage) rather than forcing quizzes into standalone rows.
"""
from typing import Literal
from pydantic import BaseModel, Field


# ── Shared sub-shapes ────────────────────────────────────────────────────────

class QuizQuestion(BaseModel):
    question: str
    options: list[str]
    correct: int


class PostTaskQuizConfig(BaseModel):
    questions: list[QuizQuestion] = Field(default_factory=list)


class TaskConfigBase(BaseModel):
    post_task_quiz: PostTaskQuizConfig | None = None


# ── Per-type config shapes ───────────────────────────────────────────────────

class FormField(BaseModel):
    key: str
    label: str
    type: Literal["text", "textarea", "number", "select", "slider", "checkbox"]
    options: list[str] | None = None
    required: bool = False
    min: float | None = None
    max: float | None = None
    min_length: int | None = None


class TextRubricConfig(TaskConfigBase):
    grading_mode: Literal["llm", "manual"] = "manual"
    min_words: int = 0
    required_keywords: list[str] = Field(default_factory=list)
    llm_judge_prompt: str | None = None
    # Optional named fields (e.g. subject/body/cta for a cold email) — when
    # empty, the runtime renders one free-text textarea instead. Field values
    # are combined into one string for min_words/keyword checks, and passed
    # individually to grade-text's `fields` dict for prompt-template filling.
    fields: list[FormField] = Field(default_factory=list)
    # LLM call tuning for the "llm" grading_mode — both optional, provider
    # defaults apply when unset. See app/services/llm.py's temperature plumbing.
    temperature: float | None = Field(None, ge=0, le=2)
    max_tokens: int | None = None


class StructuredFormConfig(TaskConfigBase):
    fields: list[FormField] = Field(default_factory=list)


class QuizConfig(TaskConfigBase):
    questions: list[QuizQuestion] = Field(default_factory=list)


class RoleplayPersona(BaseModel):
    name: str
    role: str
    personality_prompt: str
    mood_options: list[str] = Field(default_factory=lambda: ["neutral"])
    opening_mood: str = "neutral"


class ContextDocument(BaseModel):
    """A structured "reference material" the persona can be given beyond the
    flat `context` dict — rendered as its own prompt section by
    _build_roleplay_prompt (app/routes/sim_runtime.py), generalizing the
    "who you're talking to" dossier concept to any genre."""
    title: str
    body: str


class AiRoleplayChatConfig(TaskConfigBase):
    persona: RoleplayPersona
    context: dict = Field(default_factory=dict)
    context_documents: list[ContextDocument] = Field(default_factory=list)
    mode: Literal["discovery", "objection", "custom"] = "custom"
    # Always appended after whatever the `mode` preset produces (or on its
    # own for "custom") — gives every genre an escape hatch without having
    # to pretend everything is "custom" mode.
    additional_instructions: str = ""
    min_messages_for_completion: int = 6
    # LLM call tuning — both optional, provider defaults apply when unset.
    temperature: float | None = Field(None, ge=0, le=2)
    max_tokens: int | None = None


class CrmWorkspaceConfig(TaskConfigBase):
    enabled_modules: list[str] = Field(default_factory=lambda: [
        "dashboard", "leads", "accounts", "contacts", "opportunities",
        "pipeline", "activities", "tasks", "calendar", "reports",
    ])
    required_entities: dict[str, int] = Field(default_factory=dict)
    pipeline_stages: list[str] = Field(default_factory=list)
    seed_data_key: str | None = None


class DeclarativeRule(BaseModel):
    id: str
    label: str
    field: str
    op: Literal["equals", "tolerance", "range", "regex", "array_contains", "row_count_min", "row_count_range"]
    points: int
    expected: object | None = None
    tolerance_pct: float = 0.02
    min: float | None = None
    max: float | None = None
    pattern: str | None = None
    contains: list | None = None
    case_sensitive: bool = True


class CodeSandboxConfig(TaskConfigBase):
    language: Literal["python", "javascript", "jsx", "html", "text"] = "python"
    grading_strategy: Literal["registered_grader", "declarative_rules"] = "declarative_rules"
    submission_mode: Literal["code", "text"] = "code"
    docker_image: str | None = None
    starter_code: str = ""
    # The filename the student's code is submitted as, and the filename their
    # code must write for the grader to read back — e.g. ("dataset.csv",
    # "output.csv") for a CSV-in/CSV-out task, or ("submission.html",
    # "output.json") for a DOM-graded frontend task. Unused when
    # submission_mode == "text" (da-job-sim Task 5's brief-only path).
    input_filename: str | None = None
    output_filename: str | None = None
    # registered_grader strategy
    grader_key: str | None = None
    dataset_key: str | None = None
    # declarative_rules strategy
    static_input_files: dict[str, str] = Field(default_factory=dict)
    # Points are NOT required to sum to 100 at save time (allows saving a
    # half-finished rule set mid-edit) — enforced instead at publish time,
    # see admin_simulations.py's publish_simulation.
    rules: list[DeclarativeRule] = Field(default_factory=list)


CONFIG_MODELS: dict[str, type[TaskConfigBase]] = {
    "text_rubric": TextRubricConfig,
    "structured_form": StructuredFormConfig,
    "quiz": QuizConfig,
    "ai_roleplay_chat": AiRoleplayChatConfig,
    "crm_workspace": CrmWorkspaceConfig,
    "code_sandbox": CodeSandboxConfig,
}


# ── Simulation / SimulationTask CRUD schemas ─────────────────────────────────

class ManagerPersona(BaseModel):
    name: str
    role: str
    avatar: str = ""
    photo_url: str | None = None


class OnboardingCompany(BaseModel):
    name: str
    industry: str = ""
    size: str = ""
    location: str = ""
    about: str = ""


class OnboardingOffer(BaseModel):
    title: str
    role: str
    team: str = ""
    company: str = ""
    body: str = ""


class OnboardingContent(BaseModel):
    company: OnboardingCompany
    intro: str = ""
    learn: list[str] = Field(default_factory=list)
    offer: OnboardingOffer


SLUG_PATTERN = r"^[a-z0-9]+(-[a-z0-9]+)*$"


class SimulationCreate(BaseModel):
    id: str = Field(pattern=SLUG_PATTERN)
    title: str
    description: str
    company: str
    logo_url: str | None = None
    domain: str
    category: str | None = None
    accent_color: str = "bg-primary"
    difficulty: str
    estimated_hours: str
    skills: list[str] = Field(default_factory=list)
    rating: float = Field(4.8, ge=0, le=5)
    rating_count: int = Field(0, ge=0)
    manager: ManagerPersona
    onboarding: OnboardingContent
    onboarding_xp_award: int = 0
    section_labels: dict[str, str] = Field(default_factory=dict)


class SimulationUpdate(BaseModel):
    """Same fields as create, all optional, minus `id` (immutable — see
    models_cms.py's Simulation.id docstring: renaming would orphan every
    Enrollment/TaskCompletion/UserBadge row referencing it by string)."""
    title: str | None = None
    description: str | None = None
    company: str | None = None
    logo_url: str | None = None
    domain: str | None = None
    category: str | None = None
    accent_color: str | None = None
    difficulty: str | None = None
    estimated_hours: str | None = None
    skills: list[str] | None = None
    rating: float | None = Field(None, ge=0, le=5)
    rating_count: int | None = Field(None, ge=0)
    manager: ManagerPersona | None = None
    onboarding: OnboardingContent | None = None
    onboarding_xp_award: int | None = None
    section_labels: dict[str, str] | None = None


class ReferenceField(BaseModel):
    label: str
    value: str | list[str]


class ReferenceData(BaseModel):
    title: str = ""
    fields: list[ReferenceField] = Field(default_factory=list)


class ModelSolutionStep(BaseModel):
    title: str
    detail: str = ""
    example: str | None = None


class ModelSolution(BaseModel):
    steps: list[ModelSolutionStep] = Field(default_factory=list)
    key_principle: str | None = None
    great_looks_like: str | None = None
    example_solution: str | None = None


class SimulationTaskCreate(BaseModel):
    task_index: int
    title: str
    type: Literal["text_rubric", "structured_form", "quiz", "ai_roleplay_chat", "crm_workspace", "code_sandbox"]
    objective: str | None = None
    briefing: str = ""
    what_to_do: list[str] = Field(default_factory=list)
    what_to_submit: list[str] = Field(default_factory=list)
    hints: list[str] = Field(default_factory=list)
    success_criteria: list[str] = Field(default_factory=list)
    reference_data: ReferenceData | None = None
    model_solution: ModelSolution | None = None
    # NOT required to sum to 1.0 at save time (allows saving a half-finished
    # rubric mid-edit) — enforced instead at publish time, see
    # admin_simulations.py's publish_simulation.
    rubric: dict[str, float] | None = None
    config: dict = Field(default_factory=dict)
    xp_award: int = 0
    skill_awards: dict[str, int] = Field(default_factory=dict)
    week: int | None = None


class SimulationTaskUpdate(BaseModel):
    title: str | None = None
    objective: str | None = None
    briefing: str | None = None
    what_to_do: list[str] | None = None
    what_to_submit: list[str] | None = None
    hints: list[str] | None = None
    success_criteria: list[str] | None = None
    reference_data: ReferenceData | None = None
    model_solution: ModelSolution | None = None
    rubric: dict[str, float] | None = None
    config: dict | None = None
    xp_award: int | None = None
    skill_awards: dict[str, int] | None = None
    week: int | None = None


class ReorderTasksBody(BaseModel):
    task_ids: list[str]


class DuplicateSimulationBody(BaseModel):
    new_id: str = Field(pattern=SLUG_PATTERN)


class CreateFromTemplateBody(BaseModel):
    id: str = Field(pattern=SLUG_PATTERN)
    title: str | None = None


def validate_task_config(task_type: str, config: dict) -> dict:
    """Validates + normalizes a task's `config` against its type's Pydantic
    model. Raises pydantic.ValidationError (caught by the route as a 422)."""
    model = CONFIG_MODELS[task_type]
    return model(**config).model_dump(mode="json")
