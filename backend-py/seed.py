"""
Seed demo users — matches the old mock AuthContext credentials exactly.
Run: python seed.py
"""
import asyncio
from app.database import engine, Base, AsyncSessionLocal
from app.models import User, UnlockedFeature, Role, SuperAdminCredential
from app.auth import hash_password

USERS = [
    # Direct users
    dict(email="demo@worklearn.ai",  password="demo123",   name="Alex Demo",            role=Role.DIRECT_USER,        avatar="AD"),
    dict(email="admin@worklearn.ai", password="admin123",  name="Admin User",           role=Role.SUPER_ADMIN,        avatar="AU"),
    # University students
    dict(roll_no="21CS001", password="student123", name="Rahul Sharma",       role=Role.UNIVERSITY_STUDENT, institution="IIT Delhi", institution_code="IITD", department="CSE", section="A", year="3rd Year", avatar="RS"),
    dict(roll_no="21CS002", password="student123", name="Priya Singh",        role=Role.UNIVERSITY_STUDENT, institution="IIT Delhi", institution_code="IITD", department="CSE", section="A", year="3rd Year", avatar="PS"),
    # Mentor
    dict(roll_no="MENTOR001", email="ananya@iitd.ac.in", password="mentor123", name="Prof. Ananya Sharma", role=Role.CLASS_MENTOR, institution="IIT Delhi", institution_code="IITD", department="CSE", section="CS-3A", avatar="AS"),
]

async def main():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Tables ready.")

    async with AsyncSessionLocal() as db:
        for u in USERS:
            password = u.pop("password")
            # Check if exists
            from sqlalchemy import select
            q = select(User)
            if "email" in u and u["email"]:
                q = q.where(User.email == u["email"])
            elif "roll_no" in u and u["roll_no"]:
                q = q.where(User.roll_no == u["roll_no"])
            result = await db.execute(q)
            existing = result.scalar_one_or_none()
            if existing:
                print(f"  skip: {u.get('email') or u.get('roll_no')}")
                continue
            user = User(**u, password_hash=hash_password(password))
            db.add(user)
            await db.flush()

            # Unlock python_sandbox for Priya (21CS002)
            if u.get("roll_no") == "21CS002":
                db.add(UnlockedFeature(user_id=user.id, feature="python_sandbox", granted_by="MENTOR001"))

            print(f"  created: {u.get('email') or u.get('roll_no')}")

        await db.commit()

    # Seed super_admin_credentials (separate table)
    async with AsyncSessionLocal() as db:
        from sqlalchemy import select
        sa_res = await db.execute(select(SuperAdminCredential).where(SuperAdminCredential.email == "admin@worklearn.ai"))
        if not sa_res.scalar_one_or_none():
            db.add(SuperAdminCredential(
                name="Platform Admin",
                email="admin@worklearn.ai",
                password_hash=hash_password("admin123"),
            ))
            await db.commit()
            print("  created: superadmin admin@worklearn.ai")
        else:
            print("  skip: superadmin admin@worklearn.ai")

    print("Seed complete.")

asyncio.run(main())
