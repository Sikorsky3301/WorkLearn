"""Starter template: Engineering (Frontend).

The structural source of truth for engineering job simulations. The seeded
`frontend-dev-sim` in migrate_legacy_sims.py builds its rows from this package
rather than carrying its own copy — one definition, so a change here reaches
both the CMS gallery and the live simulation.

`domain` is "Engineering" deliberately. It matches the catalogue entry in
frontend/src/lib/careerDomains.js AND the runtime gate in
frontend/src/features/simulations/engineering/lib/isEngineeringSim.js, so a
simulation created from this template automatically gets the roadmap, the
redesigned task page and the full-screen sandbox workbench. The separate
`it_engineering` template uses "IT & Engineering" — a different, broader
domain, deliberately left alone.

STRUCTURE
---------
    Week 1  tasks 1-3   Structure, style, the first interaction
    Week 2  tasks 4-6   Forms, async data, filtering
    Week 3  tasks 7-9   React: props, state, a whole small app
    Week 4  task 10     Final assessment — 50 questions

Every one of the nine coding tasks carries a five-question mini assessment in
`config.assessment`, taken immediately after that task is graded. Task 10 is a
`quiz` task holding the 50-question final.

GRADER BINDING — read before reordering anything. Each task's
`config.grader_key` resolves through GRADER_REGISTRY, and the hidden Jest specs
in app/services/frontend_specs.py are keyed by **task_index 1-9**. A copy of
this template at any slug grades correctly, but only while those indices hold.
Inserting or reordering a task in the CMS builder will silently grade
submissions against the wrong answer key. tests/unit/test_engineering_template.py
asserts the two stay aligned.

ANSWER KEYS NEVER REACH THE BROWSER. `config.assessment` is listed in
secret_config_keys for both the `code_sandbox` and `quiz` task types (see
app/services/task_types.py), so the public simulation payload carries none of
it. Questions are served without answers and graded server-side by
app/api/v1/simulations/assessments.py.

CONTENT CONTRACT — `config.explainer`
-------------------------------------
The redesigned task page renders this instead of a bare bullet list. Every
field is optional; the page degrades to what it has.

    situation   str          why this work exists, in plain language
    outcome     str          what "finished" looks like, concretely
    preview     str          a monospace sketch of the finished result
    concepts    [{term, plain, why}]
                             new ideas, defined before they are used
    steps       [{title, plain, code, deeper}]
                             plain = for someone who has never done this
                             deeper = the trade-off a senior would name
    contract    [{name, must}]
                             the exact identifiers the hidden tests require
    mistakes    [str]        the specific ways this goes wrong
    further     [str]        ungraded extensions, for people who finish early

`plain` and `deeper` are not summaries of each other. A beginner can read only
the plain text and complete the task; an experienced developer can read only
the deeper notes and still learn something. That two-track structure is the
whole point — one task, two audiences, no dumbing down and no gatekeeping.
"""
from app.cms_templates.engineering import week1, week2, week3
from app.cms_templates.engineering.assessments import FINAL_ASSESSMENT

# task_index for the final assessment. Week 4 so the roadmap renders it as its
# own section rather than a fourth item inside Week 3 — the weeks are meant to
# be three tasks each, and the final exam is not one of them.
FINAL_TASK_INDEX = 10
FINAL_TASK_WEEK = 4

