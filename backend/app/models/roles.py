"""Platform roles — fixed persona slugs. No role_permissions; access is by slug in code."""
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Integer
from sqlalchemy.orm import mapped_column, Mapped
from app.db.database import Base
from app.models.helpers import utcnow


class RoleSlug:
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    UNIVERSITY_ADMIN = "university_admin"
    TEACHER = "teacher"
    STUDENT = "student"

    ALL = (SUPER_ADMIN, ADMIN, UNIVERSITY_ADMIN, TEACHER, STUDENT)


# Stable seed ids (match schema_recreate.sql / roles_seed)
ROLE_IDS = {
    RoleSlug.SUPER_ADMIN: 1,
    RoleSlug.ADMIN: 2,
    RoleSlug.UNIVERSITY_ADMIN: 3,
    RoleSlug.TEACHER: 4,
    RoleSlug.STUDENT: 5,
}


class Role(Base):
    __tablename__ = "roles"

    id:          Mapped[int]           = mapped_column(Integer, primary_key=True, autoincrement=True)
    slug:        Mapped[str]           = mapped_column(String, unique=True, nullable=False)
    name:        Mapped[str]           = mapped_column(String, nullable=False)
    description: Mapped[str | None]    = mapped_column(String, nullable=True)
    is_builtin:  Mapped[bool]          = mapped_column(Boolean, default=True)
    created_at:  Mapped[datetime]      = mapped_column(DateTime(timezone=True), default=utcnow)
