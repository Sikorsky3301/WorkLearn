"""Starter template: Finance / Accounting."""

TEMPLATE = {
    "key": "finance_accounting",
    "label": "Finance & Accounting",
    "description": "Categorize expenses, reconcile a ledger in code, and defend the numbers to a CFO.",
    "simulation": {
        "title": "Junior Staff Accountant",
        "description": "Categorize a batch of expenses, write a script to reconcile a ledger, pass "
                        "a GAAP basics check, write a variance memo, and defend the numbers to the CFO.",
        "company": "Ledger Peak Financial",
        "domain": "Finance",
        "category": "Accounting",
        "accent_color": "bg-emerald-700",
        "difficulty": "Intermediate",
        "estimated_hours": "4",
        "skills": ["Reconciliation", "Financial Reporting", "Stakeholder Communication"],
        "manager": {"name": "Owen Marsh", "role": "Senior Accountant", "avatar": "OM"},
        "onboarding": {
            "company": {
                "name": "Ledger Peak Financial", "industry": "Outsourced Accounting Services",
                "size": "80 employees", "location": "Denver, CO",
                "about": "Ledger Peak handles bookkeeping and monthly close for a portfolio of "
                         "small-to-mid-size clients.",
            },
            "intro": "Welcome aboard. You're picking up one of our retail clients' monthly close. "
                      "Precision matters more than speed here — a wrong number in a memo to the CFO "
                      "doesn't get a second chance.",
            "learn": [
                "How to categorize expenses correctly the first time",
                "How to write a reconciliation script instead of doing it by hand",
                "Core GAAP basics you'll be expected to already know",
                "How to write a variance memo a non-accountant manager can actually use",
                "How to hold your numbers up under real scrutiny",
            ],
            "offer": {
                "title": "Junior Staff Accountant — Offer", "role": "Staff Accountant",
                "team": "Client Accounting", "company": "Ledger Peak Financial",
                "body": "We'd like to bring you on to handle this client's monthly close as a trial.",
            },
        },
        "onboarding_xp_award": 20,
    },
    "tasks": [
        {
            "task_index": 1, "title": "Categorize the Expense Batch", "type": "structured_form",
            "objective": "Correctly categorize a transaction before it goes into the ledger.",
            "briefing": "A transaction came in from the client's card statement with no category. "
                        "Get this right — miscategorized expenses cascade into a wrong P&L.",
            "what_to_do": [
                "Read the transaction detail in the reference panel.",
                "Pick the correct expense category.",
                "Flag it if anything about it looks like it needs manager review.",
            ],
            "what_to_submit": ["Category", "Amount confirmed", "Flag if needed"],
            "hints": [], "success_criteria": ["Transaction categorized"],
            "reference_data": {
                "title": "Transaction #7743",
                "fields": [
                    {"label": "Vendor", "value": "Riverside Office Supply"},
                    {"label": "Amount", "value": "$1,240.00"},
                    {"label": "Memo", "value": "Bulk order — includes one $900 laptop and misc supplies"},
                ],
            },
            "rubric": None,
            "config": {
                "fields": [
                    {"key": "category", "label": "Expense category", "type": "select",
                     "options": ["Office Supplies", "Equipment (Capital)", "Software", "Travel"], "required": True},
                    {"key": "amount", "label": "Amount", "type": "number", "required": True},
                    {"key": "flagged", "label": "Flag for manager review", "type": "checkbox"},
                ],
            },
            "xp_award": 40, "skill_awards": {"data_cleaning": 10}, "week": 1,
        },
        {
            "task_index": 2, "title": "Reconcile the Ledger", "type": "code_sandbox",
            "objective": "Write a script that computes the net total from the ledger instead of doing it by hand.",
            "briefing": "Read `ledger.csv` and compute the net total across all entries. Write your "
                        "answer to `output.json` as `{\"net_total\": <number>}`.",
            "what_to_do": [
                "Read ledger.csv.",
                "Sum the amount column.",
                "Write the result to output.json as {\"net_total\": <number>}.",
            ],
            "what_to_submit": ["output.json with the correct net_total"],
            "hints": ["Don't hand-add the numbers — read and sum the file programmatically so this works on any ledger."],
            "success_criteria": ["net_total correct within tolerance"],
            "rubric": None,
            "config": {
                "language": "python", "grading_strategy": "declarative_rules", "submission_mode": "code",
                "starter_code": "import csv, json\n\nwith open('ledger.csv') as f:\n    rows = list(csv.DictReader(f))\n\n# TODO: compute the net total across all rows' amount column\nnet_total = 0\n\nwith open('output.json', 'w') as f:\n    json.dump({'net_total': net_total}, f)\n",
                "input_filename": "submission.py", "output_filename": "output.json",
                "static_input_files": {
                    "ledger.csv": "date,category,amount\n2026-01-01,Rent,-2000\n2026-01-02,Sales,4500\n2026-01-03,Utilities,-300\n2026-01-04,Sales,3000\n2026-01-05,Payroll,-2500\n",
                },
                "rules": [
                    {"id": "r1", "label": "net_total is correct", "field": "net_total", "op": "tolerance",
                     "points": 100, "expected": 2700, "tolerance_pct": 0.01},
                ],
            },
            "xp_award": 80, "skill_awards": {"analytics": 15}, "week": 1,
        },
        {
            "task_index": 3, "title": "GAAP Basics Check", "type": "quiz",
            "objective": "Confirm core accounting fundamentals before you touch client-facing numbers.",
            "briefing": "Quick knowledge check before the next task.",
            "what_to_do": ["Answer each question."],
            "what_to_submit": [], "hints": [], "success_criteria": ["Quiz completed"],
            "rubric": None,
            "config": {
                "questions": [
                    {"question": "Under accrual accounting, when is revenue recognized?",
                     "options": ["When cash is received", "When it's earned, regardless of when cash is received", "At the end of the fiscal year"],
                     "correct": 1},
                    {"question": "A $900 laptop purchase is best classified as:",
                     "options": ["An operating expense", "A capital expenditure", "A liability"],
                     "correct": 1},
                    {"question": "What does a negative variance against budget typically mean?",
                     "options": ["Actuals came in under budget", "Actuals came in over budget (spent more than planned)", "The budget was never set"],
                     "correct": 1},
                ],
            },
            "xp_award": 30, "skill_awards": {}, "week": 1,
        },
        {
            "task_index": 4, "title": "Write the Variance Memo", "type": "text_rubric",
            "objective": "Explain a budget variance to a non-accountant manager clearly.",
            "briefing": "Utilities came in 20% over budget this month. Write a short memo to the "
                        "department manager explaining why, in plain language.",
            "what_to_do": [
                "State the variance clearly (amount and %).",
                "Give the actual reason, not a vague one.",
                "Note whether this is a one-time or recurring issue.",
            ],
            "what_to_submit": ["The variance memo"],
            "hints": ["\"Costs went up\" is not an explanation. Say why."],
            "success_criteria": ["Memo drafted", "Graded by AI coach"],
            "rubric": {"clarity": 0.4, "accuracy_of_explanation": 0.35, "actionability": 0.25},
            "config": {
                "grading_mode": "llm",
                "llm_judge_prompt": "Grade this variance memo written for a non-accountant department "
                    "manager about a 20% utilities overage. Score 0-100 on: (1) clarity for a "
                    "non-finance reader, (2) whether it gives a real, specific explanation rather than "
                    "a vague one, (3) whether it's actionable (recurring vs one-time, what to do next). "
                    "Give 2-4 sentences of feedback. Respond with ONLY JSON: {{\"overall\": <0-100>, "
                    "\"feedback\": \"...\"}}\n\nMemo:\n{text}",
            },
            "xp_award": 60, "skill_awards": {"communication": 10}, "week": 1,
        },
        {
            "task_index": 5, "title": "Defend the Numbers", "type": "ai_roleplay_chat",
            "objective": "Hold up your reconciliation and variance explanation under real scrutiny.",
            "briefing": "The CFO is reviewing the month-end package and has pointed questions about "
                        "the utilities variance and your reconciliation numbers.",
            "what_to_do": [
                "Explain your reconciliation methodology when asked.",
                "Justify the variance explanation with specifics.",
                "Don't guess — if you don't have a number, say what you'd need to confirm it.",
            ],
            "what_to_submit": ["A completed conversation"],
            "hints": ["A good accountant says \"let me confirm that\" instead of guessing."],
            "success_criteria": ["At least 6 messages exchanged"],
            "rubric": None,
            "config": {
                "persona": {
                    "name": "Elaine Ruiz", "role": "CFO",
                    "personality_prompt": "You're reviewing the month-end package and want to "
                        "understand the utilities variance and the reconciliation approach before you "
                        "sign off. You're direct and ask pointed follow-up questions. You respect "
                        "someone who says \"I'd need to confirm that\" over someone who guesses "
                        "confidently and is wrong. You get more satisfied as you get specific, "
                        "well-reasoned answers.",
                    "mood_options": ["skeptical", "analytical", "satisfied", "neutral"],
                    "opening_mood": "analytical",
                },
                "context": {"topic": "month-end close review", "flagged_item": "20% utilities variance"},
                "mode": "custom",
                "min_messages_for_completion": 6,
            },
            "xp_award": 70, "skill_awards": {"communication": 10}, "week": 1,
        },
    ],
}
