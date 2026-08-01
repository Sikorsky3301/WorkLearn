import logging
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.logging_config import configure_logging
from app.core.request_context import RequestIdMiddleware
from app.db.database import engine, Base, AsyncSessionLocal
from app.routes.v1 import auth, enrollments, agent_messages, analytics, admin, mentor, sandbox, admin_simulations, admin_simulation_templates, admin_uploads, admin_sim_builder, admin_management, feature_flags, platform_analytics, platform_config, profile
from app.routes import health
# AI-specific routes (LLM-backed: AI Mentor, generic sim-runtime AI
# roleplay/grading) live in their own package — see app/ai/'s docstring.
from app.ai.routes import ai_mentor, sim_runtime
from app.models import cms as models_cms  # noqa: F401 — registers Simulation/SimulationTask on Base.metadata before create_all
from app.models import sim_builder as models_sim_builder  # noqa: F401 — registers SimBuilder* tables on Base.metadata before create_all
from app.models import rbac as models_rbac  # noqa: F401 — registers AdminRole/Permission/AdminRolePermission/AuditLog on Base.metadata before create_all
from app.models import feature_flags as models_feature_flags  # noqa: F401 — registers FeatureFlag/FeatureFlagOverride on Base.metadata before create_all
from app.models import platform_config as models_platform_config  # noqa: F401 — registers PlatformConfig on Base.metadata before create_all
from app.models import profile as models_profile  # noqa: F401 — registers EducationEntry on Base.metadata before create_all
from app.agents.manager import start_scheduler
from app.ai.services.langfuse_client import init_langfuse, shutdown_langfuse, langfuse_enabled
from app.services.permissions_seed import seed_permissions
from app.services.feature_flags import seed_feature_flags
from app.services.platform_config import seed_platform_config

configure_logging(settings.log_level)
logger = logging.getLogger(__name__)

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"
STATIC_DIR.mkdir(exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup (dev convenience — use Alembic in production)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Idempotent — upserts the permission catalog + built-in "Administrator"
    # AdminRole. See app/services/permissions_seed.py.
    async with AsyncSessionLocal() as session:
        await seed_permissions(session)

    # Idempotent — upserts the feature-flag catalog + role-default overrides
    # (byte-for-byte replica of the old hardcoded ROLE_FEATURES map). See
    # app/services/feature_flags.py.
    async with AsyncSessionLocal() as session:
        await seed_feature_flags(session)

    # Idempotent — inserts each Config Center catalog row only if missing
    # (never clobbers an admin's already-saved value). See
    # app/services/platform_config.py.
    async with AsyncSessionLocal() as session:
        await seed_platform_config(session)

    # Start Manager scheduler (deterministic reminders + deadline checks)
    try:
        start_scheduler()
        logger.info("[manager] scheduler started")
    except Exception:
        logger.exception("[manager] scheduler failed to start")

    # Langfuse tracing — registers the SDK singleton get_client() reuses
    # elsewhere; no-ops if LANGFUSE_PUBLIC_KEY/LANGFUSE_SECRET_KEY aren't set.
    init_langfuse()
    logger.info("[langfuse] tracing %s", "enabled" if langfuse_enabled else "disabled (no API keys configured)")

    yield

    # Shutdown
    from app.agents.manager import scheduler
    if scheduler.running:
        scheduler.shutdown(wait=False)
    shutdown_langfuse()

app = FastAPI(title="WorkAlearn API", lifespan=lifespan)


def _cors_origins() -> list[str]:
    """`localhost` and `127.0.0.1` are different CORS origins as far as the
    browser is concerned, even though they're the same machine — so whichever
    loopback form FRONTEND_URL isn't already, also allow it. Without this,
    the dev server binding to one form (e.g. Vite on 127.0.0.1) while
    FRONTEND_URL configures the other silently breaks every request with a
    CORS error."""
    origins = {settings.frontend_url}
    if "://localhost:" in settings.frontend_url:
        origins.add(settings.frontend_url.replace("localhost", "127.0.0.1"))
    elif "://127.0.0.1:" in settings.frontend_url:
        origins.add(settings.frontend_url.replace("127.0.0.1", "localhost"))
    return list(origins)


app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Added after CORS so it runs outermost on the request path (Starlette applies
# middleware LIFO relative to add_middleware order) — the request ID is
# assigned before anything else touches the request.
app.add_middleware(RequestIdMiddleware)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    # FastAPI's own handler for HTTPException/StarletteHTTPException is more
    # specific and always wins over this one, so existing `raise
    # HTTPException(...)` call sites are unaffected — this only catches
    # genuinely unhandled exceptions. Never put exc details in the response
    # body; the traceback goes to the log only.
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "request_id": getattr(request.state, "request_id", "-")},
    )

app.include_router(auth.router)
app.include_router(enrollments.router)
app.include_router(ai_mentor.router)
app.include_router(agent_messages.router)
app.include_router(analytics.router)
app.include_router(admin.router)
app.include_router(mentor.router)
app.include_router(sandbox.router)
app.include_router(admin_simulations.router)
app.include_router(admin_simulation_templates.router)
app.include_router(sim_runtime.router)
app.include_router(admin_uploads.router)
app.include_router(admin_sim_builder.router)
app.include_router(admin_management.router)
app.include_router(feature_flags.router)
app.include_router(platform_analytics.router)
app.include_router(platform_config.router)
app.include_router(profile.router)
app.include_router(health.router)
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
