"""Portfolio education entries."""
from datetime import datetime
from sqlalchemy import String, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import mapped_column, Mapped
from app.db.database import Base
from app.models.helpers import utcnow


class EducationEntry(Base):
    __tablename__ = "education_entries"

    id:             Mapped[int]           = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id:        Mapped[int]           = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
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
