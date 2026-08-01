"""
Platform Configuration Center — SuperAdmin-only settings store for AI
provider, billing provider, and database config. Values are real and
persisted; they are NOT yet wired into live app behavior (llm.py still reads
`.env`-backed `settings`, no billing provider is integrated, the DB
connection is still set once at startup) — this is the config *surface*,
with the actual runtime wiring explicitly deferred as a follow-up.
"""
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, UniqueConstraint
from sqlalchemy.orm import mapped_column, Mapped
from app.db.database import Base
from app.models import new_uuid, utcnow


class PlatformConfig(Base):
    __tablename__ = "platform_config"
    __table_args__ = (UniqueConstraint("category", "key", name="uq_config_category_key"),)

    id:          Mapped[str]           = mapped_column(String, primary_key=True, default=new_uuid)
    category:    Mapped[str]           = mapped_column(String, nullable=False)  # "ai" | "billing" | "database"
    key:         Mapped[str]           = mapped_column(String, nullable=False)
    value:       Mapped[str | None]    = mapped_column(String, nullable=True)
    is_secret:   Mapped[bool]          = mapped_column(Boolean, default=False)
    updated_at:  Mapped[datetime]      = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    updated_by:  Mapped[str | None]    = mapped_column(String, nullable=True)
