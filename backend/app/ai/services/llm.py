"""
Unified LLM client — powered by litellm, which gives one call shape across
Anthropic, Groq, Gemini, and any OpenAI-Chat-Completions-compatible endpoint
("openai") instead of four hand-written per-provider branches (previously
~280 lines duplicating the same generate/stream/usage-extraction logic once
per SDK). AI_PROVIDER (see app/core/config.py) still picks the provider — only the
HTTP-calling internals changed, not the generate()/stream_chat()/
chat_with_tools() functions every route already imports, so no caller needed
to change.

A fifth AI_PROVIDER value, "litellm_proxy", routes every call through a
separately-run LiteLLM Proxy (see backend/litellm-proxy/) instead of calling
a provider directly from this process — optional, off by default, and
symmetric with how "openai" already means "any OpenAI-shaped endpoint": the
proxy is just another one of those, reached via the same `openai/` model
prefix. Switching to it needs zero code changes here, only `.env` — see
backend/litellm-proxy/README.md.

Langfuse tracing is UNCHANGED from before this migration — still this app's
own traced_observation() context manager (app/ai/services/langfuse_client.py),
NOT litellm's built-in Langfuse callback. Deliberately: this app's tracing
already goes through the modern Langfuse SDK's start_as_current_observation()/
get_current_trace_id() (get_current_trace_id() specifically is used elsewhere
to persist MentorChatMessage.trace_id for later feedback scoring). Bolting
litellm's separate callback-based Langfuse integration on top of that would
create two independent tracing paths writing to the same project — harder to
debug, not easier. litellm's response.usage is already normalized to
{prompt_tokens, completion_tokens} across every provider, which is exactly
the shape traced_observation()'s usage_details expects, so wiring it in was a
drop-in swap with no change to what shows up in Langfuse.

Debugging a bad call: every provider/timeout/auth error is raised as a
litellm exception (litellm.exceptions.*, all subclasses of openai's error
types) with the model string and provider embedded in the message already —
_log_and_reraise below additionally logs model+trace_name so a stack trace
always shows which provider/model/call-site was in play, without needing to
enable litellm's own request/response verbose logging (which logs full
prompts and is gated behind LITELLM_LOG, set from this app's own log_level
below, rather than litellm's separate `_turn_on_debug()` — that one also
logs raw API keys, which this app's LOG_LEVEL=DEBUG should not do).
"""
import logging
import os

from app.core.config import settings

# Must be set before `import litellm` — litellm reads this env var for its
# own logger setup at import time. Reuses this app's one log-level knob
# (already gates SQLAlchemy echo too, see app/db/database.py) instead of a
# second, independent verbosity setting that could drift out of sync with it.
os.environ.setdefault("LITELLM_LOG", settings.log_level.upper())

import litellm  # noqa: E402 — see LITELLM_LOG comment above

from app.ai.services.langfuse_client import traced_observation

logger = logging.getLogger(__name__)

# Suppresses litellm's own "Give Feedback / Get Help" banner that otherwise
# prints on certain errors — noise in this app's logs, not something this
# app's own users/logs need to see.
litellm.suppress_debug_info = True

# Model used for one-shot generate() calls (grading, brief-judging, next-best-
# -action suggestions — latency-sensitive, non-conversational).
_GENERATE_MODEL = {
    "anthropic": "anthropic/claude-haiku-4-5-20251001",
    "gemini": "gemini/gemini-2.5-flash-lite",
    "groq": "groq/llama-3.3-70b-versatile",
}
# Model used for streaming chat (AI Mentor, CRM-sim AI customer, generic
# roleplay) — higher quality tier where the provider offers one.
_STREAM_MODEL = {
    "anthropic": "anthropic/claude-sonnet-4-6",
    "gemini": "gemini/gemini-2.5-flash-lite",
    "groq": "groq/llama-3.3-70b-versatile",
}


def _model_for(streaming: bool) -> str:
    provider = settings.ai_provider
    if provider == "openai":
        return f"openai/{settings.openai_model}"
    if provider == "litellm_proxy":
        # The proxy speaks the OpenAI wire format itself, so the same
        # "openai/" passthrough prefix the generic-openai path above uses is
        # correct here too — litellm_proxy_model is one of config.yaml's own
        # `model_name` values, not a raw provider model string.
        return f"openai/{settings.litellm_proxy_model}"
    table = _STREAM_MODEL if streaming else _GENERATE_MODEL
    return table.get(provider, table["anthropic"])


def _provider_kwargs() -> dict:
    """API key (+ base_url for the generic "openai" provider, or the proxy's
    own URL for "litellm_proxy") for whichever AI_PROVIDER is configured.
    Passed explicitly on every call rather than relying on litellm's own
    environment-variable auto-detection (it'll read ANTHROPIC_API_KEY/
    GROQ_API_KEY/etc. itself if these are omitted) — being explicit means a
    missing/blank key in Settings fails immediately and obviously on the
    first call, instead of potentially picking up some unrelated ambient env
    var and silently calling the wrong account."""
    provider = settings.ai_provider
    if provider == "gemini":
        return {"api_key": settings.gemini_api_key}
    if provider == "groq":
        return {"api_key": settings.groq_api_key}
    if provider == "openai":
        return {"api_key": settings.openai_api_key, "api_base": settings.openai_base_url}
    if provider == "litellm_proxy":
        return {"api_key": settings.litellm_proxy_api_key, "api_base": settings.litellm_proxy_url}
    return {"api_key": settings.anthropic_api_key}


