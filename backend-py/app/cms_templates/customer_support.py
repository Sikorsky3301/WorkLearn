"""Starter template: Customer Support. Instantiated via
POST /api/admin/simulations/from-template/customer_support — see
app/routes/admin_simulations.py."""

TEMPLATE = {
    "key": "customer_support",
    "label": "Customer Support",
    "description": "Triage tickets, calm an upset customer, and close the loop end to end.",
    "simulation": {
        "title": "Customer Support Associate",
        "description": "Handle a real support queue at Orbit Support — triage an inbound ticket, "
                        "write a first response, talk an upset customer through a billing issue, "
                        "and close the loop with a clean resolution log.",
        "company": "Orbit Support",
        "domain": "Customer Support",
        "category": "Support",
        "accent_color": "bg-sky-600",
        "difficulty": "Beginner",
        "estimated_hours": "3",
        "skills": ["Customer Empathy", "Written Communication", "Escalation Judgment"],
        "manager": {"name": "Maya Chen", "role": "Support Team Lead", "avatar": "MC"},
        "onboarding": {
            "company": {
                "name": "Orbit Support", "industry": "SaaS Help-Desk Tooling",
                "size": "120 employees", "location": "Remote (US)",
                "about": "Orbit Support builds the help-desk platform mid-market SaaS companies "
                         "use to manage their own customer tickets — so our own support queue is "
                         "the best advertisement we have.",
            },
            "intro": "Welcome to the team! You're joining our Tier 1 queue for your first week. "
                      "Every ticket you touch is a real customer waiting on an answer, so we care "
                      "more about clarity and empathy than speed — get it right, not just fast.",
            "learn": [
                "How to triage and prioritize an inbound ticket",
                "How to write a first response that actually de-escalates",
                "How to talk a frustrated customer through a real issue live",
                "When to escalate vs. resolve directly",
                "How to close a ticket with a clean, searchable resolution log",
            ],
            "offer": {
                "title": "Customer Support Associate — Offer", "role": "Support Associate",
                "team": "Tier 1 Support", "company": "Orbit Support",
                "body": "We'd like to bring you on for a trial week on the Tier 1 queue. You'll "
                        "shadow real ticket types (billing, bugs, how-to, account access) and be "
                        "expected to work independently by the end of the week.",
            },
        },
        "onboarding_xp_award": 20,
    },
    "tasks": [
        {
            "task_index": 1, "title": "Triage the Inbound Ticket", "type": "structured_form",
            "objective": "Correctly categorize and prioritize a raw inbound ticket before responding.",
            "briefing": "A ticket just landed in the queue with no categorization. Before you write "
                        "a single word to the customer, figure out what kind of issue this actually "
                        "is and how urgent it is — misrouting a billing issue as a bug wastes "
                        "everyone's time.",
            "what_to_do": [
                "Read the raw ticket text in the reference panel.",
                "Pick the issue category that best matches what the customer is actually describing.",
                "Set a priority level based on impact, not just tone.",
                "Summarize the issue in your own words in one or two sentences.",
            ],
            "what_to_submit": ["Issue category", "Priority", "One-sentence summary"],
            "hints": ["A customer who sounds calm can still have a high-priority issue (e.g. being double-charged)."],
            "success_criteria": ["Category selected", "Priority set", "Summary written"],
            "reference_data": {
                "title": "Incoming Ticket #4821",
                "fields": [
                    {"label": "From", "value": "dana.whitfield@northfield-labs.com"},
                    {"label": "Subject", "value": "Charged twice for annual plan??"},
                    {"label": "Message", "value": "Hi, I just noticed two charges of $1,188 on my card "
                     "this morning instead of one. I need this fixed before my finance team notices. "
                     "This is the second billing issue this year."},
                ],
            },
            "rubric": None,
            "config": {
                "fields": [
                    {"key": "issue_category", "label": "Issue category", "type": "select",
                     "options": ["Billing", "Bug Report", "How-to Question", "Account Access"], "required": True},
                    {"key": "priority", "label": "Priority (1 = low, 5 = urgent)", "type": "slider",
                     "min": 1, "max": 5, "required": True},
                    {"key": "summary", "label": "One-sentence summary", "type": "textarea",
                     "min_length": 20, "required": True},
                ],
            },
            "xp_award": 40, "skill_awards": {"communication": 5}, "week": 1,
        },
        {
            "task_index": 2, "title": "Draft the First Response", "type": "text_rubric",
            "objective": "Write a first response that acknowledges the issue and sets a clear next step.",
            "briefing": "Dana is understandably frustrated about being double-charged, and mentions "
                        "this is the second billing issue this year. Your first response sets the "
                        "tone for the whole interaction — get the empathy right and give a concrete "
                        "next step, don't just apologize and go quiet.",
            "what_to_do": [
                "Acknowledge the specific issue (double charge) and the frustration, not generically.",
                "Explain what you're going to do about it (e.g. investigate and refund the duplicate charge).",
                "Give a concrete timeframe.",
            ],
            "what_to_submit": ["Your first response email to Dana"],
            "hints": ["Avoid corporate-speak like \"We apologize for any inconvenience.\" Be specific."],
            "success_criteria": ["Response drafted", "Graded by AI coach"],
            "rubric": {"empathy": 0.4, "clarity": 0.3, "next_steps": 0.3},
            "config": {
                "grading_mode": "llm",
                "llm_judge_prompt": "You are grading a customer support first-response email. The "
                    "customer, Dana, was double-charged $1,188 for an annual plan and mentioned this "
                    "is her second billing issue this year. Grade this response 0-100 on: (1) does it "
                    "acknowledge the SPECIFIC issue and frustration rather than generic corporate "
                    "language, (2) does it clearly state what will be done about it, (3) does it give "
                    "a concrete timeframe. Give 2-4 sentences of specific feedback. Respond with ONLY "
                    "JSON: {{\"overall\": <0-100>, \"feedback\": \"...\"}}\n\nResponse:\n{text}",
            },
            "xp_award": 60, "skill_awards": {"communication": 10}, "week": 1,
        },
        {
            "task_index": 3, "title": "Talk Dana Through It", "type": "ai_roleplay_chat",
            "objective": "De-escalate a live conversation with the upset customer and confirm a resolution.",
            "briefing": "Dana is now on live chat, following up on your first response. Walk her "
                        "through what you found and confirm she's satisfied before you close things out.",
            "what_to_do": [
                "Confirm the duplicate charge and explain the refund timeline.",
                "Address her comment about this being the second issue this year without being defensive.",
                "Confirm she's satisfied before ending the conversation.",
            ],
            "what_to_submit": ["A completed chat transcript"],
            "hints": ["If she brings up canceling, don't panic-discount — address the actual trust issue first."],
            "success_criteria": ["At least 6 messages exchanged"],
            "rubric": None,
            "config": {
                "persona": {
                    "name": "Dana Whitfield", "role": "Customer, Northfield Labs",
                    "personality_prompt": "You were charged twice for your annual plan ($1,188 extra) "
                        "and this is the second billing issue you've had this year. You're frustrated "
                        "but not irrational — you want a real explanation and a refund timeline, and "
                        "you're specifically annoyed if the rep sounds scripted or doesn't acknowledge "
                        "this has happened before. You soften once you get a concrete answer and a "
                        "real timeframe, but push back on vague reassurance.",
                    "mood_options": ["annoyed", "skeptical", "neutral", "relieved"],
                    "opening_mood": "annoyed",
                },
                "context": {"order_id": "INV-88213", "issue": "double-charged for annual plan, second billing issue this year"},
                "mode": "custom",
                "min_messages_for_completion": 6,
            },
            "xp_award": 70, "skill_awards": {"communication": 10}, "week": 1,
        },
        {
            "task_index": 4, "title": "Escalation Policy Check", "type": "quiz",
            "objective": "Know when to escalate a ticket vs. resolve it yourself.",
            "briefing": "Before you're trusted with the full queue, let's confirm you know Orbit's "
                        "escalation policy.",
            "what_to_do": ["Answer each question based on the escalation policy you were given."],
            "what_to_submit": [], "hints": [], "success_criteria": ["Quiz completed"],
            "rubric": None,
            "config": {
                "questions": [
                    {"question": "A customer threatens to cancel over a billing error you can fix yourself. Do you escalate?",
                     "options": ["Yes, always escalate cancellation threats", "No, resolve it and note the threat in the ticket", "Only if they ask for a manager"],
                     "correct": 1},
                    {"question": "A refund request is for $1,188 — Tier 1 can approve refunds up to $500. What do you do?",
                     "options": ["Approve it anyway since the customer is upset", "Escalate to a Tier 2 approver with the ticket context", "Tell the customer to wait indefinitely"],
                     "correct": 1},
                    {"question": "A customer reports a possible security issue (their account was accessed from an unfamiliar location). What's the right move?",
                     "options": ["Handle it like a normal billing question", "Escalate immediately to the security on-call rotation", "Ask them to change their password and close the ticket"],
                     "correct": 1},
                ],
            },
            "xp_award": 30, "skill_awards": {}, "week": 1,
        },
        {
            "task_index": 5, "title": "Log Resolution & Close Ticket", "type": "structured_form",
            "objective": "Close the ticket with a resolution log a future teammate could actually use.",
            "briefing": "Dana's issue is resolved. Log it properly so if she writes back in a month, "
                        "whoever picks up the ticket isn't starting from zero.",
            "what_to_do": [
                "Record the root cause of the double charge.",
                "Write a resolution summary.",
                "Flag whether a follow-up is needed (e.g. to confirm the refund posted).",
            ],
            "what_to_submit": ["Root cause", "Resolution summary", "Follow-up flag"],
            "hints": [], "success_criteria": ["Ticket logged and closed"],
            "rubric": None,
            "config": {
                "fields": [
                    {"key": "root_cause", "label": "Root cause", "type": "select",
                     "options": ["Duplicate billing run", "Manual entry error", "Plan upgrade double-fired", "Other"], "required": True},
                    {"key": "resolution", "label": "Resolution summary", "type": "textarea", "min_length": 20, "required": True},
                    {"key": "follow_up_needed", "label": "Follow-up needed to confirm refund posted", "type": "checkbox"},
                ],
            },
            "xp_award": 40, "skill_awards": {"communication": 5}, "week": 1,
        },
    ],
}
