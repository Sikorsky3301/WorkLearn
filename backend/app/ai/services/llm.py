"""
Unified LLM client — swap between Anthropic, Gemini, Groq, and any
OpenAI-Chat-Completions-compatible endpoint ("openai") via AI_PROVIDER env
var. Every provider call is wrapped in a Langfuse "generation" observation
(model, input, output, token usage) — see app/ai/services/langfuse_client.py.
Tracing is a no-op when Langfuse isn't configured (see langfuse_enabled).
"""
import logging
from typing import Awaitable, Callable

from app.config import settings
from app.ai.services.langfuse_client import traced_observation

logger = logging.getLogger(__name__)

async def generate(prompt: str, max_tokens: int = 200, trace_name: str = "llm-generate", temperature: float | None = None) -> str:
    if settings.ai_provider == "gemini":
        return await _gemini(prompt, max_tokens, trace_name, temperature)
    if settings.ai_provider == "groq":
        return await _groq(prompt, max_tokens, trace_name, temperature)
    if settings.ai_provider == "openai":
        return await _openai(prompt, max_tokens, trace_name, temperature)
    return await _anthropic(prompt, max_tokens, trace_name, temperature)

async def stream_chat(system: str, messages: list[dict], max_tokens: int = 800, trace_name: str = "llm-stream-chat", temperature: float | None = None):
    """Async generator yielding text chunks."""
    if settings.ai_provider == "gemini":
        async for chunk in _gemini_stream(system, messages, max_tokens, trace_name, temperature):
            yield chunk
    elif settings.ai_provider == "groq":
        async for chunk in _groq_stream(system, messages, max_tokens, trace_name, temperature):
            yield chunk
    elif settings.ai_provider == "openai":
        async for chunk in _openai_stream(system, messages, max_tokens, trace_name, temperature):
            yield chunk
    else:
        async for chunk in _anthropic_stream(system, messages, max_tokens, trace_name, temperature):
            yield chunk


async def chat_with_tools(
    system: str,
    messages: list[dict],
    tools: list[dict],
    tool_executor: Callable[[str, str], Awaitable[dict]],
    max_tokens: int = 800,
    trace_name: str = "mentor-tool-resolve",
) -> list[dict]:
    """Resolve any tool calls the model wants to make before the caller does
    its real (streaming) generation. Groq and any OpenAI-Chat-Completions-
    compatible endpoint ("openai") share the same wire format for this, so
    both route through _resolve_tool_calls below. Anthropic/Gemini aren't
    configured for tool use in this app, so this is a no-op for them rather
    than forcing symmetry onto paths that aren't in use."""
    if settings.ai_provider == "groq":
        from groq import AsyncGroq
        client = AsyncGroq(api_key=settings.groq_api_key)
        model = "llama-3.3-70b-versatile"
    elif settings.ai_provider == "openai":
        from openai import AsyncOpenAI
        client = AsyncOpenAI(base_url=settings.openai_base_url, api_key=settings.openai_api_key)
        model = settings.openai_model
    else:
        logger.debug("tool-calling not implemented for provider=%s, skipping resolution", settings.ai_provider)
        return messages
    return await _resolve_tool_calls(client, model, system, messages, tools, tool_executor, max_tokens, trace_name)

# ── Anthropic ────────────────────────────────────────────────────────────────

async def _anthropic(prompt: str, max_tokens: int, trace_name: str = "llm-generate", temperature: float | None = None) -> str:
    import anthropic
    model = "claude-haiku-4-5-20251001"
    with traced_observation("generation", trace_name, model=model, input={"prompt": prompt}) as gen:
        client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        kwargs = {"temperature": temperature} if temperature is not None else {}
        msg = await client.messages.create(
            model=model,
            max_tokens=max_tokens,
            messages=[{"role": "user", "content": prompt}],
            **kwargs,
        )
        block = msg.content[0]
        text = block.text if block.type == "text" else ""
        gen.update(
            output=text,
            usage_details={"prompt_tokens": msg.usage.input_tokens, "completion_tokens": msg.usage.output_tokens},
        )
        return text

