from datetime import datetime
from sqlalchemy import String, Integer, Boolean, DateTime, ForeignKey, JSON, Enum as SAEnum
from sqlalchemy.orm import mapped_column, Mapped, relationship
from app.db.database import Base
from app.models.helpers import utcnow
import enum


class EnrollmentStatus(str, enum.Enum):
    ENROLLED = "ENROLLED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"


class MessageType(str, enum.Enum):
    STANDUP = "STANDUP"
    REMINDER = "REMINDER"
    REVIEW = "REVIEW"
    NUDGE = "NUDGE"


class User(Base):
    __tablename__ = "users"

    id:              Mapped[int]           = mapped_column(Integer, primary_key=True, autoincrement=True)
    email:           Mapped[str | None]    = mapped_column(String, unique=True, nullable=True)
    roll_no:         Mapped[str | None]    = mapped_column(String, unique=True, nullable=True)
    password_hash:   Mapped[str]           = mapped_column(String, nullable=False)
    name:            Mapped[str]           = mapped_column(String, nullable=False)
    role_id:         Mapped[int]           = mapped_column(Integer, ForeignKey("roles.id"), nullable=False)
    university_id:   Mapped[int | None]    = mapped_column(Integer, ForeignKey("universities.id"), nullable=True)
    is_active:       Mapped[bool]          = mapped_column(Boolean, default=True)
    suspended_at:    Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    department:      Mapped[str | None]    = mapped_column(String, nullable=True)
    section:         Mapped[str | None]    = mapped_column(String, nullable=True)
    year:            Mapped[str | None]    = mapped_column(String, nullable=True)
    avatar:          Mapped[str | None]    = mapped_column(String, nullable=True)
    xp:              Mapped[int]           = mapped_column(Integer, default=0)
    target_role:     Mapped[str]           = mapped_column(String, default="junior_da")
    last_seen_at:    Mapped[datetime]      = mapped_column(DateTime(timezone=True), default=utcnow)
    created_at:      Mapped[datetime]      = mapped_column(DateTime(timezone=True), default=utcnow)

    onboarding_completed: Mapped[bool]        = mapped_column(Boolean, default=False)
    preferred_domain:     Mapped[str | None]  = mapped_column(String, nullable=True)

    headline:          Mapped[str | None] = mapped_column(String, nullable=True)
    bio:               Mapped[str | None] = mapped_column(String, nullable=True)
    phone:             Mapped[str | None] = mapped_column(String, nullable=True)
    location:          Mapped[str | None] = mapped_column(String, nullable=True)
    linkedin_url:      Mapped[str | None] = mapped_column(String, nullable=True)
    github_url:        Mapped[str | None] = mapped_column(String, nullable=True)
    website_url:       Mapped[str | None] = mapped_column(String, nullable=True)
    photo_url:         Mapped[str | None] = mapped_column(String, nullable=True)
    resume_url:        Mapped[str | None] = mapped_column(String, nullable=True)
    resume_filename:   Mapped[str | None] = mapped_column(String, nullable=True)
    resume_uploaded_at:Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    role_row:          Mapped["Role"] = relationship("Role", lazy="joined")
    university:        Mapped["University | None"] = relationship("University", lazy="joined")

    enrollments:       Mapped[list["Enrollment"]]      = relationship(back_populates="user", cascade="all, delete")
    skills:            Mapped[list["UserSkill"]]        = relationship(back_populates="user", cascade="all, delete")
    xp_ledger:         Mapped[list["XpLedger"]]         = relationship(back_populates="user", cascade="all, delete")
    agent_messages:    Mapped[list["AgentMessage"]]     = relationship(back_populates="user", cascade="all, delete")
    task_completions:  Mapped[list["TaskCompletion"]]   = relationship(back_populates="user", cascade="all, delete")
    unlocked_features: Mapped[list["UnlockedFeature"]]  = relationship(back_populates="user", cascade="all, delete")
    badges:            Mapped[list["UserBadge"]]        = relationship(back_populates="user", cascade="all, delete")

    @property
    def role(self) -> str:
        """Role slug string — matches JWT `role` claim and frontend ROLES."""
        if self.role_row is not None:
            return self.role_row.slug
        return ""


