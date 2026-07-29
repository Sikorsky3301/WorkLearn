from sqlalchemy import text

MIGRATION_ID = "0005_users_onboarding"


async def upgrade(engine):
    async with engine.begin() as conn:
        await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false"))
        await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_domain VARCHAR"))
        # One-time backfill: every account that already existed before this
        # feature shipped is considered already onboarded — only accounts
        # created after this migration runs get the wizard (they default to
        # onboarding_completed=false via the column default above). Since the
        # migration runner tracks applied IDs and never re-runs this file,
        # this UPDATE only ever touches pre-existing rows, once.
        await conn.execute(text("UPDATE users SET onboarding_completed = true WHERE onboarding_completed = false"))
