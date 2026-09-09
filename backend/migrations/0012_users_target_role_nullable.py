from sqlalchemy import text

MIGRATION_ID = "0012_users_target_role_nullable"


async def upgrade(engine):
    async with engine.begin() as conn:
        await conn.execute(text("ALTER TABLE users ALTER COLUMN target_role DROP DEFAULT"))
        await conn.execute(text("ALTER TABLE users ALTER COLUMN target_role DROP NOT NULL"))
        # No code path has ever written this column — every row still holding
        # the literal default is unset, not a real choice. Leaving it would
        # freeze the whole existing user base on "Junior Data Analyst" forever,
        # since an explicit override outranks auto-detection by design.
        await conn.execute(text("UPDATE users SET target_role = NULL WHERE target_role = 'junior_da'"))
