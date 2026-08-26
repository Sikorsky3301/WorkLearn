"""
Registry mapping a SimulationTask's `config.grader_key` to the actual grader
function — replaces sandbox.py's old hardcoded per-sim_id SIM_GRADERS dict.
The grader functions themselves (task1_cleaning.grade, etc.) are UNCHANGED —
only the dispatch that decides which one to call moved from an `if sim_id ==`
branch to this DB-config-driven lookup.
"""
from app.services.graders import task1_cleaning, task2_report, task3_segmentation, task4_ab_test, task5_brief
from app.services.graders import da_new_tasks
from app.services.graders.frontend_tasks import GRADERS as FRONTEND_GRADERS

GRADER_REGISTRY = {
    # Keys are STABLE NAMES, not positions. The Data Analyst simulation was
    # renumbered from 5 tasks to 9 when it moved to a three-week shape, and
    # these keys did not change — which is the whole reason the registry is
    # keyed by name. `task2_report` grades the KPI task wherever it now sits.
    "da_job_sim.task1_cleaning": task1_cleaning.grade,
    "da_job_sim.task2_report": task2_report.grade,
    "da_job_sim.task3_segmentation": task3_segmentation.grade,
    "da_job_sim.task4_ab_test": task4_ab_test.grade,
    "da_job_sim.task5_brief": task5_brief.grade,
    # Added with the three-week restructure.
    "da_job_sim.quality_report": da_new_tasks.grade_quality_report,
    "da_job_sim.channel_country": da_new_tasks.grade_channel_country,
    "da_job_sim.monthly_trend": da_new_tasks.grade_monthly_trend,
    "da_job_sim.cohort_retention": da_new_tasks.grade_cohort_retention,
    # frontend_dev_sim.task1 … task9, generated from the specs themselves so a
    # new task cannot be added without its grading also existing.
    **FRONTEND_GRADERS,
}

# The one dataset generator/reference-solution pair that exists today. Keyed
# so a future second dataset-backed simulation can register its own without
# touching sandbox.py's dispatch logic.
from app.services.dataset import generate_dataset, compute_reference_solution  # noqa: E402

DATASET_REGISTRY = {
    "da_job_sim.lumen_orders": (generate_dataset, compute_reference_solution),
}
