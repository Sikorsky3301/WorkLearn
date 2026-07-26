"""Starter template: Healthcare Administration (non-clinical operations —
scheduling/billing/patient-services coordination, not diagnosis or care)."""

TEMPLATE = {
    "key": "healthcare_admin",
    "label": "Healthcare Administration",
    "description": "Verify insurance, calm an anxious patient about billing, and manage the day's schedule.",
    "simulation": {
        "title": "Patient Services Coordinator",
        "description": "Verify a patient's insurance, talk an anxious patient through a billing "
                        "concern, pass a HIPAA/compliance check, write a claim appeal letter, and "
                        "prioritize a day's appointment schedule.",
        "company": "Willowbrook Health Partners",
        "domain": "Healthcare Administration",
        "category": "Operations",
        "accent_color": "bg-teal-700",
        "difficulty": "Beginner",
        "estimated_hours": "3",
        "skills": ["Patient Communication", "Compliance Awareness", "Scheduling Judgment"],
        "manager": {"name": "Denise Coleman", "role": "Patient Services Manager", "avatar": "DC"},
        "onboarding": {
            "company": {
                "name": "Willowbrook Health Partners", "industry": "Multi-Specialty Outpatient Clinic",
                "size": "150 employees", "location": "Portland, OR",
                "about": "Willowbrook runs three outpatient clinics — this role is entirely "
                         "administrative and operational, not clinical.",
            },
            "intro": "Welcome to the front office team! This role is the first and last touchpoint "
                      "most patients have with us — get the details right and be patient with people "
                      "who are often anxious or in pain.",
            "learn": [
                "How to properly verify insurance before an appointment",
                "How to talk an anxious patient through a billing concern",
                "HIPAA and compliance basics you're expected to already know",
                "How to write a claim appeal letter that actually gets read",
                "How to prioritize a day's schedule when things go sideways",
            ],
            "offer": {
                "title": "Patient Services Coordinator — Offer", "role": "Patient Services Coordinator",
                "team": "Front Office", "company": "Willowbrook Health Partners",
                "body": "We'd like to bring you on for a trial week at the front desk.",
            },
        },
        "onboarding_xp_award": 20,
    },
    "tasks": [
        {
            "task_index": 1, "title": "Verify Insurance at Intake", "type": "structured_form",
            "objective": "Correctly verify a patient's insurance before their appointment.",
            "briefing": "A new patient is checking in. Verify their insurance details before they're "
                        "seen — a mistake here becomes a billing headache for everyone later.",
            "what_to_do": [
                "Confirm the insurance provider matches what's on file.",
                "Record the policy number exactly.",
                "Mark verification complete only once you've actually confirmed it.",
            ],
            "what_to_submit": ["Patient name", "Insurance provider", "Policy number", "Verified flag"],
            "hints": [], "success_criteria": ["Intake completed"],
            "reference_data": {
                "title": "Patient Check-In — Harold Given",
                "fields": [
                    {"label": "Patient", "value": "Harold Given, DOB 03/14/1958"},
                    {"label": "Insurance card on file", "value": "Meridian Health Plan, Policy #MH-77213-A"},
                ],
            },
            "rubric": None,
            "config": {
                "fields": [
                    {"key": "patient_name", "label": "Patient name", "type": "text", "required": True},
                    {"key": "insurance_provider", "label": "Insurance provider", "type": "select",
                     "options": ["Meridian Health Plan", "Coastal Care Network", "Union Assurance", "Self-Pay"], "required": True},
                    {"key": "policy_number", "label": "Policy number", "type": "text", "required": True},
                    {"key": "verified", "label": "Insurance verified", "type": "checkbox", "required": True},
                ],
            },
            "xp_award": 40, "skill_awards": {"communication": 5}, "week": 1,
        },
        {
            "task_index": 2, "title": "Talk Harold Through the Billing Concern", "type": "ai_roleplay_chat",
            "objective": "Calm an anxious patient about a billing issue without overpromising.",
            "briefing": "Harold is calling — he got a bill for $340 he wasn't expecting and is worried "
                        "his insurance didn't cover his visit properly.",
            "what_to_do": [
                "Acknowledge his concern without immediately promising a specific outcome.",
                "Explain what you'll actually check (whether the claim was processed correctly).",
                "Give him a real next step and timeframe.",
            ],
            "what_to_submit": ["A completed conversation"],
            "hints": ["Don't promise the bill will be waived — you don't know that yet. Promise to investigate."],
            "success_criteria": ["At least 6 messages exchanged"],
            "rubric": None,
            "config": {
                "persona": {
                    "name": "Harold Given", "role": "Patient",
                    "personality_prompt": "You're 68 and got a surprise $340 bill after a visit you "
                        "thought was covered by insurance. You're anxious about the money and a little "
                        "confused by the billing process, not angry. You calm down when someone "
                        "explains clearly what they're going to check and gives you a real timeframe. "
                        "You get more anxious if the rep sounds dismissive or vague.",
                    "mood_options": ["anxious", "confused", "relieved", "neutral"],
                    "opening_mood": "anxious",
                },
                "context": {"issue": "unexpected $340 bill", "concern": "insurance coverage confusion"},
                "mode": "custom",
                "min_messages_for_completion": 6,
            },
            "xp_award": 70, "skill_awards": {"communication": 10}, "week": 1,
        },
        {
            "task_index": 3, "title": "HIPAA & Compliance Basics", "type": "quiz",
            "objective": "Confirm you understand basic patient-privacy compliance before handling records.",
            "briefing": "Quick compliance check before you're trusted with patient records.",
            "what_to_do": ["Answer each question."],
            "what_to_submit": [], "hints": [], "success_criteria": ["Quiz completed"],
            "rubric": None,
            "config": {
                "questions": [
                    {"question": "A patient's family member calls asking about their test results. What do you do?",
                     "options": ["Share the results since they're family", "Only share information if the patient has authorized that person on file", "Share only the appointment date"],
                     "correct": 1},
                    {"question": "You need to discuss a patient's case with a coworker. Where is it appropriate?",
                     "options": ["Anywhere, as long as it's coworkers", "In a private area, on a need-to-know basis", "In the waiting room, quietly"],
                     "correct": 1},
                    {"question": "A patient asks for a copy of their own records. What's the correct response?",
                     "options": ["Refuse — records are confidential from everyone", "Provide them through the proper request process — patients have a right to their own records", "Only a doctor can authorize this"],
                     "correct": 1},
                ],
            },
            "xp_award": 30, "skill_awards": {}, "week": 1,
        },
        {
            "task_index": 4, "title": "Write the Claim Appeal Letter", "type": "text_rubric",
            "objective": "Write an appeal letter for a denied claim that's specific enough to actually work.",
            "briefing": "Harold's claim was denied for \"missing prior authorization,\" but the visit "
                        "was actually urgent care and shouldn't have required one. Write the appeal.",
            "what_to_do": [
                "State the specific denial reason and why it doesn't apply.",
                "Reference the relevant policy detail (urgent care exception).",
                "Request a specific action (reprocess the claim) with a clear timeline ask.",
            ],
            "what_to_submit": ["The appeal letter"],
            "hints": [], "success_criteria": ["Letter drafted", "Graded by AI coach"],
            "rubric": {"specificity": 0.4, "policy_accuracy": 0.35, "clarity": 0.25},
            "config": {
                "grading_mode": "llm",
                "llm_judge_prompt": "Grade this insurance claim appeal letter. The claim was denied "
                    "for 'missing prior authorization' but the visit was urgent care, which should be "
                    "exempt from prior-auth requirements. Score 0-100 on: (1) whether it specifically "
                    "addresses the denial reason rather than being generic, (2) whether it correctly "
                    "invokes the urgent-care exception, (3) clarity and a clear requested action. Give "
                    "2-4 sentences of feedback. Respond with ONLY JSON: {{\"overall\": <0-100>, "
                    "\"feedback\": \"...\"}}\n\nLetter:\n{text}",
            },
            "xp_award": 60, "skill_awards": {"communication": 10}, "week": 1,
        },
        {
            "task_index": 5, "title": "Prioritize the Day's Schedule", "type": "structured_form",
            "objective": "Triage schedule conflicts by real urgency, not just who called first.",
            "briefing": "Two patients need same-day slots and there's only one opening left. Decide "
                        "how to prioritize and document your reasoning.",
            "what_to_do": [
                "Set an urgency rating for the situation.",
                "Note which patient gets the opening and why.",
            ],
            "what_to_submit": ["Urgency rating", "Notes"],
            "hints": ["A same-day slot request isn't automatically urgent — check the actual reason."],
            "success_criteria": ["Schedule decision logged"],
            "reference_data": {
                "title": "Two Same-Day Requests",
                "fields": [
                    {"label": "Patient A", "value": "Requesting a same-day slot for a follow-up on worsening chest pain."},
                    {"label": "Patient B", "value": "Requesting a same-day slot to move up a routine annual physical by two weeks for convenience."},
                ],
            },
            "rubric": None,
            "config": {
                "fields": [
                    {"key": "urgency", "label": "Urgency of the situation (1 = low, 5 = urgent)", "type": "slider", "min": 1, "max": 5, "required": True},
                    {"key": "notes", "label": "Which patient gets the slot, and why", "type": "textarea", "min_length": 20, "required": True},
                ],
            },
            "xp_award": 40, "skill_awards": {"communication": 5}, "week": 1,
        },
    ],
}
