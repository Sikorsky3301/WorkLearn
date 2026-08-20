from sqlalchemy import text

MIGRATION_ID = "0010_universities_logo_url"


async def upgrade(engine):
    async with engine.begin() as conn:
        await conn.execute(text(
            "ALTER TABLE universities ADD COLUMN IF NOT EXISTS logo_url VARCHAR"
        ))
