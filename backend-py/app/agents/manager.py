"""
Manager — deterministic (non-AI) scheduler that reminds students of pending
tasks and checks whether deadlines have passed. Uses fixed message templates,
NOT the LLM. (The AI Mentor is the AI-based system; the Manager is not.)

Starts automatically when the FastAPI app starts.
"""
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select
from datetime import datetime, timedelta, timezone
from app.database import AsyncSessionLocal
from app.models import User, Enrollment, TaskCompletion, AgentMessage, EnrollmentStatus, MessageType
from app.config import TASK_NAMES, INACTIVITY_DAYS

scheduler = AsyncIOScheduler(timezone="UTC")

# Days after enrollment a student is expected to have completed the simulation.
SIMULATION_DEADLINE_DAYS = 14

def start_scheduler():
    scheduler.add_job(_daily_reminder,    "cron", hour=8,  minute=0, id="daily_reminder")
    scheduler.add_job(_deadline_check,     "cron", hour="*/6",        id="deadline_check")
    scheduler.add_job(_inactivity_nudge,  "cron", hour=10, minute=0, id="inactivity_nudge")
    scheduler.start()

async def _save_message(user_id: str, enrollment_id: str, msg_type: MessageType, content: str):
    async with AsyncSessionLocal() as db:
        db.add(AgentMessage(user_id=user_id, enrollment_id=enrollment_id, type=msg_type, content=content))
        await db.commit()

async def _completed_count(enrollment_id: str) -> int:
    async with AsyncSessionLocal() as db:
        rows = await db.execute(
            select(TaskCompletion).where(TaskCompletion.enrollment_id == enrollment_id, TaskCompletion.task_id >= 1)
        )
        return len(rows.scalars().all())

async def _active_enrollments():
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Enrollment, User).join(User).where(
                Enrollment.status.in_([EnrollmentStatus.ENROLLED, EnrollmentStatus.IN_PROGRESS])
            )
        )
        return result.all()

# ── Daily task reminder ───────────────────────────────────────────────────────
async def _daily_reminder():
    for enrollment, user in await _active_enrollments():
        done = await _completed_count(enrollment.id)
        next_task = TASK_NAMES.get(done + 1, "your final review")
        content = (
            f"Reminder: your next task is \"{next_task}\". "
            f"You've completed {done}/5 tasks so far — keep the momentum going."
        )
        await _save_message(user.id, enrollment.id, MessageType.REMINDER, content)

# ── Deadline check ────────────────────────────────────────────────────────────
async def _deadline_check():
    now = datetime.now(timezone.utc)
    for enrollment, user in await _active_enrollments():
        done = await _completed_count(enrollment.id)
        next_task = TASK_NAMES.get(done + 1, "your final review")
        deadline = enrollment.enrolled_at + timedelta(days=SIMULATION_DEADLINE_DAYS)
        days_left = (deadline - now).days

        if now > deadline:
            content = (
                f"Deadline passed: the simulation was due on {deadline.date().isoformat()} "
                f"and \"{next_task}\" is still pending. Please complete it as soon as you can."
            )
        elif days_left <= 2:
            content = (
                f"Deadline approaching: {days_left} day(s) left to finish the simulation "
                f"(due {deadline.date().isoformat()}). Next up: \"{next_task}\"."
            )
        else:
            continue  # not near the deadline — no message
        await _save_message(user.id, enrollment.id, MessageType.REMINDER, content)

# ── Inactivity nudge ──────────────────────────────────────────────────────────
async def _inactivity_nudge():
    threshold = datetime.now(timezone.utc) - timedelta(days=INACTIVITY_DAYS)
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Enrollment, User).join(User).where(
                Enrollment.status.in_([EnrollmentStatus.ENROLLED, EnrollmentStatus.IN_PROGRESS]),
                User.last_seen_at < threshold,
            )
        )
        rows = result.all()
    for enrollment, user in rows:
        done = await _completed_count(enrollment.id)
        next_task = TASK_NAMES.get(done + 1, "your simulation")
        content = (
            f"You haven't logged in for {INACTIVITY_DAYS}+ days and \"{next_task}\" is still waiting. "
            f"Even 15 minutes today will move you forward."
        )
        await _save_message(user.id, enrollment.id, MessageType.NUDGE, content)
