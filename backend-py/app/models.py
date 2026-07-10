import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Boolean, DateTime, ForeignKey, JSON, Enum as SAEnum
from sqlalchemy.orm import mapped_column, Mapped, relationship
from app.database import Base
import enum

def utcnow():
    return datetime.now(timezone.utc)

def new_uuid():
    return str(uuid.uuid4())

class Role(str, enum.Enum):
    DIRECT_USER = "DIRECT_USER"
    UNIVERSITY_STUDENT = "UNIVERSITY_STUDENT"
    CLASS_MENTOR = "CLASS_MENTOR"
    SUPER_ADMIN = "SUPER_ADMIN"

class EnrollmentStatus(str, enum.Enum):
    ENROLLED = "ENROLLED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    DROPPED = "DROPPED"

class MessageType(str, enum.Enum):
    STANDUP = "STANDUP"
    REMINDER = "REMINDER"
    REVIEW = "REVIEW"
    NUDGE = "NUDGE"

class User(Base):
    __tablename__ = "users"

    id:              Mapped[str]           = mapped_column(String, primary_key=True, default=new_uuid)
    email:           Mapped[str | None]    = mapped_column(String, unique=True, nullable=True)
    roll_no:         Mapped[str | None]    = mapped_column(String, unique=True, nullable=True)
    password_hash:   Mapped[str]           = mapped_column(String, nullable=False)
    name:            Mapped[str]           = mapped_column(String, nullable=False)
    role:            Mapped[Role]          = mapped_column(SAEnum(Role), default=Role.DIRECT_USER)
    institution:     Mapped[str | None]    = mapped_column(String, nullable=True)
    department:      Mapped[str | None]    = mapped_column(String, nullable=True)
    section:         Mapped[str | None]    = mapped_column(String, nullable=True)
    year:            Mapped[str | None]    = mapped_column(String, nullable=True)
    institution_code:Mapped[str | None]    = mapped_column(String, nullable=True)
    avatar:          Mapped[str | None]    = mapped_column(String, nullable=True)
    xp:              Mapped[int]           = mapped_column(Integer, default=0)
    target_role:     Mapped[str]           = mapped_column(String, default="junior_da")
    last_seen_at:    Mapped[datetime]      = mapped_column(DateTime(timezone=True), default=utcnow)
    created_at:      Mapped[datetime]      = mapped_column(DateTime(timezone=True), default=utcnow)

    enrollments:       Mapped[list["Enrollment"]]      = relationship(back_populates="user", cascade="all, delete")
    skills:            Mapped[list["UserSkill"]]        = relationship(back_populates="user", cascade="all, delete")
    xp_ledger:         Mapped[list["XpLedger"]]         = relationship(back_populates="user", cascade="all, delete")
    agent_messages:    Mapped[list["AgentMessage"]]     = relationship(back_populates="user", cascade="all, delete")
    task_completions:  Mapped[list["TaskCompletion"]]   = relationship(back_populates="user", cascade="all, delete")
    unlocked_features: Mapped[list["UnlockedFeature"]]  = relationship(back_populates="user", cascade="all, delete")
    badges:            Mapped[list["UserBadge"]]        = relationship(back_populates="user", cascade="all, delete")

class Enrollment(Base):
    __tablename__ = "enrollments"

    id:               Mapped[str]              = mapped_column(String, primary_key=True, default=new_uuid)
    user_id:          Mapped[str]              = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"))
    simulation_id:    Mapped[str]              = mapped_column(String, nullable=False)
    status:           Mapped[EnrollmentStatus] = mapped_column(SAEnum(EnrollmentStatus), default=EnrollmentStatus.ENROLLED)
    current_task_idx: Mapped[int]              = mapped_column(Integer, default=0)
    enrolled_at:      Mapped[datetime]         = mapped_column(DateTime(timezone=True), default=utcnow)
    completed_at:     Mapped[datetime | None]  = mapped_column(DateTime(timezone=True), nullable=True)

    user:            Mapped["User"]               = relationship(back_populates="enrollments")
    task_completions:Mapped[list["TaskCompletion"]] = relationship(back_populates="enrollment", cascade="all, delete")
    agent_messages:  Mapped[list["AgentMessage"]]   = relationship(back_populates="enrollment")

