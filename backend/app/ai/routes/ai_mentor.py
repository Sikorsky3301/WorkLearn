import functools
import json
import logging
import re
from collections import OrderedDict
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func
from pydantic import BaseModel
from app.db.database import get_db, AsyncSessionLocal
from app.core.auth import get_current_user, token_user_id
from app.core.config import ROLE_META
from app.models import User, Enrollment, MentorChatMessage, MentorChatSession
from app.models.cms import SimulationTask
from app.services.simulation_lookup import get_simulation
from app.services.skill_engine import (
    compute_skill_gps, role_exists, recommended_role, role_catalog, effective_target_role,
)
from app.ai.services.llm import stream_chat, generate, chat_with_tools
from app.ai.services.langfuse_client import traced_observation, traced_context, get_current_trace_id, score_trace
from app.ai.services.mentor_tools import TOOL_SCHEMAS, execute_tool, MentorToolContext
from app.ai.services.mentor_personas import build_system_prompt, get_persona
from app.api.v1.simulations.enrollments import _build_assignment

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["ai-mentor"])


async def _task_context_block(db: AsyncSession, context: dict) -> str:
    """Extra system context when the student is asking from inside a task.

    `context` carries only a POINTER — {"simulation_slug", "task_index"} — and
    the task's actual text is read from the database here. Deliberately: the
    body is client-supplied, so echoing client-sent prose straight into the
    system prompt would let anyone rewrite the mentor's instructions. A slug
    and an int can't carry an instruction, and looking the task up server-side
    also guarantees the mentor is describing the real task rather than
    whatever the page happened to have in memory.

    Returns "" for anything unrecognised, so a malformed or absent context
    simply falls back to the normal mentor behaviour.
    """
    slug = context.get("simulation_slug")
    index = context.get("task_index")
    if not slug or index is None:
        return ""
    try:
        index = int(index)
    except (TypeError, ValueError):
        return ""

    sim = await get_simulation(db, slug, published_only=True)
    if not sim:
        return ""
    task = (await db.execute(
        select(SimulationTask).where(
            SimulationTask.simulation_id == sim.id,
            SimulationTask.task_index == index,
        )
    )).scalar_one_or_none()
    if not task:
        return ""

    steps = "\n".join(f"  {i}. {s}" for i, s in enumerate(task.what_to_do or [], 1))
    criteria = "\n".join(f"  - {c}" for c in (task.success_criteria or []))
    return f"""
## The task this student is working on right now
Simulation: {sim.title} ({sim.company})
Task {task.task_index}: {task.title}
Objective: {task.objective or "—"}
Steps they were given:
{steps or "  (none listed)"}
How it is graded:
{criteria or "  (not specified)"}

They are asking from inside this task. Answer in the context of it. Help them
UNDERSTAND and get unstuck — explain concepts, point at what to reconsider, ask
what they have tried. Do NOT write the complete solution for them; the whole
point is that they build it themselves.
"""


def _current_task_headline(assignment: dict | None) -> str:
    """The one cheap, always-on piece of context almost every message needs —
    everything else (skill gaps, full task history, XP) is tool-gated, see
    app/ai/services/mentor_tools.py."""
    if not assignment:
        return "not enrolled in any simulation yet"
    if not assignment.get("has_assignment"):
        reason = assignment.get("reason")
        if reason == "onboarding_pending":
            return f"enrolled in {assignment.get('simulation_title')} but hasn't accepted the offer letter yet"
        if reason == "completed":
            return f"has completed all tasks in {assignment.get('simulation_title')}"
        return "not enrolled in any simulation yet"
    return f"{assignment.get('task_name')} ({assignment.get('simulation_title')}) — {assignment.get('brief', '')}".strip()


class ChatBody(BaseModel):
    message: str
    conversation_history: list[dict] = []
    context: dict = {}
    session_id: int | None = None  # None starts a new conversation thread


