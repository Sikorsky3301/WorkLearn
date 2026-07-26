"""Starter template: Marketing / Content."""

TEMPLATE = {
    "key": "marketing_content",
    "label": "Marketing & Content",
    "description": "Write launch copy, plan a content calendar, and defend your campaign to a skeptical VP.",
    "simulation": {
        "title": "Content Marketing Associate",
        "description": "Write a product launch announcement, plan the surrounding content calendar, "
                        "defend your campaign brief to a skeptical VP, and ship a newsletter — the "
                        "full loop from idea to send.",
        "company": "BrightWave Marketing",
        "domain": "Marketing",
        "category": "Content",
        "accent_color": "bg-fuchsia-600",
        "difficulty": "Beginner",
        "estimated_hours": "3",
        "skills": ["Copywriting", "Content Strategy", "Stakeholder Communication"],
        "manager": {"name": "Jordan Silva", "role": "Content Marketing Manager", "avatar": "JS"},
        "onboarding": {
            "company": {
                "name": "BrightWave Marketing", "industry": "B2B Marketing Agency",
                "size": "45 employees", "location": "Austin, TX",
                "about": "BrightWave runs content and launch marketing for a roster of B2B SaaS clients.",
            },
            "intro": "Glad to have you! You're picking up our newest client's product launch. "
                      "Move fast, but everything you write represents their brand, not ours — so "
                      "get the voice right.",
            "learn": [
                "How to write launch copy that actually gets read",
                "How to plan a realistic content calendar",
                "How to defend a creative decision to a skeptical stakeholder",
                "How brand voice guidelines actually get applied, not just referenced",
                "How to write a newsletter that earns the next open",
            ],
            "offer": {
                "title": "Content Marketing Associate — Offer", "role": "Content Associate",
                "team": "Client Content", "company": "BrightWave Marketing",
                "body": "We'd like you to run point on this launch as a trial project.",
            },
        },
        "onboarding_xp_award": 20,
    },
    "tasks": [
        {
            "task_index": 1, "title": "Write the Launch Announcement", "type": "text_rubric",
            "objective": "Write a social launch post that hooks in the first line and drives clicks.",
            "briefing": "Our client is launching \"Fieldstone,\" a project-tracking tool for "
                        "construction teams, next Tuesday. Write the primary launch post for LinkedIn.",
            "what_to_do": [
                "Open with a hook, not a company name.",
                "Name the specific pain point construction PMs actually have.",
                "End with a clear call to action.",
            ],
            "what_to_submit": ["The launch post copy"],
            "hints": ["\"We're excited to announce...\" is a hook-killer. Cut it."],
            "success_criteria": ["Post drafted", "Graded by AI coach"],
            "rubric": {"hook": 0.35, "tone": 0.3, "cta": 0.35},
            "config": {
                "grading_mode": "llm",
                "llm_judge_prompt": "Grade this LinkedIn launch post for a construction project-"
                    "tracking tool called Fieldstone. Score 0-100 on: (1) hook strength in the first "
                    "line, (2) whether the tone matches a practical, no-nonsense B2B construction "
                    "audience (not generic startup hype), (3) clarity and strength of the call to "
                    "action. Give 2-4 sentences of specific feedback. Respond with ONLY JSON: "
                    "{{\"overall\": <0-100>, \"feedback\": \"...\"}}\n\nPost:\n{text}",
            },
            "xp_award": 60, "skill_awards": {"communication": 10}, "week": 1,
        },
        {
            "task_index": 2, "title": "Plan the Content Calendar", "type": "structured_form",
            "objective": "Plan the two weeks of content surrounding the launch.",
            "briefing": "One post isn't a launch strategy. Plan the surrounding content so the "
                        "announcement doesn't land in silence.",
            "what_to_do": [
                "Pick the primary channel for follow-up content.",
                "Set a realistic publish window.",
                "State the actual goal of this content wave, not just \"awareness.\"",
            ],
            "what_to_submit": ["Channel", "Publish window", "Goal"],
            "hints": [], "success_criteria": ["Plan submitted"],
            "rubric": None,
            "config": {
                "fields": [
                    {"key": "channel", "label": "Primary follow-up channel", "type": "select",
                     "options": ["LinkedIn", "Email newsletter", "Industry blog", "Webinar"], "required": True},
                    {"key": "publish_window", "label": "Publish window", "type": "text", "required": True},
                    {"key": "goal", "label": "What does this content wave actually need to achieve?", "type": "textarea", "min_length": 20, "required": True},
                ],
            },
            "xp_award": 40, "skill_awards": {"communication": 5}, "week": 1,
        },
        {
            "task_index": 3, "title": "Defend the Brief", "type": "ai_roleplay_chat",
            "objective": "Justify your campaign angle to a stakeholder who thinks it's too niche.",
            "briefing": "Priya, the client's VP of Marketing, thinks your \"built for construction "
                        "PMs specifically\" angle is too narrow and wants broader messaging. Defend "
                        "your reasoning — or adjust it if she raises something real.",
            "what_to_do": [
                "Explain why specificity beats broad messaging for this audience.",
                "Listen for anything legitimately valid in her pushback.",
                "Land on a decision, don't just talk past each other.",
            ],
            "what_to_submit": ["A completed conversation"],
            "hints": ["She's not wrong to worry about niche messaging limiting reach — engage the actual tradeoff."],
            "success_criteria": ["At least 6 messages exchanged"],
            "rubric": None,
            "config": {
                "persona": {
                    "name": "Priya Patel", "role": "VP of Marketing, client-side",
                    "personality_prompt": "You think the construction-PM-specific angle is too narrow "
                        "and are worried about limiting reach. You're not hostile, but you push back "
                        "hard on anything that sounds like it's just \"trust me.\" You respond well to "
                        "specific reasoning (e.g. data, audience logic) and get more skeptical if the "
                        "rep gets defensive or vague.",
                    "mood_options": ["skeptical", "curious", "convinced", "neutral"],
                    "opening_mood": "skeptical",
                },
                "context": {"campaign": "Fieldstone launch", "disagreement": "niche vs. broad messaging angle"},
                "mode": "objection",
                "min_messages_for_completion": 6,
            },
            "xp_award": 70, "skill_awards": {"communication": 10}, "week": 1,
        },
        {
            "task_index": 4, "title": "Brand Voice Check", "type": "quiz",
            "objective": "Confirm you understand the client's brand voice guidelines before writing more copy.",
            "briefing": "Quick check before you write the newsletter.",
            "what_to_do": ["Answer based on the brand voice guide you were given."],
            "what_to_submit": [], "hints": [], "success_criteria": ["Quiz completed"],
            "rubric": None,
            "config": {
                "questions": [
                    {"question": "Fieldstone's brand voice is described as \"practical, not hype-driven.\" Which headline fits better?",
                     "options": ["\"Revolutionize Your Entire Workflow Forever\"", "\"Stop Losing Track of Change Orders\"", "\"The Future of Construction is Here\""],
                     "correct": 1},
                    {"question": "The style guide says to avoid jargon the audience wouldn't use themselves. Which term is safer for this audience?",
                     "options": ["\"Synergize your stakeholder alignment\"", "\"Change order\"", "\"Leverage cross-functional bandwidth\""],
                     "correct": 1},
                ],
            },
            "xp_award": 30, "skill_awards": {}, "week": 1,
        },
        {
            "task_index": 5, "title": "Write the Email Newsletter", "type": "text_rubric",
            "objective": "Write a launch-week newsletter with a subject line that earns the open.",
            "briefing": "Wrap up launch week with a newsletter to the existing customer base.",
            "what_to_do": [
                "Write a subject line that isn't generic (\"New Feature Alert\" is out).",
                "Write body copy that gets to the point fast.",
                "Include one clear CTA.",
            ],
            "what_to_submit": ["Subject", "Body", "CTA"],
            "hints": [], "success_criteria": ["Newsletter drafted", "Graded by AI coach"],
            "rubric": {"subject_line": 0.3, "body_clarity": 0.4, "cta": 0.3},
            "config": {
                "grading_mode": "llm",
                "fields": [
                    {"key": "subject", "label": "Subject line", "type": "text", "required": True},
                    {"key": "body", "label": "Body", "type": "textarea", "required": True},
                    {"key": "cta", "label": "Call to action", "type": "text", "required": True},
                ],
                "llm_judge_prompt": "Grade this launch-week newsletter for existing customers of "
                    "Fieldstone (a construction project-tracking tool). Score 0-100 on: (1) subject "
                    "line strength — is it specific and non-generic, (2) whether the body gets to the "
                    "point quickly and clearly, (3) CTA strength. Give 2-4 sentences of feedback. "
                    "Respond with ONLY JSON: {{\"overall\": <0-100>, \"feedback\": \"...\"}}\n\n"
                    "Subject: {subject}\nBody: {body}\nCTA: {cta}",
            },
            "xp_award": 60, "skill_awards": {"communication": 10}, "week": 1,
        },
    ],
}