class TaskCompletion(Base):
    __tablename__ = "task_completions"

    id:            Mapped[str]          = mapped_column(String, primary_key=True, default=new_uuid)
    user_id:       Mapped[str]          = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"))
    enrollment_id: Mapped[str]          = mapped_column(String, ForeignKey("enrollments.id", ondelete="CASCADE"))
    task_id:       Mapped[int]          = mapped_column(Integer, nullable=False)
    score:         Mapped[int | None]   = mapped_column(Integer, nullable=True)
    quiz_score:    Mapped[int | None]   = mapped_column(Integer, nullable=True)
    rubric_rating: Mapped[dict | None]  = mapped_column(JSON, nullable=True)
    completed_at:  Mapped[datetime]     = mapped_column(DateTime(timezone=True), default=utcnow)

    user:       Mapped["User"]       = relationship(back_populates="task_completions")
    enrollment: Mapped["Enrollment"] = relationship(back_populates="task_completions")

class UserSkill(Base):
    __tablename__ = "user_skills"

    id:            Mapped[str]      = mapped_column(String, primary_key=True, default=new_uuid)
    user_id:       Mapped[str]      = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"))
    skill_key:     Mapped[str]      = mapped_column(String, nullable=False)
    current_score: Mapped[int]      = mapped_column(Integer, default=0)
    last_updated:  Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    user: Mapped["User"] = relationship(back_populates="skills")

class XpLedger(Base):
    __tablename__ = "xp_ledger"

    id:         Mapped[str]      = mapped_column(String, primary_key=True, default=new_uuid)
    user_id:    Mapped[str]      = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"))
    amount:     Mapped[int]      = mapped_column(Integer, nullable=False)
    source:     Mapped[str]      = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    user: Mapped["User"] = relationship(back_populates="xp_ledger")

class AgentMessage(Base):
    __tablename__ = "agent_messages"

    id:            Mapped[str]          = mapped_column(String, primary_key=True, default=new_uuid)
    user_id:       Mapped[str]          = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"))
    enrollment_id: Mapped[str | None]   = mapped_column(String, ForeignKey("enrollments.id", ondelete="SET NULL"), nullable=True)
    type:          Mapped[MessageType]  = mapped_column(SAEnum(MessageType), nullable=False)
    content:       Mapped[str]          = mapped_column(String, nullable=False)
    read:          Mapped[bool]         = mapped_column(Boolean, default=False)
    created_at:    Mapped[datetime]     = mapped_column(DateTime(timezone=True), default=utcnow)

    user:       Mapped["User"]            = relationship(back_populates="agent_messages")
    enrollment: Mapped["Enrollment|None"] = relationship(back_populates="agent_messages")

class UnlockedFeature(Base):
    __tablename__ = "unlocked_features"

    id:         Mapped[str]      = mapped_column(String, primary_key=True, default=new_uuid)
    user_id:    Mapped[str]      = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"))
    feature:    Mapped[str]      = mapped_column(String, nullable=False)
    granted_by: Mapped[str]      = mapped_column(String, nullable=False)
    granted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    user: Mapped["User"] = relationship(back_populates="unlocked_features")

class UserBadge(Base):
    __tablename__ = "user_badges"

    id:            Mapped[str]           = mapped_column(String, primary_key=True, default=new_uuid)
    user_id:       Mapped[str]           = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    badge_key:     Mapped[str]           = mapped_column(String, nullable=False)
    label:         Mapped[str]           = mapped_column(String, nullable=False)
    icon:          Mapped[str]           = mapped_column(String, nullable=False)
    simulation_id: Mapped[str | None]    = mapped_column(String, nullable=True)
    granted_at:    Mapped[datetime]      = mapped_column(DateTime(timezone=True), default=utcnow)

    user: Mapped["User"] = relationship(back_populates="badges")

class MentorChatMessage(Base):
    __tablename__ = "mentor_chat_messages"

    id:         Mapped[str]      = mapped_column(String, primary_key=True, default=new_uuid)
    user_id:    Mapped[str]      = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role:       Mapped[str]      = mapped_column(String, nullable=False)  # "user" | "assistant"
    content:    Mapped[str]      = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

class SuperAdminCredential(Base):
    __tablename__ = "super_admin_credentials"

    id:            Mapped[str]      = mapped_column(String, primary_key=True, default=new_uuid)
    email:         Mapped[str]      = mapped_column(String, unique=True, nullable=False)
    name:          Mapped[str]      = mapped_column(String, nullable=False)
    password_hash: Mapped[str]      = mapped_column(String, nullable=False)
    created_at:    Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    last_seen_at:  Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
