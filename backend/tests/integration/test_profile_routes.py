"""
Integration tests for the self-service profile routes (app/api/v1/users/profile.py)
— real HTTP against a real test database, same setup as test_auth_routes.py.

These cover the two defects that made the onboarding wizard finish without
persisting anything:
  * POST /education 500'd *after* committing, because EducationOut.id was
    declared `str` against an int PK — the wizard aborted mid-run and never
    reached complete-onboarding.
  * PUT /profile was a destructive full-document overwrite, so any caller
    omitting a field (the Portfolio edit form omits preferred_domain) nulled it.
"""
import pytest

# See test_auth_routes.py's comment — the session-scoped DB engine requires
# every test touching it to run on that same session-scoped event loop.
pytestmark = pytest.mark.asyncio(loop_scope="session")


async def _register(client, email: str) -> str:
    resp = await client.post("/api/auth/register", json={
        "name": "Profile Tester", "email": email, "password": "testpass123",
    })
    assert resp.status_code == 200
    return resp.json()["token"]


async def test_add_education_returns_int_id_and_does_not_error(client):
    """Regression: this used to 500 on response validation while still having
    committed the row, which stranded the onboarding wizard."""
    token = await _register(client, "edu@example.com")
    auth = {"Authorization": f"Bearer {token}"}

    resp = await client.post("/api/users/me/education", headers=auth, json={
        "institution": "IIT Delhi", "degree": "B.Tech",
        "field_of_study": "Computer Science", "start_year": 2021, "end_year": 2025,
    })
    assert resp.status_code == 200, resp.text
    entry = resp.json()
    assert isinstance(entry["id"], int)
    assert entry["institution"] == "IIT Delhi"

    listed = await client.get("/api/users/me/education", headers=auth)
    assert listed.status_code == 200
    assert [e["institution"] for e in listed.json()] == ["IIT Delhi"]


async def test_partial_profile_update_preserves_unsent_fields(client):
    """Regression: a partial PUT used to null every field it didn't send —
    saving the Portfolio form wiped the domain chosen during onboarding."""
    token = await _register(client, "partial@example.com")
    auth = {"Authorization": f"Bearer {token}"}

    full = await client.put("/api/users/me/profile", headers=auth, json={
        "headline": "Aspiring Data Analyst", "bio": "Learning by doing.",
        "location": "Delhi", "preferred_domain": "Data Analytics",
    })
    assert full.status_code == 200

    # The Portfolio edit form's shape: no preferred_domain key at all.
    partial = await client.put("/api/users/me/profile", headers=auth, json={
        "headline": "Junior Data Analyst", "bio": "Learning by doing.",
        "location": "Delhi",
    })
    assert partial.status_code == 200

    me = (await client.get("/api/auth/me", headers=auth)).json()
    assert me["headline"] == "Junior Data Analyst"       # updated
    assert me["preferred_domain"] == "Data Analytics"    # survived


async def test_blank_optional_fields_store_as_null_not_empty_string(client):
    """A skipped optional step should leave the field genuinely unset, so the
    Portfolio can tell "not provided" from "provided but blank"."""
    token = await _register(client, "blanks@example.com")
    auth = {"Authorization": f"Bearer {token}"}

    resp = await client.put("/api/users/me/profile", headers=auth, json={
        "headline": "Aspiring PM", "phone": "", "location": "   ",
    })
    assert resp.status_code == 200

    me = (await client.get("/api/auth/me", headers=auth)).json()
    assert me["headline"] == "Aspiring PM"
    assert me["phone"] is None
    assert me["location"] is None
