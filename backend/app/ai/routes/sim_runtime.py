"""
Generic student-facing runtime endpoints for CMS-authored simulations —
everything not already covered by the generic enrollments.py endpoints
(quiz/structured_form/crm_workspace completion all post through the existing
POST /api/enrollments/{id}/tasks/{task_id}/complete, unchanged).

`ai_roleplay_chat` and `text_rubric`'s LLM grading are independent
implementations here (not routed through crm_sim.py) — they reuse
generate()/stream_chat() directly, same as crm_sim.py does, so sales-crm-sim's
frontend can be repointed at these generic endpoints later without this
file ever depending on crm_sim.py's routes.
"""
import json
import logging
import re

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.core.auth import get_current_user, token_user_id
from app.models.cms import SimulationTask
from app.ai.services.llm import generate, stream_chat
from app.ai.services.langfuse_client import traced_context
from app.services.sim_view import build_simulation_public_dict
from app.services.simulation_lookup import get_simulation

router = APIRouter(prefix="/api/simulations", tags=["sim-runtime"])
logger = logging.getLogger(__name__)


@router.get("/{sim_id}/full")
async def get_full_simulation(sim_id: str, db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user)):
    """Everything GenericSimShell needs to render a simulation — sim metadata
    + every task, with grading secrets (grader_key, rules, llm_judge_prompt,
    persona.personality_prompt, etc.) stripped out. PUBLISHED-only — this is
    the ONLY access control this endpoint has, so it must stay separate from
    the admin-only draft-preview endpoint (see
    admin_simulations.preview_full_simulation) rather than growing a bypass
    flag here."""
    sim = await get_simulation(db, sim_id, published_only=True)
    if not sim:
        raise HTTPException(404, "Simulation not found")
    tasks_res = await db.execute(
        select(SimulationTask).where(SimulationTask.simulation_id == sim.id).order_by(SimulationTask.task_index)
    )
    tasks = tasks_res.scalars().all()
    return build_simulation_public_dict(sim, tasks)


