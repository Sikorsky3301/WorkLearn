"""
Certificate issuance — the one place a Certificate row is ever created.

Issuance is idempotent and driven by a single trigger: every task in a
simulation is complete. `issue_certificate_if_complete` is safe to call on
any task completion; it no-ops unless the simulation is actually finished
and no certificate exists yet.
"""
import logging
import uuid

from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User, TaskCompletion
from app.models.certificate import Certificate
from app.models.cms import Simulation, SimulationTask

logger = logging.getLogger(__name__)


def build_certificate_number(simulation_slug: str, issued_year: int) -> str:
    """`WL-<SIM>-<YEAR>-<RAND>` e.g. WL-DAJOB-2026-4F9A2C.

    Readable enough to quote over the phone, and the random tail (not a
    sequential counter) means a certificate number can't be used to infer
    how many certificates the platform has issued, nor guessed from
    someone else's.
    """
    sim_slug = "".join(c for c in simulation_slug.upper() if c.isalnum())[:5] or "SIM"
    tail = uuid.uuid4().hex[:6].upper()
    return f"WL-{sim_slug}-{issued_year}-{tail}"


async def _completion_stats(db: AsyncSession, enrollment_id: int) -> tuple[int, int | None]:
    """(#completed tasks, average score or None if nothing was scored)."""
    result = await db.execute(
        select(TaskCompletion.score).where(TaskCompletion.enrollment_id == enrollment_id)
    )
    scores = [row[0] for row in result.all()]
    graded = [s for s in scores if s is not None]
    average = round(sum(graded) / len(graded)) if graded else None
    return len(scores), average


async def issue_certificate_if_complete(
    db: AsyncSession, *, user_id: int, enrollment_id: int, simulation_id: int
) -> Certificate | None:
    """Issue the completion certificate iff every task is done. Returns the
    certificate (existing or newly created), or None if not yet eligible.

    Never raises on a duplicate: two task completions racing to finish the
    same simulation both call this, and the unique constraint on
    (user_id, simulation_id) is what actually guarantees one certificate —
    the pre-check below is just the common-path fast exit.
    """
    existing = await db.execute(
        select(Certificate).where(Certificate.user_id == user_id, Certificate.simulation_id == simulation_id)
    )
    already = existing.scalar_one_or_none()
    if already:
        return already

    total_res = await db.execute(
        select(func.count()).select_from(SimulationTask).where(SimulationTask.simulation_id == simulation_id)
    )
    total_tasks = total_res.scalar() or 0
    if total_tasks == 0:
        return None

    completed_count, average = await _completion_stats(db, enrollment_id)
    if completed_count < total_tasks:
        return None

    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    sim = (await db.execute(select(Simulation).where(Simulation.id == simulation_id))).scalar_one_or_none()
    if not user or not sim:
        logger.warning("cannot issue certificate — missing user=%s or simulation=%s", user_id, simulation_id)
        return None

    cert = Certificate(
        user_id=user_id,
        simulation_id=simulation_id,
        simulation_title=sim.title,
        company=sim.company or "",
        recipient_name=user.name,
        certificate_number=build_certificate_number(sim.slug, _issued_year()),
        tasks_completed=completed_count,
        total_tasks=total_tasks,
        average_score=average,
    )
    db.add(cert)
    try:
        await db.commit()
    except IntegrityError:
        # Lost a race with a concurrent completion — the other one won, and
        # its certificate is the canonical one.
        await db.rollback()
        again = await db.execute(
            select(Certificate).where(Certificate.user_id == user_id, Certificate.simulation_id == simulation_id)
        )
        return again.scalar_one_or_none()

    await db.refresh(cert)
    logger.info("issued certificate %s to user=%s for simulation=%s", cert.certificate_number, user_id, simulation_id)
    return cert


def _issued_year() -> int:
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).year


def certificate_dict(c: Certificate) -> dict:
    return {
        "id": c.id,
        "certificate_number": c.certificate_number,
        "simulation_id": c.simulation_id,
        "simulation_title": c.simulation_title,
        "company": c.company,
        "recipient_name": c.recipient_name,
        "tasks_completed": c.tasks_completed,
        "total_tasks": c.total_tasks,
        "average_score": c.average_score,
        "issued_at": c.issued_at.isoformat(),
    }
