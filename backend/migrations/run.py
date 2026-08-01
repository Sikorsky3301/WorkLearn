"""
Migration runner for one-off ALTER TABLE/enum-style scripts that
`Base.metadata.create_all` can't express (adding columns or enum values to
tables that already exist and already have data) — this project's established
convention for schema changes, formalized here as a committed, numbered,
idempotent folder instead of one-off scripts written and deleted per change.

Run from backend/:  python -m migrations.run
"""
import asyncio
import importlib
from pathlib import Path
from sqlalchemy import text
from app.db.database import engine, Base
from app import models  # noqa: F401 — register all tables before create_all
from app.models import cms, sim_builder, rbac, feature_flags, platform_config, profile  # noqa: F401

MIGRATIONS_DIR = Path(__file__).resolve().parent


async def _ensure_new_tables():
    # Brand-new tables (admin_roles, permissions, admin_role_permissions,
    # audit_logs) are handled by create_all, same as every other table in
    # this project — only altering EXISTING tables needs a numbered script.
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def _ensure_tracking_table():
    async with engine.begin() as conn:
        await conn.execute(text(
            "CREATE TABLE IF NOT EXISTS schema_migrations ("
            "id VARCHAR PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())"
        ))


async def _applied_ids() -> set[str]:
    async with engine.begin() as conn:
        result = await conn.execute(text("SELECT id FROM schema_migrations"))
        return {row[0] for row in result}


async def _mark_applied(migration_id: str):
    async with engine.begin() as conn:
        await conn.execute(
            text("INSERT INTO schema_migrations (id) VALUES (:id) ON CONFLICT DO NOTHING"),
            {"id": migration_id},
        )


async def run_all():
    await _ensure_new_tables()
    await _ensure_tracking_table()
    applied = await _applied_ids()

    files = sorted(MIGRATIONS_DIR.glob("[0-9][0-9][0-9][0-9]_*.py"))
    for path in files:
        mod = importlib.import_module(f"migrations.{path.stem}")
        migration_id = mod.MIGRATION_ID
        if migration_id in applied:
            print(f"skip  {migration_id} (already applied)")
            continue
        print(f"apply {migration_id} ...")
        await mod.upgrade(engine)
        await _mark_applied(migration_id)
        print(f"done  {migration_id}")

    print("All migrations up to date.")


if __name__ == "__main__":
    asyncio.run(run_all())
