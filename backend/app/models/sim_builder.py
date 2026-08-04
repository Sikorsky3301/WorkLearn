"""
Models for Sim Builder — integer PKs/FKs.
"""
import enum
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey, JSON, Enum as SAEnum, UniqueConstraint
from sqlalchemy.orm import mapped_column, Mapped, relationship
from app.db.database import Base
from app.models.helpers import utcnow


class SimBuilderStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"


class SimBuilderProject(Base):
    __tablename__ = "sim_builder_projects"

    id:            Mapped[int]              = mapped_column(Integer, primary_key=True, autoincrement=True)
    title:         Mapped[str]               = mapped_column(String, nullable=False)
    status:        Mapped[SimBuilderStatus] = mapped_column(SAEnum(SimBuilderStatus), default=SimBuilderStatus.DRAFT)
    created_by:    Mapped[int | None]        = mapped_column(Integer, nullable=True)
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

    id:         Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(Integer, ForeignKey("sim_builder_projects.id", ondelete="CASCADE"), nullable=False)
    title:      Mapped[str] = mapped_column(String, nullable=False, default="Untitled Page")
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

    id:         Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    page_id:    Mapped[int] = mapped_column(Integer, ForeignKey("sim_builder_pages.id", ondelete="CASCADE"), nullable=False)
    block_type: Mapped[str] = mapped_column(String, nullable=False, index=True)
    order:      Mapped[int] = mapped_column(Integer, nullable=False)
    config:     Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    page: Mapped["SimBuilderPage"] = relationship(back_populates="blocks")


class SimBuilderVersion(Base):
    __tablename__ = "sim_builder_versions"

    id:              Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id:      Mapped[int] = mapped_column(Integer, ForeignKey("sim_builder_projects.id", ondelete="CASCADE"), nullable=False)
    version_number:  Mapped[int] = mapped_column(Integer, nullable=False)
    label:           Mapped[str | None] = mapped_column(String, nullable=True)
    snapshot:        Mapped[dict] = mapped_column(JSON, nullable=False)
    created_by:      Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at:      Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    project: Mapped["SimBuilderProject"] = relationship(back_populates="versions")
