"""Per-student progress analytics.

WHAT THIS REPLACED, AND WHY

The previous version of this endpoint had the same shape of problem the Skill
GPS did: the page claimed more than the code computed.

  * The period selector did nothing. `period` only moved the `since` used for
    two queries, and the only thing built from those was `_week_activity()`,
    which always returned the CURRENT Mon-Sun week regardless. Verified against
    the live endpoint: `week_activity` and `top_stats` came back byte-identical
    for week, month and "all time". The one field that did change, `xp_history`,
    was never read by the frontend.
  * The trend arrows were fabricated. `top_stats` carried `up: True` hardcoded
    for Total XP and `streak > 0` for the streak, and never carried the `delta`
    the page rendered beside them — so every card showed a green up-arrow with
    an empty string after it, permanently.
  * The heatmap legend advertised four intensity levels. `_streak_grid` only
    ever emitted 0 or 3.
  * The streak was wrong in two ways: it required TODAY to be an active day, so
    finishing a task yesterday and opening the page this morning showed a streak
    of 0; and it compared UTC completion dates against the server's LOCAL
    `date.today()`.
  * Skills came back as raw keys and the page had a five-entry label map, so
    most skills rendered as `crm_accuracy`.

Everything below is measured. Where a number cannot be computed — a previous
period that predates the account, an average score with no graded tasks — the
field is null and the UI says so rather than showing a zero that reads as real.
"""
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user, token_user_id
from app.core.config import SKILL_CATEGORIES, SKILL_LABELS
from app.db.database import get_db
from app.models import Enrollment, EnrollmentStatus, TaskCompletion, UserSkill, XpLedger
from app.models.cms import Simulation, SimulationTask

router = APIRouter(prefix="/api", tags=["analytics"])

# The heatmap window. 26 weeks is half a year — long enough to show a habit
# forming, short enough to stay legible at 12px cells on a laptop.
HEATMAP_WEEKS = 26

PERIODS = {
    "week": {"label": "Last 7 days", "days": 7},
    "month": {"label": "Last 30 days", "days": 30},
    "quarter": {"label": "Last 90 days", "days": 90},
    "all": {"label": "All time", "days": None},
}
# The frontend historically sent "all time" with a space.
_PERIOD_ALIASES = {"all time": "all", "alltime": "all", "year": "quarter"}


def _resolve_period(period: str) -> tuple[str, dict]:
    key = _PERIOD_ALIASES.get((period or "").strip().lower(), (period or "").strip().lower())
    if key not in PERIODS:
        raise HTTPException(400, f"Unknown period '{period}'. Expected one of: {', '.join(PERIODS)}.")
    return key, PERIODS[key]


@router.get("/analytics/periods")
async def analytics_periods():
    """The period options the UI is allowed to offer. Served rather than
    hardcoded in the page — a selector offering a period the backend does not
    implement is exactly how the old one ended up decorative."""
    return {
        "default": "month",
        "periods": [{"key": k, **v} for k, v in PERIODS.items()],
    }


