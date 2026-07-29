"""
Registry of the Sim Builder block-type plugins. Mirrors
app/services/task_types.py's role for the job-sim builder: gives a human
label + grouping category for the editor's palette, and the default `config`
a newly-inserted block of that type starts with.

Ships all 13 originally-requested block types. The 7 added after the initial
6 (video, email_exercise, file_upload, timer, xp_rewards, assessment,
branching_logic) are, like ai_chat/coding_challenge before them, editor-
preview only — no live grading/runtime wired up yet (see the plan's
"explicitly deferred" section).
"""
from dataclasses import dataclass, field


@dataclass(frozen=True)
class BlockTypeSpec:
    label: str
    category: str  # "content" | "interactive" | "utility" — mirrors the palette's grouping
    default_config: dict = field(default_factory=dict)


BLOCK_TYPES: dict[str, BlockTypeSpec] = {
    "heading": BlockTypeSpec(
        label="Heading", category="content",
        default_config={"text": "New heading", "level": 2},
    ),
    "text": BlockTypeSpec(
        label="Text", category="content",
        default_config={"body": ""},
    ),
    "image": BlockTypeSpec(
        label="Image", category="content",
        default_config={"url": "", "caption": ""},
    ),
    "video": BlockTypeSpec(
        label="Video", category="content",
        default_config={"url": "", "caption": ""},
    ),
    "quiz": BlockTypeSpec(
        label="Quiz", category="interactive",
        default_config={"question": "", "options": ["", ""], "correct": 0},
    ),
    "ai_chat": BlockTypeSpec(
        label="AI Chat", category="interactive",
        default_config={"persona_name": "Contact Name", "persona_role": "Role", "prompt": ""},
    ),
    "email_exercise": BlockTypeSpec(
        label="Email Exercise", category="interactive",
        default_config={
            "scenario": "", "to_placeholder": "recipient@company.com",
            "subject_placeholder": "Subject line…", "body_placeholder": "Write your email here…",
        },
    ),
    "coding_challenge": BlockTypeSpec(
        label="Coding Challenge", category="interactive",
        default_config={"language": "python", "starter_code": "", "instructions": ""},
    ),
    "file_upload": BlockTypeSpec(
        label="File Upload", category="interactive",
        default_config={"instructions": "", "accepted_types": [".pdf", ".docx"], "max_size_mb": 10},
    ),
    "assessment": BlockTypeSpec(
        label="Assessment", category="interactive",
        default_config={"criteria": [{"label": "Quality", "weight": 0.5}, {"label": "Clarity", "weight": 0.5}]},
    ),
    "branching_logic": BlockTypeSpec(
        label="Branching Logic", category="interactive",
        default_config={"prompt": "", "branches": [{"label": "Path A", "description": ""}, {"label": "Path B", "description": ""}]},
    ),
    "timer": BlockTypeSpec(
        label="Timer", category="utility",
        default_config={"duration_minutes": 15, "label": "Time limit"},
    ),
    "xp_rewards": BlockTypeSpec(
        label="XP & Rewards", category="utility",
        default_config={"xp_amount": 50, "badge_label": ""},
    ),
}


def default_config_for(block_type: str) -> dict:
    spec = BLOCK_TYPES.get(block_type)
    return dict(spec.default_config) if spec else {}
