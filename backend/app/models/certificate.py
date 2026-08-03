"""
Completion certificates — issued once, automatically, when a student
finishes every task in a job simulation (see app/services/certificates.py).

Distinct from UserBadge (app/models/__init__.py): a badge marks a milestone
*within* the journey (accepting the offer letter), is decorative, and has no
external identity. A certificate is the terminal credential — it carries a
unique, human-quotable `certificate_number` a recruiter could be given to
verify the claim, so it needs its own row and its own uniqueness guarantee
rather than being another badge_key.
"""
from datetime import datetime

from sqlalchemy import String, DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import mapped_column, Mapped

from app.db.database import Base
from app.models import utcnow, new_uuid


class Certificate(Base):
    __tablename__ = "certificates"
    # One certificate per (student, simulation) — re-running the issuance
    # path for an already-certified simulation must never mint a second
    # number for the same achievement.
    __table_args__ = (UniqueConstraint("user_id", "simulation_id", name="uq_certificate_user_simulation"),)

    id:              Mapped[str]      = mapped_column(String, primary_key=True, default=new_uuid)
    user_id:         Mapped[str]      = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    simulation_id:   Mapped[str]      = mapped_column(String, nullable=False)
    # Denormalised at issue time on purpose: a certificate is a historical
    # record. If an admin later renames the simulation or the student changes
    # their display name, the already-issued certificate must still read the
    # way it did when it was earned.
    simulation_title:Mapped[str]      = mapped_column(String, nullable=False)
    company:         Mapped[str]      = mapped_column(String, nullable=False, default="")
    recipient_name:  Mapped[str]      = mapped_column(String, nullable=False)
    # Human-quotable, globally unique — see build_certificate_number().
    certificate_number: Mapped[str]   = mapped_column(String, unique=True, nullable=False, index=True)
    # Snapshot of performance at completion, for the certificate face.
    tasks_completed: Mapped[int]      = mapped_column(Integer, nullable=False, default=0)
    total_tasks:     Mapped[int]      = mapped_column(Integer, nullable=False, default=0)
    # Null when the simulation's tasks were all ungraded (no numeric score).
    average_score:   Mapped[int | None] = mapped_column(Integer, nullable=True)
    issued_at:       Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