class FeedbackBody(BaseModel):
    feedback: str | None = None  # "up" | "down" | None (None clears it)


@router.post("/chat")
async def chat(body: ChatBody, db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user)):
    if not body.message.strip():
        raise HTTPException(400, "Message is required")

    if token.get("sa"):
        raise HTTPException(403, "AI Mentor is available for enrolled students only.")

    user_id = token_user_id(token)
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")

    # Fetch active enrollment
    enroll_res = await db.execute(
        select(Enrollment)
        .where(Enrollment.user_id == user_id)
        .order_by(Enrollment.enrolled_at.desc())
        .limit(1)
    )
    enrollment = enroll_res.scalar_one_or_none()

    # One cheap query for the always-on "current task" headline — also
    # stashed on the tool context so a `get_current_task` tool call within
    # this same request reuses it instead of re-querying.
    assignment = await _build_assignment(db, user_id, enrollment) if enrollment else None
    # Explicit override (set from the Mentor Settings page) wins; otherwise
    # derived from the student's actual enrollment domain — never a fixed
    # default. See effective_target_role() for the precedence rule.
    resolved_role, _is_override = await effective_target_role(db, user_id, user)
    target_role_label = ROLE_META[resolved_role]["label"]
    # Total XP is a free read off the already-loaded `user` row (the
    # authoritative running total, not derived from the ledger) — worth
    # making always-on rather than tool-gated since "how much XP do I have"
    # is one of the most common questions, and a model summing only the
    # capped recent-awards list from get_xp_ledger would otherwise undercount.
    context_block = f"""
## Current Context
Student: {user.name} | Target role: {target_role_label} | Total XP: {user.xp}
Current task: {_current_task_headline(assignment)}
"""
    # Persona is scoped to whatever simulation the student is actually
    # enrolled in (assignment["domain"], e.g. "IT & Engineering", "Sales") —
    # not a single hardcoded domain — see mentor_personas.py. Falls back to
    # a generic persona if not enrolled in anything yet.
    domain = assignment.get("domain") if assignment else None
    # `context` was declared on ChatBody but never read, so the task rail on
    # the engineering task page had no way to tell the mentor what the student
    # was looking at. It now carries a task pointer, resolved server-side.
    system = build_system_prompt(domain) + "\n" + context_block + await _task_context_block(db, body.context or {})

    messages = [
        *[{"role": m["role"], "content": m["content"]} for m in body.conversation_history[-10:]],
        {"role": "user", "content": body.message},
    ]

    # Resolve the conversation thread this message belongs to — creating one
    # on the fly whenever the caller has no session_id yet, which is how the
    # UI's "New Chat" button works: it just clears the session param
    # client-side and lets the first message create the real session here,
    # rather than creating an empty one up front. Either way, a still-titleless
    # session is titled from this, its first message.
    async with AsyncSessionLocal() as save_db:
        if body.session_id is not None:
            chat_session = (await save_db.execute(
                select(MentorChatSession).where(
                    MentorChatSession.id == body.session_id, MentorChatSession.user_id == user_id,
                )
            )).scalar_one_or_none()
            if not chat_session:
                raise HTTPException(404, "Chat session not found")
        else:
            chat_session = MentorChatSession(user_id=user_id)
            save_db.add(chat_session)
            await save_db.flush()  # assigns chat_session.id
        if not chat_session.title:
            chat_session.title = body.message.strip()[:60]
        chat_session.updated_at = datetime.now(timezone.utc)
        save_db.add(MentorChatMessage(user_id=user_id, session_id=chat_session.id, role="user", content=body.message))
        await save_db.commit()
        session_id = chat_session.id

    # Tool resolution needs the request-scoped `db` session, which FastAPI
    # closes right after this handler returns — it must run here, before
    # StreamingResponse starts iterating event_stream(), not inside it.
    #
    # A transient Groq hiccup (rate limit, timeout, connection reset) during
    # this extra non-streaming call must not take down the whole chat turn —
    # degrade to the plain (untooled) message list instead of raising, same
    # posture as an individual tool failure in execute_tool. Without this,
    # any tool-resolution error propagates unhandled into the global 500
    # handler before the SSE stream even starts, which is exactly what a
    # "Something went wrong" report with no visible cause looks like.
    tool_ctx = MentorToolContext(db=db, user_id=user_id, user=user, enrollment=enrollment, cached_assignment=assignment)
    try:
        with traced_context(user_id=user_id, session_id=f"mentor-{session_id}", tags=["ai-mentor", "tool-resolution"]):
            resolved_messages = await chat_with_tools(
                system, messages, TOOL_SCHEMAS,
                tool_executor=functools.partial(execute_tool, ctx=tool_ctx),
                trace_name="mentor-tool-resolve",
            )
    except Exception:
        logger.exception("tool resolution failed, falling back to untooled context")
        resolved_messages = messages

    async def event_stream():
        full_response = []
        message_id = None
        # Root span must wrap the generator body itself, not the outer route
        # handler — StreamingResponse only starts iterating this generator
        # after chat() has already returned, so a span opened in chat()
        # would already be closed before any chunk is produced.
        with traced_observation("span", "mentor-chat", input={"message": body.message}) as root_span:
            # Langfuse session_id groups every trace from this one conversation
            # thread — keyed off the real MentorChatSession id now, so traces
            # from two concurrent chats for the same student are never conflated.
            with traced_context(user_id=user_id, session_id=f"mentor-{session_id}", tags=["ai-mentor"]):
                # Captured while this trace is still active — the span
                # itself will be closed by the time a feedback PATCH arrives
                # later, so the id (not the span object) is what gets persisted.
                trace_id = get_current_trace_id()
                try:
                    async for chunk in stream_chat(system, resolved_messages, trace_name="mentor-chat-generation"):
                        full_response.append(chunk)
                        yield f"data: {json.dumps({'text': chunk})}\n\n"
                except Exception as e:
                    logger.exception("mentor chat stream failed")
                    yield f"data: {json.dumps({'error': str(e)})}\n\n"
                finally:
                    if full_response:
                        async with AsyncSessionLocal() as save_db:
                            msg = MentorChatMessage(
                                user_id=user_id, session_id=session_id, role="assistant",
                                content="".join(full_response), trace_id=trace_id,
                            )
                            save_db.add(msg)
                            await save_db.commit()
                            await save_db.refresh(msg)
                            message_id = msg.id
            root_span.update(output="".join(full_response))
        # Sent once, right before [DONE]. message_id lets the frontend attach
        # this message's id to the just-finished bubble so a thumbs up/down
        # click knows which MentorChatMessage row to PATCH. session_id is
        # always sent (even if the stream failed before any chunk arrived) so
        # a brand-new chat's lazily-created session reaches the frontend —
        # otherwise a first message that errors out mid-stream would leave an
        # orphaned session the sidebar never learns about until reload.
        yield f"data: {json.dumps({'message_id': message_id, 'session_id': session_id})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/chat/history")
