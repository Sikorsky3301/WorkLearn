"""
Test fixtures. Tests run against a REAL Postgres database — a dedicated
`<DATABASE_URL's db>_test` database, created fresh and dropped at the end of
the session — not SQLite or mocks, since the app relies on Postgres-specific
features (native enums, JSON columns) that don't behave identically on
SQLite. This does mean `pytest` needs a reachable Postgres server with
CREATEDB privilege on whatever user DATABASE_URL/TEST_DATABASE_URL uses —
see README.md in this folder.

The DATABASE_URL env var override MUST happen before any `app.*` module is
imported: app/db/database.py builds its async engine at import time from
whatever app.core.config.settings.database_url resolves to at that moment,
so this file does the override at module scope (pytest imports conftest.py
before collecting any test module) rather than inside a fixture.
"""
import os
import re
from pathlib import Path

import pytest
import pytest_asyncio
from dotenv import load_dotenv

# app/core/config.py loads backend/.env itself (via pydantic-settings'
# env_file), but that only happens once `app.core.config` is imported — and
# we need the REAL DATABASE_URL to derive the test one *before* importing
# anything under app/ (see module docstring). So load .env into the process
# env directly, same file app/core/config.py itself points at.
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

_REAL_DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql+asyncpg://postgres:password@localhost:5432/worklearn_dev")


def _with_test_suffix(url: str) -> str:
    # postgresql+asyncpg://user:pass@host:port/dbname -> .../dbname_test
    return re.sub(r"/([^/?]+)(\?.*)?$", lambda m: f"/{m.group(1)}_test{m.group(2) or ''}", url)


def _maintenance_url(url: str) -> str:
    """Same server, `postgres` database — used only to CREATE/DROP the test
    database itself (can't do that from inside the database being dropped)."""
    return re.sub(r"/([^/?]+)(\?.*)?$", lambda m: f"/postgres{m.group(2) or ''}", url)


_TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL") or _with_test_suffix(_REAL_DATABASE_URL)

# Must happen before importing anything under app/ — see module docstring.
os.environ["DATABASE_URL"] = _TEST_DATABASE_URL
# Never let a test run send real traces to the real Langfuse project.
os.environ["LANGFUSE_PUBLIC_KEY"] = ""
os.environ["LANGFUSE_SECRET_KEY"] = ""

_asyncpg_url = lambda url: url.replace("postgresql+asyncpg://", "postgresql://")  # noqa: E731


@pytest_asyncio.fixture(scope="session", autouse=True)
async def _test_database():
    import asyncpg

    db_name = _TEST_DATABASE_URL.rsplit("/", 1)[-1].split("?")[0]
    admin_conn = await asyncpg.connect(_asyncpg_url(_maintenance_url(_REAL_DATABASE_URL)))
    try:
        await admin_conn.execute(f'DROP DATABASE IF EXISTS "{db_name}" WITH (FORCE)')
        await admin_conn.execute(f'CREATE DATABASE "{db_name}"')
    finally:
        await admin_conn.close()

    # Import order matches migrations/run.py and app/main.py — every models.*
    # submodule has to be imported before create_all sees the full metadata.
    from app.db.database import engine, Base
    from app.models import cms, sim_builder, rbac, feature_flags, platform_config, profile  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    from app.services.permissions_seed import seed_permissions
    from app.db.database import AsyncSessionLocal
    async with AsyncSessionLocal() as session:
        await seed_permissions(session)

    yield

    await engine.dispose()
    admin_conn = await asyncpg.connect(_asyncpg_url(_maintenance_url(_REAL_DATABASE_URL)))
    try:
        await admin_conn.execute(f'DROP DATABASE IF EXISTS "{db_name}" WITH (FORCE)')
    finally:
        await admin_conn.close()


@pytest_asyncio.fixture(autouse=True)
async def _clean_tables():
    """Truncates every app table after each test — cheap full isolation
    without fighting FastAPI's per-request sessions over savepoints. Uses a
    standalone asyncpg connection rather than the SQLAlchemy engine's pool —
    tests that also hold a `db_session`/`client`-opened pooled connection
    open at teardown time otherwise intermittently hit asyncpg's "another
    operation is in progress" (a connection-reuse race, not a real data
    issue). The permission catalog (seeded once above) is repopulated since
    admin_role_permissions/permissions get truncated with everything else."""
    yield
    import asyncpg
    from app.db.database import Base
    from app.services.permissions_seed import seed_permissions
    from app.db.database import AsyncSessionLocal

    conn = await asyncpg.connect(_asyncpg_url(_TEST_DATABASE_URL))
    try:
        table_names = ", ".join(f'"{t.name}"' for t in Base.metadata.sorted_tables)
        await conn.execute(f"TRUNCATE {table_names} RESTART IDENTITY CASCADE")
    finally:
        await conn.close()

    async with AsyncSessionLocal() as session:
        await seed_permissions(session)


@pytest_asyncio.fixture
async def db_session():
    from app.db.database import AsyncSessionLocal
    async with AsyncSessionLocal() as session:
        yield session


@pytest_asyncio.fixture
async def client():
    from httpx import AsyncClient, ASGITransport
    from app.main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
