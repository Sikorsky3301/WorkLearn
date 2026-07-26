"""Starter template: IT & Engineering."""

TEMPLATE = {
    "key": "it_engineering",
    "label": "IT & Engineering",
    "description": "Triage a broken-access ticket, fix a buggy script, talk a user through an outage, and write the postmortem.",
    "simulation": {
        "title": "IT Support & Systems Engineer",
        "description": "Triage an incoming IT ticket, fix a bug in a production log-parsing script, talk "
                        "a frustrated employee through a live outage, pass a security/access policy check, "
                        "and write the incident postmortem.",
        "company": "Cascade Systems",
        "domain": "IT & Engineering",
        "category": "IT",
        "accent_color": "bg-cyan-700",
        "difficulty": "Intermediate",
        "estimated_hours": "4",
        "skills": ["Troubleshooting", "Scripting & Debugging", "Incident Communication"],
        "manager": {"name": "Nadia Osei", "role": "IT Operations Manager", "avatar": "NO"},
        "onboarding": {
            "company": {
                "name": "Cascade Systems", "industry": "Cloud Infrastructure",
                "size": "200 employees", "location": "Remote (US)",
                "about": "Cascade Systems runs internal IT and cloud infrastructure for its own SaaS "
                         "product — this team keeps the lights on for 200 engineers and support staff.",
            },
            "intro": "Welcome to IT Operations! You're picking up the on-call queue for your first week. "
                      "Real employees are blocked on real work when a ticket lands on your desk, so we "
                      "care about getting the actual root cause right, not just closing tickets fast.",
            "learn": [
                "How to triage and prioritize an incoming IT ticket",
                "How to debug a real bug in a production script instead of guessing",
                "How to talk a frustrated, blocked employee through a live outage",
                "Core security and access-control judgment calls you're expected to already have",
                "How to write an incident postmortem that actually prevents a repeat",
            ],
            "offer": {
                "title": "IT Support & Systems Engineer — Offer", "role": "Systems Engineer",
                "team": "IT Operations", "company": "Cascade Systems",
                "body": "We'd like to bring you on for a trial week on the on-call rotation.",
            },
        },
        "onboarding_xp_award": 20,
    },
    "tasks": [
        {
            "task_index": 1, "title": "Triage the Broken-Access Ticket", "type": "structured_form",
            "objective": "Correctly categorize and prioritize an incoming IT ticket before acting on it.",
            "briefing": "A ticket just landed with no triage. Priya from Sales says she's locked out of "
                        "the CRM right after a password reset — and she has a client call in 30 minutes. "
                        "Figure out what kind of issue this actually is and how urgent it really is.",
            "what_to_do": [
                "Read the raw ticket in the reference panel.",
                "Pick the category that best matches the actual issue.",
                "Set a priority based on real impact (a blocked client call), not just tone.",
                "Summarize the issue in your own words.",
            ],
            "what_to_submit": ["Issue category", "Priority", "One-sentence summary"],
            "hints": ["An access issue right after a password reset is usually a sync delay or a typo'd new password, not a network problem."],
            "success_criteria": ["Category selected", "Priority set", "Summary written"],
            "reference_data": {
                "title": "Incoming Ticket #5512",
                "fields": [
                    {"label": "From", "value": "priya.nandakumar@cascadesystems.com — Sales"},
                    {"label": "Subject", "value": "Locked out of CRM after password reset — call in 30 min"},
                    {"label": "Message", "value": "I reset my password 10 minutes ago like IT told me to, "
                     "but I still can't log into the CRM. I have a client call in 30 minutes and need my "
                     "notes. This is the second login issue I've had this quarter."},
                ],
            },
            "rubric": None,
            "config": {
                "fields": [
                    {"key": "issue_category", "label": "Issue category", "type": "select",
                     "options": ["Hardware", "Software Bug", "Network", "Access & Permissions"], "required": True},
                    {"key": "priority", "label": "Priority (1 = low, 5 = urgent)", "type": "slider",
                     "min": 1, "max": 5, "required": True},
                    {"key": "summary", "label": "One-sentence summary", "type": "textarea",
                     "min_length": 20, "required": True},
                ],
            },
            "xp_award": 40, "skill_awards": {"communication": 5}, "week": 1,
        },
        {
            "task_index": 2, "title": "Fix the Broken Log-Parser Script", "type": "code_sandbox",
            "objective": "Find and fix a real bug in a production monitoring script.",
            "briefing": "The monitoring script that counts ERROR lines in the app log has been silently "
                        "under-reporting for a week — that's part of why Priya's login issue wasn't "
                        "caught earlier. Read `app.log` and fix `submission.py` so it reports the "
                        "correct error count to `output.json` as `{\"error_count\": <number>}`.",
            "what_to_do": [
                "Read app.log to see what an actual ERROR line looks like.",
                "Find the bug in the starter script's matching logic.",
                "Fix it and confirm the count is correct.",
            ],
            "what_to_submit": ["output.json with the correct error_count"],
            "hints": ["Log levels are conventionally uppercase — check whether the script's string match respects that."],
            "success_criteria": ["error_count correct"],
            "rubric": None,
            "config": {
                "language": "python", "grading_strategy": "declarative_rules", "submission_mode": "code",
                "starter_code": "import json\n\nwith open('app.log') as f:\n    lines = f.readlines()\n\n"
                    "# TODO: this should count lines containing 'ERROR' but doesn't catch any — why?\n"
                    "error_count = sum(1 for line in lines if 'error' in line)\n\n"
                    "with open('output.json', 'w') as f:\n    json.dump({'error_count': error_count}, f)\n",
                "input_filename": "submission.py", "output_filename": "output.json",
                "static_input_files": {
                    "app.log": "2026-01-01 10:00:00 INFO Service started\n"
                        "2026-01-01 10:01:15 ERROR Database connection timeout\n"
                        "2026-01-01 10:01:16 WARNING Retrying connection\n"
                        "2026-01-01 10:01:20 ERROR Database connection timeout\n"
                        "2026-01-01 10:02:00 INFO Connection restored\n"
                        "2026-01-01 10:05:33 ERROR Failed to process request id=4521\n"
                        "2026-01-01 10:10:00 INFO Health check passed\n",
                },
                "rules": [
                    {"id": "r1", "label": "error_count is correct", "field": "error_count", "op": "equals",
                     "points": 100, "expected": 3},
                ],
            },
            "xp_award": 80, "skill_awards": {"python": 15}, "week": 1,
        },
        {
            "task_index": 3, "title": "Talk Priya Through the Outage", "type": "ai_roleplay_chat",
            "objective": "Keep a blocked, time-pressured employee informed while you actually fix the issue.",
            "briefing": "Priya is now on live chat, 20 minutes from her client call and still locked out. "
                        "Keep her informed while you resolve the underlying access issue.",
            "what_to_do": [
                "Acknowledge the time pressure without over-promising a fix time you can't guarantee.",
                "Explain what's actually being checked (sync delay vs. bad password entry).",
                "Confirm she's back in before the conversation ends.",
            ],
            "what_to_submit": ["A completed chat transcript"],
            "hints": ["If she mentions this happened before, don't brush it off — it's a real pattern worth acknowledging."],
            "success_criteria": ["At least 6 messages exchanged"],
            "rubric": None,
            "config": {
                "persona": {
                    "name": "Priya Nandakumar", "role": "Sales Rep, Cascade Systems",
                    "personality_prompt": "You're locked out of the CRM with a client call in 20 minutes "
                        "and climbing anxiety. You're not rude, but you're direct and increasingly "
                        "impatient with vague reassurance. You calm down when given a specific, honest "
                        "explanation and a real ETA — you get more anxious if the rep goes quiet or gives "
                        "generic \"we're looking into it\" responses.",
                    "mood_options": ["anxious", "impatient", "relieved", "neutral"],
                    "opening_mood": "anxious",
                },
                "context": {"ticket": "#5512", "issue": "locked out of CRM after password reset"},
                "context_documents": [
                    {"title": "Account History", "body": "Priya has had 2 prior login issues this quarter — "
                     "once from an expired SSO token, once from a sync delay identical to this one. Neither "
                     "was root-caused at the time."},
                ],
                "mode": "custom",
                "additional_instructions": "If the rep doesn't acknowledge that this has happened before by "
                    "your second reply, bring up the pattern yourself — you're losing confidence that IT "
                    "actually fixes the underlying problem instead of just resetting things.",
                "min_messages_for_completion": 6,
            },
            "xp_award": 70, "skill_awards": {"communication": 10}, "week": 1,
        },
        {
            "task_index": 4, "title": "Security & Access Policy Check", "type": "quiz",
            "objective": "Confirm baseline security judgment before you're trusted with account access.",
            "briefing": "Quick check before you're trusted with resetting anyone's access.",
            "what_to_do": ["Answer each question based on standard IT security practice."],
            "what_to_submit": [], "hints": [], "success_criteria": ["Quiz completed"],
            "rubric": None,
            "config": {
                "questions": [
                    {"question": "Someone calls claiming to be a VP and demands an urgent password reset over the phone, refusing to verify identity through the normal channel. What do you do?",
                     "options": ["Reset it immediately — VPs shouldn't be kept waiting", "Follow the standard identity-verification process regardless of claimed seniority", "Ask a coworker to vouch for them instead"],
                     "correct": 1},
                    {"question": "An employee's account shows 40 failed login attempts overnight from an unfamiliar location. What's the right first move?",
                     "options": ["Ignore it — failed logins are normal", "Lock the account and investigate before any further access is granted", "Just reset their password and move on"],
                     "correct": 1},
                    {"question": "What's the principle behind granting the minimum access someone needs to do their job, and nothing more?",
                     "options": ["Least privilege", "Single sign-on", "Two-factor authentication"],
                     "correct": 0},
                ],
            },
            "xp_award": 30, "skill_awards": {}, "week": 1,
        },
        {
            "task_index": 5, "title": "Write the Incident Postmortem", "type": "text_rubric",
            "objective": "Write a postmortem that actually prevents this from happening again.",
            "briefing": "The login issue is resolved — a sync delay between the password-reset service and "
                        "the CRM's auth cache, made worse by the log-parser bug hiding the real error rate. "
                        "Write the postmortem for the team.",
            "what_to_do": [
                "State the root cause precisely, not just the symptom.",
                "Note the actual impact (who, how long, what was blocked).",
                "Propose a concrete prevention step, not just \"we'll monitor it more.\"",
            ],
            "what_to_submit": ["The incident postmortem"],
            "hints": ["\"We'll be more careful\" is not a prevention step. What would actually catch this earlier next time?"],
            "success_criteria": ["Postmortem drafted", "Graded by AI coach"],
            "rubric": {"root_cause_clarity": 0.35, "impact_and_timeline": 0.3, "prevention_plan": 0.35},
            "config": {
                "grading_mode": "llm",
                "llm_judge_prompt": "Grade this IT incident postmortem. The real root cause was a sync "
                    "delay between the password-reset service and the CRM's auth cache, made worse by a "
                    "bug in the log-parsing script that was undercounting real errors (case-sensitive "
                    "string match missing uppercase ERROR lines). Score 0-100 on: (1) does it state the "
                    "precise root cause rather than just the symptom (\"couldn't log in\"), (2) does it "
                    "clearly state impact and timeline, (3) does it propose a concrete, specific prevention "
                    "step rather than vague \"monitor more closely\" language. Give 2-4 sentences of "
                    "specific feedback. Respond with ONLY JSON: {{\"overall\": <0-100>, \"feedback\": "
                    "\"...\"}}\n\nPostmortem:\n{text}",
            },
            "xp_award": 60, "skill_awards": {"communication": 10}, "week": 1,
        },
    ],
}
