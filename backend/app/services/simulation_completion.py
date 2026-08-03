"""
"Is this simulation finished?" — the single place that decides, and the
single place that reacts.

This logic used to live inline in routes/v1/enrollments.py::complete_task
only. But that endpoint is not the only way a task gets completed: every
`code_sandbox` task completes through routes/v1/sandbox.py::submit instead,
which calls award_task_completion directly. Simulations built entirely from
sandbox tasks (da-job-sim and frontend-dev-sim are both 5/5 code_sandbox)
therefore never had their enrollment marked COMPLETED and never had a
certificate issued — students would finish every task, see the client-side
"Simulation complete" screen from local state, and end up with an
IN_PROGRESS enrollment and an empty Certificates tab.

Both submission paths now call finalize_if_complete(), so a simulation
finishes the same way regardless of which task type happened to be last.
"""
import logging
from datetime import datetime, timezone

from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Enrollment, EnrollmentStatus, TaskCompletion, AgentMessage, MessageType
from app.models.cms import Simulation, SimulationStatus, SimulationTask
from app.services.certificates import issue_certificate_if_complete

logger = logging.getLogger(__name__)


async def finalize_if_complete(
    db: AsyncSession, *, user_id: str, enrollment_id: str, simulation_id: str, xp_awarded: int | None = None,
) -> dict:
    """Mark the enrollment COMPLETED, post the manager's wrap-up message, and
    issue the completion certificate — iff every task is now done.

    Idempotent: safe to call after every task completion, and safe to call
    again on an already-completed enrollment (the status update is a no-op
    and certificate issuance has its own uniqueness guarantee).

    Returns {} when not yet complete, otherwise {"certificate_number": ...}
    so callers can surface it in their response.
    """
    total_res = await db.execute(
        select(func.count()).select_from(SimulationTask).where(SimulationTask.simulation_id == simulation_id)
    )
    total_tasks = total_res.scalar() or 0
    if total_tasks == 0:
        return {}

    done_res = await db.execute(
        select(func.count()).select_from(TaskCompletion)
        .where(TaskCompletion.enrollment_id == enrollment_id, TaskCompletion.task_id >= 1)
    )
    if (done_res.scalar() or 0) < total_tasks:
        return {}

    enrollment = (await db.execute(
        select(Enrollment).where(Enrollment.id == enrollment_id)
    )).scalar_one_or_none()
    if not enrollment:
        return {}

    # Only announce/flip the first time this enrollment crosses the line.
    if enrollment.status != EnrollmentStatus.COMPLETED:
        await db.execute(
            update(Enrollment).where(Enrollment.id == enrollment_id).values(
                status=EnrollmentStatus.COMPLETED, completed_at=datetime.now(timezone.utc)
            )
        )
        sim = (await db.execute(
            select(Simulation).where(Simulation.id == simulation_id, Simulation.status == SimulationStatus.PUBLISHED)
        )).scalar_one_or_none()
        sim_title = sim.title if sim else simulation_id

        earned = f" and earned {xp_awarded} XP on your final task" if xp_awarded else ""
        db.add(AgentMessage(
            user_id=user_id, enrollment_id=enrollment_id, type=MessageType.REVIEW,
            content=(
                f"Congratulations! You completed the {sim_title}{earned}. "
                f"Your Skill GPS has been updated and your completion certificate is ready in your Portfolio."
            ),
        ))
        await db.commit()

    # Never fatal — a certificate failure must not roll back or 500 a task
    # the student legitimately completed.
    try:
        cert = await issue_certificate_if_complete(
            db, user_id=user_id, enrollment_id=enrollment_id, simulation_id=simulation_id
        )
        if cert:
            return {"certificate_number": cert.certificate_number}
    except Exception:
        logger.exception("certificate issuance failed for user=%s simulation=%s", user_id, simulation_id)

    return {}