@router.get("/analytics")
async def analytics(
    period: str = "month",
    db: AsyncSession = Depends(get_db),
    token: dict = Depends(get_current_user),
):
    user_id = token_user_id(token)
    period_key, spec = _resolve_period(period)
    now = datetime.now(timezone.utc)
    today = now.date()

    # ── raw material: two full-history reads, then everything else is arithmetic
    #
    # Pulling the whole history once and bucketing in Python beats issuing a
    # query per window: a student's history is tens of rows, and the previous
    # -period comparison, the streak, the heatmap and the trend all need
    # overlapping slices of the same data.
    xp_rows = (await db.execute(
        select(XpLedger.amount, XpLedger.source, XpLedger.created_at)
        .where(XpLedger.user_id == user_id).order_by(XpLedger.created_at)
    )).all()
    completions = (await db.execute(
        select(
            TaskCompletion.task_id, TaskCompletion.score, TaskCompletion.quiz_score,
            TaskCompletion.completed_at, Enrollment.simulation_id,
        )
        .join(Enrollment, Enrollment.id == TaskCompletion.enrollment_id)
        .where(TaskCompletion.user_id == user_id)
        .order_by(TaskCompletion.completed_at)
    )).all()

    first_activity = min(
        [r.created_at for r in xp_rows] + [c.completed_at for c in completions],
        default=None,
    )

    if spec["days"] is None:
        start = first_activity or now
        previous_start = None
    else:
        start = now - timedelta(days=spec["days"])
        previous_start = start - timedelta(days=spec["days"])

    in_period = lambda ts: ts is not None and ts >= start  # noqa: E731
    in_previous = lambda ts: (  # noqa: E731
        previous_start is not None and ts is not None and previous_start <= ts < start
    )

    # ── headline stats, each against the equivalent preceding window ─────────
    stats = [
        _stat("xp", "XP earned", "XP",
              sum(r.amount for r in xp_rows if in_period(r.created_at)),
              sum(r.amount for r in xp_rows if in_previous(r.created_at)) if previous_start else None,
              spec, previous_start is not None),
        _stat("tasks", "Tasks completed", "tasks",
              sum(1 for c in completions if in_period(c.completed_at)),
              sum(1 for c in completions if in_previous(c.completed_at)) if previous_start else None,
              spec, previous_start is not None),
        _stat("active_days", "Active days", "days",
              len({c.completed_at.date() for c in completions if in_period(c.completed_at)}),
              len({c.completed_at.date() for c in completions if in_previous(c.completed_at)})
              if previous_start else None,
              spec, previous_start is not None),
        _stat("avg_score", "Average score", "/100",
              _mean([c.score for c in completions if in_period(c.completed_at) and c.score is not None]),
              _mean([c.score for c in completions if in_previous(c.completed_at) and c.score is not None])
              if previous_start else None,
              spec, previous_start is not None),
    ]

    active_dates = sorted({c.completed_at.date() for c in completions if c.completed_at})

    completed_sims = (await db.execute(
        select(func.count()).select_from(Enrollment).where(
            Enrollment.user_id == user_id, Enrollment.status == EnrollmentStatus.COMPLETED,
        )
    )).scalar() or 0

    return {
        "period": {"key": period_key, **spec, "start": start.isoformat(), "end": now.isoformat()},
        "stats": stats,
        "totals": {
            "xp": sum(r.amount for r in xp_rows),
            "tasks": len(completions),
            "simulations_completed": completed_sims,
            "active_days": len(active_dates),
            "first_activity": first_activity.date().isoformat() if first_activity else None,
        },
        "streak": _streak(active_dates, today),
        "activity": _activity_series(xp_rows, completions, start, now, spec["days"]),
        "heatmap": _heatmap(completions, xp_rows, today),
        "skills": await _skills(db, user_id),
        "score_trend": _score_trend(completions, start, await _task_titles(db)),
        "xp_breakdown": _xp_breakdown(xp_rows, start),
        "simulations": await _simulation_progress(db, user_id, completions),
    }


# ── stats ────────────────────────────────────────────────────────────────────

def _mean(values: list[int]) -> float | None:
    return round(sum(values) / len(values), 1) if values else None


def _stat(key, label, unit, value, previous, spec, comparable: bool) -> dict:
    """One headline number and its honest comparison.

    Three distinct states, and the UI renders each differently:
      · comparable with a previous value  -> an arrow and a real delta
      · comparable but nothing to compare -> "no data in the previous window"
      · not comparable at all (all-time)  -> no arrow, no note

    The old page collapsed all three into one: `up: True` was hardcoded on some
    cards and the `delta` it rendered beside the arrow was never sent at all, so
    every card showed a green up-arrow followed by an empty string, forever.
    """
    delta = None if previous is None or value is None else round(value - previous, 1)
    if delta is None or abs(delta) < 0.05:
        direction = "flat"
    else:
        direction = "up" if delta > 0 else "down"

    if not comparable:
        comparison = None
    elif previous is None:
        comparison = f"Nothing to compare in the previous {spec['days']} days"
    else:
        comparison = f"vs previous {spec['days']} days"

    return {
        "key": key,
        "label": label,
        "unit": unit,
        "value": value,
        "previous": previous,
        "delta": delta,
        "direction": direction,
        "comparison": comparison,
    }


def _streak(active_dates: list[date], today: date) -> dict:
    """Current and longest run of consecutive active days.

    The current streak counts back from today OR yesterday. The old version
    required today to be active, so a student who worked yesterday and opened
    the page before doing anything today was told their streak was 0 — which is
    both wrong and the single most discouraging thing this page could say.
    """
    if not active_dates:
        return {"current": 0, "longest": 0, "last_active": None, "active_today": False}

    unique = sorted(set(active_dates))
    latest = unique[-1]

    current = 0
    if (today - latest).days <= 1:
        cursor = latest
        for day in reversed(unique):
            if day == cursor:
                current += 1
                cursor -= timedelta(days=1)
            elif day < cursor:
                break

    longest = run = 1
    for previous, day in zip(unique, unique[1:]):
        run = run + 1 if (day - previous).days == 1 else 1
        longest = max(longest, run)

    return {
        "current": current,
        "longest": max(longest, current),
        "last_active": latest.isoformat(),
        "active_today": latest == today,
    }


