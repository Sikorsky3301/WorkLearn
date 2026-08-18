"""
Registry mapping a SimulationTask's `config.grader_key` to the actual grader
function — replaces sandbox.py's old hardcoded per-sim_id SIM_GRADERS dict.
The grader functions themselves (task1_cleaning.grade, etc.) are UNCHANGED —
only the dispatch that decides which one to call moved from an `if sim_id ==`
branch to this DB-config-driven lookup.
"""
from app.services.graders import task1_cleaning, task2_report, task3_segmentation, task4_ab_test, task5_brief
from app.services.graders.frontend_tasks import GRADERS as FRONTEND_GRADERS

GRADER_REGISTRY = {
    "da_job_sim.task1_cleaning": task1_cleaning.grade,
    "da_job_sim.task2_report": task2_report.grade,
    "da_job_sim.task3_segmentation": task3_segmentation.grade,
    "da_job_sim.task4_ab_test": task4_ab_test.grade,
    "da_job_sim.task5_brief": task5_brief.grade,
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