async def _anthropic_stream(system: str, messages: list[dict], max_tokens: int, trace_name: str = "llm-stream-chat", temperature: float | None = None):
    import anthropic
    model = "claude-sonnet-4-6"
    with traced_observation("generation", trace_name, model=model, input={"system": system, "messages": messages}) as gen:
        client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        full_text = []
        kwargs = {"temperature": temperature} if temperature is not None else {}
        async with client.messages.stream(
            model=model,
            max_tokens=max_tokens,
            system=system,
            messages=messages,
            **kwargs,
        ) as stream:
            async for text in stream.text_stream:
                full_text.append(text)
                yield text
            final = await stream.get_final_message()

        usage = {"prompt_tokens": final.usage.input_tokens, "completion_tokens": final.usage.output_tokens} if final else None
        gen.update(output="".join(full_text), usage_details=usage)

# ── Groq ─────────────────────────────────────────────────────────────────────

async def _groq(prompt: str, max_tokens: int, trace_name: str = "llm-generate", temperature: float | None = None) -> str:
    from groq import AsyncGroq
    model = "llama-3.3-70b-versatile"
    with traced_observation("generation", trace_name, model=model, input={"prompt": prompt}) as gen:
        client = AsyncGroq(api_key=settings.groq_api_key)
        kwargs = {"temperature": temperature} if temperature is not None else {}
        resp = await client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=max_tokens,
            **kwargs,
        )
        text = resp.choices[0].message.content or ""
        usage = None
        if resp.usage:
            usage = {"prompt_tokens": resp.usage.prompt_tokens, "completion_tokens": resp.usage.completion_tokens}
        gen.update(output=text, usage_details=usage)
        return text

async def _resolve_tool_calls(
    client,
    model: str,
    system: str,
    messages: list[dict],
    tools: list[dict],
    tool_executor: Callable[[str, str], Awaitable[dict]],
    max_tokens: int,
    trace_name: str,
    max_iterations: int = 5,
) -> list[dict]:
    """Hand-written agentic loop for OpenAI-Chat-Completions-compatible tool
    calling — there is no SDK-provided loop helper for Groq or a self-hosted
    OpenAI-compatible endpoint, and both `AsyncGroq`/`AsyncOpenAI` expose the
    identical `chat.completions.create(tools=...)` shape, so one loop serves
    both. Non-streaming: each iteration is one blocking chat.completions.create()
    call; the caller does its own final streaming call afterwards with
    `tools` omitted (two-phase design — streaming + partial tool-call-argument
    chunks are fiddly to reassemble, so this avoids that entirely)."""
    import json as _json
    msgs = [{"role": "system", "content": system}] + list(messages)

    with traced_observation("span", trace_name, input={"messages": messages}):
        for i in range(max_iterations):
            logger.debug("tool-resolution iteration %d/%d", i + 1, max_iterations)
            resp = await client.chat.completions.create(
                model=model,
                messages=msgs,
                tools=tools,
                tool_choice="auto",
                max_tokens=max_tokens,
            )
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


async def _groq_stream(system: str, messages: list[dict], max_tokens: int, trace_name: str = "llm-stream-chat", temperature: float | None = None):
    from groq import AsyncGroq
    model = "llama-3.3-70b-versatile"
    with traced_observation("generation", trace_name, model=model, input={"system": system, "messages": messages}) as gen:
        client = AsyncGroq(api_key=settings.groq_api_key)
        # Pass each message through as-is (not just role/content) so a
        # tool-augmented history (tool_calls/tool_call_id keys from
        # chat_with_tools) survives into this call. No-op for every other
        # caller, which only ever puts role/content keys in these dicts.
        msgs = [{"role": "system", "content": system}] + list(messages)
        kwargs = {"temperature": temperature} if temperature is not None else {}
        stream = await client.chat.completions.create(
            model=model,
            messages=msgs,
            max_tokens=max_tokens,
            stream=True,
            **kwargs,
        )
        full_text = []
        usage = None
        async for chunk in stream:
            text = chunk.choices[0].delta.content
            if text:
                full_text.append(text)
                yield text
            # Groq populates `usage` on the final chunk of the stream.
            if chunk.usage:
                usage = {"prompt_tokens": chunk.usage.prompt_tokens, "completion_tokens": chunk.usage.completion_tokens}

        gen.update(output="".join(full_text), usage_details=usage)

# ── OpenAI-compatible (any server speaking the OpenAI Chat Completions wire
# format — api.openai.com itself, or a self-hosted vLLM/ngrok endpoint) ───────

