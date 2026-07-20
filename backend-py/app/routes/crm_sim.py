import json
import re
import traceback
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.auth import get_current_user
from app.services.llm import generate, stream_chat
from app.services.langfuse_client import traced_observation, traced_context
from app.services.crm_sim_prompts import (
    ai_customer_system_prompt, EMAIL_GRADING_PROMPT, FINAL_SCORE_PROMPT, PERSONALITIES,
)

router = APIRouter(prefix="/api/crm-sim", tags=["crm-sim"])


def _extract_json(raw: str) -> dict:
    """LLM output is asked to be pure JSON, but models occasionally wrap it in
    prose or a code fence — pull out the first {...} block defensively."""
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if not match:
        raise ValueError(f"No JSON object found in model output: {raw[:200]}")
    return json.loads(match.group())


async def _collect_stream_chat(system: str, messages: list[dict], max_tokens: int, trace_name: str) -> str:
    """The LLM client only exposes one-shot generate() (single prompt string)
    and stream_chat() (system + message history, streamed) — the AI customer
    needs the latter's conversational shape but this endpoint isn't
    streamed to the frontend, so collect the chunks into one string."""
    chunks = []
    async for chunk in stream_chat(system, messages, max_tokens=max_tokens, trace_name=trace_name):
        chunks.append(chunk)
    return "".join(chunks)


# ── Email grading (Stage 3 — Cold Outreach) ─────────────────────────────────

class GradeEmailBody(BaseModel):
    subject: str
    body: str
    cta: str = ""
    stageContext: dict = {}


@router.post("/grade-email")
async def grade_email(body: GradeEmailBody, token: dict = Depends(get_current_user)):
    if not body.subject.strip() or not body.body.strip():
        raise HTTPException(400, "Subject and body are required")

    prompt = EMAIL_GRADING_PROMPT.format(subject=body.subject, body=body.body, cta=body.cta or "(none written)")
    try:
        with traced_context(user_id=token["sub"], tags=["crm-sim", "email-grading"]):
            raw = await generate(prompt, max_tokens=500, trace_name="crm-sim-grade-email")
        result = _extract_json(raw)
    except Exception:
        print(f"[crm-sim] grade-email ERROR:\n{traceback.format_exc()}")
        raise HTTPException(502, "Could not grade the email right now — try again.")

    return result


# ── AI customer (Stage 4 — Discovery Call, Stage 6 — Objection Handling) ────

class AiCustomerBody(BaseModel):
    personality: str = "friendly"
    mood: str = "neutral"
    mode: str = "discovery"  # "discovery" | "objection"
    history: list[dict] = []
    message: str
    context: dict = {}


@router.post("/ai-customer")
async def ai_customer(body: AiCustomerBody, token: dict = Depends(get_current_user)):
    if not body.message.strip():
        raise HTTPException(400, "Message is required")
    if body.personality not in PERSONALITIES:
        raise HTTPException(400, f"Unknown personality '{body.personality}'")

    system = ai_customer_system_prompt(body.personality, body.mood, body.mode, body.context)
    messages = [
        *[{"role": m["role"], "content": m["content"]} for m in body.history[-16:]],
        {"role": "user", "content": body.message},
    ]

    try:
        with traced_context(user_id=token["sub"], tags=["crm-sim", "ai-customer", body.mode]):
            raw = await _collect_stream_chat(system, messages, max_tokens=350, trace_name="crm-sim-ai-customer")
    except Exception:
        print(f"[crm-sim] ai-customer ERROR:\n{traceback.format_exc()}")
        raise HTTPException(502, "The AI customer is unavailable right now — try again.")

    reply, mood = _split_mood_tag(raw, fallback_mood=body.mood)
    return {"reply": reply, "personality": body.personality, "mood": mood}


_VALID_MOODS = {
    "excited", "neutral", "annoyed", "curious", "impatient",
    "analytical", "price_sensitive", "enterprise_buyer",
}


def _split_mood_tag(raw: str, fallback_mood: str) -> tuple[str, str]:
    """The model is asked to end its reply with a `[[MOOD: xyz]]` line — pull
    it out so the mood indicator reflects a real model judgment call each
    turn instead of just echoing back whatever mood the frontend last sent."""
    match = re.search(r"\[\[MOOD:\s*([a-z_]+)\s*\]\]\s*$", raw.strip(), re.IGNORECASE)
    if not match:
        return raw.strip(), fallback_mood
    mood = match.group(1).lower()
    reply = raw[: match.start()].strip()
    return reply, mood if mood in _VALID_MOODS else fallback_mood


# ── Final scoring (end of Stage 8 — Close) ──────────────────────────────────

class FinalScoreBody(BaseModel):
    allStageData: dict = {}
    eventLog: list[dict] = []


def _summarize_attempt(all_stage_data: dict, event_log: list[dict]) -> str:
    parts = [f"Total logged actions: {len(event_log)}"]
    for stage_key, data in all_stage_data.items():
        parts.append(f"\n### {stage_key}\n{json.dumps(data, default=str)[:1500]}")
    return "\n".join(parts)


@router.post("/final-score")
async def final_score(body: FinalScoreBody, token: dict = Depends(get_current_user)):
    summary = _summarize_attempt(body.allStageData, body.eventLog)
    prompt = FINAL_SCORE_PROMPT.format(attempt_summary=summary)

    try:
        with traced_context(user_id=token["sub"], tags=["crm-sim", "final-score"]):
            raw = await generate(prompt, max_tokens=1200, trace_name="crm-sim-final-score")
        result = _extract_json(raw)
    except Exception:
        print(f"[crm-sim] final-score ERROR:\n{traceback.format_exc()}")
        raise HTTPException(502, "Could not compute the final score right now — try again.")

    return result
