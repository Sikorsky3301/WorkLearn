"""
Repair enrollments that finished every task but were never finalized.

Until app/services/simulation_completion.py existed, the "all tasks done ->
mark COMPLETED + issue certificate" step ran only in
routes/v1/enrollments.py::complete_task. Every `code_sandbox` task completes
through routes/v1/sandbox.py::submit instead, so simulations built entirely
from sandbox tasks (da-job-sim and frontend-dev-sim are both 5/5
code_sandbox) left students with a fully-completed task list, an
IN_PROGRESS enrollment, and no certificate.

0006 backfilled certificates for enrollments already marked COMPLETED — but
these never reached that status, so 0006 skipped them. This migration flips
them and mints their certificates.
"""
import uuid

from sqlalchemy import text

MIGRATION_ID = "0007_finalize_stuck_enrollments"


def _certificate_number(simulation_id: str, year: int) -> str:
    sim_slug = "".join(c for c in simulation_id.upper() if c.isalnum())[:5] or "SIM"
    return f"WL-{sim_slug}-{year}-{uuid.uuid4().hex[:6].upper()}"


async def upgrade(engine):
    async with engine.begin() as conn:
        # Enrollments where completed task count >= the simulation's task
        # count, but which were never flipped to COMPLETED.
        rows = (await conn.execute(text("""
            SELECT e.id AS enrollment_id, e.user_id, e.simulation_id,
                   u.name AS recipient_name,
                   s.title AS simulation_title,
                   COALESCE(s.company, '') AS company,
                   (SELECT COUNT(*) FROM task_completions tc
                     WHERE tc.enrollment_id = e.id AND tc.task_id >= 1) AS done,
                   (SELECT COUNT(*) FROM simulation_tasks st
                     WHERE st.simulation_id = e.simulation_id) AS total,
                   (SELECT AVG(tc.score) FROM task_completions tc
                     WHERE tc.enrollment_id = e.id AND tc.score IS NOT NULL) AS avg_score
            FROM enrollments e
            JOIN users u ON u.id = e.user_id
            JOIN simulations s ON s.id = e.simulation_id
            WHERE e.status <> 'COMPLETED'
        """))).mappings().all()

        finalized = 0
        for r in rows:
            if not r["total"] or r["done"] < r["total"]:
                continue

            await conn.execute(
                text("UPDATE enrollments SET status = 'COMPLETED', completed_at = COALESCE(completed_at, NOW()) WHERE id = :eid"),
                {"eid": r["enrollment_id"]},
            )

            await conn.execute(
                text("""
                    INSERT INTO certificates (
                        id, user_id, simulation_id, simulation_title, company,
                        recipient_name, certificate_number, tasks_completed,
                        total_tasks, average_score, issued_at
                    ) VALUES (
                        :id, :user_id, :simulation_id, :simulation_title, :company,
                        :recipient_name, :certificate_number, :tasks_completed,
                        :total_tasks, :average_score, NOW()
                    )
                    ON CONFLICT (user_id, simulation_id) DO NOTHING
                """),
                {
                    "id": str(uuid.uuid4()),
                    "user_id": r["user_id"],
                    "simulation_id": r["simulation_id"],
                    "simulation_title": r["simulation_title"],
                    "company": r["company"],
                    "recipient_name": r["recipient_name"],
                    "certificate_number": _certificate_number(r["simulation_id"], 2026),
                    "tasks_completed": r["done"],
                    "total_tasks": r["total"],
                    "average_score": round(r["avg_score"]) if r["avg_score"] is not None else None,
                },
            )
            finalized += 1

        print(f"       finalized {finalized} stuck enrollment(s)")
