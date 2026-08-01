"""
CMS models for admin-authored job simulations. Purely additive: `Simulation.id`
is the same opaque string `Enrollment.simulation_id` already stores, and
`SimulationTask.task_index` is the same int `TaskCompletion.task_id` already
stores — both existing tables are untouched (see app/models.py), because they
were already schema-agnostic before this file existed.
"""
import enum
from datetime import datetime
from sqlalchemy import String, Integer, Float, Text, DateTime, ForeignKey, JSON, Enum as SAEnum, UniqueConstraint
from sqlalchemy.orm import mapped_column, Mapped, relationship
from app.db.database import Base
from app.models import new_uuid, utcnow


class SimulationStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"


# The fixed set of task-type plugins the generic runtime/builder know how to
# render — see app/services/task_types.py for the registry these values key
# into. Kept as plain strings (not a DB enum) so a new type can be added by a
# developer without a schema migration, matching this project's no-Alembic,
# create_all-only posture.
TASK_TYPES = (
    "text_rubric",
    "structured_form",
    "quiz",
    "ai_roleplay_chat",
    "crm_workspace",
    "code_sandbox",
)


class Simulation(Base):
    __tablename__ = "simulations"

    # This IS the same string Enrollment.simulation_id stores — admin-typed
    # slug, immutable after creation (no rename endpoint: renaming would
    # orphan every Enrollment/TaskCompletion/UserBadge row referencing it).
    id:               Mapped[str]              = mapped_column(String, primary_key=True)
    title:            Mapped[str]               = mapped_column(String, nullable=False)
    description:      Mapped[str]               = mapped_column(Text, nullable=False)
    company:          Mapped[str]               = mapped_column(String, nullable=False)
    logo_url:         Mapped[str | None]        = mapped_column(String, nullable=True)
    # Filter-bar taxonomy ("IT", "Business Development", "Sales", ...) — free
    # text, not an enum, so a new domain needs no migration.
    domain:           Mapped[str]               = mapped_column(String, nullable=False, index=True)
    # The existing display-chip tag ("Data", "Engineering", "Sales") — kept
    # distinct from `domain` so migrating the 3 existing sims doesn't change
    # their card chip while still giving them a domain for the new filter bar.
    category:         Mapped[str | None]        = mapped_column(String, nullable=True)
    accent_color:     Mapped[str]               = mapped_column(String, nullable=False, default="bg-primary")
    difficulty:       Mapped[str]                = mapped_column(String, nullable=False)
    estimated_hours:  Mapped[str]                = mapped_column(String, nullable=False)
    skills:           Mapped[list]               = mapped_column(JSON, nullable=False, default=list)
    # Display-only rating shown on the overview page/picker card (5-star,
    # one decimal) — not computed from real reviews yet, admin-set like every
    # other overview field.
    rating:           Mapped[float]               = mapped_column(Float, nullable=False, default=4.8)
    rating_count:     Mapped[int]                 = mapped_column(Integer, nullable=False, default=0)
    manager:          Mapped[dict]                = mapped_column(JSON, nullable=False)
    onboarding:       Mapped[dict]                = mapped_column(JSON, nullable=False)
    onboarding_xp_award: Mapped[int]              = mapped_column(Integer, nullable=False, default=0)
    # Optional display names for `SimulationTask.week` groupings, e.g.
    # {"1": "Week 1: Onboarding"} — purely cosmetic, task_index stays the only
    # real ordering mechanism. Untouched (defaults to {}) for sims that don't
    # group tasks by week.
    section_labels:   Mapped[dict]                = mapped_column(JSON, nullable=False, default=dict)
    status:           Mapped[SimulationStatus]   = mapped_column(SAEnum(SimulationStatus), default=SimulationStatus.DRAFT)
    created_by:       Mapped[str | None]         = mapped_column(String, nullable=True)  # SuperAdminCredential.id — not a FK, matches UnlockedFeature.granted_by's convention
    created_at:       Mapped[datetime]           = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at:       Mapped[datetime]           = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    published_at:     Mapped[datetime | None]    = mapped_column(DateTime(timezone=True), nullable=True)

    tasks: Mapped[list["SimulationTask"]] = relationship(
        back_populates="simulation", cascade="all, delete-orphan",
        order_by="SimulationTask.task_index",
    )


class SimulationTask(Base):
    __tablename__ = "simulation_tasks"
    __table_args__ = (UniqueConstraint("simulation_id", "task_index", name="uq_simulation_task_index"),)

    id:                Mapped[str]      = mapped_column(String, primary_key=True, default=new_uuid)
    simulation_id:     Mapped[str]      = mapped_column(String, ForeignKey("simulations.id", ondelete="CASCADE"), nullable=False)
    # This IS the same int TaskCompletion.task_id stores for this simulation.
    task_index:        Mapped[int]      = mapped_column(Integer, nullable=False)
    title:             Mapped[str]      = mapped_column(String, nullable=False)
    type:              Mapped[str]      = mapped_column(String, nullable=False, index=True)
    objective:         Mapped[str | None] = mapped_column(Text, nullable=True)
    briefing:          Mapped[str]      = mapped_column(Text, nullable=False, default="")
    # Step-by-step instructions and the deliverables list — shown to the
    # student between the briefing and the interactive task UI. Distinct from
    # `hints` (optional nudges) and `success_criteria` (the completion-gate
    # checklist badges).
    what_to_do:        Mapped[list]     = mapped_column(JSON, nullable=False, default=list)
    what_to_submit:    Mapped[list]     = mapped_column(JSON, nullable=False, default=list)
    hints:             Mapped[list]     = mapped_column(JSON, nullable=False, default=list)
    success_criteria:  Mapped[list]     = mapped_column(JSON, nullable=False, default=list)
    # Read-only "case file" content shown alongside the interactive task —
    # {title, fields: [{label, value}]} where value is a string (paragraph) or
    # a list of strings (tags/bullets). Null when a task has nothing to review
    # (e.g. crm_workspace, where the CRM app itself is the reference).
    reference_data:    Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # Optional worked-example reveal, gated client-side behind a "show
    # solution" button — {steps: [{title, detail, example}], key_principle,
    # great_looks_like, example_solution}. Null when a task has no canonical
    # model answer to show (open-ended CRM/roleplay stages may still have one).
    model_solution:    Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # {category: weight} summing to 1.0 — null for quiz/code_sandbox (own scoring)
    rubric:            Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # Type-specific payload — see app/services/task_types.py for the Pydantic
    # shape validated per `type` on write.
    config:            Mapped[dict]     = mapped_column(JSON, nullable=False, default=dict)
    xp_award:          Mapped[int]      = mapped_column(Integer, nullable=False, default=0)
    skill_awards:      Mapped[dict]     = mapped_column(JSON, nullable=False, default=dict)
    week:              Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at:        Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at:        Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    simulation: Mapped["Simulation"] = relationship(back_populates="tasks")
