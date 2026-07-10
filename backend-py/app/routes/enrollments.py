from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from pydantic import BaseModel
from datetime import datetime, timezone
from app.database import get_db
from app.auth import get_current_user
from app.models import Enrollment, EnrollmentStatus, TaskCompletion, AgentMessage, MessageType, UserBadge
from app.services.skill_engine import award_task_completion
from app.config import TASK_NAMES

router = APIRouter(prefix="/api", tags=["enrollments"])

SIMULATIONS = [
    {
        "id": "da-job-sim",
        "title": "Junior Data Analyst Job Simulation",
        "description": "Real-world DA tasks from Lumen Corporation: clean data, build reports, segment customers, run A/B tests, and deliver an executive brief.",
        "tag": "Data", "level": "Beginner", "tasks": 5, "estimated_hours": "4–6 hrs",
        "skills": ["SQL", "Python", "Analytics", "Data Visualization", "Statistics"],
    }
]

# The in-simulation manager who "assigns" tasks to the student
SIM_MANAGERS = {
    "da-job-sim": {
        "name": "Priya Sharma", "role": "Growth & Analytics Manager",
        "company": "Lumen Corporation", "avatar": "PS",
    },
}
DEFAULT_MANAGER = {"name": "Your Manager", "role": "Simulation Manager", "company": "", "avatar": "M"}

# One-line brief the manager attaches to each task
TASK_BRIEFS = {
    1: "Clean the raw order data and give me a one-page data-quality summary.",
    2: "Build the monthly business review report — headline KPIs and where growth is coming from.",
    3: "Segment our customers with RFM so we know who to prioritise.",
    4: "Analyse the pricing A/B test and tell me which variant to ship.",
    5: "Pull it together into an executive brief for leadership.",
}
WORK_TASK_IDS = [1, 2, 3, 4, 5]
_SIM_TITLES = {s["id"]: s["title"] for s in SIMULATIONS}

# Badge granted when the student accepts the simulation's offer letter
JOURNEY_BADGE_KEY = "sim_journey"

# Onboarding experience content shown right after enrollment, before Week 1.
SIM_ONBOARDING = {
    "da-job-sim": {
        "company": {
            "name": "Lumen Corporation", "industry": "Home & Lighting",
            "size": "~120 employees", "location": "Remote-first · US/UK",
            "about": "Lumen Corporation is a fast-growing online retailer in the home & lighting space. "
                     "The Growth & Analytics team turns raw commercial data into the decisions that steer the business.",
        },
        "manager": SIM_MANAGERS["da-job-sim"],
        "intro": (
            "Hey, and welcome to the team — really glad to have you on Growth & Analytics.\n\n"
            "Here's how I work: I'll send you tasks exactly as I would to any analyst on my team. "
            "Take a real swing at each one before you peek at how I'd have approached it — that's where the learning is. "
            "Don't aim for perfect; aim for defensible. Every number you hand leadership, you should be able to explain.\n\n"
            "Over the next two weeks you'll go from raw, messy data to an executive-ready story. "
            "Let's get you set up and into your first project."
        ),
        "learn": [
            "Cleaning messy real-world data and defending your judgment calls",
            "Building skimmable KPI reports leadership actually reads",
            "Segmenting customers with RFM to focus the business",
            "Analysing an A/B test and making a ship / no-ship call",
            "Turning analysis into a clear executive brief",
        ],
        "projects": [{"id": i, "name": TASK_NAMES[i], "brief": TASK_BRIEFS[i]} for i in WORK_TASK_IDS],
        "offer": {
            "title": "Junior Data Analyst — Job Simulation",
            "role": "Junior Data Analyst",
            "team": "Growth & Analytics",
            "company": "Lumen Corporation",
            "body": (
                "We're delighted to offer you a place on the Lumen Corporation Junior Data Analyst Job Simulation. "
                "In this role you'll work directly with your manager on five real projects using a realistic commercial dataset, "
                "building the exact skills a junior data analyst needs on the job. "
                "By accepting, you're committing to give each task a genuine attempt and to learn by doing. "
                "We're excited to see what you deliver."
            ),
        },
    },
}

class CompleteTaskBody(BaseModel):
    score: int | None = None
    quiz_score: int | None = None
    rubric_rating: dict | None = None

async def _has_journey_badge(db: AsyncSession, user_id: str, sim_id: str) -> bool:
    result = await db.execute(
        select(UserBadge).where(
            UserBadge.user_id == user_id,
            UserBadge.badge_key == JOURNEY_BADGE_KEY,
            UserBadge.simulation_id == sim_id,
        )
    )
    return result.scalar_one_or_none() is not None