async def chat_history(
    session_id: int, limit: int = 200,
    db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user),
):
    if token.get("sa"):
        return []
    user_id = token_user_id(token)
    owns = (await db.execute(
        select(MentorChatSession.id).where(MentorChatSession.id == session_id, MentorChatSession.user_id == user_id)
    )).scalar_one_or_none()
    if not owns:
        raise HTTPException(404, "Chat session not found")
    result = await db.execute(
        select(MentorChatMessage)
        .where(MentorChatMessage.session_id == session_id)
        .order_by(MentorChatMessage.created_at.asc())
        .limit(limit)
    )
    return [
        {
            "role": m.role, "text": m.content, "id": m.id,
            "feedback": m.feedback, "created_at": m.created_at.isoformat(),
        }
        for m in result.scalars().all()
    ]


@router.delete("/chat/history")
async def clear_chat_history(db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user)):
    """Wipes every conversation this student has — used by the "Clear
    conversation history" control on the AI Mentor Settings page. Deleting
    the sessions (rather than the messages directly) is what makes them
    disappear from the sidebar too, via ON DELETE CASCADE."""
    if token.get("sa"):
        return {"ok": True}
    await db.execute(delete(MentorChatSession).where(MentorChatSession.user_id == token_user_id(token)))
    await db.commit()
    return {"ok": True}


