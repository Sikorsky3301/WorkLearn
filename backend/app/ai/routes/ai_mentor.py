import functools
import json
import logging
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from pydantic import BaseModel
from app.db.database import get_db, AsyncSessionLocal
from app.core.auth import get_current_user, token_user_id
from app.models import User, Enrollment, MentorChatMessage
from app.models.cms import SimulationTask
from app.services.simulation_lookup import get_simulation
from app.services.skill_engine import compute_skill_gps
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
    target_role = (user.target_role or "junior_da").replace("_", " ").title()
    # Total XP is a free read off the already-loaded `user` row (the
    # authoritative running total, not derived from the ledger) — worth
    # making always-on rather than tool-gated since "how much XP do I have"
    # is one of the most common questions, and a model summing only the
    # capped recent-awards list from get_xp_ledger would otherwise undercount.
    context_block = f"""
## Current Context
Student: {user.name} | Target role: {target_role} | Total XP: {user.xp}
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

    # Save user message
    async with AsyncSessionLocal() as save_db:
        save_db.add(MentorChatMessage(user_id=user_id, role="user", content=body.message))
        await save_db.commit()

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
        with traced_context(user_id=user_id, session_id=f"mentor-{user_id}", tags=["ai-mentor", "tool-resolution"]):
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
            # session_id groups this user's ongoing mentor conversation —
            # there's no explicit chat-session boundary in the data model
            # (MentorChatMessage rows are just one continuous per-user
            # history), so the user's own id is the natural session key.
            with traced_context(user_id=user_id, session_id=f"mentor-{user_id}", tags=["ai-mentor"]):
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
                                user_id=user_id, role="assistant",
                                content="".join(full_response), trace_id=trace_id,
                            )
                            save_db.add(msg)
                            await save_db.commit()
                            await save_db.refresh(msg)
                            message_id = msg.id
            root_span.update(output="".join(full_response))
        # Sent once, right before [DONE] — lets the frontend attach this
        # message's id to the just-finished bubble so a thumbs up/down click
        # knows which MentorChatMessage row to PATCH.
        if message_id:
            yield f"data: {json.dumps({'message_id': message_id})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/chat/history")
async def chat_history(limit: int = 50, db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user)):
    if token.get("sa"):
        return []
    user_id = token_user_id(token)
    result = await db.execute(
        select(MentorChatMessage)
        .where(MentorChatMessage.user_id == user_id)
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
    if token.get("sa"):
        return {"ok": True}
    await db.execute(delete(MentorChatMessage).where(MentorChatMessage.user_id == token_user_id(token)))
    await db.commit()
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
    """Domain-aware quick-topic chips for the Mentor sidebar — same domain
    resolution as chat()'s persona lookup, so the chips always match
    whatever persona the student is actually talking to."""
    if token.get("sa"):
        return {"domain": None, "topics": []}
    user_id = token_user_id(token)
    enroll_res = await db.execute(
        select(Enrollment).where(Enrollment.user_id == user_id).order_by(Enrollment.enrolled_at.desc()).limit(1)
    )
    enrollment = enroll_res.scalar_one_or_none()
    assignment = await _build_assignment(db, user_id, enrollment) if enrollment else None
    domain = assignment.get("domain") if assignment else None
    persona = get_persona(domain)
    return {"domain": domain, "topics": persona.topics, "tagline": persona.tagline}


@router.get("/skill-gps")
async def skill_gps(role: str = "junior_da", db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user)):
    user_id = token_user_id(token)
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    target_role = role or (user.target_role if user else "junior_da")

    gps = await compute_skill_gps(db, user_id, target_role)

    next_actions = []
    if gps["top_gaps"]:
        gap_list = ", ".join(f"{g['skill']} ({g['current']}/{g['required']})" for g in gps["top_gaps"])
        try:
            with traced_context(user_id=user_id, tags=["skill-gps"]):
                raw = await generate(
                    f"A data analyst student has these skill gaps: {gap_list}. Target role: {target_role}. "
                    f"List exactly 3 specific, actionable next steps as a JSON array of strings. Only output the JSON array.",
                    max_tokens=300,
                    trace_name="skill-gps-next-actions",
                )
            import re
            match = re.search(r'\[.*\]', raw, re.DOTALL)
            next_actions = json.loads(match.group()) if match else []
        except Exception:
            logger.warning("skill-gps next_actions generation/parsing failed, using fallback", exc_info=True)
            next_actions = [f"Improve your {g['skill']} by completing related simulation tasks" for g in gps["top_gaps"]]

    return {**gps, "target_role": target_role, "next_actions": next_actions}
