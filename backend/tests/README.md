# Backend tests

Real Postgres, no mocks — the app relies on Postgres-specific features (native
enums, JSON columns) that don't behave identically under SQLite, so these
tests run against a dedicated `<database>_test` database instead.

## Setup

```bash
pip install -r requirements-dev.txt
```

You need a reachable Postgres server, and the user in `DATABASE_URL` (or
`TEST_DATABASE_URL`, if set) needs `CREATEDB` privilege — the suite creates
and drops the test database itself, once per run.

## Running

```bash
pytest                          # everything
pytest tests/unit                # pure-logic tests, no DB, fastest
pytest tests/integration         # real HTTP requests against a real DB
pytest -v -k test_register       # a single test by name
```

## Layout

- `tests/unit/` — pure functions, no DB, no HTTP (password hashing, JWT
  encode/decode, the declarative auto-grader).
- `tests/integration/` — real requests through FastAPI's ASGI app (via
  httpx's `ASGITransport`, in-process — no server actually listens on a
  port) against the real test database.
- `conftest.py` — creates/drops the test database once per session, truncates
  every table after each test for isolation, and exposes the `client` and
  `db_session` fixtures used throughout.

## Why the tests run on the session-scoped event loop

`pytest.ini` sets `asyncio_default_fixture_loop_scope = session` because
`conftest.py`'s `_test_database` fixture creates the SQLAlchemy engine once
per session — every fixture built on top of it (`client`, `db_session`,
`_clean_tables`) has to run on that same loop or asyncpg's connection pool
ends up bound to an already-closed loop from a previous test.

That ini setting only covers *fixtures*, though — pytest-asyncio 0.25 has no
equivalent option for test *functions*, which default to their own
function-scoped loop. Any integration test module that touches the DB (via
`client`/`db_session`) needs a module-level marker to line up with the same
loop:

```python
import pytest
pytestmark = pytest.mark.asyncio(loop_scope="session")
```

This has to be a `pytestmark` set at module-collection time, not something
added later in a `pytest_collection_modifyitems` hook — pytest-asyncio's auto
mode stamps a plain (function-scoped) `asyncio` marker onto any async test
that doesn't already have one during collection, and `get_closest_marker`
returns that first marker, not one appended afterwards. `tests/unit/` doesn't
need this — those tests never touch the DB-backed fixtures.