# ── series ───────────────────────────────────────────────────────────────────

def _activity_series(xp_rows, completions, start: datetime, now: datetime, days: int | None) -> dict:
    """XP and tasks bucketed across the selected period.

    Daily buckets up to 31 days, weekly beyond that — 180 daily bars is a
    smear, not a chart. This is the part the period selector never used to
    reach: the old chart was always the current Monday-to-Sunday week no matter
    which period was chosen.
    """
    span_days = (now.date() - start.date()).days + 1
    granularity = "day" if (days is not None and days <= 31) or span_days <= 31 else "week"

    buckets: dict[date, dict] = {}
    if granularity == "day":
        cursor = start.date()
        while cursor <= now.date():
            buckets[cursor] = {"xp": 0, "tasks": 0}
            cursor += timedelta(days=1)
        key_for = lambda d: d  # noqa: E731
    else:
        cursor = start.date() - timedelta(days=start.date().weekday())
        while cursor <= now.date():
            buckets[cursor] = {"xp": 0, "tasks": 0}
            cursor += timedelta(days=7)
        key_for = lambda d: d - timedelta(days=d.weekday())  # noqa: E731

    for row in xp_rows:
        if row.created_at and row.created_at >= start:
            bucket = buckets.get(key_for(row.created_at.date()))
            if bucket:
                bucket["xp"] += row.amount
    for c in completions:
        if c.completed_at and c.completed_at >= start:
            bucket = buckets.get(key_for(c.completed_at.date()))
            if bucket:
                bucket["tasks"] += 1

    points = [
        {
            "bucket": d.isoformat(),
            "label": d.strftime("%a %d") if granularity == "day" else d.strftime("%d %b"),
            "xp": v["xp"],
            "tasks": v["tasks"],
        }
        for d, v in sorted(buckets.items())
    ]
    return {
        "granularity": granularity,
        "points": points,
        "max_xp": max((p["xp"] for p in points), default=0),
        "total_xp": sum(p["xp"] for p in points),
        "total_tasks": sum(p["tasks"] for p in points),
    }


def _heatmap(completions, xp_rows, today: date) -> dict:
    """A weekday-aligned contribution grid with real intensity levels.

    Two fixes over the old `_streak_grid`: columns are true calendar weeks
    starting Monday (the old one produced rolling 7-day columns, so row 0 was
    not a weekday and the grid did not line up with any calendar), and levels
    are scaled against the student's own busiest day instead of being 3-or-0
    under a legend that advertised four shades.
    """
    per_day: dict[date, dict] = defaultdict(lambda: {"tasks": 0, "xp": 0})
    for c in completions:
        if c.completed_at:
            per_day[c.completed_at.date()]["tasks"] += 1
    for r in xp_rows:
        if r.created_at:
            per_day[r.created_at.date()]["xp"] += r.amount

    end = today + timedelta(days=6 - today.weekday())          # Sunday of this week
    begin = end - timedelta(weeks=HEATMAP_WEEKS - 1, days=6)   # Monday, N weeks back
    busiest = max((v["tasks"] for v in per_day.values()), default=0)

    weeks, months, cursor, last_month = [], [], begin, None
    while cursor <= end:
        column = []
        for offset in range(7):
            d = cursor + timedelta(days=offset)
            entry = per_day.get(d, {"tasks": 0, "xp": 0})
            column.append({
                "date": d.isoformat(),
                "tasks": entry["tasks"],
                "xp": entry["xp"],
                "level": _intensity(entry["tasks"], busiest),
                "future": d > today,
            })
        if cursor.month != last_month:
            months.append({"label": cursor.strftime("%b"), "week_index": len(weeks)})
            last_month = cursor.month
        weeks.append(column)
        cursor += timedelta(weeks=1)

    return {
        "weeks": weeks,
        "months": months,
        "weeks_shown": HEATMAP_WEEKS,
        "busiest_day_tasks": busiest,
        "active_days": sum(1 for v in per_day.values() if v["tasks"] > 0),
    }


def _intensity(tasks: int, busiest: int) -> int:
    """0-3, scaled to this student's own busiest day. Absolute thresholds would
    leave a light user permanently on level 1 and a heavy user permanently on 3."""
    if tasks <= 0 or busiest <= 0:
        return 0
    ratio = tasks / busiest
    if ratio <= 0.34:
        return 1
    if ratio <= 0.67:
        return 2
    return 3


