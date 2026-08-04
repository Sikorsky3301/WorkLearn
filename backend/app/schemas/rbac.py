"""Pydantic models for admin lifecycle + platform roles + audit log."""
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


# ── Permissions (catalog removed — endpoint returns empty) ───────────────────

class PermissionOut(BaseModel):
    key: str
    category: str
    label: str
    description: str


# ── Platform roles (roles table — list only) ─────────────────────────────────

class AdminRoleOut(BaseModel):
    id: int
    slug: str
    name: str
    description: str | None
    is_builtin: bool
    permission_keys: list[str] = Field(default_factory=list)
    admin_count: int = 0
    created_at: datetime | None = None


# ── Admins ───────────────────────────────────────────────────────────────────

class AdminCreate(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)


class AdminUpdate(BaseModel):
    name: str | None = None


class AdminResetPassword(BaseModel):
    password: str = Field(min_length=6)


class AdminOut(BaseModel):
    id: int
    name: str
    email: str | None
    is_active: bool
    suspended_at: datetime | None
    role: str
    role_id: int
    created_at: datetime
    last_seen_at: datetime | None


# ── Audit log ────────────────────────────────────────────────────────────────

class AuditLogOut(BaseModel):
    id: int
    actor_id: int | None
    actor_role: str
    actor_name: str
    action: str
    target_type: str | None
    target_id: str | None
    meta: dict | None
    created_at: datetime