async def _get_task(db: AsyncSession, sim_key: str, task_index: int, task_type: str) -> SimulationTask:
    """Intentionally status-agnostic (no PUBLISHED filter) — this is what
    lets roleplay_message/grade_text below work against DRAFT simulations
    for any authenticated user, which is exactly what makes the admin
    builder's interactive preview possible without a separate AI endpoint.
    Do not add a status filter here."""
    sim = await get_simulation(db, sim_key)
    if not sim:
        raise HTTPException(404, "Simulation not found")
    result = await db.execute(
        select(SimulationTask).where(
            SimulationTask.simulation_id == sim.id, SimulationTask.task_index == task_index,
            SimulationTask.type == task_type,
        )
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(404, f"No {task_type} task at index {task_index} for this simulation")
    return task


def _extract_json(raw: str) -> dict:
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if not match:
        raise ValueError(f"No JSON object found in model output: {raw[:200]}")
    return json.loads(match.group())


async def _collect_stream_chat(system: str, messages: list[dict], max_tokens: int, trace_name: str, temperature: float | None = None) -> str:
    chunks = []
    async for chunk in stream_chat(system, messages, max_tokens=max_tokens, trace_name=trace_name, temperature=temperature):
        chunks.append(chunk)
    return "".join(chunks)


# ── AI roleplay chat ─────────────────────────────────────────────────────────

MOOD_TAG_RE = re.compile(r"\[\[MOOD:\s*([a-z_]+)\s*\]\]\s*$", re.IGNORECASE)


def _split_mood_tag(raw: str, fallback_mood: str, valid_moods: list[str]) -> tuple[str, str]:
    match = MOOD_TAG_RE.search(raw.strip())
    if not match:
        return raw.strip(), fallback_mood
    mood = match.group(1).lower()
    reply = raw[: match.start()].strip()
    return reply, mood if mood in valid_moods else fallback_mood


def _build_roleplay_prompt(config: dict, mood: str, context_note: str) -> str:
    persona = config["persona"]
    mode = config.get("mode", "custom")
    mood_options = persona.get("mood_options") or ["neutral"]
    mode_instructions = {
        "discovery": (
            "This is an early discovery call. You have not been sold yet. Let the rep earn information — "
            "don't volunteer your full budget, timeline, and pain points unprompted. Reward good, specific "
            "open-ended questions with real answers. Punish generic pitching with short or deflecting replies."
        ),
        "objection": (
            "You are further along in the deal. Raise real objections naturally within the conversation — one "
            "at a time, not all at once. Only soften an objection when the rep actually addresses its substance."
        ),
    }.get(mode, "")

    # Always appended regardless of mode — the admin's escape hatch for
    # genre-specific scene-setting the two sales presets above don't cover.
    additional_instructions = config.get("additional_instructions") or ""

    documents = config.get("context_documents") or []
    docs_section = ""
    if documents:
        docs_body = "\n\n".join(f"### {d['title']}\n{d['body']}" for d in documents)
        docs_section = f"\n\n## Reference Materials\n{docs_body}"

    return f"""\
## Your character
{persona['name']} — {persona['role']}
{persona['personality_prompt']}
Current mood: {mood}. Let your mood color your tone, but shift it naturally over the course of the
conversation in response to how well the rep is doing.

## Context
{context_note}
{mode_instructions}
{additional_instructions}{docs_section}

## Rules
- Stay fully in character. Never mention you are an AI, a simulation, or break the fourth wall.
- Keep replies conversational and realistic in length (1-4 sentences typically).
- Never explicitly grade or coach the rep inside the conversation itself.
- Do not agree to buy, sign, or commit to anything unless the rep has genuinely earned it.

## Required output format
After your in-character reply, on its own final line, output your updated mood as a machine-readable
tag — exactly this format, nothing else on that line:
[[MOOD: <one of {'|'.join(mood_options)}>]]
"""


class RoleplayMessageBody(BaseModel):
    history: list[dict] = []  # [{role, content}]
    message: str
    mood: str = "neutral"


@router.post("/{sim_id}/tasks/{task_index}/roleplay-message")
async def roleplay_message(
    sim_id: str, task_index: int, body: RoleplayMessageBody,
    db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user),
):
    if not body.message.strip():
        raise HTTPException(400, "Message is required")
    task = await _get_task(db, sim_id, task_index, "ai_roleplay_chat")
    config = task.config
    context_note = ", ".join(f"{k}: {v}" for k, v in (config.get("context") or {}).items()) or "none provided"
    system = _build_roleplay_prompt(config, body.mood, context_note)
    messages = [
        *[{"role": m["role"], "content": m["content"]} for m in body.history[-16:]],
        {"role": "user", "content": body.message},
    ]
    try:
        with traced_context(user_id=token_user_id(token), tags=["sim-runtime", "ai-roleplay", sim_id]):
            raw = await _collect_stream_chat(
                system, messages, max_tokens=config.get("max_tokens") or 350, trace_name="sim-roleplay",
                temperature=config.get("temperature"),
            )
    except Exception:
        logger.exception("[sim-runtime] roleplay-message failed")
        raise HTTPException(502, "The AI customer is unavailable right now — try again.")

    mood_options = config["persona"].get("mood_options") or ["neutral"]
    reply, mood = _split_mood_tag(raw, fallback_mood=body.mood, valid_moods=mood_options)
    return {"reply": reply, "mood": mood}


# ── Text + rubric grading (LLM-judged submissions, e.g. cold-outreach email) ─

class GradeTextBody(BaseModel):
    text: str
    fields: dict = {}  # e.g. {"subject": "...", "body": "...", "cta": "..."} for structured text submissions


@router.post("/{sim_id}/tasks/{task_index}/grade-text")
async def grade_text(
    sim_id: str, task_index: int, body: GradeTextBody,
    db: AsyncSession = Depends(get_db), token: dict = Depends(get_current_user),
):
    task = await _get_task(db, sim_id, task_index, "text_rubric")
    config = task.config
    if config.get("grading_mode") != "llm":
        raise HTTPException(400, "This task is not configured for LLM grading")
    if not body.text.strip():
        raise HTTPException(400, "text is required")

    prompt_template = config.get("llm_judge_prompt") or (
        "Grade this submission 0-100 and give 2-4 sentences of specific feedback. "
        "Respond with ONLY JSON: {{\"overall\": <0-100>, \"feedback\": \"...\"}}\n\nSubmission:\n{text}"
    )
    try:
        prompt = prompt_template.format(text=body.text, **body.fields)
    except (KeyError, IndexError):
        prompt = prompt_template.format(text=body.text)

    try:
        with traced_context(user_id=token_user_id(token), tags=["sim-runtime", "text-rubric", sim_id]):
            raw = await generate(
                prompt, max_tokens=config.get("max_tokens") or 500, trace_name="sim-grade-text",
                temperature=config.get("temperature"),
            )
        result = _extract_json(raw)
    except Exception:
        logger.exception("[sim-runtime] grade-text failed")
        raise HTTPException(502, "Could not grade this submission right now — try again.")

    return result
