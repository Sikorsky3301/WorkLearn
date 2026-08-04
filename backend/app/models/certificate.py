"""Completion certificates — issued when a student finishes a simulation."""
from datetime import datetime

from sqlalchemy import String, DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import mapped_column, Mapped

from app.db.database import Base
from app.models.helpers import utcnow


class Certificate(Base):
    __tablename__ = "certificates"
    __table_args__ = (UniqueConstraint("user_id", "simulation_id", name="uq_certificate_user_simulation"),)

    id:              Mapped[int]      = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id:         Mapped[int]      = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    simulation_id:   Mapped[int]      = mapped_column(Integer, ForeignKey("simulations.id"), nullable=False)
    simulation_title:Mapped[str]      = mapped_column(String, nullable=False)
    company:         Mapped[str]      = mapped_column(String, nullable=False, default="")
    recipient_name:  Mapped[str]      = mapped_column(String, nullable=False)
    certificate_number: Mapped[str]   = mapped_column(String, unique=True, nullable=False, index=True)
    tasks_completed: Mapped[int]      = mapped_column(Integer, nullable=False, default=0)
    total_tasks:     Mapped[int]      = mapped_column(Integer, nullable=False, default=0)
    average_score:   Mapped[int | None] = mapped_column(Integer, nullable=True)
    issued_at:       Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