_SIMULATION = dict(
    title="Frontend Developer Job Simulation",
    description=(
        "Nine real frontend tickets from Enigma, from a semantic landing page to a stateful React "
        "app that survives a refresh. Every ticket is graded against a hidden test suite and followed "
        "by a short assessment, ending with a 50-question final."
    ),
    company="Enigma",
    domain="Engineering",
    category="Engineering",
    accent_color="bg-primary",
    difficulty="Beginner",
    estimated_hours="12–16 hrs",
    skills=["HTML/CSS", "JavaScript", "React", "Accessibility", "State Management", "Async Data"],
    rating=4.7, rating_count=983,
    manager={"name": "Maya Chen", "role": "Frontend Engineering Lead", "avatar": "MC"},
    onboarding={
        "company": {
            "name": "Enigma", "industry": "B2B SaaS · Productivity Software",
            "size": "~85 employees", "location": "Remote-first · US/EU",
            "about": "Enigma builds a workspace platform teams use to plan, track, and ship their work "
                     "in one place. The Web Platform team owns everything the customer actually sees "
                     "and clicks — performance and polish are the product.",
        },
        "intro": (
            "Hey, welcome to the Web Platform team — excited to have you.\n\n"
            "Here's how I work: I'll hand you tickets exactly like I would to any frontend engineer on "
            "the team. Build the real thing, don't just make it look right — I'll be checking that it "
            "actually behaves correctly, not just that it renders.\n\n"
            "Three weeks, three tickets a week. You'll start with markup and layout, move through the "
            "browser's real behaviour — forms, network requests, the states in between — and finish "
            "with a React app you'd be happy to show someone. Each ticket has a short assessment "
            "afterwards so you know what stuck, and there's a proper exam at the end.\n\n"
            "Let's get you set up."
        ),
        "learn": [
            "Building accessible, responsive layouts with semantic HTML, Flexbox and CSS Grid",
            "Adding interactivity with vanilla JavaScript and the DOM API",
            "Validating forms and announcing errors to every user, not just sighted ones",
            "Fetching async data and handling loading, success and failure honestly",
            "Separating pure logic from rendering so both stay testable",
            "Writing React components with props, state and controlled inputs",
            "Persisting state across sessions, and why immutability is what makes React re-render",
        ],
        "offer": {
            "title": "Frontend Developer — Job Simulation", "role": "Frontend Developer",
            "team": "Web Platform", "company": "Enigma",
            "body": (
                "We're delighted to offer you a place on the Enigma Frontend Developer Job Simulation. "
                "Over three weeks you'll work directly with your manager on nine real tickets, going "
                "from a static landing page to a fully interactive React application, building the "
                "exact skills a frontend developer needs on the job. Each ticket is followed by a "
                "short assessment, and the simulation ends with a 50-question final exam. By "
                "accepting, you're committing to give each task a genuine attempt and to learn by "
                "doing. We're excited to see what you ship."
            ),
        },
    },
    onboarding_xp_award=10,
    section_labels={
        "1": "Week 1 — Structure & Style",
        "2": "Week 2 — Behaviour & Data",
        "3": "Week 3 — React & Shipping",
        "4": "Final Assessment",
    },
)


_FINAL_TASK = dict(
    task_index=FINAL_TASK_INDEX,
    title="Final Assessment",
    type="quiz",
    week=FINAL_TASK_WEEK,
    objective="Fifty questions across everything the simulation covered.",
    briefing=(
        "That's all nine tickets — genuinely well done. One last thing before I sign this off: fifty "
        "questions covering the whole three weeks. Some of it is recall, some of it is the judgement "
        "calls we talked about along the way, and a few are the kind of thing I'd ask in an interview. "
        "It's not designed to catch you out. Take your time."
    ),
    what_to_do=[
        "Answer all 50 questions — they cover HTML, CSS, JavaScript, React, accessibility and performance.",
        "Difficulty ramps from fundamentals to senior-level trade-offs.",
        "You'll see which answers were right, and why, as soon as you submit.",
    ],
    what_to_submit=["Your answers — there's nothing to upload."],
    hints=[],
    success_criteria=[f"Score {FINAL_ASSESSMENT['pass_mark']}% or higher to pass"],
    config={
        "assessment": FINAL_ASSESSMENT,
        "is_final_assessment": True,
        "question_count": len(FINAL_ASSESSMENT["questions"]),
        "pass_mark": FINAL_ASSESSMENT["pass_mark"],
    },
    xp_award=200,
    skill_awards={"html_css": 22, "javascript": 11, "react": 10, "accessibility": 9},
)


_TASKS = [*week1.TASKS, *week2.TASKS, *week3.TASKS, _FINAL_TASK]


TEMPLATE = {
    "key": "engineering",
    "label": "Frontend Developer (Engineering)",
    "description": (
        "Nine graded frontend tickets across three weeks — semantic HTML, responsive CSS, DOM events, "
        "forms, async data and React — each followed by a mini assessment, ending with a 50-question "
        "final exam."
    ),
    "simulation": _SIMULATION,
    "tasks": _TASKS,
}


def coding_tasks() -> list[dict]:
    """The nine sandbox tasks, excluding the final assessment."""
    return [t for t in _TASKS if t["type"] == "code_sandbox"]
