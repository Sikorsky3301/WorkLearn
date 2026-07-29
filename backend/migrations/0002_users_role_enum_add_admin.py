from sqlalchemy import text

MIGRATION_ID = "0002_users_role_enum_add_admin"


async def upgrade(engine):
    # Postgres can't ADD VALUE to an enum type inside an ordinary transaction
    # block — run this single statement in autocommit mode rather than
    # engine.begin()'s implicit transaction.
    async with engine.connect() as conn:
        conn = await conn.execution_options(isolation_level="AUTOCOMMIT")
        await conn.execute(text("ALTER TYPE role ADD VALUE IF NOT EXISTS 'ADMIN'"))