@router.get("/mentor/sessions")
async def list_mentor_sessions(db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user)):
    """The sidebar's conversation list — most recently active first."""
    if token.get("sa"):
        return []
    user_id = token_user_id(token)
    result = await db.execute(
        select(MentorChatSession)
        .where(MentorChatSession.user_id == user_id)
        .order_by(MentorChatSession.updated_at.desc())
    )
    return [
        {
            "id": s.id,
            "title": s.title or "New conversation",
            "created_at": s.created_at.isoformat(),
            "updated_at": s.updated_at.isoformat(),
        }
        for s in result.scalars().all()
    ]


class RenameSessionBody(BaseModel):
    title: str


@router.patch("/mentor/sessions/{session_id}")
async def rename_mentor_session(
    session_id: int, body: RenameSessionBody,
    db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user),
):
    if token.get("sa"):
        raise HTTPException(403, "Not available for admins.")
    title = body.title.strip()
    if not title:
        raise HTTPException(400, "Title cannot be empty")
    user_id = token_user_id(token)
    chat_session = (await db.execute(
        select(MentorChatSession).where(MentorChatSession.id == session_id, MentorChatSession.user_id == user_id)
    )).scalar_one_or_none()
    if not chat_session:
        raise HTTPException(404, "Chat session not found")
    chat_session.title = title[:120]
    await db.commit()
    return {"id": chat_session.id, "title": chat_session.title}


@router.delete("/mentor/sessions/{session_id}")
async def delete_mentor_session(
    session_id: int, db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user),
):
    if token.get("sa"):
        raise HTTPException(403, "Not available for admins.")
    user_id = token_user_id(token)
    result = await db.execute(
        delete(MentorChatSession).where(MentorChatSession.id == session_id, MentorChatSession.user_id == user_id)
    )
    await db.commit()
    if result.rowcount == 0:
        raise HTTPException(404, "Chat session not found")
    return {"ok": True}


@router.patch("/chat/history/{message_id}/feedback")
async def set_message_feedback(
    message_id: str, body: FeedbackBody,
    db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user),
):
    """Thumbs up/down on one assistant message. Persisted locally on the
    message row regardless of Langfuse config; additionally attached as a
    score to that reply's original trace when Langfuse is enabled and the
    message has a trace_id (see event_stream's capture of it in chat())."""
    if token.get("sa"):
        raise HTTPException(403, "Not available for admins.")
    if body.feedback not in (None, "up", "down"):
        raise HTTPException(400, "feedback must be 'up', 'down', or null")

    user_id = token_user_id(token)
    result = await db.execute(
        select(MentorChatMessage).where(MentorChatMessage.id == message_id, MentorChatMessage.user_id == user_id)
    )
    msg = result.scalar_one_or_none()
    if not msg:
        raise HTTPException(404, "Message not found")
    if msg.role != "assistant":
        raise HTTPException(400, "Feedback only applies to assistant messages")

    msg.feedback = body.feedback
    await db.commit()

    if msg.trace_id and body.feedback is not None:
        score_trace(msg.trace_id, name="user_feedback", value=1.0 if body.feedback == "up" else 0.0)

    return {"ok": True}


