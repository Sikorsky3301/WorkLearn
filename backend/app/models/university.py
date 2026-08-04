"""Universities — org affiliation for students/teachers/university_admins."""
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Integer
from sqlalchemy.orm import mapped_column, Mapped
from app.db.database import Base
from app.models.helpers import utcnow

DEFAULT_UNIVERSITY_CODE = "DEFAULT"


class University(Base):
    __tablename__ = "universities"

    id:         Mapped[int]      = mapped_column(Integer, primary_key=True, autoincrement=True)
    code:       Mapped[str]      = mapped_column(String, unique=True, nullable=False)
    name:       Mapped[str]      = mapped_column(String, nullable=False)
    is_default: Mapped[bool]     = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
