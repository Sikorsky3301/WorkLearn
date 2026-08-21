"""
Tool/function-calling surface for the AI Mentor — provider-agnostic (the
Groq-specific wire mechanics live in app/ai/services/llm.py). Each tool is a
thin wrapper around existing query logic; nothing here reinvents
_build_assignment/compute_skill_gps.
"""
import json
import logging
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Enrollment, TaskCompletion, User, XpLedger
from app.services.skill_engine import compute_skill_gps, role_exists, recommended_role
from app.api.v1.simulations.enrollments import _build_assignment, _get_sim_tasks

logger = logging.getLogger(__name__)


@dataclass
class MentorToolContext:
    db: AsyncSession
    user_id: str
    user: User
    enrollment: Enrollment | None
    cached_assignment: dict | None = None


TOOL_SCHEMAS: list[dict] = [
    {
        "type": "function",
        "function": {
            "name": "get_current_task",
            "description": "Get the student's current/next incomplete task in their active simulation, including the task name, brief, and their manager's info.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_skill_gaps",
            "description": "Get the student's skill scores vs. the requirements for a target job role, highlighting the biggest gaps.",
            "parameters": {
                "type": "object",
                "properties": {
                    "target_role": {
                        "type": "string",
                        "description": "Role key e.g. 'junior_da'. Defaults to the student's own target role if omitted.",
                    },
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_task_history",
            "description": "Get the list of tasks the student has completed in their active simulation, with scores.",
            "parameters": {
                "type": "object",
                "properties": {
                    "simulation_id": {"type": "string", "description": "Optional simulation id filter."},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_xp_ledger",
            "description": (
                "Get the student's all-time total XP (use this for any 'how much XP do I have / have I "
                "earned in total' question) plus a short list of their most recent individual XP awards "
                "with source and amount, for describing recent activity. The recent-awards list is capped "
                "at `limit` entries and is NOT the full history — never sum it to answer a 'total' question, "
                "use the separate total_xp field for that."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    # Declared to accept a string too — Groq's llama-3.3-70b
                    # model occasionally emits this as a JSON string (e.g.
                    # "5") rather than a bare number, and Groq's server-side
                    # schema validation on tool calls rejects the ENTIRE
                    # completions.create() call with a 400 if the emitted
                    # type doesn't match a strict "integer" declaration —
                    # tool_get_xp_ledger coerces whichever shape arrives.
                    "limit": {"type": ["integer", "string"], "description": "Max recent-award entries to return, default 5. Does not affect total_xp."},
                },
            },
        },
    },
]


async def tool_get_current_task(ctx: MentorToolContext, **_kwargs) -> dict:
    if ctx.cached_assignment is not None:
        return ctx.cached_assignment
    if ctx.enrollment is None:
        return {"has_assignment": False, "reason": "not_enrolled"}
    return await _build_assignment(ctx.db, ctx.user_id, ctx.enrollment)


async def tool_get_skill_gaps(ctx: MentorToolContext, target_role: str | None = None, **_kwargs) -> dict:
    # The model picks `target_role` freely, so it can and does invent roles.
    # compute_skill_gps no longer silently substitutes junior_da for an unknown
    # role, so anything unrecognised is resolved to the student's own
    # recommended role instead of exploding mid-conversation.
    role = target_role or ctx.user.target_role or ""
    if not role_exists(role):
        role = await recommended_role(ctx.db, ctx.user_id)
    return await compute_skill_gps(ctx.db, ctx.user_id, role)


async def tool_get_task_history(ctx: MentorToolContext, simulation_id: str | None = None, **_kwargs) -> dict:
    if ctx.enrollment is None:
        return {"completed_tasks": []}
    tasks = await _get_sim_tasks(ctx.db, ctx.enrollment.simulation_id)
    task_names = {t.task_index: t.title for t in tasks}
    result = await ctx.db.execute(
        select(TaskCompletion).where(TaskCompletion.enrollment_id == ctx.enrollment.id)
    )
    completed = [
        {
            "task_id": tc.task_id,
            "task_name": task_names.get(tc.task_id, f"Task {tc.task_id}"),
            "score": tc.score,
            "quiz_score": tc.quiz_score,
        }
        for tc in result.scalars().all()
    ]
    return {"completed_tasks": completed}


async def tool_get_xp_ledger(ctx: MentorToolContext, limit: int | str = 5, **_kwargs) -> dict:
    try:
        limit = int(limit)
    except (TypeError, ValueError):
        limit = 5
    result = await ctx.db.execute(
        select(XpLedger)
        .where(XpLedger.user_id == ctx.user_id)
        .order_by(XpLedger.created_at.desc())
        .limit(limit)
    )
    entries = [{"source": x.source, "amount": x.amount, "created_at": x.created_at.isoformat()} for x in result.scalars().all()]
    # ctx.user.xp is the authoritative running total (updated atomically in
    # award_task_completion), not derived from the ledger — a model summing
    # the capped `recent_xp` list below to answer "what's my total XP" would
    # silently undercount for anyone with more than `limit` XP-earning
    # events, which is exactly the bug this field exists to prevent.
    return {"total_xp": ctx.user.xp, "recent_xp": entries}


TOOL_DISPATCH = {
    "get_current_task": tool_get_current_task,
    "get_skill_gaps": tool_get_skill_gaps,
    "get_task_history": tool_get_task_history,
    "get_xp_ledger": tool_get_xp_ledger,
}


async def execute_tool(name: str, arguments_json: str, ctx: MentorToolContext) -> dict:
    """Single dispatch point — never raises. Malformed args, unknown tool
    names, and failing tool functions all degrade to a logged {"error": ...}
    result instead of crashing the chat turn."""
    logger.debug("tool call requested: name=%s args=%s", name, arguments_json)

    try:
        arguments = json.loads(arguments_json or "{}")
    except json.JSONDecodeError:
        logger.warning("malformed tool-call arguments for %s: %r", name, arguments_json)
        return {"error": "malformed arguments, ignoring this tool call"}

    # A model can legally emit the JSON literal `null` (or anything else
    # non-object) as its arguments string — json.loads succeeds but returns
    # something **kwargs can't unpack.
    if not isinstance(arguments, dict):
        logger.warning("tool-call arguments for %s were not a JSON object: %r", name, arguments_json)
        arguments = {}

    fn = TOOL_DISPATCH.get(name)
    if fn is None:
        logger.warning("unknown tool requested: %s", name)
        return {"error": f"unknown tool {name}"}

    try:
        result = await fn(ctx, **arguments)
    except Exception as e:
        logger.error("tool execution failed: name=%s", name, exc_info=True)
        return {"error": str(e)}

    logger.debug("tool result: name=%s result=%s", name, str(result)[:500])
    return result
