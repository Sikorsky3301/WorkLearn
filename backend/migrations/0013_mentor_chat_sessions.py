from sqlalchemy import text

MIGRATION_ID = "0013_mentor_chat_sessions"


async def upgrade(engine):
    async with engine.begin() as conn:
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS mentor_chat_sessions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR,
                created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
            )
        """))
        await conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_mentor_chat_sessions_user_id ON mentor_chat_sessions (user_id)"
        ))
        await conn.execute(text(
            "ALTER TABLE mentor_chat_messages ADD COLUMN IF NOT EXISTS session_id INTEGER "
            "REFERENCES mentor_chat_sessions(id) ON DELETE CASCADE"
        ))

        # Every message so far belonged to one continuous per-user thread —
        # bucket each user's existing messages into a single legacy session
        # rather than losing them, titled from their first message.
        await conn.execute(text("""
            INSERT INTO mentor_chat_sessions (user_id, created_at, updated_at)
            SELECT user_id, min(created_at), max(created_at)
            FROM mentor_chat_messages
            WHERE session_id IS NULL
            GROUP BY user_id
        """))
        await conn.execute(text("""
            UPDATE mentor_chat_sessions s
            SET title = substr(first_msg.content, 1, 60)
            FROM (
                SELECT DISTINCT ON (user_id) user_id, content
                FROM mentor_chat_messages
                WHERE role = 'user'
                ORDER BY user_id, created_at ASC
            ) first_msg
            WHERE s.user_id = first_msg.user_id AND s.title IS NULL
        """))
        await conn.execute(text("""
            UPDATE mentor_chat_messages m
            SET session_id = s.id
            FROM mentor_chat_sessions s
            WHERE m.session_id IS NULL AND m.user_id = s.user_id
        """))

        await conn.execute(text("ALTER TABLE mentor_chat_messages ALTER COLUMN session_id SET NOT NULL"))
        await conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_mentor_chat_messages_session_id ON mentor_chat_messages (session_id)"
        ))
