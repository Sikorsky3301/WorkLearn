"""
Unified LLM client — swap between Anthropic and Gemini via AI_PROVIDER env var.
"""
from app.config import settings

async def generate(prompt: str, max_tokens: int = 200) -> str:
    if settings.ai_provider == "gemini":
        return await _gemini(prompt, max_tokens)
    if settings.ai_provider == "groq":
        return await _groq(prompt, max_tokens)
    return await _anthropic(prompt, max_tokens)

async def stream_chat(system: str, messages: list[dict], max_tokens: int = 800):
    """Async generator yielding text chunks."""
    if settings.ai_provider == "gemini":
        async for chunk in _gemini_stream(system, messages, max_tokens):
            yield chunk
    elif settings.ai_provider == "groq":
        async for chunk in _groq_stream(system, messages, max_tokens):
            yield chunk
    else:
        async for chunk in _anthropic_stream(system, messages, max_tokens):
            yield chunk

# ── Anthropic ────────────────────────────────────────────────────────────────

async def _anthropic(prompt: str, max_tokens: int) -> str:
    import anthropic
    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    msg = await client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=max_tokens,
        messages=[{"role": "user", "content": prompt}],
    )
    block = msg.content[0]
    return block.text if block.type == "text" else ""

async def _anthropic_stream(system: str, messages: list[dict], max_tokens: int):
    import anthropic
    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    async with client.messages.stream(
        model="claude-sonnet-4-6",
        max_tokens=max_tokens,
        system=system,
        messages=messages,
    ) as stream:
        async for text in stream.text_stream:
            yield text

# ── Groq ─────────────────────────────────────────────────────────────────────

async def _groq(prompt: str, max_tokens: int) -> str:
    from groq import AsyncGroq
    client = AsyncGroq(api_key=settings.groq_api_key)
    resp = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=max_tokens,
    )
    return resp.choices[0].message.content or ""

async def _groq_stream(system: str, messages: list[dict], max_tokens: int):
    from groq import AsyncGroq
    client = AsyncGroq(api_key=settings.groq_api_key)
    msgs = [{"role": "system", "content": system}] + [
        {"role": m["role"], "content": m["content"]} for m in messages
    ]
    stream = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=msgs,
        max_tokens=max_tokens,
        stream=True,
    )
    async for chunk in stream:
        text = chunk.choices[0].delta.content
        if text:
            yield text

# ── Gemini (new google-genai SDK) ────────────────────────────────────────────

def _gemini_client():
    from google import genai
    return genai.Client(api_key=settings.gemini_api_key)

async def _gemini(prompt: str, max_tokens: int) -> str:
    from google.genai import types
    client = _gemini_client()
    response = await client.aio.models.generate_content(
        model="gemini-2.0-flash-lite",
        contents=prompt,
        config=types.GenerateContentConfig(max_output_tokens=max_tokens),
    )
    return response.text or ""

async def _gemini_stream(system: str, messages: list[dict], max_tokens: int):
    from google.genai import types
    client = _gemini_client()

    contents = [
        types.Content(
            role="user" if m["role"] == "user" else "model",
            parts=[types.Part(text=m["content"])],
        )
        for m in messages
    ]

    print(f"[gemini] streaming {len(contents)} messages with gemini-2.0-flash-lite")
    async for chunk in await client.aio.models.generate_content_stream(
        model="gemini-2.0-flash-lite",
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=system,
            max_output_tokens=max_tokens,
        ),
    ):
        if chunk.text:
            yield chunk.text
