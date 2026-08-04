"""DB-backed feature flags."""
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import mapped_column, Mapped
from app.db.database import Base
from app.models.helpers import utcnow


class FeatureFlag(Base):
    __tablename__ = "feature_flags"

    key:             Mapped[str]      = mapped_column(String, primary_key=True)
    label:           Mapped[str]      = mapped_column(String, nullable=False)
    description:     Mapped[str]      = mapped_column(String, nullable=False)
    category:        Mapped[str]      = mapped_column(String, nullable=False, default="Core")
    is_beta:         Mapped[bool]     = mapped_column(Boolean, default=False)
    enabled_default: Mapped[bool]     = mapped_column(Boolean, default=False)
    created_at:      Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at:      Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class FeatureFlagOverride(Base):
    __tablename__ = "feature_flag_overrides"
    __table_args__ = (UniqueConstraint("flag_key", "scope_type", "scope_value", name="uq_flag_scope"),)

    id:          Mapped[int]      = mapped_column(Integer, primary_key=True, autoincrement=True)
    flag_key:    Mapped[str]      = mapped_column(String, ForeignKey("feature_flags.key", ondelete="CASCADE"), nullable=False)
    # "role" (scope_value = role slug) | "university" (scope_value = universities.code) | "user" (scope_value = str(user.id))
    scope_type:  Mapped[str]      = mapped_column(String, nullable=False)
    scope_value: Mapped[str]      = mapped_column(String, nullable=False)
    enabled:     Mapped[bool]     = mapped_column(Boolean, nullable=False)
    created_at:  Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
