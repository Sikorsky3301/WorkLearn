"""Pydantic request/response models for the real feature-flag system
(app/api/v1/superadmin/feature_flags.py)."""
from datetime import datetime
from pydantic import BaseModel, Field


class FeatureFlagOverrideOut(BaseModel):
    id: str
    flag_key: str
    scope_type: str
    scope_value: str
    enabled: bool
    created_at: datetime


class FeatureFlagCreate(BaseModel):
    key: str
    label: str
    description: str = ""
    category: str = "Core"
    is_beta: bool = False
    enabled_default: bool = False


class FeatureFlagUpdate(BaseModel):
    label: str | None = None
    description: str | None = None
    category: str | None = None
    is_beta: bool | None = None
    enabled_default: bool | None = None


class FeatureFlagOut(BaseModel):
    key: str
    label: str
    description: str
    category: str
    is_beta: bool
    enabled_default: bool
    override_count: int
    created_at: datetime
    updated_at: datetime


class SetOverrideBody(BaseModel):
    scope_type: str = Field(pattern="^(role|university|user)$")
    scope_value: str
    enabled: bool