@router.get("/simulations")
async def list_simulations():
    return {"simulations": SIMULATIONS}

@router.get("/users/me/badges")
async def my_badges(db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user)):
    result = await db.execute(
        select(UserBadge).where(UserBadge.user_id == token["sub"]).order_by(UserBadge.granted_at.desc())
    )
    return {"badges": [_badge_dict(b) for b in result.scalars().all()]}

@router.get("/my-assignment")
async def my_assignment(db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user)):
    """Current task the simulation manager has assigned to the student — for the Dashboard."""
    user_id = token["sub"]
    result = await db.execute(
        select(Enrollment).where(Enrollment.user_id == user_id)
        .order_by(Enrollment.enrolled_at.desc()).limit(1)
    )
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        return {"has_assignment": False, "reason": "not_enrolled"}

    manager = SIM_MANAGERS.get(enrollment.simulation_id, DEFAULT_MANAGER)

    completions = await db.execute(
        select(TaskCompletion.task_id).where(TaskCompletion.enrollment_id == enrollment.id)
    )
    completed_ids = {r[0] for r in completions}
    completed_count = len([t for t in WORK_TASK_IDS if t in completed_ids])
    next_task = next((t for t in WORK_TASK_IDS if t not in completed_ids), None)

    base = {
        "simulation_id": enrollment.simulation_id,
        "simulation_title": _SIM_TITLES.get(enrollment.simulation_id, enrollment.simulation_id),
        "enrollment_id": enrollment.id,
        "manager": manager,
        "completed_count": completed_count,
        "total_tasks": len(WORK_TASK_IDS),
    }

    # Enrolled but hasn't accepted the offer yet → onboarding is pending
    if not await _has_journey_badge(db, user_id, enrollment.simulation_id):
        return {**base, "has_assignment": False, "reason": "onboarding_pending"}

    if next_task is None:
        return {**base, "has_assignment": False, "reason": "completed"}

    return {
        **base,
        "has_assignment": True,
        "task_id": next_task,
        "task_name": TASK_NAMES.get(next_task, f"Task {next_task}"),
        "brief": TASK_BRIEFS.get(next_task, ""),
        # True once they've completed at least one earlier task (i.e. actively in progress)
        "in_progress": completed_count > 0,
        "assigned_at": enrollment.enrolled_at.isoformat(),
    }

@router.post("/simulations/{sim_id}/enroll")
async def enroll(sim_id: str, background: BackgroundTasks, db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user)):
    user_id = token["sub"]
    result = await db.execute(
        select(Enrollment).where(Enrollment.user_id == user_id, Enrollment.simulation_id == sim_id)
    )
    existing = result.scalar_one_or_none()
    if existing:
        return {"enrollment": _enroll_dict(existing), "already_enrolled": True}

    enrollment = Enrollment(user_id=user_id, simulation_id=sim_id)
    db.add(enrollment)
    await db.commit()
    await db.refresh(enrollment)

    # NOTE: the manager welcome is posted when the student ACCEPTS the offer
    # (see accept_onboarding), not at enroll — onboarding comes first.
    return {"enrollment": _enroll_dict(enrollment), "already_enrolled": False}

@router.get("/simulations/{sim_id}/onboarding")
async def get_onboarding(sim_id: str, db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user)):
    """Onboarding experience content (company, manager, projects, offer) + whether accepted."""
    content = SIM_ONBOARDING.get(sim_id)
    if not content:
        raise HTTPException(404, "No onboarding for this simulation")
    accepted = await _has_journey_badge(db, token["sub"], sim_id)
    return {**content, "simulation_id": sim_id, "accepted": accepted}

@router.post("/simulations/{sim_id}/onboarding/accept")
async def accept_onboarding(
    sim_id: str, background: BackgroundTasks,
    db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user)
):
    """Accept the offer → grant the Simulation Journey badge and start Week 1."""
    user_id = token["sub"]
    if sim_id not in SIM_ONBOARDING:
        raise HTTPException(404, "No onboarding for this simulation")

    # Ensure the student is enrolled
    enroll_res = await db.execute(
        select(Enrollment).where(Enrollment.user_id == user_id, Enrollment.simulation_id == sim_id)
    )
    enrollment = enroll_res.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(400, "Enroll in the simulation before accepting the offer.")

    # Idempotent badge grant
    if not await _has_journey_badge(db, user_id, sim_id):
        title = _SIM_TITLES.get(sim_id, sim_id)
        badge = UserBadge(
            user_id=user_id, badge_key=JOURNEY_BADGE_KEY,
            label=f"{title} — Journey", icon="🎖️", simulation_id=sim_id,
        )
        db.add(badge)
        await db.commit()
        # Manager posts the Week 1 welcome now that onboarding is done
        background.add_task(_spawn_manager_welcome, user_id, enrollment.id, sim_id)

    badge_res = await db.execute(
        select(UserBadge).where(
            UserBadge.user_id == user_id, UserBadge.badge_key == JOURNEY_BADGE_KEY,
            UserBadge.simulation_id == sim_id,
        )
    )
    b = badge_res.scalar_one()
    return {"accepted": True, "badge": _badge_dict(b)}

