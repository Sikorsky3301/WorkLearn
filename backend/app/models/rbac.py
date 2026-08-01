"""
RBAC for the ADMIN tier. SUPER_ADMIN is untouched by any of this — it stays a
separate `SuperAdminCredential` row (see app/models.py) and is always an
unconditional bypass in `require_permission` (see app/core/dependencies.py).

`AdminRole` is deliberately not named `Role` — that name is already the
4-value (soon 5) enum on `User.role`, imported directly as `SAEnum(Role)`.
`AdminRole` rows are the fine-grained, admin-creatable roles ("Support",
"Content Editor", ...) that an ADMIN user is assigned via `User.admin_role_id`.
"""
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import mapped_column, Mapped, relationship
from app.db.database import Base
from app.models import new_uuid, utcnow


class AdminRole(Base):
    __tablename__ = "admin_roles"

    id:          Mapped[str]           = mapped_column(String, primary_key=True, default=new_uuid)
    name:        Mapped[str]           = mapped_column(String, unique=True, nullable=False)
    description: Mapped[str | None]    = mapped_column(String, nullable=True)
    # Seeded roles (e.g. "Administrator") — not deletable/renamable from the UI.
    is_builtin:  Mapped[bool]          = mapped_column(Boolean, default=False)
    created_by:  Mapped[str | None]    = mapped_column(String, nullable=True)  # actor id, no FK (User or SuperAdminCredential)
    created_at:  Mapped[datetime]      = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at:  Mapped[datetime]      = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    permissions: Mapped[list["AdminRolePermission"]] = relationship(back_populates="role", cascade="all, delete-orphan")


class Permission(Base):
    __tablename__ = "permissions"

    # Natural key, e.g. "users.suspend" — a permission is added by a code
    # change (see app/services/permissions_seed.py), not a migration, matching
    # this project's no-Alembic, seed-on-startup posture for taxonomy data.
    key:         Mapped[str] = mapped_column(String, primary_key=True)
    category:    Mapped[str] = mapped_column(String, nullable=False)
    label:       Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False)


class AdminRolePermission(Base):
    __tablename__ = "admin_role_permissions"

    role_id:        Mapped[str] = mapped_column(String, ForeignKey("admin_roles.id", ondelete="CASCADE"), primary_key=True)
    permission_key: Mapped[str] = mapped_column(String, ForeignKey("permissions.key", ondelete="CASCADE"), primary_key=True)

    role: Mapped["AdminRole"] = relationship(back_populates="permissions")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id:          Mapped[str]           = mapped_column(String, primary_key=True, default=new_uuid)
    # No FK — actor is either a User (ADMIN) or SuperAdminCredential row, two
    # different tables, and the log must survive the actor being deleted later.
    actor_id:    Mapped[str | None]    = mapped_column(String, nullable=True)
    actor_role:  Mapped[str]           = mapped_column(String, nullable=False)  # "ADMIN" | "SUPER_ADMIN"
    actor_name:  Mapped[str]           = mapped_column(String, nullable=False)  # denormalized snapshot
    action:      Mapped[str]           = mapped_column(String, nullable=False, index=True)  # "admin.create", "user.suspend", ...
    target_type: Mapped[str | None]    = mapped_column(String, nullable=True)
    target_id:   Mapped[str | None]    = mapped_column(String, nullable=True)
    meta:        Mapped[dict | None]   = mapped_column(JSON, nullable=True)
    request_id:  Mapped[str | None]    = mapped_column(String, nullable=True)
    created_at:  Mapped[datetime]      = mapped_column(DateTime(timezone=True), default=utcnow, index=True)
