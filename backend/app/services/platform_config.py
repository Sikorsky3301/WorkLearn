"""
Catalog + seed + read/write helpers for the Platform Configuration Center.
Seeded defaults mirror this app's actual current `.env`/hardcoded values
where one exists, so the form isn't blank on first load — but note these
are display defaults only; they are not read back into `app.config.settings`
or `app.database.engine` (see models_platform_config.py's docstring).
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert as pg_insert
from app.config import settings
from app.models_platform_config import PlatformConfig

# (category, key, label, description, is_secret, seed_value)
CONFIG_CATALOG: list[dict] = [
    # ── AI Provider ──────────────────────────────────────────────────────────
    {"category": "ai", "key": "ai_provider", "label": "Active provider", "is_secret": False,
     "description": "Which LLM provider the app talks to: anthropic, gemini, groq, or openai (any OpenAI-Chat-Completions-compatible endpoint, incl. self-hosted/on-prem).",
     "seed_value": settings.ai_provider},
    {"category": "ai", "key": "anthropic_api_key", "label": "Anthropic API key", "is_secret": True,
     "description": "Used when the active provider is anthropic.", "seed_value": None},
    {"category": "ai", "key": "gemini_api_key", "label": "Gemini API key", "is_secret": True,
     "description": "Used when the active provider is gemini.", "seed_value": None},
    {"category": "ai", "key": "groq_api_key", "label": "Groq API key", "is_secret": True,
     "description": "Used when the active provider is groq.", "seed_value": None},
    {"category": "ai", "key": "openai_base_url", "label": "OpenAI-compatible base URL", "is_secret": False,
     "description": "The endpoint to call when the active provider is openai — api.openai.com, or an on-premise/self-hosted server (e.g. vLLM).",
     "seed_value": settings.openai_base_url},
    {"category": "ai", "key": "openai_api_key", "label": "OpenAI-compatible API key", "is_secret": True,
     "description": "Bearer credential for the base URL above — an on-prem server's own key, not necessarily OpenAI's.", "seed_value": None},
    {"category": "ai", "key": "openai_model", "label": "Model name", "is_secret": False,
     "description": "The model identifier to request from the OpenAI-compatible endpoint.", "seed_value": settings.openai_model},

    # ── Billing Provider ─────────────────────────────────────────────────────
    {"category": "billing", "key": "billing_provider", "label": "Active provider", "is_secret": False,
     "description": "Which payment provider is configured — none | stripe | razorpay | paypal.", "seed_value": "none"},
    {"category": "billing", "key": "publishable_key", "label": "Publishable key", "is_secret": False,
     "description": "The provider's client-side/publishable key.", "seed_value": None},
    {"category": "billing", "key": "secret_key", "label": "Secret key", "is_secret": True,
     "description": "The provider's server-side secret key.", "seed_value": None},
    {"category": "billing", "key": "webhook_secret", "label": "Webhook signing secret", "is_secret": True,
     "description": "Used to verify incoming webhook events from the provider.", "seed_value": None},
    {"category": "billing", "key": "currency", "label": "Default currency", "is_secret": False,
     "description": "ISO currency code used for pricing (e.g. USD, INR, EUR).", "seed_value": "USD"},
    {"category": "billing", "key": "trial_period_days", "label": "Trial period (days)", "is_secret": False,
     "description": "Default trial length for new subscriptions.", "seed_value": "14"},

    # ── Database ─────────────────────────────────────────────────────────────
    {"category": "database", "key": "database_url", "label": "Connection string", "is_secret": True,
     "description": "The Postgres connection string. Changing this here does not reconnect the running app — it's stored for reference/handover.",
     "seed_value": None},
    {"category": "database", "key": "pool_size", "label": "Connection pool size", "is_secret": False,
     "description": "Base number of pooled connections.", "seed_value": "5"},
    {"category": "database", "key": "max_overflow", "label": "Max overflow connections", "is_secret": False,
     "description": "Extra connections allowed beyond the pool size under load.", "seed_value": "10"},
    {"category": "database", "key": "echo_sql", "label": "Log all SQL statements", "is_secret": False,
     "description": "Verbose SQL logging for debugging — noisy, dev-only.", "seed_value": "false"},
    {"category": "database", "key": "backup_schedule", "label": "Backup schedule", "is_secret": False,
     "description": "How often the database is backed up (e.g. daily, hourly).", "seed_value": "daily"},
    {"category": "database", "key": "backup_retention_days", "label": "Backup retention (days)", "is_secret": False,
     "description": "How long backups are kept before being discarded.", "seed_value": "30"},
]


async def seed_platform_config(db: AsyncSession) -> None:
    """Idempotent — inserts each catalog row only if it doesn't already exist,
    so an admin's saved value is never clobbered by a later app restart."""
    for entry in CONFIG_CATALOG:
        stmt = pg_insert(PlatformConfig).values(
            category=entry["category"], key=entry["key"], value=entry["seed_value"], is_secret=entry["is_secret"],
        ).on_conflict_do_nothing(index_elements=["category", "key"])
        await db.execute(stmt)
    await db.commit()


def catalog_meta(category: str, key: str) -> dict | None:
    for entry in CONFIG_CATALOG:
        if entry["category"] == category and entry["key"] == key:
            return entry
    return None
