"""
Integration tests for the direct-user auth flow (app/routes/v1/auth.py) — real
HTTP requests (in-process, via httpx's ASGI transport) against a real test
database. See tests/conftest.py for how DB isolation works. pytest.ini sets
asyncio_mode=auto, so plain `async def test_...` is enough — no markers needed.
"""
import pytest

# The DB engine (app/db/database.py's module-level `engine`) is created once on
# the session-scoped event loop by tests/conftest.py's `_test_database`
# fixture. A test running on its own default function-scoped loop trips
# asyncpg's "attached to a different loop" the moment it touches a pooled
# connection (via the `client`/`db_session` fixtures) — this has to be set
# here, at module-collection time, because pytest-asyncio's auto mode stamps
# a plain (function-scoped) `asyncio` marker onto any async test that doesn't
# already have one, and that stamping happens before a `pytest_collection_modifyitems`
# hook could add loop_scope after the fact.
pytestmark = pytest.mark.asyncio(loop_scope="session")


async def test_register_then_me(client):
    resp = await client.post("/api/auth/register", json={
        "name": "Test Student", "email": "test-student@example.com", "password": "testpass123",
    })
    assert resp.status_code == 200
    body = resp.json()
    assert body["user"]["email"] == "test-student@example.com"
    assert body["user"]["role"] == "DIRECT_USER"
    assert body["user"]["onboarding_completed"] is False  # new signup, wizard should show

    token = body["token"]
    me = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == "test-student@example.com"


async def test_register_rejects_duplicate_email(client):
    payload = {"name": "First", "email": "dupe@example.com", "password": "testpass123"}
    first = await client.post("/api/auth/register", json=payload)
    assert first.status_code == 200

    second = await client.post("/api/auth/register", json={**payload, "name": "Second"})
    assert second.status_code == 400


async def test_login_wrong_password_rejected(client):
    await client.post("/api/auth/register", json={
        "name": "Login Test", "email": "login-test@example.com", "password": "correctpass",
    })
    resp = await client.post("/api/auth/login/direct", json={
        "email": "login-test@example.com", "password": "wrongpass",
    })
    assert resp.status_code == 401


async def test_me_requires_a_token(client):
    resp = await client.get("/api/auth/me")
    assert resp.status_code in (401, 403)  # HTTPBearer's own default is 403 when the header is missing entirely
