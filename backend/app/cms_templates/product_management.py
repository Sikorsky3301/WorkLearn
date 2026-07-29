"""Starter template: Product Management."""

TEMPLATE = {
    "key": "product_management",
    "label": "Product Management",
    "description": "Scope a PRD, defend it against engineering pushback, prioritize with data, and update stakeholders.",
    "simulation": {
        "title": "Associate Product Manager",
        "description": "Scope a one-pager, defend the scope against an engineer pushing back, apply "
                        "a prioritization framework, write a stakeholder update, and use real usage "
                        "data to justify a call.",
        "company": "Fieldstone Product",
        "domain": "Product Management",
        "category": "Product",
        "accent_color": "bg-indigo-600",
        "difficulty": "Intermediate",
        "estimated_hours": "4",
        "skills": ["Scoping", "Prioritization", "Stakeholder Communication"],
        "manager": {"name": "Renee Ibarra", "role": "Director of Product", "avatar": "RI"},
        "onboarding": {
            "company": {
                "name": "Fieldstone Product", "industry": "B2B SaaS — Construction Tech",
                "size": "90 employees", "location": "Remote (US)",
                "about": "Fieldstone builds project-tracking software for construction teams.",
            },
            "intro": "Welcome to the team! You're picking up a feature request that's been sitting "
                      "in the backlog — change-order tracking. Let's figure out if and how we build it.",
            "learn": [
                "How to scope a one-pager before writing a full PRD",
                "How to hold a scope decision under real engineering pushback",
                "How to apply a prioritization framework instead of gut feel",
                "How to write a stakeholder update that doesn't bury the lede",
                "How to use real usage data to justify a prioritization call",
            ],
            "offer": {
                "title": "Associate Product Manager — Offer", "role": "Associate PM",
                "team": "Core Product", "company": "Fieldstone Product",
                "body": "We'd like you to own the change-order tracking feature as a trial project.",
            },
        },
        "onboarding_xp_award": 20,
    },
    "tasks": [
        {
            "task_index": 1, "title": "Scope the One-Pager", "type": "structured_form",
            "objective": "Write a tight problem/goal/non-goals scope before any design or engineering work starts.",
            "briefing": "Change-order tracking has been requested by three different customers. Before "
                        "anyone builds anything, scope exactly what this feature is and isn't.",
            "what_to_do": [
                "State the actual problem, not the requested solution.",
                "Set one measurable success metric.",
                "Explicitly state what's out of scope for v1.",
            ],
            "what_to_submit": ["Problem", "Goal", "Non-goals", "Success metric"],
            "hints": ["\"Customers want change-order tracking\" is the request, not the problem. What's the underlying pain?"],
            "success_criteria": ["One-pager scoped"],
            "rubric": None,
            "config": {
                "fields": [
                    {"key": "problem", "label": "Problem statement", "type": "textarea", "min_length": 20, "required": True},
                    {"key": "goal", "label": "Goal", "type": "textarea", "min_length": 15, "required": True},
                    {"key": "non_goals", "label": "Explicitly out of scope for v1", "type": "textarea", "min_length": 15, "required": True},
                    {"key": "success_metric", "label": "Success metric", "type": "text", "required": True},
                ],
            },
            "xp_award": 50, "skill_awards": {"communication": 10}, "week": 1,
        },
        {
            "task_index": 2, "title": "Defend the Scope", "type": "ai_roleplay_chat",
            "objective": "Hold a scope decision under real technical pushback without being inflexible.",
            "briefing": "Marcus, a backend engineer, thinks your v1 scope is going to require a much "
                        "bigger data-model change than you think. Work through it with him.",
            "what_to_do": [
                "Understand the actual technical concern before defending your scope.",
                "Distinguish between \"this is hard\" and \"this is out of scope for v1.\"",
                "Land on a decision — cut scope, extend timeline, or push back with reasoning.",
            ],
            "what_to_submit": ["A completed conversation"],
            "hints": ["Don't just repeat your scope louder — actually engage the technical concern."],
            "success_criteria": ["At least 6 messages exchanged"],
            "rubric": None,
            "config": {
                "persona": {
                    "name": "Marcus Lee", "role": "Backend Engineer",
                    "personality_prompt": "You think the v1 scope for change-order tracking implies a "
                        "bigger data-model migration than the PM realizes, because change orders need "
                        "to link to existing project records that weren't designed for versioning. "
                        "You're not trying to kill the feature — you want the PM to either genuinely "
                        "understand the tradeoff or cut scope further. You respond well to a PM who "
                        "asks real technical questions instead of just repeating the business case.",
                    "mood_options": ["skeptical", "engaged", "frustrated", "satisfied"],
                    "opening_mood": "skeptical",
                },
                "context": {"feature": "change-order tracking v1", "concern": "data-model migration scope"},
                "mode": "objection",
                "min_messages_for_completion": 6,
            },
            "xp_award": 70, "skill_awards": {"communication": 10}, "week": 1,
        },
        {
            "task_index": 3, "title": "Prioritization Framework Check", "type": "quiz",
            "objective": "Apply RICE/MoSCoW correctly instead of prioritizing by gut feel or loudest voice.",
            "briefing": "Quick check before you write the stakeholder update.",
            "what_to_do": ["Answer each question."],
            "what_to_submit": [], "hints": [], "success_criteria": ["Quiz completed"],
            "rubric": None,
            "config": {
                "questions": [
                    {"question": "In the RICE framework, what does the 'C' stand for?",
                     "options": ["Cost", "Confidence", "Complexity"],
                     "correct": 1},
                    {"question": "A feature has huge reach but the team has low confidence in the impact estimate. What should you do?",
                     "options": ["Prioritize it anyway since reach is high", "Discount the score using the confidence factor", "Ignore confidence — it's not a real input"],
                     "correct": 1},
                    {"question": "In MoSCoW, a 'Should have' that gets cut from the release due to time should be treated as:",
                     "options": ["A failure of the release", "A deliberate, communicated scope decision", "Automatically pushed to a hotfix"],
                     "correct": 1},
                ],
            },
            "xp_award": 30, "skill_awards": {}, "week": 1,
        },
        {
            "task_index": 4, "title": "Write the Stakeholder Update", "type": "text_rubric",
            "objective": "Write a status update that leads with the decision, not the process.",
            "briefing": "Update leadership on where change-order tracking stands after the scope "
                        "conversation with engineering.",
            "what_to_do": [
                "Lead with the current status/decision, not a chronological narrative.",
                "State what changed in scope and why.",
                "Give a clear next milestone.",
            ],
            "what_to_submit": ["The stakeholder update"],
            "hints": ["Don't bury the decision in paragraph three."],
            "success_criteria": ["Update drafted", "Graded by AI coach"],
            "rubric": {"leads_with_decision": 0.4, "clarity": 0.3, "next_steps": 0.3},
            "config": {
                "grading_mode": "llm",
                "llm_judge_prompt": "Grade this stakeholder update about the change-order tracking "
                    "feature's scope, written after a scope negotiation with engineering. Score 0-100 "
                    "on: (1) whether it leads with the current status/decision rather than a "
                    "chronological narrative, (2) overall clarity for a leadership audience, (3) "
                    "whether it states a clear next milestone. Give 2-4 sentences of feedback. Respond "
                    "with ONLY JSON: {{\"overall\": <0-100>, \"feedback\": \"...\"}}\n\nUpdate:\n{text}",
            },
            "xp_award": 60, "skill_awards": {"communication": 10}, "week": 1,
        },
        {
            "task_index": 5, "title": "Justify the Call With Data", "type": "code_sandbox",
            "objective": "Use real usage data instead of opinion to justify a prioritization call.",
            "briefing": "Read `usage.csv` (feature-request votes by customer segment) and compute the "
                        "total vote count for the 'Enterprise' segment, writing it to `output.json` as "
                        "`{\"enterprise_votes\": <number>}`.",
            "what_to_do": [
                "Read usage.csv.",
                "Filter to the Enterprise segment.",
                "Sum the votes column and write the result to output.json.",
            ],
            "what_to_submit": ["output.json with the correct enterprise_votes"],
            "hints": [], "success_criteria": ["enterprise_votes correct within tolerance"],
            "rubric": None,
            "config": {
                "language": "python", "grading_strategy": "declarative_rules", "submission_mode": "code",
                "starter_code": "import csv, json\n\nwith open('usage.csv') as f:\n    rows = list(csv.DictReader(f))\n\n# TODO: sum 'votes' for rows where segment == 'Enterprise'\nenterprise_votes = 0\n\nwith open('output.json', 'w') as f:\n    json.dump({'enterprise_votes': enterprise_votes}, f)\n",
                "input_filename": "submission.py", "output_filename": "output.json",
                "static_input_files": {
                    "usage.csv": "segment,votes\nEnterprise,42\nSMB,18\nEnterprise,15\nSMB,9\nEnterprise,8\n",
                },
                "rules": [
                    {"id": "r1", "label": "enterprise_votes is correct", "field": "enterprise_votes",
                     "op": "tolerance", "points": 100, "expected": 65, "tolerance_pct": 0.01},
                ],
            },
            "xp_award": 80, "skill_awards": {"analytics": 15}, "week": 1,
        },
    ],
}
