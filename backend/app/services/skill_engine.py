from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.models import TaskCompletion, UserSkill, XpLedger, User, Enrollment, AgentMessage, EnrollmentStatus, MessageType
from app.models_cms import SimulationTask
from app.config import (
    TARGET_ROLE_REQUIREMENTS, SKILL_LABELS, QUIZ_BONUS_THRESHOLD, QUIZ_BONUS_XP
)
from datetime import datetime, timezone

async def award_task_completion(
    db: AsyncSession,
    user_id: str,
    enrollment_id: str,
    task_id: int,
    simulation_id: str,
    score: int | None = None,
    quiz_score: int | None = None,
    rubric_rating: dict | None = None,
) -> dict:
    # Upsert TaskCompletion
    existing = await db.execute(
        select(TaskCompletion).where(
            TaskCompletion.enrollment_id == enrollment_id,
            TaskCompletion.task_id == task_id,
        )
    )
    tc = existing.scalar_one_or_none()
    if tc:
        tc.score = score
        tc.quiz_score = quiz_score
        tc.rubric_rating = rubric_rating
        tc.completed_at = datetime.now(timezone.utc)
    else:
        tc = TaskCompletion(
            user_id=user_id, enrollment_id=enrollment_id,
            task_id=task_id, score=score, quiz_score=quiz_score,
            rubric_rating=rubric_rating,
        )
        db.add(tc)

    # XP/skill awards now come from the task's own SimulationTask row instead
    # of a hardcoded per-(simulation_id, task_id) dict — see app/models_cms.py.
    sim_task_res = await db.execute(
        select(SimulationTask).where(
            SimulationTask.simulation_id == simulation_id, SimulationTask.task_index == task_id,
        )
    )
    sim_task = sim_task_res.scalar_one_or_none()

    skill_awards = sim_task.skill_awards if sim_task else {}
    for skill_key, delta in skill_awards.items():
        res = await db.execute(
            select(UserSkill).where(UserSkill.user_id == user_id, UserSkill.skill_key == skill_key)
        )
        us = res.scalar_one_or_none()
        if us:
            us.current_score = min(100, us.current_score + delta)
        else:
            db.add(UserSkill(user_id=user_id, skill_key=skill_key, current_score=min(100, delta)))

    # Award XP
    base_xp = sim_task.xp_award if sim_task else 0
    bonus_xp = QUIZ_BONUS_XP if (quiz_score and quiz_score >= QUIZ_BONUS_THRESHOLD) else 0
    total_xp = base_xp + bonus_xp

    if total_xp > 0:
        db.add(XpLedger(user_id=user_id, amount=total_xp, source=f"task_{task_id}_completion"))
        await db.execute(
            update(User).where(User.id == user_id).values(xp=User.xp + total_xp)
        )

    # Advance enrollment task index
    await db.execute(
        update(Enrollment).where(Enrollment.id == enrollment_id).values(
            current_task_idx=task_id + 1,
            status=EnrollmentStatus.IN_PROGRESS,
        )
    )

    await db.commit()
    return {"xp_awarded": total_xp, "skills_awarded": skill_awards}


async def get_user_skills(db: AsyncSession, user_id: str) -> dict[str, int]:
    result = await db.execute(select(UserSkill).where(UserSkill.user_id == user_id))
    return {s.skill_key: s.current_score for s in result.scalars().all()}


async def compute_skill_gps(db: AsyncSession, user_id: str, target_role: str) -> dict:
    requirements = TARGET_ROLE_REQUIREMENTS.get(target_role, TARGET_ROLE_REQUIREMENTS["junior_da"])
    user_skills = await get_user_skills(db, user_id)

    gap_data = []
    for skill_key, required in requirements.items():
        current = user_skills.get(skill_key, 0)
        gap_data.append({
            "skill": SKILL_LABELS.get(skill_key, skill_key),
            "skill_key": skill_key,
            "current": current,
            "required": required,
            "status": "met" if current >= required else "gap",
            "category": _skill_category(skill_key),
        })

    overall_readiness = round(
        sum(min(g["current"] / g["required"], 1.0) for g in gap_data) / len(gap_data) * 100
    ) if gap_data else 0

    top_gaps = sorted(
        [g for g in gap_data if g["status"] == "gap"],
        key=lambda g: g["required"] - g["current"],
        reverse=True,
    )[:3]

    return {"gap_data": gap_data, "overall_readiness": overall_readiness, "top_gaps": top_gaps}


def _skill_category(skill_key: str) -> str:
    categories = {
        "sql": "Technical", "python": "Technical",
        "data_cleaning": "Technical", "data_viz": "Technical",
        "analytics": "Analytical", "statistics": "Analytical",
        "hypothesis_testing": "Analytical", "segmentation": "Analytical",
        "customer_analysis": "Analytical",
        "communication": "Communication", "data_storytelling": "Communication",
    }
    return categories.get(skill_key, "General")
