from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from pydantic import BaseModel
from datetime import datetime, timezone
from app.database import get_db
from app.auth import get_current_user
from app.models import Enrollment, EnrollmentStatus, TaskCompletion, AgentMessage, MessageType, UserBadge
from app.services.skill_engine import award_task_completion
from app.config import SIM_TASK_NAMES

router = APIRouter(prefix="/api", tags=["enrollments"])

SIMULATIONS = [
    {
        "id": "da-job-sim",
        "title": "Junior Data Analyst Job Simulation",
        "description": "Real-world DA tasks from Lumen Corporation: clean data, build reports, segment customers, run A/B tests, and deliver an executive brief.",
        "tag": "Data", "level": "Beginner", "tasks": 5, "estimated_hours": "4–6 hrs",
        "skills": ["SQL", "Python", "Analytics", "Data Visualization", "Statistics"],
    },
    {
        "id": "frontend-dev-sim",
        "title": "Frontend Developer Job Simulation",
        "description": "Real-world frontend tickets from Enigma: build a responsive landing page, wire up interactivity, fetch live data, and ship a stateful React app.",
        "tag": "Engineering", "level": "Beginner", "tasks": 5, "estimated_hours": "5–7 hrs",
        "skills": ["HTML/CSS", "JavaScript", "React", "Accessibility", "State Management"],
    },
    {
        "id": "sales-crm-sim",
        "title": "Enterprise SaaS Sales Representative",
        "description": "A full sales cycle at Nimbus CRM: qualify a lead, research the account, send cold outreach, run a discovery call, work the deal in a real CRM, handle objections, write a proposal, and close.",
        "tag": "Sales", "level": "Intermediate", "tasks": 8, "estimated_hours": "3–5 hrs",
        "skills": ["Discovery", "CRM Accuracy", "Objection Handling", "Negotiation", "Closing"],
    },
]

# The in-simulation manager who "assigns" tasks to the student
SIM_MANAGERS = {
    "da-job-sim": {
        "name": "Priya Sharma", "role": "Growth & Analytics Manager",
        "company": "Lumen Corporation", "avatar": "PS",
    },
    "frontend-dev-sim": {
        "name": "Maya Chen", "role": "Frontend Engineering Lead",
        "company": "Enigma", "avatar": "MC",
    },
    "sales-crm-sim": {
        "name": "Derek Holt", "role": "VP of Sales",
        "company": "Nimbus CRM", "avatar": "DH",
    },
}
DEFAULT_MANAGER = {"name": "Your Manager", "role": "Simulation Manager", "company": "", "avatar": "M"}

# Everything below is keyed by simulation_id first — two simulations both
# number their tasks 1-5, so a bare task_id key would mix up briefs/weeks
# across simulations (same pattern as SIM_TASK_IO/SIM_GRADERS in sandbox.py
# and SIM_TASK_XP_AWARDS/SIM_TASK_SKILL_AWARDS in config.py).

