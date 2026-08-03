"""Pydantic request/response models for the ADMIN-tier RBAC surface
(app/api/v1/superadmin/admin_management.py) — admin lifecycle, roles, and permissions."""
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


# ── Permissions ──────────────────────────────────────────────────────────────

class PermissionOut(BaseModel):
    key: str
    category: str
    label: str
    description: str


# ── Roles ────────────────────────────────────────────────────────────────────

class AdminRoleCreate(BaseModel):
    name: str
    description: str | None = None
    permission_keys: list[str] = Field(default_factory=list)


class AdminRoleUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    permission_keys: list[str] | None = None  # None = leave unchanged, [] = clear all


class AdminRoleOut(BaseModel):
    id: str
    name: str
    description: str | None
    is_builtin: bool
    permission_keys: list[str]
    admin_count: int
    created_at: datetime
    updated_at: datetime


# ── Admins ───────────────────────────────────────────────────────────────────

class AdminCreate(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)
    admin_role_id: str


class AdminUpdate(BaseModel):
    name: str | None = None
    admin_role_id: str | None = None


class AdminResetPassword(BaseModel):
    password: str = Field(min_length=6)


class AdminOut(BaseModel):
    id: str
    name: str
    email: str | None
    is_active: bool
    suspended_at: datetime | None
    admin_role_id: str | None
    admin_role_name: str | None
    created_at: datetime
    last_seen_at: datetime | None


# ── Audit log ────────────────────────────────────────────────────────────────

class AuditLogOut(BaseModel):
    id: str
    actor_id: str | None
    actor_role: str
    actor_name: str
    action: str
    target_type: str | None
    target_id: str | None
    meta: dict | None
    created_at: datetime
