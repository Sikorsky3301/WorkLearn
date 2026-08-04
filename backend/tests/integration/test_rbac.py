"""
Integration tests for role-slug access control (require_roles / require_permission alias).
"""
import pytest

from app.core.auth import create_token, hash_password
from app.models import User
from app.models.roles import RoleSlug, ROLE_IDS
from app.services.roles_seed import seed_roles_and_universities

pytestmark = pytest.mark.asyncio(loop_scope="session")


async def _make_admin_user(db_session) -> User:
    await seed_roles_and_universities(db_session)
    user = User(
        email="admin-test@example.com",
        password_hash=hash_password("testpass123"),
        name="Test Admin",
        role_id=ROLE_IDS[RoleSlug.ADMIN],
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


async def _make_student_user(db_session) -> User:
    await seed_roles_and_universities(db_session)
    user = User(
        email="student-test@example.com",
        password_hash=hash_password("testpass123"),
        name="Test Student",
        role_id=ROLE_IDS[RoleSlug.STUDENT],
        university_id=1,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


async def test_student_cannot_access_admin_config(client, db_session):
    user = await _make_student_user(db_session)
    token = create_token(user.id, RoleSlug.STUDENT)
    resp = await client.get("/api/admin-management/config/ai", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403


async def test_admin_can_access_admin_surface(client, db_session):
    user = await _make_admin_user(db_session)
    token = create_token(user.id, RoleSlug.ADMIN)
    resp = await client.get("/api/admin/stats", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200


async def test_suspended_admin_is_blocked(client, db_session):
    user = await _make_admin_user(db_session)
    user.is_active = False
    db_session.add(user)
    await db_session.commit()

    token = create_token(user.id, RoleSlug.ADMIN)
    resp = await client.get("/api/admin/stats", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403


async def test_superadmin_can_access_admin_surface(client, db_session):
    await seed_roles_and_universities(db_session)
    user = User(
        email="sa@example.com",
        password_hash=hash_password("testpass123"),
        name="SA",
        role_id=ROLE_IDS[RoleSlug.SUPER_ADMIN],
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    token = create_token(user.id, RoleSlug.SUPER_ADMIN)
    resp = await client.get("/api/admin/stats", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
