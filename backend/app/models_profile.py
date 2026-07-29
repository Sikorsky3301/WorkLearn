"""
Portfolio education entries — a user can have many, so unlike the flat
contact/photo/resume fields (which live directly on User, see models.py),
this is its own table. No relationship is declared on User (no other
cross-file table does either, e.g. models_cms.py's Simulation); routes/
profile.py queries it directly by user_id.
"""
from datetime import datetime
from sqlalchemy import String, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import mapped_column, Mapped
from app.database import Base
from app.models import new_uuid, utcnow


class EducationEntry(Base):
    __tablename__ = "education_entries"

    id:             Mapped[str]           = mapped_column(String, primary_key=True, default=new_uuid)
    user_id:        Mapped[str]           = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    institution:    Mapped[str]           = mapped_column(String, nullable=False)
    degree:         Mapped[str | None]    = mapped_column(String, nullable=True)
    field_of_study: Mapped[str | None]    = mapped_column(String, nullable=True)
    start_year:     Mapped[int | None]    = mapped_column(Integer, nullable=True)
    end_year:       Mapped[int | None]    = mapped_column(Integer, nullable=True)
    is_current:     Mapped[bool]          = mapped_column(Boolean, default=False)
    description:    Mapped[str | None]    = mapped_column(String, nullable=True)
    sort_order:     Mapped[int]           = mapped_column(Integer, default=0)
    created_at:     Mapped[datetime]      = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at:     Mapped[datetime]      = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
