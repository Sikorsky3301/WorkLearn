"""Universities — org affiliation for students/teachers/university_admins."""
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Integer, ForeignKey
from sqlalchemy.orm import mapped_column, Mapped
from app.db.database import Base
from app.models.helpers import utcnow

DEFAULT_UNIVERSITY_CODE = "DEFAULT"


class University(Base):
    __tablename__ = "universities"

    id:         Mapped[int]      = mapped_column(Integer, primary_key=True, autoincrement=True)
    code:       Mapped[str]      = mapped_column(String, unique=True, nullable=False)
    name:       Mapped[str]      = mapped_column(String, nullable=False)
    logo_url:   Mapped[str | None] = mapped_column(String, nullable=True)
    is_default: Mapped[bool]     = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class UniversityDomain(Base):
    """Explicit hostname -> university mapping — checked before the
    subdomain-shape convention in app/services/tenant.py.

    The convention (`iitd.worklearn.ai` -> partner code "iitd") infers the
    tenant purely from how many dots a hostname has, which silently breaks
    the moment a university (including the default academy itself) is
    reachable at a hostname that doesn't fit that shape — e.g. the academy
    deployed at worklearn.upskillcampus.com, a 3-label host with no
    university actually named "worklearn", which the old heuristic read as
    an unknown partner subdomain and 404'd on. A row here makes the mapping
    an explicit fact instead of an inferred one, for either the default
    university or a real partner's own custom domain.
    """
    __tablename__ = "university_domains"

    id:             Mapped[int]      = mapped_column(Integer, primary_key=True, autoincrement=True)
    hostname:       Mapped[str]      = mapped_column(String, unique=True, nullable=False)
    university_id:  Mapped[int]      = mapped_column(Integer, ForeignKey("universities.id", ondelete="CASCADE"), nullable=False)
    created_at:     Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
