"""
Real, DB-backed feature flags — replaces the frontend's previously-hardcoded
ROLE_FEATURES map in AuthContext.jsx. `FeatureFlag.enabled_default` is the
fallback when nothing more specific applies; `FeatureFlagOverride` rows layer
on top at increasing specificity (role < university < user — see
app/services/feature_flags.py::resolve_feature_flags).
"""
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import mapped_column, Mapped
from app.database import Base
from app.models import new_uuid, utcnow


class FeatureFlag(Base):
    __tablename__ = "feature_flags"

    key:             Mapped[str]      = mapped_column(String, primary_key=True)
    label:           Mapped[str]      = mapped_column(String, nullable=False)
    description:     Mapped[str]      = mapped_column(String, nullable=False)
    category:        Mapped[str]      = mapped_column(String, nullable=False, default="Core")
    is_beta:         Mapped[bool]     = mapped_column(Boolean, default=False)
    # Fallback used when no role/university/user override applies to a given
    # request — deliberately conservative (False) for anything not seeded by
    # services/feature_flags.py::seed_feature_flags.
    enabled_default: Mapped[bool]     = mapped_column(Boolean, default=False)
    created_at:      Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at:      Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class FeatureFlagOverride(Base):
    __tablename__ = "feature_flag_overrides"
    __table_args__ = (UniqueConstraint("flag_key", "scope_type", "scope_value", name="uq_flag_scope"),)

    id:          Mapped[str]      = mapped_column(String, primary_key=True, default=new_uuid)
    flag_key:    Mapped[str]      = mapped_column(String, ForeignKey("feature_flags.key", ondelete="CASCADE"), nullable=False)
    # "role" (scope_value = Role enum value, e.g. "UNIVERSITY_STUDENT") |
    # "university" (scope_value = User.institution_code) |
    # "user" (scope_value = User.id) — resolved most-specific-wins.
    scope_type:  Mapped[str]      = mapped_column(String, nullable=False)
    scope_value: Mapped[str]      = mapped_column(String, nullable=False)
    enabled:     Mapped[bool]     = mapped_column(Boolean, nullable=False)
    created_at:  Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
