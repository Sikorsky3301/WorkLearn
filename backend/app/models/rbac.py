"""Audit log only — AdminRole / Permission tables removed (role slug access instead)."""
from datetime import datetime
from sqlalchemy import String, DateTime, Integer, JSON
from sqlalchemy.orm import mapped_column, Mapped
from app.db.database import Base
from app.models.helpers import utcnow


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id:          Mapped[int]           = mapped_column(Integer, primary_key=True, autoincrement=True)
    actor_id:    Mapped[int | None]    = mapped_column(Integer, nullable=True)
    actor_role:  Mapped[str]           = mapped_column(String, nullable=False)
    actor_name:  Mapped[str]           = mapped_column(String, nullable=False)
    action:      Mapped[str]           = mapped_column(String, nullable=False, index=True)
    target_type: Mapped[str | None]    = mapped_column(String, nullable=True)
    target_id:   Mapped[str | None]    = mapped_column(String, nullable=True)
    meta:        Mapped[dict | None]   = mapped_column(JSON, nullable=True)
    request_id:  Mapped[str | None]    = mapped_column(String, nullable=True)
    created_at:  Mapped[datetime]      = mapped_column(DateTime(timezone=True), default=utcnow, index=True)
