"""
Seed demo users. Roles + universities are seeded on API startup
(app/services/roles_seed.py); this script re-runs that seed then creates
or refreshes demo accounts. Run: python seed.py

Every seeded account uses password: password
See docs/TEST_LOGINS.md.

Existing demo users are updated (password + role/profile fields) so local
DBs never keep stale hashes after DEMO_PASSWORD changes.
"""
import asyncio
from sqlalchemy import select
from app.db.database import engine, Base, AsyncSessionLocal
from app.models import User, UnlockedFeature
from app.models.roles import RoleSlug, ROLE_IDS
from app.core.auth import hash_password
from app.services.roles_seed import seed_roles_and_universities

# Shared password for all demo accounts (documented in docs/TEST_LOGINS.md)
DEMO_PASSWORD = "password"

# IIT Delhi university id from roles_seed (id=2)
IITD_UNIVERSITY_ID = 2

# Fields copied onto existing rows on upsert (password_hash set separately)
_SYNC_FIELDS = (
    "email", "roll_no", "name", "role_id", "university_id",
    "department", "section", "year", "avatar",
)

USERS = [
    dict(
        email="demo@worklearn.ai", name="Alex Demo",
        role_id=ROLE_IDS[RoleSlug.STUDENT], university_id=1, avatar="AD",
    ),
    dict(
        email="admin@worklearn.ai", name="Admin User",
        role_id=ROLE_IDS[RoleSlug.SUPER_ADMIN], university_id=None, avatar="AU",
    ),
    dict(
        email="platform@worklearn.ai", name="Platform Admin",
        role_id=ROLE_IDS[RoleSlug.ADMIN], university_id=None, avatar="PA",
    ),
    dict(
        email="uniadmin@worklearn.ai", name="IIT Delhi Uni Admin",
        role_id=ROLE_IDS[RoleSlug.UNIVERSITY_ADMIN], university_id=IITD_UNIVERSITY_ID,
        avatar="UA",
    ),
    dict(
        email="rahul@iitd.ac.in", roll_no="21CS001", name="Rahul Sharma",
        role_id=ROLE_IDS[RoleSlug.STUDENT], university_id=IITD_UNIVERSITY_ID,
        department="CSE", section="A", year="3rd Year", avatar="RS",
    ),
    dict(
        email="priya@iitd.ac.in", roll_no="21CS002", name="Priya Singh",
        role_id=ROLE_IDS[RoleSlug.STUDENT], university_id=IITD_UNIVERSITY_ID,
        department="CSE", section="A", year="3rd Year", avatar="PS",
    ),
    dict(
        email="ananya@iitd.ac.in", roll_no="MENTOR001",
        name="Prof. Ananya Sharma", role_id=ROLE_IDS[RoleSlug.TEACHER],
        university_id=IITD_UNIVERSITY_ID, department="CSE", section="CS-3A", avatar="AS",
    ),
]


def _apply_demo_fields(user: User, data: dict, password_hash: str) -> None:
    for key, value in data.items():
        if key in _SYNC_FIELDS:
            setattr(user, key, value)
    user.password_hash = password_hash
    user.is_active = True


async def main():
    from app.models import roles, university, cms, sim_builder, rbac, feature_flags, platform_config, profile, certificate  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Tables ready.")

    async with AsyncSessionLocal() as db:
        await seed_roles_and_universities(db)
        print("Roles + universities seeded.")

    async with AsyncSessionLocal() as db:
        mentor_id: int | None = None
        for raw in USERS:
            u = dict(raw)
            existing = None
            # Prefer roll_no match so legacy email-null rows get an email assigned
            if u.get("roll_no"):
                existing = (await db.execute(
                    select(User).where(User.roll_no == u["roll_no"])
                )).scalar_one_or_none()
            if existing is None and u.get("email"):
                existing = (await db.execute(
                    select(User).where(User.email == u["email"])
                )).scalar_one_or_none()
            label = u.get("email") or u.get("roll_no")
            # Fresh bcrypt per user (unique salt) — plaintext is still DEMO_PASSWORD
            pwd_hash = hash_password(DEMO_PASSWORD)

            if existing:
                _apply_demo_fields(existing, u, pwd_hash)
                if u.get("roll_no") == "MENTOR001":
                    mentor_id = existing.id
                print(f"  updated: {label} (email={existing.email!r})")
                continue

            user = User(**u, password_hash=pwd_hash, is_active=True)
            db.add(user)
            await db.flush()
            if u.get("roll_no") == "MENTOR001":
                mentor_id = user.id
            print(f"  created: {label}")

        priya = (await db.execute(select(User).where(User.roll_no == "21CS002"))).scalar_one_or_none()
        if priya:
            existing_ul = await db.execute(
                select(UnlockedFeature).where(
                    UnlockedFeature.user_id == priya.id,
                    UnlockedFeature.feature == "python_sandbox",
                )
            )
            if not existing_ul.scalar_one_or_none():
                db.add(UnlockedFeature(
                    user_id=priya.id,
                    feature="python_sandbox",
                    granted_by=mentor_id,
                ))
                print("  unlocked: python_sandbox for 21CS002")

        await db.commit()

    print("Seed complete. All demo passwords:", DEMO_PASSWORD)


asyncio.run(main())
