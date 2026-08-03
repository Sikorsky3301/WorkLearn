"""
Integration tests for permission-based access control (app/core/permissions.py's
require_permission). This is the same grant/deny pattern manually verified
live (via disposable test roles/curl) throughout this project's RBAC work —
now automated instead of re-done by hand every time something touches it.

Confirms the behavior require_permission's own docstring promises: it never
trusts the JWT's embedded `permissions` claim, always re-checking the
database — so a permission grant/revoke takes effect immediately, not after
the token happens to expire.
"""
import pytest

from app.core.auth import create_token, hash_password
from app.models import User, Role
from app.models.rbac import AdminRole, AdminRolePermission

# See tests/integration/test_auth_routes.py's pytestmark comment — the
# session-scoped DB engine requires every test that touches it to run on the
# same session-scoped event loop.
pytestmark = pytest.mark.asyncio(loop_scope="session")


async def _make_admin_user(db_session, *, permissions: list[str] = ()) -> User:
    role = AdminRole(name=f"Test Role {'-'.join(permissions) or 'none'}", description="test", is_builtin=False)
    db_session.add(role)
    await db_session.flush()

    for key in permissions:
        db_session.add(AdminRolePermission(role_id=role.id, permission_key=key))

    user = User(
        email=f"admin-{role.id}@example.com",
        password_hash=hash_password("testpass123"),
        name="Test Admin",
        role=Role.ADMIN,
        is_active=True,
        admin_role_id=role.id,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


async def test_admin_without_permission_gets_403(client, db_session):
    user = await _make_admin_user(db_session, permissions=["users.view"])
    token = create_token(user.id, "ADMIN", permissions=["users.view"])

    resp = await client.get("/api/admin-management/config/ai", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403
    assert "config.view" in resp.json()["detail"]


async def test_admin_with_permission_succeeds(client, db_session):
    user = await _make_admin_user(db_session, permissions=["config.view"])
    token = create_token(user.id, "ADMIN", permissions=["config.view"])

    resp = await client.get("/api/admin-management/config/ai", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200


async def test_permission_revocation_takes_effect_without_reissuing_token(client, db_session):
    """The core promise of require_permission: it re-checks the DB every
    request, so revoking access mid-session (without the user logging out or
    their token expiring) blocks the very next request."""
    user = await _make_admin_user(db_session, permissions=["config.view"])
    token = create_token(user.id, "ADMIN", permissions=["config.view"])  # still-valid old token throughout

    ok = await client.get("/api/admin-management/config/ai", headers={"Authorization": f"Bearer {token}"})
    assert ok.status_code == 200

    # Revoke, without touching the token at all.
    from sqlalchemy import delete
    await db_session.execute(delete(AdminRolePermission).where(AdminRolePermission.role_id == user.admin_role_id))
    await db_session.commit()

    blocked = await client.get("/api/admin-management/config/ai", headers={"Authorization": f"Bearer {token}"})
    assert blocked.status_code == 403


async def test_suspended_admin_is_blocked_regardless_of_permissions(client, db_session):
    user = await _make_admin_user(db_session, permissions=["config.view"])
    user.is_active = False
    db_session.add(user)
    await db_session.commit()

    token = create_token(user.id, "ADMIN", permissions=["config.view"])
    resp = await client.get("/api/admin-management/config/ai", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403


async def test_superadmin_bypasses_permission_checks_entirely(client):
    # SUPER_ADMIN tokens are minted with sa=True and no admin_role_id at all
    # (see auth.py's login_superadmin) — require_permission must let them
    # through on the role check alone, never touching AdminRolePermission.
    token = create_token("some-superadmin-id", "SUPER_ADMIN", sa=True)
    resp = await client.get("/api/admin-management/config/ai", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
