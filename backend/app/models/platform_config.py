"""Platform Configuration Center — values not yet wired into live llm/db."""
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Integer, UniqueConstraint
from sqlalchemy.orm import mapped_column, Mapped
from app.db.database import Base
from app.models.helpers import utcnow


class PlatformConfig(Base):
    __tablename__ = "platform_config"
    __table_args__ = (UniqueConstraint("category", "key", name="uq_config_category_key"),)

    id:          Mapped[int]           = mapped_column(Integer, primary_key=True, autoincrement=True)
    category:    Mapped[str]           = mapped_column(String, nullable=False)
    key:         Mapped[str]           = mapped_column(String, nullable=False)
    value:       Mapped[str | None]    = mapped_column(String, nullable=True)
    is_secret:   Mapped[bool]          = mapped_column(Boolean, default=False)
    updated_at:  Mapped[datetime]      = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    updated_by:  Mapped[int | None]    = mapped_column(Integer, nullable=True)
