"""
CMS models for admin-authored job simulations.
`Simulation.id` is an integer PK; public URLs use `slug`.
`Enrollment.simulation_id` / badges / certificates FK to `simulations.id`.
"""
import enum
from datetime import datetime
from sqlalchemy import String, Integer, Float, Text, DateTime, ForeignKey, JSON, Enum as SAEnum, UniqueConstraint, Boolean
from sqlalchemy.orm import mapped_column, Mapped, relationship
from app.db.database import Base
from app.models.helpers import utcnow


class SimulationStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"


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

    id:               Mapped[int]              = mapped_column(Integer, primary_key=True, autoincrement=True)
    slug:             Mapped[str]              = mapped_column(String, unique=True, nullable=False, index=True)
    title:            Mapped[str]               = mapped_column(String, nullable=False)
    description:      Mapped[str]               = mapped_column(Text, nullable=False)
    company:          Mapped[str]               = mapped_column(String, nullable=False)
    logo_url:         Mapped[str | None]        = mapped_column(String, nullable=True)
    domain:           Mapped[str]               = mapped_column(String, nullable=False, index=True)
    category:         Mapped[str | None]        = mapped_column(String, nullable=True)
    accent_color:     Mapped[str]               = mapped_column(String, nullable=False, default="bg-primary")
    difficulty:       Mapped[str]                = mapped_column(String, nullable=False)
    estimated_hours:  Mapped[str]                = mapped_column(String, nullable=False)
    skills:           Mapped[list]               = mapped_column(JSON, nullable=False, default=list)
    rating:           Mapped[float]               = mapped_column(Float, nullable=False, default=4.8)
    rating_count:     Mapped[int]                 = mapped_column(Integer, nullable=False, default=0)
    manager:          Mapped[dict]                = mapped_column(JSON, nullable=False)
    onboarding:       Mapped[dict]                = mapped_column(JSON, nullable=False)
    onboarding_xp_award: Mapped[int]              = mapped_column(Integer, nullable=False, default=0)
    section_labels:   Mapped[dict]                = mapped_column(JSON, nullable=False, default=dict)
    status:           Mapped[SimulationStatus]   = mapped_column(SAEnum(SimulationStatus), default=SimulationStatus.DRAFT)
    created_by:       Mapped[int | None]         = mapped_column(Integer, nullable=True)
    created_at:       Mapped[datetime]           = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at:       Mapped[datetime]           = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    published_at:     Mapped[datetime | None]    = mapped_column(DateTime(timezone=True), nullable=True)
    # When set, this CMS row was published from a Sim Builder project (re-publish sync).
    sim_builder_project_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("sim_builder_projects.id", ondelete="SET NULL"),
        nullable=True, unique=True, index=True,
    )
    # True = visible on every tenant; False = only universities in simulation_universities.
    available_to_all_universities: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    tasks: Mapped[list["SimulationTask"]] = relationship(
        back_populates="simulation", cascade="all, delete-orphan",
        order_by="SimulationTask.task_index",
    )
    university_links: Mapped[list["SimulationUniversity"]] = relationship(
        back_populates="simulation", cascade="all, delete-orphan",
    )


class SimulationUniversity(Base):
    """Which partner universities can see a published simulation (when not available_to_all)."""
    __tablename__ = "simulation_universities"
    __table_args__ = (UniqueConstraint("simulation_id", "university_id", name="uq_simulation_university"),)

    id:            Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    simulation_id: Mapped[int] = mapped_column(Integer, ForeignKey("simulations.id", ondelete="CASCADE"), nullable=False, index=True)
    university_id: Mapped[int] = mapped_column(Integer, ForeignKey("universities.id", ondelete="CASCADE"), nullable=False, index=True)

    simulation: Mapped["Simulation"] = relationship(back_populates="university_links")


class SimulationTask(Base):
    __tablename__ = "simulation_tasks"
    __table_args__ = (UniqueConstraint("simulation_id", "task_index", name="uq_simulation_task_index"),)

    id:                Mapped[int]      = mapped_column(Integer, primary_key=True, autoincrement=True)
    simulation_id:     Mapped[int]      = mapped_column(Integer, ForeignKey("simulations.id", ondelete="CASCADE"), nullable=False)
    task_index:        Mapped[int]      = mapped_column(Integer, nullable=False)
    title:             Mapped[str]      = mapped_column(String, nullable=False)
    type:              Mapped[str]      = mapped_column(String, nullable=False, index=True)
    objective:         Mapped[str | None] = mapped_column(Text, nullable=True)
    briefing:          Mapped[str]      = mapped_column(Text, nullable=False, default="")
    what_to_do:        Mapped[list]     = mapped_column(JSON, nullable=False, default=list)
    what_to_submit:    Mapped[list]     = mapped_column(JSON, nullable=False, default=list)
    hints:             Mapped[list]     = mapped_column(JSON, nullable=False, default=list)
    success_criteria:  Mapped[list]     = mapped_column(JSON, nullable=False, default=list)
    reference_data:    Mapped[dict | None] = mapped_column(JSON, nullable=True)
    model_solution:    Mapped[dict | None] = mapped_column(JSON, nullable=True)
    rubric:            Mapped[dict | None] = mapped_column(JSON, nullable=True)
    config:            Mapped[dict]     = mapped_column(JSON, nullable=False, default=dict)
    xp_award:          Mapped[int]      = mapped_column(Integer, nullable=False, default=0)
    skill_awards:      Mapped[dict]     = mapped_column(JSON, nullable=False, default=dict)
    week:              Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at:        Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at:        Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    simulation: Mapped["Simulation"] = relationship(back_populates="tasks")
