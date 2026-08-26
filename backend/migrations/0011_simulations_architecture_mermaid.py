from sqlalchemy import text

MIGRATION_ID = "0011_simulations_architecture_mermaid"


async def upgrade(engine):
    async with engine.begin() as conn:
        await conn.execute(text(
            "ALTER TABLE simulations ADD COLUMN IF NOT EXISTS architecture_mermaid TEXT"
        ))