# One-line brief the manager attaches to each task
SIM_TASK_BRIEFS = {
    "da-job-sim": {
        1: "Clean the raw order data and give me a one-page data-quality summary.",
        2: "Build the monthly business review report — headline KPIs and where growth is coming from.",
        3: "Segment our customers with RFM so we know who to prioritise.",
        4: "Analyse the pricing A/B test and tell me which variant to ship.",
        5: "Pull it together into an executive brief for leadership.",
    },
    "frontend-dev-sim": {
        1: "Build the landing hero section — semantic, responsive, no JS needed yet.",
        2: "Wire up the navigation — mobile menu toggle and active-link highlighting.",
        3: "Fetch and render the team directory from the API, with loading and error states.",
        4: "Convert the directory list into a proper React component.",
        5: "Build the task manager — add, complete, delete, and persist across reloads.",
    },
    "sales-crm-sim": {
        1: "Review the inbound lead and score it — buying intent, priority, and your reasoning.",
        2: "Research the account — company profile, competitors, decision makers, budget signals.",
        3: "Send the cold outreach email — subject, body, and a clear call to action.",
        4: "Run the discovery call — qualify budget, timeline, and the real pain points.",
        5: "Work the deal in the CRM — account, contacts, opportunity, and next steps.",
        6: "Handle the objections that come up and keep the deal moving.",
        7: "Put together the proposal — problem, solution, ROI, pricing, timeline.",
        8: "Close it — demo, signature, negotiation, and the onboarding handoff.",
    },
}
SIM_WORK_TASK_IDS = {
    "da-job-sim": [1, 2, 3, 4, 5],
    "frontend-dev-sim": [1, 2, 3, 4, 5],
    "sales-crm-sim": [1, 2, 3, 4, 5, 6, 7, 8],
}
# Which week each task belongs to — drives the Manager/AI Mentor's "Week N"
# narration. da-job-sim is a 2-week program; frontend-dev-sim is 3 weeks
# (basic -> intermediate -> advanced). sales-crm-sim is a single continuous
# sales cycle rather than a multi-week program, so every stage is "Week 1".
SIM_TASK_WEEKS = {
    "da-job-sim": {1: 1, 2: 1, 3: 2, 4: 2, 5: 2},
    "frontend-dev-sim": {1: 1, 2: 1, 3: 2, 4: 2, 5: 3},
    "sales-crm-sim": {1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1},
}
SIM_TITLES = {s["id"]: s["title"] for s in SIMULATIONS}

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
        "projects": [
            {"id": i, "name": SIM_TASK_NAMES["da-job-sim"][i], "brief": SIM_TASK_BRIEFS["da-job-sim"][i]}
            for i in SIM_WORK_TASK_IDS["da-job-sim"]
        ],
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
    "frontend-dev-sim": {
        "company": {
            "name": "Enigma", "industry": "B2B SaaS · Productivity Software",
            "size": "~85 employees", "location": "Remote-first · US/EU",
            "about": "Enigma builds a workspace platform teams use to plan, track, and ship their work in one place. "
                     "The Web Platform team owns everything the customer actually sees and clicks — performance and polish are the product.",
        },
        "manager": SIM_MANAGERS["frontend-dev-sim"],
        "intro": (
            "Hey, welcome to the Web Platform team — excited to have you.\n\n"
            "Here's how I work: I'll hand you tickets exactly like I would to any frontend engineer on the team. "
            "Build the real thing, don't just make it look right — I'll be checking that it actually behaves correctly, not just that it renders.\n\n"
            "You'll start with the fundamentals — markup and layout — and build up to a real interactive React feature by the end. "
            "Let's get you set up."
        ),
        "learn": [
            "Building accessible, responsive layouts with semantic HTML and CSS",
            "Adding interactivity with vanilla JavaScript and the DOM API",
            "Fetching and rendering async data with proper loading/error states",
            "Writing your first React components with props and conditional rendering",
            "Managing state in React with hooks and persisting it across sessions",
        ],
        "projects": [
            {"id": i, "name": SIM_TASK_NAMES["frontend-dev-sim"][i], "brief": SIM_TASK_BRIEFS["frontend-dev-sim"][i]}
            for i in SIM_WORK_TASK_IDS["frontend-dev-sim"]
        ],
        "offer": {
            "title": "Frontend Developer — Job Simulation",
            "role": "Frontend Developer",
            "team": "Web Platform",
            "company": "Enigma",
            "body": (
                "We're delighted to offer you a place on the Enigma Frontend Developer Job Simulation. "
                "You'll work directly with your manager on five real tickets, going from a static landing page to a fully interactive React application, "
                "building the exact skills a frontend developer needs on the job. "
                "By accepting, you're committing to give each task a genuine attempt and to learn by doing. "
                "We're excited to see what you ship."
            ),
        },
    },
    "sales-crm-sim": {
        "company": {
            "name": "Nimbus CRM", "industry": "CRM SaaS",
            "size": "~60 employees", "location": "Remote-first · US",
            "about": "Nimbus CRM builds an AI-powered sales platform for mid-market and enterprise sales teams. "
                     "The sales org is expanding into industrial and manufacturing accounts, which is exactly the "
                     "kind of deal you're about to run.",
        },
        "manager": SIM_MANAGERS["sales-crm-sim"],
        "intro": (
            "Welcome to the team — glad to have you on board.\n\n"
            "Here's how I work: I hand my reps a real deal, start to finish, and I expect you to run the whole "
            "cycle yourself — qualify it, research it, work it, and close it. I'm not going to hover over every "
            "email, but I will read your CRM, your transcripts, and your proposal the way I'd read any rep's on "
            "my team.\n\n"
            "Your first deal is Atlas Forge Manufacturing — a real inbound lead that just came in. Let's get you "
            "into it."
        ),
        "learn": [
            "Qualifying an inbound lead and defending your scoring with real reasoning",
            "Researching an account like a rep who actually wants to win the deal",
            "Writing cold outreach that earns a reply, not a delete",
            "Running a discovery call that uncovers real pain, budget, and timeline",
            "Working a deal in a real CRM — accounts, contacts, opportunities, pipeline",
            "Handling real objections with substance, not scripted reassurance",
            "Building a proposal that makes an honest business case",
            "Closing — demo, signature, negotiation, and a clean handoff to onboarding",
        ],
        "projects": [
            {"id": i, "name": SIM_TASK_NAMES["sales-crm-sim"][i], "brief": SIM_TASK_BRIEFS["sales-crm-sim"][i]}
            for i in SIM_WORK_TASK_IDS["sales-crm-sim"]
        ],
        "offer": {
            "title": "Enterprise SaaS Sales Representative — Job Simulation",
            "role": "Enterprise SaaS Sales Representative",
            "team": "Sales",
            "company": "Nimbus CRM",
            "body": (
                "We're delighted to offer you a place on the Nimbus CRM Enterprise SaaS Sales Representative Job "
                "Simulation. You'll run one real deal start to finish — lead qualification, research, outreach, "
                "a discovery call, working the pipeline in a real CRM, objection handling, a proposal, and the "
                "close — building the exact skills an enterprise sales rep needs on the job. By accepting, you're "
                "committing to give each stage a genuine attempt and to learn by doing. We're excited to see you close."
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

async def _build_assignment(db: AsyncSession, user_id: str, enrollment: Enrollment) -> dict:
    """Manager + current-task summary for one enrollment — shared by the
    single-simulation `/my-assignment` (kept for back-compat) and the
    multi-simulation `/my-assignments` the Dashboard now uses so every
    enrolled simulation's manager/task shows up, not just the latest one."""
    manager = SIM_MANAGERS.get(enrollment.simulation_id, DEFAULT_MANAGER)
    sim_id = enrollment.simulation_id
    work_task_ids = SIM_WORK_TASK_IDS.get(sim_id, [])
    task_names = SIM_TASK_NAMES.get(sim_id, {})
    task_briefs = SIM_TASK_BRIEFS.get(sim_id, {})

    completions = await db.execute(
        select(TaskCompletion.task_id).where(TaskCompletion.enrollment_id == enrollment.id)
    )
    completed_ids = {r[0] for r in completions}
    completed_count = len([t for t in work_task_ids if t in completed_ids])
    next_task = next((t for t in work_task_ids if t not in completed_ids), None)

    base = {
        "simulation_id": sim_id,
        "simulation_title": SIM_TITLES.get(sim_id, sim_id),
        "enrollment_id": enrollment.id,
        "manager": manager,
        "completed_count": completed_count,
        "total_tasks": len(work_task_ids),
    }

    # Enrolled but hasn't accepted the offer yet → onboarding is pending
    if not await _has_journey_badge(db, user_id, sim_id):
        return {**base, "has_assignment": False, "reason": "onboarding_pending"}

    if next_task is None:
        return {**base, "has_assignment": False, "reason": "completed"}

    return {
        **base,
        "has_assignment": True,
        "task_id": next_task,
        "task_name": task_names.get(next_task, f"Task {next_task}"),
        "brief": task_briefs.get(next_task, ""),
        # True once they've completed at least one earlier task (i.e. actively in progress)
        "in_progress": completed_count > 0,
        "assigned_at": enrollment.enrolled_at.isoformat(),
    }

@router.get("/my-assignment")
async def my_assignment(db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user)):
    """Most-recently-enrolled simulation's manager/task. Kept for any caller
    still using the singular endpoint — the Dashboard itself now uses
    `/my-assignments` (plural) so it can show every enrolled simulation."""
    user_id = token["sub"]
    result = await db.execute(
        select(Enrollment).where(Enrollment.user_id == user_id)
        .order_by(Enrollment.enrolled_at.desc()).limit(1)
    )
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        return {"has_assignment": False, "reason": "not_enrolled"}
    return await _build_assignment(db, user_id, enrollment)

@router.get("/my-assignments")
async def my_assignments(db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user)):
    """One manager/task summary per simulation the student is enrolled in —
    powers the Dashboard's "Your Managers" list so a student running multiple
    job simulations at once sees every manager and their current task."""
    user_id = token["sub"]
    result = await db.execute(
        select(Enrollment).where(Enrollment.user_id == user_id)
        .order_by(Enrollment.enrolled_at.asc())
    )
    enrollments = result.scalars().all()
    assignments = [await _build_assignment(db, user_id, e) for e in enrollments]
    return {"assignments": assignments}

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
        title = SIM_TITLES.get(sim_id, sim_id)
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
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(404, "Enrollment not found")
    sim_id = enrollment.simulation_id

    awards = await award_task_completion(
        db, user_id, enrollment_id, task_id, simulation_id=sim_id,
        score=body.score, quiz_score=body.quiz_score, rubric_rating=body.rubric_rating,
    )

    # Check if every task in this simulation is done → complete the simulation
    work_task_ids = SIM_WORK_TASK_IDS.get(sim_id, [])
    count = await db.execute(
        select(TaskCompletion).where(TaskCompletion.enrollment_id == enrollment_id, TaskCompletion.task_id >= 1)
    )
    if work_task_ids and len(count.scalars().all()) >= len(work_task_ids):
        await db.execute(
            update(Enrollment).where(Enrollment.id == enrollment_id).values(
                status=EnrollmentStatus.COMPLETED, completed_at=datetime.now(timezone.utc)
            )
        )
        sim_title = SIM_TITLES.get(sim_id, sim_id)
        db.add(AgentMessage(
            user_id=user_id, enrollment_id=enrollment_id, type=MessageType.REVIEW,
            content=f"Congratulations! You completed the {sim_title} and earned {awards['xp_awarded']} XP on your final task. Your Skill GPS has been updated."
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
        first_task = SIM_TASK_NAMES.get(sim_id, {}).get(1, "Task 1")
        content = (
            f"Welcome to the team, {user.name}! I'm {manager['name']}, your {manager['role']}. "
            f"Your first assignment is \"{first_task}\" — head to the Job Simulation to get started."
        )
        db.add(AgentMessage(user_id=user_id, enrollment_id=enrollment_id, type=MessageType.STANDUP, content=content))
        await db.commit()