async def _openai(prompt: str, max_tokens: int, trace_name: str = "llm-generate", temperature: float | None = None) -> str:
    from openai import AsyncOpenAI
    model = settings.openai_model
    with traced_observation("generation", trace_name, model=model, input={"prompt": prompt}) as gen:
        client = AsyncOpenAI(base_url=settings.openai_base_url, api_key=settings.openai_api_key)
        kwargs = {"temperature": temperature} if temperature is not None else {}
        resp = await client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=max_tokens,
            **kwargs,
        )
        text = resp.choices[0].message.content or ""
        usage = None
        if resp.usage:
            usage = {"prompt_tokens": resp.usage.prompt_tokens, "completion_tokens": resp.usage.completion_tokens}
        gen.update(output=text, usage_details=usage)
        return text

async def _openai_stream(system: str, messages: list[dict], max_tokens: int, trace_name: str = "llm-stream-chat", temperature: float | None = None):
    from openai import AsyncOpenAI
    model = settings.openai_model
    with traced_observation("generation", trace_name, model=model, input={"system": system, "messages": messages}) as gen:
        client = AsyncOpenAI(base_url=settings.openai_base_url, api_key=settings.openai_api_key)
        msgs = [{"role": "system", "content": system}] + list(messages)
        kwargs = {"temperature": temperature} if temperature is not None else {}
        stream = await client.chat.completions.create(
            model=model,
            messages=msgs,
            max_tokens=max_tokens,
            stream=True,
            **kwargs,
        )
        full_text = []
        usage = None
        async for chunk in stream:
            # Some self-hosted OpenAI-compatible servers (vLLM included) omit
            # `choices` entirely on the final chunk instead of sending an
            # empty list — index straight into [0] and this crashes the
            # whole stream on the very last chunk.
            text = chunk.choices[0].delta.content if chunk.choices else None
            if text:
                full_text.append(text)
                yield text
            if chunk.usage:
                usage = {"prompt_tokens": chunk.usage.prompt_tokens, "completion_tokens": chunk.usage.completion_tokens}

        gen.update(output="".join(full_text), usage_details=usage)

# ── Gemini (new google-genai SDK) ────────────────────────────────────────────

def _gemini_client():
    from google import genai
    return genai.Client(api_key=settings.gemini_api_key)

async def _gemini(prompt: str, max_tokens: int, trace_name: str = "llm-generate", temperature: float | None = None) -> str:
    from google.genai import types
    # gemini-2.0-flash-lite was retired by Google on 2026-06-01 — every call
    # would 404. 2.5 flash-lite is the current equivalent low-cost tier.
    model = "gemini-2.5-flash-lite"
    with traced_observation("generation", trace_name, model=model, input={"prompt": prompt}) as gen:
        client = _gemini_client()
        config_kwargs = {"max_output_tokens": max_tokens}
        if temperature is not None:
            config_kwargs["temperature"] = temperature
        response = await client.aio.models.generate_content(
            model=model,
            contents=prompt,
            config=types.GenerateContentConfig(**config_kwargs),
        )
        text = response.text or ""
        usage = None
        if response.usage_metadata:
            usage = {
                "prompt_tokens": response.usage_metadata.prompt_token_count,
                "completion_tokens": response.usage_metadata.candidates_token_count,
            }
        gen.update(output=text, usage_details=usage)
        return text

async def _gemini_stream(system: str, messages: list[dict], max_tokens: int, trace_name: str = "llm-stream-chat", temperature: float | None = None):
    from google.genai import types
    # gemini-2.0-flash-lite was retired by Google on 2026-06-01 — every call
    # would 404. 2.5 flash-lite is the current equivalent low-cost tier.
    model = "gemini-2.5-flash-lite"

    contents = [
        types.Content(
            role="user" if m["role"] == "user" else "model",
            parts=[types.Part(text=m["content"])],
        )
        for m in messages
    ]

    with traced_observation("generation", trace_name, model=model, input={"system": system, "messages": messages}) as gen:
        client = _gemini_client()
        logger.debug("[gemini] streaming %d messages with %s", len(contents), model)
        full_text = []
        usage_meta = None
        config_kwargs = {"system_instruction": system, "max_output_tokens": max_tokens}
        if temperature is not None:
            config_kwargs["temperature"] = temperature
        async for chunk in await client.aio.models.generate_content_stream(
            model=model,
            contents=contents,
            config=types.GenerateContentConfig(**config_kwargs),
        ):
            if chunk.text:
                full_text.append(chunk.text)
                yield chunk.text
            if chunk.usage_metadata:
                usage_meta = chunk.usage_metadata

        usage = None
        if usage_meta:
            usage = {
                "prompt_tokens": usage_meta.prompt_token_count,
                "completion_tokens": usage_meta.candidates_token_count,
            }
        gen.update(output="".join(full_text), usage_details=usage)
