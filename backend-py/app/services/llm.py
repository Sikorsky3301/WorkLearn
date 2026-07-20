"""
Unified LLM client — swap between Anthropic, Gemini, and Groq via AI_PROVIDER
env var. Every provider call is wrapped in a Langfuse "generation" observation
(model, input, output, token usage) — see app/services/langfuse_client.py.
Tracing is a no-op when Langfuse isn't configured (see langfuse_enabled).
"""
from app.config import settings
from app.services.langfuse_client import traced_observation

async def generate(prompt: str, max_tokens: int = 200, trace_name: str = "llm-generate") -> str:
    if settings.ai_provider == "gemini":
        return await _gemini(prompt, max_tokens, trace_name)
    if settings.ai_provider == "groq":
        return await _groq(prompt, max_tokens, trace_name)
    return await _anthropic(prompt, max_tokens, trace_name)

async def stream_chat(system: str, messages: list[dict], max_tokens: int = 800, trace_name: str = "llm-stream-chat"):
    """Async generator yielding text chunks."""
    if settings.ai_provider == "gemini":
        async for chunk in _gemini_stream(system, messages, max_tokens, trace_name):
            yield chunk
    elif settings.ai_provider == "groq":
        async for chunk in _groq_stream(system, messages, max_tokens, trace_name):
            yield chunk
    else:
        async for chunk in _anthropic_stream(system, messages, max_tokens, trace_name):
            yield chunk

# ── Anthropic ────────────────────────────────────────────────────────────────

async def _anthropic(prompt: str, max_tokens: int, trace_name: str = "llm-generate") -> str:
    import anthropic
    model = "claude-haiku-4-5-20251001"
    with traced_observation("generation", trace_name, model=model, input={"prompt": prompt}) as gen:
        client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        msg = await client.messages.create(
            model=model,
            max_tokens=max_tokens,
            messages=[{"role": "user", "content": prompt}],
        )
        block = msg.content[0]
        text = block.text if block.type == "text" else ""
        gen.update(
            output=text,
            usage_details={"prompt_tokens": msg.usage.input_tokens, "completion_tokens": msg.usage.output_tokens},
        )
        return text

async def _anthropic_stream(system: str, messages: list[dict], max_tokens: int, trace_name: str = "llm-stream-chat"):
    import anthropic
    model = "claude-sonnet-4-6"
    with traced_observation("generation", trace_name, model=model, input={"system": system, "messages": messages}) as gen:
        client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        full_text = []
        async with client.messages.stream(
            model=model,
            max_tokens=max_tokens,
            system=system,
            messages=messages,
        ) as stream:
            async for text in stream.text_stream:
                full_text.append(text)
                yield text
            final = await stream.get_final_message()

        usage = {"prompt_tokens": final.usage.input_tokens, "completion_tokens": final.usage.output_tokens} if final else None
        gen.update(output="".join(full_text), usage_details=usage)

# ── Groq ─────────────────────────────────────────────────────────────────────

async def _groq(prompt: str, max_tokens: int, trace_name: str = "llm-generate") -> str:
    from groq import AsyncGroq
    model = "llama-3.3-70b-versatile"
    with traced_observation("generation", trace_name, model=model, input={"prompt": prompt}) as gen:
        client = AsyncGroq(api_key=settings.groq_api_key)
        resp = await client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=max_tokens,
        )
        text = resp.choices[0].message.content or ""
        usage = None
        if resp.usage:
            usage = {"prompt_tokens": resp.usage.prompt_tokens, "completion_tokens": resp.usage.completion_tokens}
        gen.update(output=text, usage_details=usage)
        return text

async def _groq_stream(system: str, messages: list[dict], max_tokens: int, trace_name: str = "llm-stream-chat"):
    from groq import AsyncGroq
    model = "llama-3.3-70b-versatile"
    with traced_observation("generation", trace_name, model=model, input={"system": system, "messages": messages}) as gen:
        client = AsyncGroq(api_key=settings.groq_api_key)
        msgs = [{"role": "system", "content": system}] + [
            {"role": m["role"], "content": m["content"]} for m in messages
        ]
        stream = await client.chat.completions.create(
            model=model,
            messages=msgs,
            max_tokens=max_tokens,
            stream=True,
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

# ── Gemini (new google-genai SDK) ────────────────────────────────────────────

def _gemini_client():
    from google import genai
    return genai.Client(api_key=settings.gemini_api_key)

async def _gemini(prompt: str, max_tokens: int, trace_name: str = "llm-generate") -> str:
    from google.genai import types
    # gemini-2.0-flash-lite was retired by Google on 2026-06-01 — every call
    # would 404. 2.5 flash-lite is the current equivalent low-cost tier.
    model = "gemini-2.5-flash-lite"
    with traced_observation("generation", trace_name, model=model, input={"prompt": prompt}) as gen:
        client = _gemini_client()
        response = await client.aio.models.generate_content(
            model=model,
            contents=prompt,
            config=types.GenerateContentConfig(max_output_tokens=max_tokens),
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

async def _gemini_stream(system: str, messages: list[dict], max_tokens: int, trace_name: str = "llm-stream-chat"):
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
        print(f"[gemini] streaming {len(contents)} messages with {model}")
        full_text = []
        usage_meta = None
        async for chunk in await client.aio.models.generate_content_stream(
            model=model,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system,
                max_output_tokens=max_tokens,
            ),
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
