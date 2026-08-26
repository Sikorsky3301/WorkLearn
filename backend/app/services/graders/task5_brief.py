"""Grades Task 5 — Executive Brief. This is the one task with no Docker
sandbox: it's a text submission. Deterministic structural checks run first
(cheap, ungameable-by-fluff), then an LLM-as-judge pass scores the narrative
quality against a fixed rubric using the existing Groq-backed llm.py."""
import json
import re

from app.services.graders import score_from_checks, to_native
from app.ai.services.llm import generate

# Word-family patterns, not literal substrings.
#
# This used to be `all(kw in lower for kw in ["revenue", "recommendation"])`,
# so a brief that said "I recommend pausing the programme" — better prose than
# "My recommendation is to pause the programme" — failed the check for
# covering a recommendation. It measured which part of speech a student
# reached for, not whether they made a call.
REQUIRED_SECTIONS = {
    "revenue": r"\brevenues?\b",
    "a recommendation": r"\brecommend(?:s|ed|ing|ation|ations)?\b",
}

# The task tells the student "one page, <= 400 words" and "exactly 3
# prioritized recommendations" in both what_to_submit and success_criteria.
# The grader checked neither: it enforced an 80-word MINIMUM nobody was told
# about and no maximum at all, so following the stated brief as tightly as
# possible was punished and ignoring the length limit entirely cost nothing.
MIN_WORDS = 80
MAX_WORDS = 400

JUDGE_PROMPT = """\
You are grading a junior data analyst's executive brief for a business review.
Score it 0-40 on these criteria combined:
- Clarity and executive-appropriate tone (skimmable, no jargon dump)
- Uses concrete numbers rather than vague statements
- Draws an actionable recommendation, not just a data recap

Brief:
---
{brief}
---

Respond with ONLY a JSON object: {{"score": <0-40 integer>, "justification": "<one sentence>"}}\
"""


async def grade(text: str | None, reference: dict) -> dict:
    checks = []
    text = (text or "").strip()

    word_count = len(text.split())
    length_ok = MIN_WORDS <= word_count <= MAX_WORDS
    checks.append({
        "id": "length",
        "label": f"One page: between {MIN_WORDS} and {MAX_WORDS} words (yours: {word_count})",
        "points": 15,
        "pass": length_ok,
    })

    lower = text.lower()
    mentions_numbers = bool(re.search(r"\d", text))
    checks.append({"id": "has_numbers", "label": "References concrete numbers", "points": 15, "pass": mentions_numbers})

    sections_ok = all(re.search(pattern, lower) for pattern in REQUIRED_SECTIONS.values())
    checks.append({"id": "sections", "label": "Covers revenue performance and a recommendation", "points": 15, "pass": sections_ok})

    justification = ""
    llm_score = 0
    if text:
        try:
            raw = await generate(JUDGE_PROMPT.format(brief=text[:4000]), max_tokens=150)
            match = re.search(r"\{.*\}", raw, re.DOTALL)
            parsed = json.loads(match.group()) if match else {}
            llm_score = max(0, min(40, int(parsed.get("score", 0))))
            justification = str(parsed.get("justification", ""))
        except Exception as e:
            justification = f"LLM judge unavailable: {e}"
            llm_score = 20 if (length_ok and mentions_numbers and sections_ok) else 0

    checks.append({"id": "llm_judge", "label": "AI review of narrative quality", "points": 40, "pass": llm_score >= 20})
    checks = [{"id": c["id"], "label": c["label"], "points": int(c["points"]), "pass": bool(c["pass"])} for c in checks]

    structural_score = score_from_checks(checks[:-1])
    total = structural_score + llm_score
    return {
        "score": min(100, int(total)),
        "checks": checks,
        "details": to_native({"word_count": word_count, "llm_score": llm_score, "justification": justification}),
    }