@router.get("/enrollments/by-sim/{sim_id}")
async def get_by_sim(sim_id: str, db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user)):
    user_id = token["sub"]
    result = await db.execute(
        select(Enrollment).where(Enrollment.user_id == user_id, Enrollment.simulation_id == sim_id)
    )
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(404, "Not enrolled")
    completions = await db.execute(
        select(TaskCompletion.task_id, TaskCompletion.score, TaskCompletion.quiz_score)
        .where(TaskCompletion.enrollment_id == enrollment.id)
    )
    return {**_enroll_dict(enrollment), "task_completions": [{"task_id": r[0], "score": r[1], "quiz_score": r[2]} for r in completions]}

@router.get("/enrollments/{enrollment_id}")
async def get_enrollment(enrollment_id: str, db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user)):
    result = await db.execute(
        select(Enrollment).where(Enrollment.id == enrollment_id, Enrollment.user_id == token["sub"])
    )
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(404, "Enrollment not found")
    completions = await db.execute(
        select(TaskCompletion.task_id).where(TaskCompletion.enrollment_id == enrollment_id)
    )
    return {**_enroll_dict(enrollment), "completed_task_ids": [r[0] for r in completions]}

@router.post("/enrollments/{enrollment_id}/tasks/{task_id}/complete")
async def complete_task(
    enrollment_id: str, task_id: int, body: CompleteTaskBody,
    db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user)
):
    user_id = token["sub"]
    result = await db.execute(
        select(Enrollment).where(Enrollment.id == enrollment_id, Enrollment.user_id == user_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(404, "Enrollment not found")

    awards = await award_task_completion(db, user_id, enrollment_id, task_id, body.score, body.quiz_score, body.rubric_rating)

    # Check if all 5 tasks done → complete simulation
    count = await db.execute(
        select(TaskCompletion).where(TaskCompletion.enrollment_id == enrollment_id, TaskCompletion.task_id >= 1)
    )
    if len(count.scalars().all()) >= 5:
        await db.execute(
            update(Enrollment).where(Enrollment.id == enrollment_id).values(
                status=EnrollmentStatus.COMPLETED, completed_at=datetime.now(timezone.utc)
            )
        )
        db.add(AgentMessage(
            user_id=user_id, enrollment_id=enrollment_id, type=MessageType.REVIEW,
            content=f"Congratulations! You completed the Junior DA Simulation and earned {awards['xp_awarded']} XP on your final task. Your Skill GPS has been updated."
        ))
        await db.commit()

    return awards

def _enroll_dict(e: Enrollment) -> dict:
    return {
        "id": e.id, "user_id": e.user_id, "simulation_id": e.simulation_id,
        "status": e.status, "current_task_idx": e.current_task_idx,
        "enrolled_at": e.enrolled_at.isoformat(), "completed_at": e.completed_at.isoformat() if e.completed_at else None,
    }

def _badge_dict(b: UserBadge) -> dict:
    return {
        "id": b.id, "badge_key": b.badge_key, "label": b.label, "icon": b.icon,
        "simulation_id": b.simulation_id, "granted_at": b.granted_at.isoformat(),
    }

async def _spawn_manager_welcome(user_id: str, enrollment_id: str, sim_id: str):
    """Deterministic welcome from the Manager — no LLM."""
    from app.database import AsyncSessionLocal
    from app.models import User
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            return
        manager = SIM_MANAGERS.get(sim_id, DEFAULT_MANAGER)
        first_task = TASK_NAMES.get(1, "Task 1")
        content = (
            f"Welcome to the team, {user.name}! I'm {manager['name']}, your {manager['role']}. "
            f"Your first assignment is \"{first_task}\" — head to the Job Simulation to get started."
        )
        db.add(AgentMessage(user_id=user_id, enrollment_id=enrollment_id, type=MessageType.STANDUP, content=content))
        await db.commit()