@router.get("/mentor/topics")
async def mentor_topics(db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user)):
    """Domain-aware quick-topic chips + starter questions for the Mentor UI —
    same domain resolution as chat()'s persona lookup, so both always match
    whatever persona the student is actually talking to."""
    if token.get("sa"):
        return {"domain": None, "topics": [], "starters": []}
    user_id = token_user_id(token)
    enroll_res = await db.execute(
        select(Enrollment).where(Enrollment.user_id == user_id).order_by(Enrollment.enrolled_at.desc()).limit(1)
    )
    enrollment = enroll_res.scalar_one_or_none()
    assignment = await _build_assignment(db, user_id, enrollment) if enrollment else None
    domain = assignment.get("domain") if assignment else None
    persona = get_persona(domain)

    # The one starter no static persona list can write: the task they have
    # open right now. Costs nothing extra — `assignment` is already loaded
    # above for the domain lookup — and it is reliably the most useful thing
    # on the welcome screen for a student who is mid-simulation.
    starters = list(persona.starters)
    if assignment and assignment.get("has_assignment") and assignment.get("task_name"):
        starters.insert(0, f"Where should I start with \"{assignment['task_name']}\"?")

    return {
        "domain": domain,
        "topics": persona.topics,
        "starters": starters[:4],
        "tagline": persona.tagline,
    }


class MentorSettingsBody(BaseModel):
    target_role: str | None = None  # a valid ROLE_META key, or null to clear the override


@router.get("/mentor/settings")
async def get_mentor_settings(db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user)):
    if token.get("sa"):
        raise HTTPException(403, "Not available for admins.")
    user_id = token_user_id(token)
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    role_key, is_override = await effective_target_role(db, user_id, user)
    msg_count = (await db.execute(
        select(func.count()).select_from(MentorChatMessage).where(MentorChatMessage.user_id == user_id)
    )).scalar_one()
    return {
        "target_role": role_key,
        "target_role_label": ROLE_META[role_key]["label"],
        "is_override": is_override,
        "message_count": msg_count,
    }


@router.patch("/mentor/settings")
async def update_mentor_settings(
    body: MentorSettingsBody, db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user),
):
    if token.get("sa"):
        raise HTTPException(403, "Not available for admins.")
    user_id = token_user_id(token)
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    if body.target_role is not None and not role_exists(body.target_role):
        raise HTTPException(400, f"Unknown target role '{body.target_role}'.")
    user.target_role = body.target_role  # None clears the override -> back to automatic
    await db.commit()
    role_key, is_override = await effective_target_role(db, user_id, user)
    return {
        "target_role": role_key,
        "target_role_label": ROLE_META[role_key]["label"],
        "is_override": is_override,
    }


@router.get("/skill-gps/roles")
async def skill_gps_roles(db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user)):
    """The roles a student can benchmark against, plus which one their Skill GPS
    should open on.

    This exists because the frontend used to hardcode its own role list, and it
    had drifted away from the backend: two of the four roles it offered
    ("Mid-level DA", "Lead DA") had no entry in TARGET_ROLE_REQUIREMENTS at all,
    so they rendered Junior DA's numbers under a different name, and no role was
    offered for the Engineering or Sales simulations. Serving the catalog makes
    that class of drift impossible.
    """
    user_id = token_user_id(token)
    return role_catalog(await recommended_role(db, user_id))


@router.get("/skill-gps")
async def skill_gps(
    role: str | None = None,
    db: AsyncSession = Depends(get_db),
    token: dict = Depends(get_current_user),
):
    """Gap analysis for one role.

    Deliberately contains no LLM call. It used to generate the "next best
    actions" inline, which meant every single page load — and every click on a
    role button — blocked for the length of a model round-trip and burned a
    completion. At the scale this is being deployed at that is both the slowest
    part of the page and a per-student cost with no cap. The recommendations now
    live at /skill-gps/next-actions, which the page loads separately.
    """
    user_id = token_user_id(token)
    target_role = role or await recommended_role(db, user_id)

    if not role_exists(target_role):
        raise HTTPException(
            status_code=404,
            detail=f"Unknown target role '{target_role}'.",
        )

    gps = await compute_skill_gps(db, user_id, target_role)
    return {**gps, "target_role": target_role}


