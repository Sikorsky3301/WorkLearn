from sqlalchemy import text

MIGRATION_ID = "0009_simulation_university_scope"


async def upgrade(engine):
    async with engine.begin() as conn:
        await conn.execute(text(
            "ALTER TABLE simulations ADD COLUMN IF NOT EXISTS "
            "available_to_all_universities BOOLEAN NOT NULL DEFAULT TRUE"
        ))
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS simulation_universities (
                id SERIAL PRIMARY KEY,
                simulation_id INTEGER NOT NULL REFERENCES simulations(id) ON DELETE CASCADE,
                university_id INTEGER NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
                CONSTRAINT uq_simulation_university UNIQUE (simulation_id, university_id)
            )
        """))
        await conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_simulation_universities_simulation_id "
            "ON simulation_universities (simulation_id)"
        ))
        await conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_simulation_universities_university_id "
            "ON simulation_universities (university_id)"
        ))
