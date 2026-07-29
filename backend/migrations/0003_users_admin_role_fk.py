from sqlalchemy import text

MIGRATION_ID = "0003_users_admin_role_fk"


async def upgrade(engine):
    # Depends on admin_roles already existing — run.py calls create_all
    # (which creates it, being a brand-new table) before running any of
    # these numbered scripts.
    async with engine.begin() as conn:
        await conn.execute(text(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_role_id VARCHAR REFERENCES admin_roles(id)"
        ))