def _score_trend(completions, start: datetime, titles: dict[tuple[int, int], str]) -> list[dict]:
    """Graded scores over the period. Quiz-only tasks carry no score and are
    left out rather than plotted as zero."""
    return [
        {
            "date": c.completed_at.date().isoformat(),
            "score": c.score,
            "task": titles.get((c.simulation_id, c.task_id), f"Task {c.task_id}"),
        }
        for c in completions
        if c.completed_at and c.completed_at >= start and c.score is not None
    ]


def _xp_breakdown(xp_rows, start: datetime) -> list[dict]:
    """Where the period's XP came from. The ledger's `source` is written as
    `task_{n}_{kind}` by skill_engine and the assessment routes."""
    kinds = {"completion": "Task completions", "quiz_bonus": "Quiz bonuses", "assessment_bonus": "Assessment bonuses"}
    totals: dict[str, int] = defaultdict(int)
    counts: dict[str, int] = defaultdict(int)
    for r in xp_rows:
        if not r.created_at or r.created_at < start:
            continue
        kind = next((k for k in kinds if (r.source or "").endswith(k)), "other")
        totals[kind] += r.amount
        counts[kind] += 1
    return [
        {"key": k, "label": kinds.get(k, "Other"), "xp": totals[k], "count": counts[k]}
        for k in sorted(totals, key=lambda k: totals[k], reverse=True)
    ]


# ── database-backed sections ─────────────────────────────────────────────────

async def _skills(db: AsyncSession, user_id: int) -> list[dict]:
    """Skill points with their display label and category resolved server-side.

    The page used to receive a bare {key: score} dict and carry a five-entry
    label map, so anything outside Data Analytics rendered as `crm_accuracy`.
    """
    rows = (await db.execute(
        select(UserSkill).where(UserSkill.user_id == user_id).order_by(UserSkill.current_score.desc())
    )).scalars().all()
    return [
        {
            "skill_key": s.skill_key,
            "label": SKILL_LABELS.get(s.skill_key, s.skill_key.replace("_", " ").title()),
            "category": SKILL_CATEGORIES.get(s.skill_key, "Technical"),
            "current_score": s.current_score,
            "last_updated": s.last_updated.isoformat() if s.last_updated else None,
        }
        for s in rows
    ]


async def _task_titles(db: AsyncSession) -> dict[tuple[int, int], str]:
    rows = (await db.execute(
        select(SimulationTask.simulation_id, SimulationTask.task_index, SimulationTask.title)
    )).all()
    return {(r.simulation_id, r.task_index): r.title for r in rows}


async def _simulation_progress(db: AsyncSession, user_id: int, completions) -> list[dict]:
    """Per-simulation standing: how far in, how well, and when last touched.

    The old page had nothing at this level — it reported one global "Simulations
    Done" count, which tells a student enrolled in three simulations nothing
    about any of them.
    """
    enrollments = (await db.execute(
        select(
            Enrollment.id, Enrollment.simulation_id, Enrollment.status,
            Enrollment.current_task_idx, Enrollment.enrolled_at, Enrollment.completed_at,
            Simulation.slug, Simulation.title, Simulation.domain,
        )
        .join(Simulation, Simulation.id == Enrollment.simulation_id)
        .where(Enrollment.user_id == user_id)
        .order_by(Enrollment.enrolled_at.desc())
    )).all()
    if not enrollments:
        return []

    task_counts = dict((await db.execute(
        select(SimulationTask.simulation_id, func.count())
        .group_by(SimulationTask.simulation_id)
    )).all())

    by_sim: dict[int, list] = defaultdict(list)
    for c in completions:
        by_sim[c.simulation_id].append(c)

    out = []
    for e in enrollments:
        done = by_sim.get(e.simulation_id, [])
        scores = [c.score for c in done if c.score is not None]
        total = task_counts.get(e.simulation_id, 0)
        out.append({
            "slug": e.slug,
            "title": e.title,
            "domain": e.domain,
            "status": e.status.value if hasattr(e.status, "value") else e.status,
            "tasks_completed": len(done),
            "tasks_total": total,
            "percent": round(len(done) / total * 100) if total else 0,
            "avg_score": _mean(scores),
            "graded_tasks": len(scores),
            "next_task_index": e.current_task_idx,
            "enrolled_at": e.enrolled_at.date().isoformat() if e.enrolled_at else None,
            "last_activity": max(
                (c.completed_at.date().isoformat() for c in done if c.completed_at), default=None,
            ),
        })
    return out
