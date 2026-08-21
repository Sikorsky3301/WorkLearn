"""
Quick manual check — run this to verify your AI key works before starting
the full server. Not part of the pytest suite (see tests/) — this hits a
real provider and prints output for a human to read, it has no assertions.
Usage: python check_ai_provider.py
"""

import asyncio
from dotenv import load_dotenv
load_dotenv()

from app.core.config import settings

async def main():
    print(f"AI Provider : {settings.ai_provider}")
    print(f"Key present : {'YES' if (settings.gemini_api_key or settings.anthropic_api_key) else 'NO — check .env'}")
    print()

    test_prompt = "Say hello in exactly 5 words."
    print(f"Sending: '{test_prompt}'")
    print("Response: ", end="", flush=True)

    from app.ai.services.llm import generate
    try:
        reply = await generate(test_prompt, max_tokens=50)
        print(reply)
        print("\n[OK] AI is working!")
    except Exception as e:
        # Plain ASCII, not a unicode checkmark/cross — Windows' default
        # console codepage (cp1252) can't encode those and would crash this
        # print with a UnicodeEncodeError, hiding the actual error above it.
        print(f"\n[FAIL] Error: {e}")
        if "API_KEY" in str(e).upper() or "invalid" in str(e).lower() or "auth" in str(e).lower():
            print("\nKey issue — make sure your key in .env:")
            print("  Gemini keys start with 'AIza' (get from aistudio.google.com)")
            print("  Anthropic keys start with 'sk-ant-'")

asyncio.run(main())
