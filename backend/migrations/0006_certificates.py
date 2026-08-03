"""
Certificates table + one-time backfill for simulations already completed
before this feature shipped.

The table itself is created by Base.metadata.create_all (see run.py's
_ensure_new_tables / app/main.py's lifespan), so this migration only owns
the backfill — without it, a student who finished a simulation last week
would see an empty Certificates tab forever, since issuance is triggered by
the *final task completion* and theirs already happened.
"""
import uuid

from sqlalchemy import text

MIGRATION_ID = "0006_certificates"


def _certificate_number(simulation_id: str, year: int) -> str:
    # Mirrors app/services/certificates.py::build_certificate_number. Kept as
    # a local copy rather than imported: a migration must keep producing the
    # format that was current when it ran, even if the app's generator is
    # changed later.
    sim_slug = "".join(c for c in simulation_id.upper() if c.isalnum())[:5] or "SIM"
    return f"WL-{sim_slug}-{year}-{uuid.uuid4().hex[:6].upper()}"


async def upgrade(engine):
    async with engine.begin() as conn:
        # Every completed enrollment that has no certificate yet, with the
        # display fields the certificate face needs, denormalised the same
        # way issue_certificate_if_complete does.
        rows = (await conn.execute(text("""
            SELECT e.id           AS enrollment_id,
                   e.user_id      AS user_id,
                   e.simulation_id AS simulation_id,
                   e.completed_at AS completed_at,
                   u.name         AS recipient_name,
                   s.title        AS simulation_title,
                   COALESCE(s.company, '') AS company
            FROM enrollments e
            JOIN users u ON u.id = e.user_id
            JOIN simulations s ON s.id = e.simulation_id
            WHERE e.status = 'COMPLETED'
              AND NOT EXISTS (
                  SELECT 1 FROM certificates c
                  WHERE c.user_id = e.user_id AND c.simulation_id = e.simulation_id
              )
        """))).mappings().all()

        for r in rows:
            stats = (await conn.execute(
                text("""
                    SELECT COUNT(*) AS done,
                           AVG(score) FILTER (WHERE score IS NOT NULL) AS avg_score
                    FROM task_completions WHERE enrollment_id = :eid
                """),
                {"eid": r["enrollment_id"]},
            )).mappings().one()

            total = (await conn.execute(
                text("SELECT COUNT(*) FROM simulation_tasks WHERE simulation_id = :sid"),
                {"sid": r["simulation_id"]},
            )).scalar() or 0

            issued_at = r["completed_at"]
            year = issued_at.year if issued_at else 2026

            await conn.execute(
                text("""
                    INSERT INTO certificates (
                        id, user_id, simulation_id, simulation_title, company,
                        recipient_name, certificate_number, tasks_completed,
                        total_tasks, average_score, issued_at
                    ) VALUES (
                        :id, :user_id, :simulation_id, :simulation_title, :company,
                        :recipient_name, :certificate_number, :tasks_completed,
                        :total_tasks, :average_score, COALESCE(:issued_at, NOW())
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
                    "certificate_number": _certificate_number(r["simulation_id"], year),
                    "tasks_completed": stats["done"] or 0,
                    "total_tasks": total,
                    "average_score": round(stats["avg_score"]) if stats["avg_score"] is not None else None,
                    "issued_at": issued_at,
                },
            )