class Enrollment(Base):
    __tablename__ = "enrollments"

    id:               Mapped[int]              = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id:          Mapped[int]              = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    simulation_id:    Mapped[int]              = mapped_column(Integer, ForeignKey("simulations.id"), nullable=False)
    status:           Mapped[EnrollmentStatus] = mapped_column(SAEnum(EnrollmentStatus), default=EnrollmentStatus.ENROLLED)
    current_task_idx: Mapped[int]              = mapped_column(Integer, default=0)
    enrolled_at:      Mapped[datetime]         = mapped_column(DateTime(timezone=True), default=utcnow)
    completed_at:     Mapped[datetime | None]  = mapped_column(DateTime(timezone=True), nullable=True)

    user:            Mapped["User"]               = relationship(back_populates="enrollments")
    task_completions:Mapped[list["TaskCompletion"]] = relationship(back_populates="enrollment", cascade="all, delete")
    agent_messages:  Mapped[list["AgentMessage"]]   = relationship(back_populates="enrollment")


class TaskCompletion(Base):
    __tablename__ = "task_completions"

    id:            Mapped[int]          = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id:       Mapped[int]          = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    enrollment_id: Mapped[int]          = mapped_column(Integer, ForeignKey("enrollments.id", ondelete="CASCADE"))
    task_id:       Mapped[int]          = mapped_column(Integer, nullable=False)
    score:         Mapped[int | None]   = mapped_column(Integer, nullable=True)
    quiz_score:    Mapped[int | None]   = mapped_column(Integer, nullable=True)
    rubric_rating: Mapped[dict | None]  = mapped_column(JSON, nullable=True)
    completed_at:  Mapped[datetime]     = mapped_column(DateTime(timezone=True), default=utcnow)

    user:       Mapped["User"]       = relationship(back_populates="task_completions")
    enrollment: Mapped["Enrollment"] = relationship(back_populates="task_completions")


class UserSkill(Base):
    __tablename__ = "user_skills"

    id:            Mapped[int]      = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id:       Mapped[int]      = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    skill_key:     Mapped[str]      = mapped_column(String, nullable=False)
    current_score: Mapped[int]      = mapped_column(Integer, default=0)
    last_updated:  Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    user: Mapped["User"] = relationship(back_populates="skills")


class XpLedger(Base):
    __tablename__ = "xp_ledger"

    id:         Mapped[int]      = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id:    Mapped[int]      = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    amount:     Mapped[int]      = mapped_column(Integer, nullable=False)
    source:     Mapped[str]      = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    user: Mapped["User"] = relationship(back_populates="xp_ledger")


class AgentMessage(Base):
    __tablename__ = "agent_messages"

    id:            Mapped[int]          = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id:       Mapped[int]          = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    enrollment_id: Mapped[int | None]   = mapped_column(Integer, ForeignKey("enrollments.id", ondelete="SET NULL"), nullable=True)
    type:          Mapped[MessageType]  = mapped_column(SAEnum(MessageType), nullable=False)
    content:       Mapped[str]          = mapped_column(String, nullable=False)
    read:          Mapped[bool]         = mapped_column(Boolean, default=False)
    created_at:    Mapped[datetime]     = mapped_column(DateTime(timezone=True), default=utcnow)

    user:       Mapped["User"]            = relationship(back_populates="agent_messages")
    enrollment: Mapped["Enrollment|None"] = relationship(back_populates="agent_messages")


class UnlockedFeature(Base):
    __tablename__ = "unlocked_features"

    id:         Mapped[int]      = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id:    Mapped[int]      = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    feature:    Mapped[str]      = mapped_column(String, nullable=False)
    granted_by: Mapped[int | None] = mapped_column(Integer, nullable=True)  # users.id of granter
    granted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    user: Mapped["User"] = relationship(back_populates="unlocked_features")


class UserBadge(Base):
    __tablename__ = "user_badges"

    id:            Mapped[int]           = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id:       Mapped[int]           = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    badge_key:     Mapped[str]           = mapped_column(String, nullable=False)
    label:         Mapped[str]           = mapped_column(String, nullable=False)
    icon:          Mapped[str]           = mapped_column(String, nullable=False)
    simulation_id: Mapped[int | None]    = mapped_column(Integer, ForeignKey("simulations.id"), nullable=True)
    granted_at:    Mapped[datetime]      = mapped_column(DateTime(timezone=True), default=utcnow)

    user: Mapped["User"] = relationship(back_populates="badges")


class MentorChatMessage(Base):
    __tablename__ = "mentor_chat_messages"

    id:         Mapped[int]      = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id:    Mapped[int]      = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role:       Mapped[str]      = mapped_column(String, nullable=False)
    content:    Mapped[str]      = mapped_column(String, nullable=False)
    trace_id:   Mapped[str | None] = mapped_column(String, nullable=True)
    feedback:   Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


# Late imports for relationship type hints
from app.models.roles import Role  # noqa: E402
from app.models.university import University  # noqa: E402
