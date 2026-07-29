"""
Pydantic request/response models for Sim Builder. One config model per block
`block_type` (see app/services/block_types.py for the registry), mirroring
schemas_cms.py's CONFIG_MODELS/validate_task_config pattern but simpler —
v1 blocks are content/authoring, not graded, so there's no shared grading
sub-shape to inherit.
"""
from typing import Literal
from pydantic import BaseModel, Field


# ── Per-block-type config shapes ─────────────────────────────────────────────

class HeadingConfig(BaseModel):
    text: str = "New heading"
    level: Literal[1, 2, 3, 4] = 2


class TextConfig(BaseModel):
    body: str = ""


class ImageConfig(BaseModel):
    url: str = ""
    caption: str = ""


class QuizBlockConfig(BaseModel):
    question: str = ""
    options: list[str] = Field(default_factory=lambda: ["", ""])
    correct: int = 0


class VideoConfig(BaseModel):
    url: str = ""
    caption: str = ""


class AiChatConfig(BaseModel):
    persona_name: str = "Contact Name"
    persona_role: str = "Role"
    prompt: str = ""


class EmailExerciseConfig(BaseModel):
    scenario: str = ""
    to_placeholder: str = "recipient@company.com"
    subject_placeholder: str = "Subject line…"
    body_placeholder: str = "Write your email here…"


class CodingChallengeConfig(BaseModel):
    language: Literal["python", "javascript", "jsx", "html", "text"] = "python"
    starter_code: str = ""
    instructions: str = ""


class FileUploadConfig(BaseModel):
    instructions: str = ""
    accepted_types: list[str] = Field(default_factory=lambda: [".pdf", ".docx"])
    max_size_mb: int = 10


class AssessmentCriterion(BaseModel):
    label: str
    weight: float = 0


class AssessmentConfig(BaseModel):
    criteria: list[AssessmentCriterion] = Field(default_factory=lambda: [
        AssessmentCriterion(label="Quality", weight=0.5), AssessmentCriterion(label="Clarity", weight=0.5),
    ])


class BranchingLogicBranch(BaseModel):
    label: str
    description: str = ""


class BranchingLogicConfig(BaseModel):
    prompt: str = ""
    branches: list[BranchingLogicBranch] = Field(default_factory=lambda: [
        BranchingLogicBranch(label="Path A"), BranchingLogicBranch(label="Path B"),
    ])


class TimerConfig(BaseModel):
    duration_minutes: int = 15
    label: str = "Time limit"


class XpRewardsConfig(BaseModel):
    xp_amount: int = 50
    badge_label: str = ""


BLOCK_CONFIG_MODELS: dict[str, type[BaseModel]] = {
    "heading": HeadingConfig,
    "text": TextConfig,
    "image": ImageConfig,
    "video": VideoConfig,
    "quiz": QuizBlockConfig,
    "ai_chat": AiChatConfig,
    "email_exercise": EmailExerciseConfig,
    "coding_challenge": CodingChallengeConfig,
    "file_upload": FileUploadConfig,
    "assessment": AssessmentConfig,
    "branching_logic": BranchingLogicConfig,
    "timer": TimerConfig,
    "xp_rewards": XpRewardsConfig,
}

BLOCK_TYPE_LITERAL = Literal[
    "heading", "text", "image", "video", "quiz", "ai_chat", "email_exercise",
    "coding_challenge", "file_upload", "assessment", "branching_logic", "timer", "xp_rewards",
]


def validate_block_config(block_type: str, config: dict) -> dict:
    """Validates + normalizes a block's `config` against its type's Pydantic
    model. Raises pydantic.ValidationError (caught by the route as a 422)."""
    model = BLOCK_CONFIG_MODELS[block_type]
    return model(**config).model_dump(mode="json")


# ── Project / Page / Block CRUD schemas ──────────────────────────────────────

class SimBuilderProjectCreate(BaseModel):
    title: str


class SimBuilderProjectUpdate(BaseModel):
    title: str | None = None


class SimBuilderPageCreate(BaseModel):
    title: str = "Untitled Page"
    week: int | None = None
    order: int


class SimBuilderPageUpdate(BaseModel):
    title: str | None = None
    week: int | None = None


class ReorderPagesBody(BaseModel):
    page_ids: list[str]


class SimBuilderBlockCreate(BaseModel):
    block_type: BLOCK_TYPE_LITERAL
    order: int
    config: dict = Field(default_factory=dict)


class SimBuilderBlockUpdate(BaseModel):
    config: dict


class ReorderBlocksBody(BaseModel):
    block_ids: list[str]


class AiGenerateBody(BaseModel):
    prompt: str
