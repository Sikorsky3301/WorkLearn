"""
Models for Sim Builder — a separate, Framer-like visual editor for authoring
job simulations as Weeks -> Pages -> Blocks. Deliberately independent of
Simulation/SimulationTask (see app/models_cms.py): that model is one rigid
`type` per task, while a Sim Builder Page is a free-form stack of Blocks of
different types. Keeping these tables separate means the existing job-sim
builder and its student-facing runtime are completely unaffected by this
feature. v1 is authoring-only — published Sim Builder content is not (yet)
rendered to students; publish/version-history operate purely on this tree.
"""
import enum
from datetime import datetime
from sqlalchemy import String, Integer, Text, DateTime, ForeignKey, JSON, Enum as SAEnum, UniqueConstraint
from sqlalchemy.orm import mapped_column, Mapped, relationship
from app.database import Base
from app.models import new_uuid, utcnow


class SimBuilderStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"


class SimBuilderProject(Base):
    __tablename__ = "sim_builder_projects"

    id:            Mapped[str]              = mapped_column(String, primary_key=True, default=new_uuid)
    title:         Mapped[str]               = mapped_column(String, nullable=False)
    status:        Mapped[SimBuilderStatus] = mapped_column(SAEnum(SimBuilderStatus), default=SimBuilderStatus.DRAFT)
    created_by:    Mapped[str | None]        = mapped_column(String, nullable=True)  # SuperAdminCredential.id, not a FK — matches UnlockedFeature.granted_by's convention
    created_at:    Mapped[datetime]          = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at:    Mapped[datetime]          = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    published_at:  Mapped[datetime | None]   = mapped_column(DateTime(timezone=True), nullable=True)

    pages: Mapped[list["SimBuilderPage"]] = relationship(
        back_populates="project", cascade="all, delete-orphan", order_by="SimBuilderPage.order",
    )
    versions: Mapped[list["SimBuilderVersion"]] = relationship(
        back_populates="project", cascade="all, delete-orphan",
    )


class SimBuilderPage(Base):
    __tablename__ = "sim_builder_pages"
    __table_args__ = (UniqueConstraint("project_id", "order", name="uq_sim_builder_page_order"),)

    id:         Mapped[str] = mapped_column(String, primary_key=True, default=new_uuid)
    project_id: Mapped[str] = mapped_column(String, ForeignKey("sim_builder_projects.id", ondelete="CASCADE"), nullable=False)
    title:      Mapped[str] = mapped_column(String, nullable=False, default="Untitled Page")
    # Purely a cosmetic grouping (mirrors SimulationTask.week) — `order` is the
    # only real ordering mechanism, same convention as the job-sim builder.
    week:       Mapped[int | None] = mapped_column(Integer, nullable=True)
    order:      Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    project: Mapped["SimBuilderProject"] = relationship(back_populates="pages")
    blocks: Mapped[list["SimBuilderBlock"]] = relationship(
        back_populates="page", cascade="all, delete-orphan", order_by="SimBuilderBlock.order",
    )


class SimBuilderBlock(Base):
    __tablename__ = "sim_builder_blocks"
    __table_args__ = (UniqueConstraint("page_id", "order", name="uq_sim_builder_block_order"),)

    id:         Mapped[str] = mapped_column(String, primary_key=True, default=new_uuid)
    page_id:    Mapped[str] = mapped_column(String, ForeignKey("sim_builder_pages.id", ondelete="CASCADE"), nullable=False)
    # One of app/services/block_types.py's BLOCK_TYPES keys.
    block_type: Mapped[str] = mapped_column(String, nullable=False, index=True)
    order:      Mapped[int] = mapped_column(Integer, nullable=False)
    # Type-specific payload — see app/services/block_types.py for defaults and
    # app/schemas_sim_builder.py for the Pydantic shape validated per type.
    config:     Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    page: Mapped["SimBuilderPage"] = relationship(back_populates="blocks")


class SimBuilderVersion(Base):
    """A full serialized snapshot of a project's Weeks/Pages/Blocks tree at
    the moment of publish — powers both Publish (this row IS the published
    record) and Version History (list + restore-by-copying-back-in). v1 is
    whole-snapshot based, not a field-level diff."""
    __tablename__ = "sim_builder_versions"

    id:              Mapped[str] = mapped_column(String, primary_key=True, default=new_uuid)
    project_id:      Mapped[str] = mapped_column(String, ForeignKey("sim_builder_projects.id", ondelete="CASCADE"), nullable=False)
    version_number:  Mapped[int] = mapped_column(Integer, nullable=False)
    label:           Mapped[str | None] = mapped_column(String, nullable=True)
    snapshot:        Mapped[dict] = mapped_column(JSON, nullable=False)
    created_by:      Mapped[str | None] = mapped_column(String, nullable=True)
    created_at:      Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    project: Mapped["SimBuilderProject"] = relationship(back_populates="versions")
