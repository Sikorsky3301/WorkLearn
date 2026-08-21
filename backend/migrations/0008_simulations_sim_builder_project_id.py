from sqlalchemy import text

MIGRATION_ID = "0008_simulations_sim_builder_project_id"


async def upgrade(engine):
    async with engine.begin() as conn:
        await conn.execute(text(
            "ALTER TABLE simulations ADD COLUMN IF NOT EXISTS sim_builder_project_id INTEGER"
        ))
        await conn.execute(text(
            "CREATE UNIQUE INDEX IF NOT EXISTS ix_simulations_sim_builder_project_id "
            "ON simulations (sim_builder_project_id) WHERE sim_builder_project_id IS NOT NULL"
        ))
        # Soft FK — avoid failing if sim_builder_projects missing on older DBs mid-migrate
        await conn.execute(text("""
            DO $$ BEGIN
              IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'fk_simulations_sim_builder_project'
              ) THEN
                ALTER TABLE simulations
                  ADD CONSTRAINT fk_simulations_sim_builder_project
                  FOREIGN KEY (sim_builder_project_id)
                  REFERENCES sim_builder_projects(id)
                  ON DELETE SET NULL;
              END IF;
            END $$;
        """))
