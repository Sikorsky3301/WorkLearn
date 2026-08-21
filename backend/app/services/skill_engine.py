from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.models import (
    TaskCompletion, UserSkill, XpLedger, User, Enrollment, EnrollmentStatus,
    AgentMessage, MessageType,
)
from app.models.cms import Simulation, SimulationTask
from app.core.config import (
    TARGET_ROLE_REQUIREMENTS, SKILL_LABELS, SKILL_CATEGORIES, CATEGORY_ORDER, ROLE_META,
    CAREER_TRACKS, DOMAIN_TO_TRACK, DEFAULT_TARGET_ROLE,
    QUIZ_BONUS_THRESHOLD, QUIZ_BONUS_XP,
)
from datetime import datetime, timezone

async def award_task_completion(
    db: AsyncSession,
    user_id: int,
    enrollment_id: int,
    task_id: int,
    simulation_id: int,
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
    first_completion = tc is None
    if tc:
        tc.score = score
        # A code_sandbox re-submit always passes quiz_score=None (sandbox.py
        # never carries one), so assigning it unconditionally wiped a quiz
        # score the student had already earned on this task. Only overwrite
        # when the caller actually supplies one.
        if quiz_score is not None:
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
    # of a hardcoded per-(simulation_id, task_id) dict — see app/models/cms.py.
    sim_task_res = await db.execute(
        select(SimulationTask).where(
            SimulationTask.simulation_id == simulation_id, SimulationTask.task_index == task_id,
        )
    )
    sim_task = sim_task_res.scalar_one_or_none()

    # Skill points and XP are paid ONCE, on the first completion of a task.
    #
    # They used to be paid on every call, and both sandbox re-submits and the
    # /complete route call through here — so re-submitting task 1 five times
    # paid its skill points five times and its XP five times, walking every
    # skill to the min(100) cap without doing any more work. That made the
    # readiness score in the Skill GPS meaningless: it measured how many times
    # you pressed Submit, not what you had finished.
    #
    # Re-submitting to improve a score still updates TaskCompletion.score above,
    # which is what the score-based UI reads. It just doesn't pay twice.
    skill_awards = sim_task.skill_awards if sim_task else {}
    if first_completion:
        for skill_key, delta in skill_awards.items():
            res = await db.execute(
                select(UserSkill).where(UserSkill.user_id == user_id, UserSkill.skill_key == skill_key)
            )
            us = res.scalar_one_or_none()
            if us:
                us.current_score = min(100, us.current_score + delta)
            else:
                db.add(UserSkill(user_id=user_id, skill_key=skill_key, current_score=min(100, delta)))
    else:
        skill_awards = {}

    # Award XP
    base_xp = (sim_task.xp_award if sim_task else 0) if first_completion else 0
    bonus_xp = QUIZ_BONUS_XP if (first_completion and quiz_score and quiz_score >= QUIZ_BONUS_THRESHOLD) else 0
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

    # Manager congratulations, delivered to the notification bell. This sits
    # here rather than in either API route because both completion paths —
    # POST /enrollments/../complete and the sandbox's own submit — already
    # funnel through this function, so one insert covers both and neither
    # caller has to remember.
    #
    # Only on the FIRST completion: re-submitting to improve a score should
    # not re-congratulate you each time.
    if first_completion:
        db.add(AgentMessage(
            user_id=user_id,
            enrollment_id=enrollment_id,
            # Reusing REVIEW rather than adding a PRAISE member — MessageType
            # is a SAEnum, so a new member means a real enum ALTER on Postgres.
            type=MessageType.REVIEW,
            content=await _completion_message(db, simulation_id, task_id, sim_task, score),
        ))

    await db.commit()
    return {"xp_awarded": total_xp, "skills_awarded": skill_awards}


async def _completion_message(
    db: AsyncSession,
    simulation_id: int,
    task_id: int,
    sim_task: SimulationTask | None,
    score: int | None,
) -> str:
    """The manager's "nice work" line for the notification bell.

    Prefers an author-written `config.completion_message` so a CMS template can
    put the line in the manager's own voice, and otherwise assembles one from
    data already on the row. Written to degrade rather than fail — a missing
    simulation, task or score just yields a shorter sentence."""
    sim = (await db.execute(
        select(Simulation).where(Simulation.id == simulation_id)
    )).scalar_one_or_none()

    authored = (sim_task.config or {}).get("completion_message") if sim_task else None
    if authored:
        return authored

    manager = (sim.manager or {}).get("name") if sim else None
    task_title = sim_task.title if sim_task else f"Task {task_id}"

    parts = [f'Good work — you finished "{task_title}".']
    if score is not None:
        parts.append(f"You scored {score}/100.")

    next_task = (await db.execute(
        select(SimulationTask).where(
            SimulationTask.simulation_id == simulation_id,
            SimulationTask.task_index == task_id + 1,
        )
    )).scalar_one_or_none()
    if next_task:
        parts.append(f'Next up: "{next_task.title}".')
    else:
        parts.append("That's the last one — nice finish.")

    body = " ".join(parts)
    return f"{body} — {manager}" if manager else body


async def get_user_skills(db: AsyncSession, user_id: int) -> dict[str, int]:
    result = await db.execute(select(UserSkill).where(UserSkill.user_id == user_id))
    return {s.skill_key: s.current_score for s in result.scalars().all()}


def role_exists(target_role: str) -> bool:
    """A role is real only if it has BOTH a requirements benchmark and catalog
    metadata. compute_skill_gps used to fall back to junior_da for anything it
    did not recognise, which meant the UI could label Junior DA numbers as some
    other role entirely and nothing anywhere reported a problem."""
    return target_role in TARGET_ROLE_REQUIREMENTS and target_role in ROLE_META


def track_for_role(target_role: str) -> str | None:
    meta = ROLE_META.get(target_role)
    return meta["track"] if meta else None


async def recommended_role(db: AsyncSession, user_id: int) -> str:
    """The role this student's Skill GPS should open on.

    Their most recent enrollment's simulation domain wins, because that is the
    thing they are actually doing right now; a frontend student opening a page
    benchmarked against Data Analytics is the bug this replaces. Falls back to
    the target_role on their profile, then to the platform default.
    """
    res = await db.execute(
        select(Simulation.domain)
        .join(Enrollment, Enrollment.simulation_id == Simulation.id)
        .where(Enrollment.user_id == user_id)
        .order_by(Enrollment.enrolled_at.desc())
        .limit(1)
    )
    domain = res.scalar_one_or_none()
    track_key = DOMAIN_TO_TRACK.get(domain) if domain else None
    if track_key:
        for track in CAREER_TRACKS:
            if track["key"] == track_key:
                # Entry rung of that ladder — the student is starting out.
                return min(track["roles"], key=lambda r: r["level"])["key"]

    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    profile_role = user.target_role if user else None
    return profile_role if role_exists(profile_role or "") else DEFAULT_TARGET_ROLE


def role_catalog(recommended: str) -> dict:
    """The full set of roles a student can benchmark against, grouped by track.

    Served to the frontend so the role picker can never again offer a role the
    backend has no numbers for.
    """
    return {
        "recommended": recommended,
        "default": DEFAULT_TARGET_ROLE,
        "tracks": [
            {
                "key": track["key"],
                "label": track["label"],
                "roles": [
                    {
                        **ROLE_META[role["key"]],
                        "skill_count": len(TARGET_ROLE_REQUIREMENTS[role["key"]]),
                    }
                    for role in sorted(track["roles"], key=lambda r: r["level"])
                ],
            }
            for track in CAREER_TRACKS
        ],
    }


async def compute_skill_gps(db: AsyncSession, user_id: int, target_role: str) -> dict:
    """Gap analysis for one role. Pure database + config — deliberately no LLM
    call, so the page renders at database speed for every student on the
    platform. The AI recommendations live behind their own endpoint."""
    requirements = TARGET_ROLE_REQUIREMENTS[target_role]
    meta = ROLE_META[target_role]
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

    overall_readiness = _readiness(user_skills, requirements)

    top_gaps = sorted(
        [g for g in gap_data if g["status"] == "gap"],
        key=lambda g: g["required"] - g["current"],
        reverse=True,
    )[:3]

    # Readiness against every rung of this role's track, so the career ladder
    # in the UI shows where the student actually stands. It used to draw the
    # ladder with "(You)" hardcoded onto the first entry regardless of any
    # data. This costs no extra queries — user_skills is already loaded and the
    # rest is arithmetic over config.
    track_progress = [
        {
            **ROLE_META[role["key"]],
            "readiness": _readiness(user_skills, TARGET_ROLE_REQUIREMENTS[role["key"]]),
            "is_target": role["key"] == target_role,
        }
        for track in CAREER_TRACKS
        if track["key"] == meta["track"]
        for role in sorted(track["roles"], key=lambda r: r["level"])
    ]

    catalog = await _task_catalog(db)
    completions = await _completions(db, user_id)
    done = {(sim_id, idx) for sim_id, idx, _ in completions}

    # Which tasks award each benchmarked skill, and whether this student has
    # already done them. This is what turns the page from a scoreboard into a
    # plan: a gap is only useful if you can see the specific work that closes
    # it. Nothing here is estimated — it reads SimulationTask.skill_awards, the
    # same column award_task_completion() pays out from.
    for row in gap_data:
        sources = [t for t in catalog if row["skill_key"] in t["skill_awards"]]
        row["sources"] = [
            {
                "simulation_slug": t["slug"],
                "simulation_title": t["sim_title"],
                "task_index": t["task_index"],
                "task_title": t["title"],
                "week": t["week"],
                "points": t["skill_awards"][row["skill_key"]],
                "completed": (t["simulation_id"], t["task_index"]) in done,
            }
            for t in sources
        ]
        row["points_available"] = sum(s["points"] for s in row["sources"] if not s["completed"])

    # Readiness per category, computed with the same formula as the headline
    # number so the two can never tell different stories.
    category_summary = []
    for category in CATEGORY_ORDER:
        members = {k: v for k, v in requirements.items() if _skill_category(k) == category}
        if not members:
            continue
        category_summary.append({
            "category": category,
            "readiness": _readiness(user_skills, members),
            "met": sum(1 for k, v in members.items() if user_skills.get(k, 0) >= v),
            "total": len(members),
        })

    totals = {
        "points_earned": sum(min(user_skills.get(k, 0), v) for k, v in requirements.items()),
        "points_required": sum(requirements.values()),
        "tasks_completed": sum(
            1 for t in catalog
            if (t["simulation_id"], t["task_index"]) in done
            and any(k in requirements for k in t["skill_awards"])
        ),
        "tasks_total": sum(1 for t in catalog if any(k in requirements for k in t["skill_awards"])),
    }
    totals["points_remaining"] = totals["points_required"] - totals["points_earned"]

    return {
        "gap_data": gap_data,
        "overall_readiness": overall_readiness,
        "top_gaps": top_gaps,
        "role": meta,
        "track_progress": track_progress,
        "category_summary": category_summary,
        "totals": totals,
        "readiness_history": _readiness_history(catalog, completions, requirements),
    }


async def _task_catalog(db: AsyncSession) -> list[dict]:
    """Every task that awards any skill, with the simulation it belongs to.

    One query for the whole platform rather than one per skill — the table is
    small (tens of rows across three simulations) and this is on a page-load
    path that has to hold up for a thousand students.
    """
    rows = (await db.execute(
        select(
            SimulationTask.simulation_id, SimulationTask.task_index, SimulationTask.title,
            SimulationTask.week, SimulationTask.skill_awards,
            Simulation.slug, Simulation.title.label("sim_title"),
        ).join(Simulation, Simulation.id == SimulationTask.simulation_id)
        .order_by(SimulationTask.simulation_id, SimulationTask.task_index)
    )).all()
    return [
        {
            "simulation_id": r.simulation_id, "task_index": r.task_index, "title": r.title,
            "week": r.week, "skill_awards": r.skill_awards or {},
            "slug": r.slug, "sim_title": r.sim_title,
        }
        for r in rows if r.skill_awards
    ]


async def _completions(db: AsyncSession, user_id: int) -> list[tuple[int, int, datetime]]:
    """(simulation_id, task_index, completed_at) for this student, oldest first.

    TaskCompletion.task_id holds the task_index, not SimulationTask.id — the
    same convention award_task_completion() matches on.
    """
    rows = (await db.execute(
        select(Enrollment.simulation_id, TaskCompletion.task_id, TaskCompletion.completed_at)
        .join(Enrollment, Enrollment.id == TaskCompletion.enrollment_id)
        .where(TaskCompletion.user_id == user_id)
        .order_by(TaskCompletion.completed_at)
    )).all()
    return [(r.simulation_id, r.task_id, r.completed_at) for r in rows]


def _readiness_history(
    catalog: list[dict],
    completions: list[tuple[int, int, datetime]],
    requirements: dict[str, int],
) -> list[dict]:
    """Readiness after each completed task, replayed from the completion log.

    UserSkill stores only a running total with no history, so the curve is
    reconstructed by replaying completions in order against the CURRENT award
    values. That means it shows what this student's path is worth today, not
    what the page displayed at the time — which is the more useful of the two,
    since the benchmark it is drawn against is also today's.
    """
    if not completions:
        return []

    awards_by_task = {(t["simulation_id"], t["task_index"]): t["skill_awards"] for t in catalog}
    running: dict[str, int] = {}
    history = [{"date": None, "readiness": 0, "label": "Start"}]

    for sim_id, task_index, completed_at in completions:
        awards = awards_by_task.get((sim_id, task_index))
        if not awards:
            continue
        for key, delta in awards.items():
            running[key] = min(100, running.get(key, 0) + delta)
        history.append({
            "date": completed_at.date().isoformat() if completed_at else None,
            "readiness": _readiness(running, requirements),
            "label": next(
                (t["title"] for t in catalog
                 if t["simulation_id"] == sim_id and t["task_index"] == task_index),
                f"Task {task_index}",
            ),
        })

    return history


def _readiness(user_skills: dict[str, int], requirements: dict[str, int]) -> int:
    if not requirements:
        return 0
    return round(
        sum(min(user_skills.get(k, 0) / req, 1.0) for k, req in requirements.items())
        / len(requirements) * 100
    )


def _skill_category(skill_key: str) -> str:
    """Single source of truth is SKILL_CATEGORIES in config. This used to be a
    local dict covering only the Data Analytics skills, so every Engineering and
    Sales skill was reported as "General"."""
    return SKILL_CATEGORIES.get(skill_key, "Technical")
