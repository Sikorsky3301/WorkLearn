"""Starter template: HR & Recruiting."""

TEMPLATE = {
    "key": "hr_recruiting",
    "label": "HR & Recruiting",
    "description": "Intake a requisition, write an inclusive job post, screen candidates, and make a hiring call.",
    "simulation": {
        "title": "Recruiting Coordinator",
        "description": "Take a job requisition from a hiring manager, write the job description, "
                        "screen the candidate pool, run a phone screen, and make a hiring recommendation.",
        "company": "Northgate Talent",
        "domain": "HR & Recruiting",
        "category": "Recruiting",
        "accent_color": "bg-amber-600",
        "difficulty": "Beginner",
        "estimated_hours": "3",
        "skills": ["Job Description Writing", "Candidate Screening", "Interview Judgment"],
        "manager": {"name": "Alicia Brown", "role": "Senior Recruiter", "avatar": "AB"},
        "onboarding": {
            "company": {
                "name": "Northgate Talent", "industry": "Technical Recruiting Agency",
                "size": "60 employees", "location": "Chicago, IL",
                "about": "Northgate places engineering and product talent for mid-size tech companies.",
            },
            "intro": "Welcome! You're taking over a live requisition from one of our clients — a "
                      "backend engineer role that's been open for three weeks. Let's move it forward.",
            "learn": [
                "How to properly intake a job requisition from a hiring manager",
                "How to write an inclusive, specific job description",
                "How to screen a candidate pool against a real rubric",
                "How to run a phone screen that actually surfaces signal",
                "How to make and justify a hiring recommendation",
            ],
            "offer": {
                "title": "Recruiting Coordinator — Offer", "role": "Recruiting Coordinator",
                "team": "Technical Recruiting", "company": "Northgate Talent",
                "body": "We'd like you to run this open requisition end to end as a trial.",
            },
        },
        "onboarding_xp_award": 20,
    },
    "tasks": [
        {
            "task_index": 1, "title": "Intake the Requisition", "type": "structured_form",
            "objective": "Capture a job requisition precisely enough to actually source against it.",
            "briefing": "The hiring manager gave you a rough, verbal description of the role. Turn "
                        "it into a structured requisition before you write anything client-facing.",
            "what_to_do": [
                "Set the exact title.",
                "Set the seniority level.",
                "List the actual must-have skills, not a wishlist.",
            ],
            "what_to_submit": ["Title", "Level", "Must-have skills"],
            "hints": ["\"Nice to have\" and \"must have\" are not the same list — don't conflate them."],
            "success_criteria": ["Requisition captured"],
            "reference_data": {
                "title": "Hiring Manager Notes (verbal)",
                "fields": [
                    {"label": "Team", "value": "Platform Engineering"},
                    {"label": "Notes", "value": "We need someone who can own our payments service. "
                     "Must know Python and distributed systems basics. Nice if they know Go too, but "
                     "not required. Mid-level, not junior — we don't have bandwidth to mentor heavily "
                     "right now."},
                ],
            },
            "rubric": None,
            "config": {
                "fields": [
                    {"key": "title", "label": "Job title", "type": "text", "required": True},
                    {"key": "level", "label": "Seniority level", "type": "select",
                     "options": ["Junior", "Mid-level", "Senior", "Staff"], "required": True},
                    {"key": "must_have_skills", "label": "Must-have skills (not nice-to-haves)", "type": "textarea", "min_length": 15, "required": True},
                ],
            },
            "xp_award": 40, "skill_awards": {"communication": 5}, "week": 1,
        },
        {
            "task_index": 2, "title": "Write the Job Description", "type": "text_rubric",
            "objective": "Write a job post that's specific and doesn't unnecessarily narrow the pool.",
            "briefing": "Turn the requisition into a public job posting. Be specific about the role, "
                        "but watch for language that discourages qualified candidates from applying.",
            "what_to_do": [
                "Describe the actual work, not generic responsibilities.",
                "List only genuine must-haves as requirements.",
                "Avoid gendered or exclusionary phrasing (e.g. \"rockstar,\" \"ninja,\" unnecessary degree requirements).",
            ],
            "what_to_submit": ["The job description"],
            "hints": [], "success_criteria": ["JD drafted", "Graded by AI coach"],
            "rubric": {"specificity": 0.4, "inclusive_language": 0.35, "clarity": 0.25},
            "config": {
                "grading_mode": "llm",
                "llm_judge_prompt": "Grade this job description for a mid-level backend engineer role "
                    "owning a payments service. Score 0-100 on: (1) specificity about the actual work "
                    "vs. generic boilerplate, (2) inclusive language — flag gendered terms, unnecessary "
                    "jargon like 'rockstar/ninja', or requirements that would exclude qualified "
                    "candidates without good reason, (3) overall clarity. Give 2-4 sentences of "
                    "specific feedback. Respond with ONLY JSON: {{\"overall\": <0-100>, \"feedback\": "
                    "\"...\"}}\n\nJob description:\n{text}",
            },
            "xp_award": 60, "skill_awards": {"communication": 10}, "week": 1,
        },
        {
            "task_index": 3, "title": "Screen the Candidate Pool", "type": "quiz",
            "objective": "Apply the requisition's rubric consistently across a candidate pool.",
            "briefing": "Applications came in. Score which candidates should advance based on the "
                        "must-have skills you defined.",
            "what_to_do": ["Answer based on the candidate summaries you were given."],
            "what_to_submit": [], "hints": [], "success_criteria": ["Screening completed"],
            "rubric": None,
            "config": {
                "questions": [
                    {"question": "Candidate A has 4 years of Python + distributed systems experience but no payments background. Candidate B has 1 year of Python and a CS degree. Who should advance for a mid-level role requiring Python + distributed systems?",
                     "options": ["Candidate A", "Candidate B", "Neither"],
                     "correct": 0},
                    {"question": "A candidate meets every must-have but is missing the 'nice to have' Go experience. Should they be screened out?",
                     "options": ["Yes, screen them out", "No, nice-to-haves shouldn't disqualify a candidate", "Only if another candidate has Go"],
                     "correct": 1},
                ],
            },
            "xp_award": 30, "skill_awards": {}, "week": 1,
        },
        {
            "task_index": 4, "title": "Run the Phone Screen", "type": "ai_roleplay_chat",
            "objective": "Run a phone screen that surfaces real signal on the must-have skills.",
            "briefing": "Sam is your top candidate from the pool. Run a short phone screen to confirm "
                        "the Python/distributed-systems experience before scheduling a technical round.",
            "what_to_do": [
                "Ask specific, not generic, questions about their experience.",
                "Probe for depth (ask a follow-up, don't just accept the first answer).",
                "Gauge genuine interest in the role, not just \"any job.\"",
            ],
            "what_to_submit": ["A completed phone screen"],
            "hints": ["\"Tell me about yourself\" wastes your limited time — ask about the specific must-haves."],
            "success_criteria": ["At least 6 messages exchanged"],
            "rubric": None,
            "config": {
                "persona": {
                    "name": "Sam Okafor", "role": "Candidate — Backend Engineer",
                    "personality_prompt": "You have 3 years of Python experience and worked on a "
                        "distributed job-scheduling system at your last company, though you've never "
                        "used the word 'distributed systems' to describe it yourself. You're friendly "
                        "and a little nervous. You give surface-level answers unless the interviewer "
                        "asks a real follow-up question, at which point you open up with specific, "
                        "credible detail. You're genuinely interested in the role if it comes up "
                        "naturally, but you won't volunteer your enthusiasm unprompted.",
                    "mood_options": ["neutral", "nervous", "engaged", "curious"],
                    "opening_mood": "nervous",
                },
                "context": {"role": "Backend Engineer, Platform team, payments service"},
                "mode": "discovery",
                "min_messages_for_completion": 6,
            },
            "xp_award": 70, "skill_awards": {"communication": 10}, "week": 1,
        },
        {
            "task_index": 5, "title": "Make the Hiring Recommendation", "type": "structured_form",
            "objective": "Turn the phone screen into a clear, defensible recommendation.",
            "briefing": "Write up your recommendation for the hiring manager based on the phone screen.",
            "what_to_do": [
                "Decide whether to advance, hold, or reject.",
                "Write notes a hiring manager could act on.",
                "Suggest an offer range if advancing.",
            ],
            "what_to_submit": ["Recommendation", "Notes", "Offer range"],
            "hints": [], "success_criteria": ["Recommendation submitted"],
            "rubric": None,
            "config": {
                "fields": [
                    {"key": "recommendation", "label": "Recommendation", "type": "select",
                     "options": ["Advance to technical round", "Hold for now", "Reject"], "required": True},
                    {"key": "notes", "label": "Notes for the hiring manager", "type": "textarea", "min_length": 20, "required": True},
                    {"key": "offer_range", "label": "Suggested offer range (if advancing), in $K", "type": "slider", "min": 80, "max": 180},
                ],
            },
            "xp_award": 40, "skill_awards": {"communication": 5}, "week": 1,
        },
    ],
}
