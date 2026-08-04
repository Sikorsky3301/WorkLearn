"""Idempotent seed for roles + default university."""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert as pg_insert
from app.models.roles import Role, RoleSlug, ROLE_IDS
from app.models.university import University, DEFAULT_UNIVERSITY_CODE

ROLE_SEED = [
    {"id": ROLE_IDS[RoleSlug.SUPER_ADMIN], "slug": RoleSlug.SUPER_ADMIN, "name": "Super Admin",
     "description": "Full platform access", "is_builtin": True},
    {"id": ROLE_IDS[RoleSlug.ADMIN], "slug": RoleSlug.ADMIN, "name": "Admin",
     "description": "Platform administration", "is_builtin": True},
    {"id": ROLE_IDS[RoleSlug.UNIVERSITY_ADMIN], "slug": RoleSlug.UNIVERSITY_ADMIN, "name": "University Admin",
     "description": "Manages one university", "is_builtin": True},
    {"id": ROLE_IDS[RoleSlug.TEACHER], "slug": RoleSlug.TEACHER, "name": "Teacher",
     "description": "Class mentor / teacher", "is_builtin": True},
    {"id": ROLE_IDS[RoleSlug.STUDENT], "slug": RoleSlug.STUDENT, "name": "Student",
     "description": "Learner", "is_builtin": True},
]


async def seed_roles_and_universities(db: AsyncSession) -> None:
    for row in ROLE_SEED:
        stmt = pg_insert(Role).values(**row).on_conflict_do_update(
            index_elements=["id"],
            set_={"slug": row["slug"], "name": row["name"], "description": row["description"], "is_builtin": row["is_builtin"]},
        )
        await db.execute(stmt)

    stmt = pg_insert(University).values(
        id=1, code=DEFAULT_UNIVERSITY_CODE, name="WorkLearn Teaching Academy", is_default=True,
    ).on_conflict_do_update(
        index_elements=["id"],
        set_={
            "code": DEFAULT_UNIVERSITY_CODE,
            "name": "WorkLearn Teaching Academy",
            "is_default": True,
        },
    )
    await db.execute(stmt)

    # Demo university for seeded teachers/students
    stmt = pg_insert(University).values(
        id=2, code="IITD", name="IIT Delhi", is_default=False,
    ).on_conflict_do_update(
        index_elements=["id"],
        set_={"code": "IITD", "name": "IIT Delhi", "is_default": False},
    )
    await db.execute(stmt)

    await db.commit()