# Cache for the generated recommendations, keyed by (user, role, gap
# fingerprint). Skill scores only move when a task is graded, so between two
# gradings the same student asking the same question has exactly one right
# answer — regenerating it on every page view is spend with no upside. The
# fingerprint means the cache invalidates itself the moment their scores change,
# so there is no staleness to reason about.
#
# Bounded, because an unbounded per-user dict in a long-lived process is a leak.
_NEXT_ACTIONS_CACHE: "OrderedDict[tuple, list[str]]" = OrderedDict()
_NEXT_ACTIONS_CACHE_MAX = 2048


def _actions_cache_key(user_id: int, target_role: str, top_gaps: list[dict]) -> tuple:
    return (user_id, target_role, tuple((g["skill_key"], g["current"]) for g in top_gaps))


def _fallback_actions(top_gaps: list[dict], role_label: str) -> list[str]:
    return [
        f"Close the {g['skill']} gap ({g['current']}/{g['required']}) — "
        f"finish the simulation tasks that award it to reach {role_label}."
        for g in top_gaps
    ]


@router.get("/skill-gps/next-actions")
async def skill_gps_next_actions(
    role: str | None = None,
    db: AsyncSession = Depends(get_db),
    token: dict = Depends(get_current_user),
):
    """AI-generated next steps for the current gaps. Split out of /skill-gps so
    a slow or failing model degrades one card instead of the whole page."""
    user_id = token_user_id(token)
    target_role = role or await recommended_role(db, user_id)

    if not role_exists(target_role):
        raise HTTPException(status_code=404, detail=f"Unknown target role '{target_role}'.")

    gps = await compute_skill_gps(db, user_id, target_role)
    top_gaps = gps["top_gaps"]
    if not top_gaps:
        return {"target_role": target_role, "next_actions": [], "source": "none"}

    cache_key = _actions_cache_key(user_id, target_role, top_gaps)
    cached = _NEXT_ACTIONS_CACHE.get(cache_key)
    if cached is not None:
        _NEXT_ACTIONS_CACHE.move_to_end(cache_key)
        return {"target_role": target_role, "next_actions": cached, "source": "cache"}

    meta = gps["role"]
    gap_list = ", ".join(f"{g['skill']} ({g['current']}/{g['required']})" for g in top_gaps)
    source = "ai"
    try:
        with traced_context(user_id=user_id, tags=["skill-gps"]):
            raw = await generate(
                # Previously hardcoded to "A data analyst student", which was
                # wrong for every student on the Engineering or Sales track.
                f"A student is working towards the role of {meta['label']} "
                f"({meta['track_label']}). Their three largest skill gaps, as "
                f"current score out of required score, are: {gap_list}. "
                f"List exactly 3 specific, actionable next steps they should take. "
                f"Each step must be one sentence and must name one of those skills. "
                f"Only output a JSON array of 3 strings.",
                max_tokens=300,
                trace_name="skill-gps-next-actions",
            )
        match = re.search(r"\[.*\]", raw, re.DOTALL)
        parsed = json.loads(match.group()) if match else []
        next_actions = [str(a) for a in parsed if str(a).strip()][:3]
        if not next_actions:
            raise ValueError("model returned no usable actions")
    except Exception:
        logger.warning("skill-gps next_actions generation/parsing failed, using fallback", exc_info=True)
        next_actions = _fallback_actions(top_gaps, meta["label"])
        source = "fallback"

    if source == "ai":
        _NEXT_ACTIONS_CACHE[cache_key] = next_actions
        while len(_NEXT_ACTIONS_CACHE) > _NEXT_ACTIONS_CACHE_MAX:
            _NEXT_ACTIONS_CACHE.popitem(last=False)

    return {"target_role": target_role, "next_actions": next_actions, "source": source}