def _usage_details(usage) -> dict | None:
    if not usage:
        return None
    return {"prompt_tokens": usage.prompt_tokens, "completion_tokens": usage.completion_tokens}


def _log_and_reraise(exc: Exception, *, model: str, trace_name: str):
    logger.error("LLM call failed — provider=%s model=%s trace=%s: %s", settings.ai_provider, model, trace_name, exc)
    raise exc


async def generate(prompt: str, max_tokens: int = 200, trace_name: str = "llm-generate", temperature: float | None = None) -> str:
    model = _model_for(streaming=False)
    with traced_observation("generation", trace_name, model=model, input={"prompt": prompt}) as gen:
        kwargs = {"temperature": temperature} if temperature is not None else {}
        try:
            response = await litellm.acompletion(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=max_tokens,
                **_provider_kwargs(),
                **kwargs,
            )
        except Exception as exc:
            _log_and_reraise(exc, model=model, trace_name=trace_name)
        text = response.choices[0].message.content or ""
        gen.update(output=text, usage_details=_usage_details(response.usage))
        return text


async def stream_chat(system: str, messages: list[dict], max_tokens: int = 800, trace_name: str = "llm-stream-chat", temperature: float | None = None):
    """Async generator yielding text chunks."""
    model = _model_for(streaming=True)
    with traced_observation("generation", trace_name, model=model, input={"system": system, "messages": messages}) as gen:
        msgs = [{"role": "system", "content": system}] + list(messages)
        kwargs = {"temperature": temperature} if temperature is not None else {}
        try:
            stream = await litellm.acompletion(
                model=model,
                messages=msgs,
                max_tokens=max_tokens,
                stream=True,
                **_provider_kwargs(),
                **kwargs,
            )
        except Exception as exc:
            _log_and_reraise(exc, model=model, trace_name=trace_name)

        full_text = []
        usage = None
        try:
            async for chunk in stream:
                # Some OpenAI-compatible servers omit `choices` entirely on
                # the final chunk instead of sending an empty list — index
                # straight into [0] and this crashes the whole stream on the
                # very last chunk.
                text = chunk.choices[0].delta.content if chunk.choices else None
                if text:
                    full_text.append(text)
                    yield text
                # Usage is only populated on the final chunk of the stream,
                # by whichever providers report it.
                if getattr(chunk, "usage", None):
                    usage = chunk.usage
        except Exception as exc:
            _log_and_reraise(exc, model=model, trace_name=trace_name)

        gen.update(output="".join(full_text), usage_details=_usage_details(usage))


async def chat_with_tools(
    system: str,
    messages: list[dict],
    tools: list[dict],
    tool_executor,
    max_tokens: int = 800,
    trace_name: str = "mentor-tool-resolve",
) -> list[dict]:
    """Resolve any tool calls the model wants to make before the caller does
    its real (streaming) generation. Groq, any OpenAI-Chat-Completions-
    compatible endpoint ("openai"), and the LiteLLM Proxy ("litellm_proxy" —
    itself just another OpenAI-shaped endpoint) all share the same wire
    format for tool calling, and litellm normalizes them through the same
    `tools=`/`tool_choice=` params either way. Anthropic/Gemini aren't
    configured for tool use in this app, so this is a no-op for them rather
    than forcing symmetry onto paths that aren't in use."""
    if settings.ai_provider not in ("groq", "openai", "litellm_proxy"):
        logger.debug("tool-calling not implemented for provider=%s, skipping resolution", settings.ai_provider)
        return messages
    model = _model_for(streaming=False)
    return await _resolve_tool_calls(model, system, messages, tools, tool_executor, max_tokens, trace_name)


async def _resolve_tool_calls(
    model: str,
    system: str,
    messages: list[dict],
    tools: list[dict],
    tool_executor,
    max_tokens: int,
    trace_name: str,
    max_iterations: int = 5,
) -> list[dict]:
    """Hand-written agentic loop — litellm normalizes the *call* shape across
    providers, but there's no SDK-provided loop helper for resolving
    multi-step tool calls, so this loop (unchanged from before the litellm
    migration) still drives it: each iteration is one blocking
    litellm.acompletion(tools=...) call; the caller does its own final
    streaming call afterwards with `tools` omitted."""
    import json as _json
    msgs = [{"role": "system", "content": system}] + list(messages)

    with traced_observation("span", trace_name, input={"messages": messages}):
        for i in range(max_iterations):
            logger.debug("tool-resolution iteration %d/%d", i + 1, max_iterations)
            try:
                resp = await litellm.acompletion(
                    model=model,
                    messages=msgs,
                    tools=tools,
                    tool_choice="auto",
                    max_tokens=max_tokens,
                    **_provider_kwargs(),
                )
            except Exception as exc:
                _log_and_reraise(exc, model=model, trace_name=trace_name)

            message = resp.choices[0].message
            if not message.tool_calls:
                logger.info("tool-resolution complete after %d iteration(s), no further tool calls", i + 1)
                break

            msgs.append({
                "role": "assistant",
                "content": message.content,
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {"name": tc.function.name, "arguments": tc.function.arguments},
                    }
                    for tc in message.tool_calls
                ],
            })
            for tc in message.tool_calls:
                result = await tool_executor(tc.function.name, tc.function.arguments)
                msgs.append({"role": "tool", "tool_call_id": tc.id, "content": _json.dumps(result)})
            logger.debug(
                "resolved %d tool call(s) this iteration: %s",
                len(message.tool_calls), [tc.function.name for tc in message.tool_calls],
            )
        else:
            logger.warning("tool-resolution hit max_iterations=%d cap, proceeding with partial results", max_iterations)

    return msgs[1:]
