"""Content layer for the Junior Data Analyst simulation.

DELIBERATELY NOT A FULL TEMPLATE. The Engineering sim owns its tasks outright
(app/cms_templates/engineering/ defines every field, and
resync_engineering_sim.py rewrites the whole task list). The DA sim's tasks
already exist and are good — briefing, what_to_do, hints, grader wiring and the
seeded dataset were authored in migrate_legacy_sims.py::da_job_sim() and are
still correct.

So this package supplies only what the workbench task page needs and the DA
tasks lacked:

    explainers.py   the two-level `explainer` block the task page renders
                    instead of a bare bullet list
    assessments.py  the per-task mini assessment that gates the next task,
                    plus the 40-question final
    new_tasks.py    the four tasks added when the sim went from five tasks to
                    nine (three per week, three weeks), and where the original
                    five were renumbered to
    starters.py     starter code and model solutions for those four

sync_da_content.py applies both to the existing rows. Nothing else about those
tasks is touched — a full rewrite would risk the grader config, which is the
one part of this simulation that has been verified end-to-end against real
Docker runs.

The final assessment is task 10, alone in week 4, mirroring the Engineering
sim exactly.

verify_da_grading.py proves each new task's model solution scores 100 and its
starter scores less, through a real Docker container.
"""
from app.cms_templates.data_analytics import assessments, explainers, new_tasks, starters
from app.cms_templates.data_analytics.assessments import (
    FINAL_ASSESSMENT,
    MINI_ASSESSMENTS,
    MINI_PASS_MARK,
    assessment_for,
)
from app.cms_templates.data_analytics.explainers import EXPLAINERS

# The nine graded tasks — three per week across three weeks, matching the
# Frontend Developer simulation. See new_tasks.py for the full layout and
# which four were added in the restructure.
CONTENT_TASK_INDEXES = (1, 2, 3, 4, 5, 6, 7, 8, 9)

# The week names shown on the roadmap and above every task title.
#
# These existed only as prose in new_tasks.py's docstring, so the simulation
# shipped with `section_labels = {}` and a student saw "Week 1" where the
# Frontend Developer sim says "Week 1 — Structure & Style". The Sim Builder's
# readiness panel is what surfaced it: a named week tells a student what the
# week is FOR, and three unnamed ones were the only thing it had to say about
# this simulation.
#
# Same em-dash convention as the Engineering template, deliberately — a student
# moving between the two should meet one convention, not two.
SECTION_LABELS = {
    "1": "Week 1 — Make the Data Trustworthy",
    "2": "Week 2 — Find Where the Money Comes From",
    "3": "Week 3 — Decide, Then Say It",
    "4": "Final Assessment",
}

# The final assessment sits alone in week 4.
FINAL_TASK_INDEX = 10

FINAL_TASK = dict(
    task_index=FINAL_TASK_INDEX,
    title="Final Assessment",
    type="quiz",
    week=4,
    objective="Everything from the last three weeks, in one sitting.",
    briefing=(
        "You've cleaned a real dataset, built the monthly numbers, segmented the customer base, "
        "called an experiment, and written the brief that went to the VP. This is the last thing "
        "before your certificate — forty questions on the analysis you did and the thinking behind "
        "it. Some of it is recall; most of it is judgement. Take your time."
    ),
    what_to_do=[
        "Answer all 40 questions — data quality, pandas, SQL, business metrics, segmentation, "
        "experiments and statistics, and communicating a result.",
        "Difficulty ramps from fundamentals to the trade-offs behind the calls you made.",
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
    # Mirrors the five tasks' own awards in proportion, so finishing the
    # assessment tops up the same skills the simulation taught rather than
    # introducing new ones. Kept small: the tasks are where the points are.
    skill_awards={"analytics": 10, "statistics": 8, "communication": 7, "sql": 5},
)


__all__ = [
    "assessments", "explainers", "SECTION_LABELS",
    "EXPLAINERS", "MINI_ASSESSMENTS", "MINI_PASS_MARK", "FINAL_ASSESSMENT",
    "assessment_for", "FINAL_TASK", "FINAL_TASK_INDEX", "CONTENT_TASK_INDEXES",
    "new_tasks", "starters",
]
